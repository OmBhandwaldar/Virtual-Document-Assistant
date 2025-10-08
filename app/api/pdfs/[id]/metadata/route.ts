import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const { data: pdf, error: e1 } = await supabase.from("Pdf").select("*").eq("id", id).single();
  if (e1 || !pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = String(pdf.storagePath).replace("pdfs/", "");
  const { data: signed } = await supabase.storage.from("pdfs").createSignedUrl(key, 60 * 30); // 30 min
  if (!signed?.signedUrl) return NextResponse.json({ error: "Signed URL failed" }, { status: 500 });

  return NextResponse.json({ signedUrl: signed.signedUrl, pages: pdf.pages });
}
