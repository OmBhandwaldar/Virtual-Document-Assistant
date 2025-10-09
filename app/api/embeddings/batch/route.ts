import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { embedTextsGemini } from "@/lib/gemini";
import { randomUUID } from "crypto";

// Type definitions
interface ChunkData {
  id: string;
  text: string;
  page: number;
}

export const runtime = "nodejs";

/**
 * Body: { pdfId: string, batchSize?: number }
 * Call repeatedly until response says "No chunks left to embed".
 */
export async function POST(req: Request) {
  const { pdfId, batchSize = 10 } = await req.json();
  if (!pdfId) {
    return NextResponse.json({ error: "Missing pdfId" }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1) Pull up to N not-yet-embedded chunks
  const { data: chunks, error: fetchErr } = await supabase.rpc(
    "get_chunks_without_embeddings",
    { _pdf_id: pdfId, _limit: batchSize }
  );

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!chunks || chunks.length === 0) {
    return NextResponse.json({ message: "No chunks left to embed", pdfId });
  }

  // 2) Create embeddings in a single batch call to Gemini
  const texts = chunks.map((c: ChunkData) => c.text);
  const vectors = await embedTextsGemini(texts, { dim: 1536 });

  // 3) Prepare rows for insert
  const rows = chunks.map((c: ChunkData, i: number) => ({
    id: randomUUID(),
    pdf_id: pdfId,
    chunk_id: c.id,
    content: c.text.slice(0, 200),
    embedding: vectors[i],
    page: c.page,
  }));

  // 4) Insert (upsert to avoid duplicates if re-run)
  // Requires a UNIQUE constraint on chunk_id (added above)
  const { error: insertErr } = await supabase
    .from("embeddings")
    .upsert(rows, { onConflict: "chunk_id" });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: rows.length, pdfId });
}
