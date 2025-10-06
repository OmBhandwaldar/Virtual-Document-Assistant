import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("Pdf")
    .select("id, title, filename, preview, uploadedAt")
    .order("uploadedAt", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
