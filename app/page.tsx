import PdfList from "@/components/PdfList";
import UploadModal from "@/components/UploadModal";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">📄 PDF Upload Demo</h1>
      <UploadModal />
      <div className="mt-8">
        <PdfList />
      </div>
    </main>
  );
}
