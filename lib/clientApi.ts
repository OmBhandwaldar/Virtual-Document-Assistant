export async function uploadPdf(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data; // { id, title, filename, storagePath, ... } if you return those
  }
  
  export async function listPdfs() {
    const res = await fetch("/api/pdfs", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to list PDFs");
    return data as Array<{ id: string; title: string; filename: string; storagePath: string; indexedAt?: string | null }>;
  }
  
  export async function fetchPdfSignedUrl(pdfId: string) {
    const res = await fetch(`/api/pdfs/${pdfId}/metadata`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get signed URL");
    return data as { signedUrl: string; pages?: number };
  }
  
  export async function indexPdf(pdfId: string) {
    const res = await fetch(`/api/pdfs/${pdfId}/index`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Indexing failed");
    return data; // { success, message }
  }
  
  export async function embedBatch(pdfId: string, batchSize = 10) {
    const res = await fetch("/api/embeddings/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfId, batchSize }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Embedding failed");
    return data; // { success, inserted } OR { message: "No chunks left to embed" }
  }
  
  export async function chatQuery(pdfIds: string[], question: string) {
    const res = await fetch("/api/chat/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfIds, question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Chat failed");
    return data as { answer: string; citations: Array<{ pdfId: string; page: number }> };
  }
  