import { GoogleGenAI } from "@google/genai";

const GEMINI_DIM = 1536;

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
 
export async function embedTextsGemini(
  texts: string[],
  { dim = GEMINI_DIM } = {}
): Promise<number[][]> {
  if (!texts.length) return [];

  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`Embedding batch ${i / BATCH_SIZE + 1} (${batch.length} items)`);

    try {
      const res = await gemini.models.embedContent({
        model: "models/gemini-embedding-001",
        contents: batch.map((t) => ({ role: "user", parts: [{ text: t }] })),
        // ✅ Force 1536-dimensional output
        config: {
          outputDimensionality: dim,
        },
      });

      // ✅ Handle multiple embeddings safely
      const embeddings = res.embeddings?.map((e) => e.values as number[]) || [];
        // 🧩 Log embedding length for debugging
        if (embeddings.length > 0) {
          console.log(
            `✅ Got ${embeddings.length} embeddings | Dimension of first vector:`,
            embeddings[0].length
          );
        } else {
          console.warn("⚠️ No embeddings returned for this batch");
        }
      allEmbeddings.push(...embeddings);
    } catch (err: any) {
      console.error("❌ Embedding batch failed:", err.message || err);
    }
  }

  return allEmbeddings;
}

/**
 * Embed a single user query (for retrieval).
 */
export async function embedQueryGemini(
  text: string,
  dim = GEMINI_DIM
): Promise<number[]> {
  const res = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: [text],  // still use contents as array
    config: {
      outputDimensionality: dim,
      // optional: taskType: "RETRIEVAL_QUERY"
    },
  });

  // take the first embedding
  const first = res.embeddings?.[0];
  return first ? (first.values as number[]) : [];
}
