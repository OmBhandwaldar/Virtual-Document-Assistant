// app/api/pdfs/[id]/index/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { chunkText } from "@/lib/chunker";
import { randomUUID } from "crypto";


export async function parsePdf(bufferOrUint8: ArrayBuffer | Uint8Array): Promise<{ text: string }> {
  const PDFParser = require("pdf2json");
  
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // null for no events, 1 for text parsing
    
    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("PDF Parser Error:", errData.parserError);
      reject(errData.parserError);
    });
    
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        // Extract text from all pages
        let text = "";
        
        if (pdfData && pdfData.Pages) {
          pdfData.Pages.forEach((page: any) => {
            if (page.Texts) {
              page.Texts.forEach((textItem: any) => {
                if (textItem.R) {
                  textItem.R.forEach((run: any) => {
                    if (run.T) {
                      // Decode URI component (pdf2json encodes special characters)
                      text += decodeURIComponent(run.T) + " ";
                    }
                  });
                }
              });
              text += "\n"; // Add newline between pages
            }
          });
        }
        
        resolve({ text: text.trim() });
      } catch (error) {
        console.error("Error processing PDF data:", error);
        reject(error);
      }
    });

    const buffer = bufferOrUint8 instanceof Uint8Array 
      ? Buffer.from(bufferOrUint8) 
      : Buffer.from(new Uint8Array(bufferOrUint8));
    
    pdfParser.parseBuffer(buffer);
  });
}



export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseServer();

  try {
    console.log("Starting PDF indexing for ID:", id);
    
    // 1️⃣ Fetch PDF record from DB
    const { data: pdfRecord, error: pdfError } = await supabase
      .from("Pdf")
      .select("*")
      .eq("id", id)
      .single();

    if (pdfError || !pdfRecord) {
      console.log("PDF not found:", pdfError);
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    console.log("PDF record found:", pdfRecord.filename);


    const { data: file, error: downloadError } = await supabase.storage
      .from("pdfs")
      .download(pdfRecord.storagePath.replace("pdfs/", ""));
    if (downloadError) {
      // handle
    }
    if (!file) {
      return NextResponse.json({ error: "File download failed (null data)" }, { status: 500 });
    }
    const arrayBuffer = await file.arrayBuffer();
    // Convert to Uint8Array (not Buffer)
    const uint8 = new Uint8Array(arrayBuffer);

    console.log("Uint8Array length:", uint8.length);

    const parsed = await parsePdf(uint8); // pass the correct type

    const fullText = parsed.text.replace(/\s+/g, " ").trim();


    console.log("Text extracted, length:", fullText.length);

    // 4️⃣ Split into chunks
    const chunks = chunkText(fullText, 400, 80);
    console.log("Text chunked into", chunks.length, "chunks");

    // 5️⃣ Insert chunks into Supabase
    const records = chunks.map((text, idx) => ({
      id: randomUUID(),
      pdfId: id,
      page: idx + 1,
      startChar: idx * 400,
      endChar: (idx + 1) * 400,
      text,
    }));

    console.log("Inserting", records.length, "chunks into database...");
    const { error: insertError } = await supabase.from("Chunk").insert(records);
    if (insertError) {
      console.log("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6️⃣ Update Pdf table with indexedAt timestamp
    await supabase
      .from("Pdf")
      .update({ indexedAt: new Date().toISOString() })
      .eq("id", id);

    console.log("PDF indexing completed successfully");
    return NextResponse.json({
      success: true,
      message: `Indexed ${records.length} chunks.`,
    });
  } catch (err: any) {
    console.error("Indexing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}