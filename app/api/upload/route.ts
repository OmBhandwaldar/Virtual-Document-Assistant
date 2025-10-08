import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { extractPreview } from "@/lib/pdfUtils";
import { PrismaClient } from "@/lib/generated/prisma";

export const runtime = "nodejs"; // ensure it runs on server

export async function POST(req: Request) {
  console.log("Upload route hit");

  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const chatId = form.get("chatId") as string | null;

    if (!file) {
      console.log("No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("File received:", file.name, file.type, file.size);

    if (file.type !== "application/pdf") {
      console.log("Invalid file type:", file.type);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = supabaseServer();

    const fileName = `${Date.now()}_${file.name}`;
    console.log("Uploading to Supabase storage:", fileName);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

        // ✅ VALIDATION BLOCK (place this here)
        const prisma = new PrismaClient();
        if (chatId) {
          const chatExists = await prisma.chat.findUnique({ where: { id: chatId } });
          if (!chatExists) {
            await prisma.$disconnect();
            return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
          }
        }
    

    console.log("File uploaded successfully, extracting preview...");

    // Extract preview text (first ~2000 chars)
    const preview = await extractPreview(buffer);
    console.log("Preview extracted, length:", preview.length);

    // Insert into Pdf table using Prisma
    // const prisma = new PrismaClient();
    try {
      const pdfRecord = await prisma.pdf.create({
        data: {
          title: file.name,
          filename: fileName,
          storagePath: `pdfs/${fileName}`,
          pages: 0, // optional, can parse later
          chatId: chatId || null,
          preview,
        },
      });
      console.log("Database record created:", pdfRecord.id);
    } catch (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({ error: "Failed to save PDF record" }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }

    console.log("Successfully uploaded and saved to database");
    return NextResponse.json({ success: true, filename: fileName, chatId });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
