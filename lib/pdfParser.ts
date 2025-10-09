// Type definitions for PDF2JSON
interface PDFTextRun {
  T?: string;
}

interface PDFTextItem {
  R?: PDFTextRun[];
}

interface PDFPage {
  Texts?: PDFTextItem[];
}

interface PDFData {
  Pages?: PDFPage[];
}

interface PDFParserError {
  parserError?: string;
}

// Type declaration for pdf2json module
declare const require: (module: string) => {
  new (a: null, b: boolean): {
    on(event: "pdfParser_dataError", callback: (errData: PDFParserError | string) => void): void;
    on(event: "pdfParser_dataReady", callback: (pdfData: PDFData) => void): void;
    parseBuffer: (buffer: Buffer) => void;
  };
};

export async function parsePdf(
    bufferOrUint8: ArrayBuffer | Uint8Array
  ): Promise<{ text: string }> {
    const PDFParser = require("pdf2json");

    return new Promise((resolve, reject) => {
      // ✅ FIX: second argument should be a boolean, not a number
      const pdfParser = new PDFParser(null, true);

      pdfParser.on("pdfParser_dataError", (errData: PDFParserError | string) => {
        // ✅ Fix type safety for parserError
        const errorMsg =
          errData && typeof errData === "object" && "parserError" in errData
            ? errData.parserError
            : errData;
        console.error("PDF Parser Error:", errorMsg);
        reject(errorMsg);
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: PDFData) => {
        try {
          let text = "";

          if (pdfData && pdfData.Pages) {
            pdfData.Pages.forEach((page: PDFPage) => {
              if (page.Texts) {
                page.Texts.forEach((textItem: PDFTextItem) => {
                  if (textItem.R) {
                    textItem.R.forEach((run: PDFTextRun) => {
                      if (run.T) {
                        // ✅ Decode URI-encoded text correctly
                        text += decodeURIComponent(run.T) + " ";
                      }
                    });
                  }
                });
                text += "\n";
              }
            });
          }

          resolve({ text: text.trim() });
        } catch (error) {
          console.error("Error processing PDF data:", error);
          reject(error);
        }
      });
  
      const buffer =
        bufferOrUint8 instanceof Uint8Array
          ? Buffer.from(bufferOrUint8)
          : Buffer.from(new Uint8Array(bufferOrUint8));
  
      pdfParser.parseBuffer(buffer);
    });
  }
  