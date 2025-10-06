// Use dynamic import to avoid issues with browser APIs in Node.js
export async function extractPreview(buffer: Buffer, limit = 2000) {
  try {
    // Dynamic import to avoid bundling issues
    const pdfParseModule = await import("pdf-parse");
    
    // pdf-parse ESM exports PDFParse and pdf directly
    const pdfParse = pdfParseModule.pdf || pdfParseModule.PDFParse;
    
    if (typeof pdfParse !== 'function') {
      throw new Error('pdfParse is not a function');
    }
    
    const parsed = await pdfParse(buffer);
    const text = parsed.text.replace(/\s+/g, " ").trim();
    return text.slice(0, limit);
  } catch (error) {
    console.error("Error parsing PDF:", error);
    // Return a fallback message if PDF parsing fails
    return "PDF preview could not be extracted";
  }
}
