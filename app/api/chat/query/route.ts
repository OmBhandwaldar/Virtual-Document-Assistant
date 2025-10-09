import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { embedQueryGemini } from "@/lib/gemini";
import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { pdfIds, question, topK = 5 } = await req.json();

  if (!pdfIds?.length || !question)
    return NextResponse.json({ error: "Missing pdfIds or question" }, { status: 400 });

  const supabase = supabaseServer();

  // 1️⃣ Embed the user query
  const qvec = await embedQueryGemini(question, 1536);

  // 2️⃣ Retrieve most relevant chunks
  const { data: matches, error } = await supabase.rpc("match_embeddings", {
    query_embedding: qvec,
    match_count: topK,
    filter_pdf_ids: pdfIds,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // 3️⃣ Build context for Gemini
  const context = matches
    .map(
      (m: any, i: number) =>
        `Excerpt ${i + 1} (PDF: ${m.pdf_id}, p.${m.page}): "${m.content.trim()}"`
    )
    .join("\n\n");

  const prompt = `
You are a helpful tutor that answers using only the provided excerpts.
When you use information, cite it inline as (PDF, p.X).
If answer not found, reply “I couldn’t find that in the provided texts.”

Excerpts:
${context}

Question: ${question}
Answer:
`;

  // 4️⃣ Ask Gemini for the final answer
  const result = await gemini.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const answer = result.text || "No answer generated.";

  return NextResponse.json({
    answer,
    citations: matches.map((m: any) => ({
      pdfId: m.pdf_id,
      page: m.page,
    })),
  });
}
