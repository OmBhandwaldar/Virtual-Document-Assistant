"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";

// Import CSS files for react-pdf
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";


// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

interface PDFViewerProps {
  file?: File | null;           // optional local File
  fileUrl?: string | null;      // optional remote/signed URL
  pdfName?: string;             // display name
  initialPage?: number;         // optional starting page
}

export default function PDFViewer({
  file = null,
  fileUrl = null,
  pdfName,
  initialPage = 1,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string>("");

  // Set up PDF.js worker client-side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import react-pdf and set up worker
      import("react-pdf").then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // Prefer File if provided, else fall back to URL
  const src: File | string | null = file ? file : fileUrl ? fileUrl : null;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    // reset to 1 (or provided initialPage bounded to numPages)
    setPageNumber(Math.min(Math.max(initialPage, 1), numPages));
    setError("");
  }

  function onDocumentLoadError(err: Error) {
    setError(err.message || "Failed to load PDF.");
  }

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale((prev) => Math.min(2.0, prev + 0.2));
  const zoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.2));

  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <FileText className="h-12 w-12 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No PDF Selected
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Upload and select a PDF from the sidebar to view it here. You can zoom,
          scroll, and switch pages easily.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-medium text-gray-900 truncate max-w-[240px]">
            {pdfName || (file instanceof File ? file.name : "Document")}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="rounded-lg"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="rounded-lg"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Page Navigation */}
          <div className="h-6 w-px bg-gray-300 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            {pageNumber} / {numPages || "—"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={numPages === 0 || pageNumber >= numPages}
            className="rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="flex justify-center p-6 min-h-full">
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="shadow-2xl rounded-lg overflow-hidden"
            options={{
              // You can add httpHeaders or withCredentials here if needed for protected URLs
              // httpHeaders: { Authorization: `Bearer ...` },
              // withCredentials: true,
            }}
          >
            {error ? (
              <div className="text-red-600 text-sm p-4">{error}</div>
            ) : (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import dynamic from "next/dynamic"; // ✅ added for lazy loading
// import { Button } from "@/components/ui/button";
// import {
//   ChevronLeft,
//   ChevronRight,
//   ZoomIn,
//   ZoomOut,
//   FileText,
// } from "lucide-react";
// import "react-pdf/dist/Page/AnnotationLayer.css";
// import "react-pdf/dist/Page/TextLayer.css";

// /* ✅ FIX: Dynamically import react-pdf client-side only */
// const { Document, Page, pdfjs } = dynamic(
//   async () => {
//     const mod = await import("react-pdf");
//     return {
//       default: () => null, // placeholder (not used directly)
//       Document: mod.Document,
//       Page: mod.Page,
//       pdfjs: mod.pdfjs,
//     };
//   },
//   { ssr: false }
// ) as unknown as typeof import("react-pdf");

// /* ✅ FIX: Safe worker setup for pdf.js */
// if (typeof window !== "undefined" && pdfjs) {
//   pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
// }

// interface PDFViewerProps {
//   file?: File | null;
//   fileUrl?: string | null;
//   pdfName?: string;
//   initialPage?: number;
// }

// export default function PDFViewer({
//   file = null,
//   fileUrl = null,
//   pdfName,
//   initialPage = 1,
// }: PDFViewerProps) {
//   const [numPages, setNumPages] = useState<number>(0);
//   const [pageNumber, setPageNumber] = useState<number>(initialPage);
//   const [scale, setScale] = useState<number>(1.0);
//   const [error, setError] = useState<string>("");

//   const src: File | string | null = file ? file : fileUrl ? fileUrl : null;

//   function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
//     setNumPages(numPages);
//     setPageNumber(Math.min(Math.max(initialPage, 1), numPages));
//     setError("");
//   }

//   function onDocumentLoadError(err: Error) {
//     setError(err.message || "Failed to load PDF.");
//   }

//   const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
//   const goToNextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));
//   const zoomIn = () => setScale((p) => Math.min(2.0, p + 0.2));
//   const zoomOut = () => setScale((p) => Math.max(0.5, p - 0.2));

//   if (!src) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8">
//         <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
//           <FileText className="h-12 w-12 text-purple-600" />
//         </div>
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">
//           No PDF Selected
//         </h3>
//         <p className="text-gray-600 text-center max-w-md">
//           Upload and select a PDF from the sidebar to view it here. You can zoom,
//           scroll, and switch pages easily.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full bg-gray-100">
//       {/* Toolbar */}
//       <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
//         <div className="flex items-center space-x-2">
//           <FileText className="h-5 w-5 text-purple-600" />
//           <h3 className="text-sm font-medium text-gray-900 truncate max-w-[240px]">
//             {pdfName || (file instanceof File ? file.name : "Document")}
//           </h3>
//         </div>

//         <div className="flex items-center space-x-2">
//           {/* Zoom Controls */}
//           <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
//             <ZoomOut className="h-4 w-4" />
//           </Button>
//           <span className="text-sm text-gray-600 min-w-[60px] text-center">
//             {Math.round(scale * 100)}%
//           </span>
//           <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 2.0}>
//             <ZoomIn className="h-4 w-4" />
//           </Button>

//           {/* Page Navigation */}
//           <div className="h-6 w-px bg-gray-300 mx-2" />
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={goToPrevPage}
//             disabled={pageNumber <= 1}
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
//           <span className="text-sm text-gray-600 min-w-[80px] text-center">
//             {pageNumber} / {numPages || "—"}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={goToNextPage}
//             disabled={numPages === 0 || pageNumber >= numPages}
//           >
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* PDF Display */}
//       <div className="flex-1 overflow-auto bg-gray-100">
//         <div className="flex justify-center p-6 min-h-full">
//           <Document
//             file={src}
//             onLoadSuccess={onDocumentLoadSuccess}
//             onLoadError={onDocumentLoadError}
//             className="shadow-2xl rounded-lg overflow-hidden"
//           >
//             {error ? (
//               <div className="text-red-600 text-sm p-4">{error}</div>
//             ) : (
//               <Page
//                 pageNumber={pageNumber}
//                 scale={scale}
//                 renderTextLayer
//                 renderAnnotationLayer
//                 className="bg-white"
//               />
//             )}
//           </Document>
//         </div>
//       </div>
//     </div>
//   );
// }
