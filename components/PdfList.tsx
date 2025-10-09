"use client";

import { useEffect, useState } from "react";

interface PDFRecord {
  id: string;
  title: string;
  filename: string;
  storagePath: string;
  indexedAt?: string | null;
}

export default function PdfList() {
  const [pdfs, setPdfs] = useState<PDFRecord[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pdfs");
      const data = await res.json();
      setPdfs(data);
    })();
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Uploaded PDFs</h2>
      {pdfs.map((pdf) => (
        <div key={pdf.id} className="p-3 border rounded-lg bg-white">
          <p className="font-medium">{pdf.title}</p>
          <p className="text-sm text-gray-500">{pdf.filename}</p>
          {/* <p className="text-xs text-gray-400">{pdf.preview?.slice(0, 100)}...</p> */}
        </div>
      ))}
    </div>
  );
}
