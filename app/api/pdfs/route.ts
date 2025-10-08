// app/api/pdfs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const supabase = supabaseServer();

  // ✅ Extract chatId from query params
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  try {
    // ✅ Base query
    let query = supabase
      .from("Pdf")
      .select("id, title, filename, preview, uploadedAt, chatId")
      .order("uploadedAt", { ascending: false });

    // ✅ If chatId provided, filter PDFs belonging to that chat
    if (chatId) {
      query = query.eq("chatId", chatId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching PDFs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



// import { NextResponse } from "next/server";
// import { supabaseServer } from "@/lib/supabaseClient";

// export async function GET() {
//   const supabase = supabaseServer();
//   const { data, error } = await supabase
//     .from("Pdf")
//     .select("id, title, filename, preview, uploadedAt")
//     .order("uploadedAt", { ascending: false });


//   if (error)
//     return NextResponse.json({ error: error.message }, { status: 500 });

//   return NextResponse.json(data);
// }
