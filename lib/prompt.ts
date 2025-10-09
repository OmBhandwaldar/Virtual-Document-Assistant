// lib/prompt.ts
export function buildQuizPrompt(context: string, counts: { mcq: number; saq: number; laq: number }) {
    return `
  You are an exam author. Based ONLY on the following study material, write questions.
  
  === STUDY MATERIAL (verbatim) ===
  ${context}
  === END MATERIAL ===
  
  Generate STRICT JSON with this shape:
  {
    "mcq": [
      { "question": "...", "options": ["A","B","C","D"], "correct_index": 2, "explanation": "..." }
    ],
    "saq": [
      { "question": "...", "answer": "short answer (1-2 lines)", "explanation": "..." }
    ],
    "laq": [
      { "question": "...", "answer_outline": "bullet points or 3-5 sentences", "explanation": "..." }
    ]
  }
  
  Rules:
  - Total MCQs = ${counts.mcq}, SAQs = ${counts.saq}, LAQs = ${counts.laq}
  - Keep questions concise, unambiguous, and relevant to the material.
  - For MCQ, options must be plausible; exactly one correct_index.
  - Return ONLY JSON. No prose, no markdown.
  `;
  }
  
  /** Try to parse JSON, even if the model added stray text. */
  export function safeJsonParse<T = any>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      // try to extract first {...} or [...]
      const start = raw.search(/[\{\[]/);
      const end = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
      if (start >= 0 && end > start) {
        const sliced = raw.slice(start, end + 1);
        return JSON.parse(sliced) as T;
      }
      throw new Error("Failed to parse model JSON");
    }
  }
  