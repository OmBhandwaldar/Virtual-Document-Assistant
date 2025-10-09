import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
 
// GET /api/gemini/list-models
export async function GET() {
  try {
    const pager = await gemini.models.list(); // ✅ Await the Pager<Model>
    const modelNames: string[] = [];

    for await (const model of pager) {
    //   modelNames.push(model.name);
      if (model.name) {
        modelNames.push(model.name);
      } // e.g. "models/gemini-1.5-pro"
    }

    return NextResponse.json({ models: modelNames });
  } catch (error) {
    console.error("Failed to list models:", error);
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}
