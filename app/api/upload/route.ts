import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { extractPreview } from "@/lib/pdfUtils";
import { PrismaClient } from "@/lib/generated/prisma";
import { parsePdf } from "@/lib/pdfParser"; // ✅ added
import { chunkText } from "@/lib/chunker"; // ✅ added
import { embedTextsGemini } from "@/lib/gemini";
// import { embedTextsGemini } from "@/lib/geminiEmbed"; // ✅ added

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("Upload route hit");

  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const chatId = form.get("chatId") as string | null;

    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf")
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = supabaseServer();
    const prisma = new PrismaClient(); // ✅ moved up for reuse

    // ✅ validate chat exists
    if (chatId) {
      const chatExists = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chatExists) {
        await prisma.$disconnect();
        return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
      }
    }

    const fileName = `${Date.now()}_${file.name}`;
    console.log("Uploading to Supabase storage:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, buffer, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    console.log("File uploaded successfully, extracting preview...");
    const preview = await extractPreview(buffer);

    // ✅ Create PDF record with chatId
    const pdfRecord = await prisma.pdf.create({
      data: {
        title: file.name,
        filename: fileName,
        storagePath: `pdfs/${fileName}`,
        pages: 0,
        chatId: chatId ?? null,
        preview,
      },
    });

    console.log(`📄 PDF record created in DB (id: ${pdfRecord.id})`);

    // ✅ START AUTOMATIC INDEXING PIPELINE
    console.log("Starting automatic chunking and embedding...");

    // 1️⃣ Parse full text
    const parsed = await parsePdf(buffer);
    const fullText = parsed.text.replace(/\s+/g, " ").trim();

    // 2️⃣ Chunk text
    const chunks = chunkText(fullText, 400, 80);
    console.log(`Split into ${chunks.length} chunks`);

    // 3️⃣ Insert chunks
    const createdChunks = await prisma.chunk.createMany({
      data: chunks.map((text, idx) => ({
        pdfId: pdfRecord.id,
        page: idx + 1,
        startChar: idx * 400,
        endChar: (idx + 1) * 400,
        text,
      })),
    });
    console.log(`Inserted ${createdChunks.count} chunks into DB`);

    // 4️⃣ Generate embeddings using Gemini
    const embeddings = await embedTextsGemini(chunks);
    console.log(`Generated ${embeddings.length} embeddings`);

    // 5️⃣ Insert embeddings manually (Supabase SQL)
    const supabaseInsert = await supabase.from("embeddings").insert(
      embeddings.map((embed, i) => ({
        pdf_id: pdfRecord.id,
        chunk_id: null, // we'll update if needed later
        content: chunks[i],
        embedding: embed,
        page: i + 1,
      }))
    );

    if (supabaseInsert.error) {
      console.error("Embedding insert error:", supabaseInsert.error);
    } else {
      console.log("✅ Embeddings saved in Supabase table");
    }

    // 6️⃣ Update PDF as indexed
    await prisma.pdf.update({
      where: { id: pdfRecord.id },
      data: { indexedAt: new Date() },
    });

    console.log("✅ Auto-indexing complete");
    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "Uploaded, chunked, and embedded successfully!",
      pdfId: pdfRecord.id,
      chatId,
    });
  } catch (err: unknown) {
    console.error("Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import { supabaseServer } from "@/lib/supabaseClient";
// import { extractPreview } from "@/lib/pdfUtils";
// import { PrismaClient } from "@/lib/generated/prisma";

// export const runtime = "nodejs"; // ensure it runs on server

// export async function POST(req: Request) {
//   console.log("Upload route hit");

//   try {
//     const form = await req.formData();
//     const file = form.get("file") as File;
//     const chatId = form.get("chatId") as string | null;

//     if (!file) {
//       console.log("No file uploaded");
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     console.log("File received:", file.name, file.type, file.size);

//     if (file.type !== "application/pdf") {
//       console.log("Invalid file type:", file.type);
//       return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const supabase = supabaseServer();

//     const fileName = `${Date.now()}_${file.name}`;
//     console.log("Uploading to Supabase storage:", fileName);

//     // Upload to Supabase Storage
//     const { error: uploadError } = await supabase.storage
//       .from("pdfs")
//       .upload(fileName, buffer, { contentType: "application/pdf" });

//     if (uploadError) {
//       console.error("Upload error:", uploadError);
//       return NextResponse.json({ error: uploadError.message }, { status: 500 });
//     }

//         // ✅ VALIDATION BLOCK (place this here)
//         const prisma = new PrismaClient();
//         if (chatId) {
//           const chatExists = await prisma.chat.findUnique({ where: { id: chatId } });
//           if (!chatExists) {
//             await prisma.$disconnect();
//             return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
//           }
//         }
    

//     console.log("File uploaded successfully, extracting preview...");

//     // Extract preview text (first ~2000 chars)
//     const preview = await extractPreview(buffer);
//     console.log("Preview extracted, length:", preview.length);

//     // Insert into Pdf table using Prisma
//     // const prisma = new PrismaClient();
//     try {
//       const pdfRecord = await prisma.pdf.create({
//         data: {
//           title: file.name,
//           filename: fileName,
//           storagePath: `pdfs/${fileName}`,
//           pages: 0, // optional, can parse later
//           chatId: chatId || null,
//           preview,
//         },
//       });
//       console.log("Database record created:", pdfRecord.id);
//     } catch (insertError) {
//       console.error("Database insert error:", insertError);
//       return NextResponse.json({ error: "Failed to save PDF record" }, { status: 500 });
//     } finally {
//       await prisma.$disconnect();
//     }

//     console.log("Successfully uploaded and saved to database");
//     return NextResponse.json({ success: true, filename: fileName, chatId });
//   } catch (err: any) {
//     console.error("Unexpected error:", err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
