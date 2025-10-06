"use client";

import { useState } from "react";

export default function UploadModal() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function handleUpload() {
    if (!file) {
      setStatus("❌ Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("Uploading...");
    
    try {
      console.log("Starting upload...", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      console.log("Upload response:", res.status, res.statusText);
      
      const data = await res.json();
      console.log("Upload data:", data);

      if (res.ok) {
        setStatus("✅ Uploaded successfully!");
        setFile(null); // Reset file input
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Upload
      </button>
      <p className="mt-2 text-sm text-gray-600">{status}</p>
    </div>
  );
}
