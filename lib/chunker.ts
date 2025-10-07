// lib/chunker.ts
/**
 * Splits long text into overlapping chunks.
 * Each chunk ~400–500 words with 80–100 word overlap.
 */
// export function chunkText(
//     text: string,
//     chunkSize: number = 400,
//     overlap: number = 80
// ) {
//     const words = text.split(/\s+/);
//     const chunks: string[] = [];
  
//     for (let i = 0; i < words.length; i += chunkSize - overlap) {
//       const chunk = words.slice(i, i + chunkSize).join(" ");
//       chunks.push(chunk);
//       if (i + chunkSize >= words.length) break;
//     }
  
//     return chunks;
// }  

export function chunkText(text: string, chunkSize = 1500, overlap = 300) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
