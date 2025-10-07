import { GoogleGenAI } from "@google/genai";

const GEMINI_DIM = 1536;

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Embed many texts at once with Gemini (batch).
 */
export async function embedTextsGemini(
  texts: string[],
  { dim = GEMINI_DIM } = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await gemini.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,  // correct field name
    config: {
      outputDimensionality: dim,
      // (If supported in your SDK) you might supply taskType in config, but skip it if types don't allow
      // taskType: "RETRIEVAL_DOCUMENT"
    },
  });

  // res.embeddings is an array
  const arrays = (res.embeddings ?? []).map((e) => e.values as number[]);
  return arrays;
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
