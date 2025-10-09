// import PdfList from "@/components/PdfList";
// import UploadModal from "@/components/UploadModal";

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50 p-6">
//       <h1 className="text-2xl font-bold mb-4">📄 PDF Upload Demo</h1>
//       <UploadModal />
//       <div className="mt-8">
//         <PdfList />
//       </div>
//     </main>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PDFViewer from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import ProgressDashboard from "@/components/ProgressDashboard";
import QuizGenerator from "@/components/QuizGenerator";
import ChatInterface from "@/components/ChatInterface";

interface PDFFile {
  id: string;
  name: string;
  file: File;
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
  pdfs: PDFFile[]; // ✅ added this line
  quizHistory: QuizResult[];
}


// interface Chat {
//   id: string;
//   title: string;
//   timestamp: Date;
//   messages: Message[];
//   quizHistory: QuizResult[];
// }

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citation?: {
    page: number;
    snippet: string;
  };
}

interface PDFRecord {
  id: string;
  title: string;
  filename: string;
  storagePath: string;
  indexedAt?: string | null;
}

interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuestionTypes {
  mcq: number;
  saq: number;
  laq: number;
}

interface QuizResult {
  id: string;
  timestamp: Date;
  score: number;
  total: number;
  answers: QuizAnswer[];
  questionTypes: QuestionTypes;
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [pdfs, setPdfs] = useState<PDFRecord[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePDF, setActivePDF] = useState<string | null>(null);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentView, setCurrentView] = useState<"chat" | "quiz" | "progress">("chat");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(true);

  // 🔹 Load PDFs on mount
  useEffect(() => {
    fetchPDFs();
  }, []);

  async function fetchPDFs(chatId?: string | null) { // ✅ added chatId param
    setIsLoading(true);
    try {
      // ✅ updated to request PDFs filtered by chatId
      const url = chatId ? `/api/pdfs?chatId=${chatId}` : "/api/pdfs";
      const res = await fetch(url);
      const data = await res.json();
      setPdfs(data || []);
    } catch (err) {
      console.error("Error fetching PDFs:", err);
    } finally {
      setIsLoading(false);
    }
  }
  

  // 🧠 Chat handling
  // const handleNewChat = () => {
  //   const newChat: Chat = {
  //     id: Date.now().toString(),
  //     title: "New Chat",
  //     timestamp: new Date(),
  //     messages: [],
  //     pdfs: [], // ✅ ensure each chat starts with its own empty PDF list
  //     quizHistory: [],
  //   };
  //   setChats((prev) => [newChat, ...prev]);
  //   setActiveChat(newChat.id);
  //   setActivePDF(null);
  //   setCurrentView("chat");
  //   setIsMobileOpen(false);

  //   // ✅ optional: fetch PDFs for the new chat (should be empty initially)
  //   fetchPDFs(newChat.id);

  // };
  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      // 🧩 Step 1: Create the chat in database (API call)
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
  
      if (!res.ok) throw new Error("Failed to create chat");
  
      // 🧩 Step 2: Get chat record from DB (contains id + createdAt)
      const chatFromDB = await res.json();
  
      // 🧩 Step 3: Create local chat object (with same DB id)
      const newChat: Chat = {
        id: chatFromDB.id, // ✅ use DB-generated UUID
        title: chatFromDB.title,
        timestamp: new Date(chatFromDB.createdAt),
        messages: [],
        pdfs: [], // ✅ each chat starts with its own PDFs
        quizHistory: [],
      };
  
      // 🧩 Step 4: Update local state
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat.id);
      setActivePDF(null);
      setCurrentView("chat");
      setIsMobileOpen(false);
  
      // 🧩 Step 5: Fetch PDFs for the chat (will be empty initially)
      fetchPDFs(newChat.id);
  
    } catch (err) {
      console.error("Error creating chat:", err);
    } finally {
      setIsLoading(false);
    }
  };
  

  // const handleSelectChat = (id: string) => {
  //   setActiveChat(id);
  //   setCurrentView("chat");
  //   setIsMobileOpen(false);
  // };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setActivePDF(null);
    setCurrentView("chat");
    setIsMobileOpen(false);
  
    // ✅ load PDFs for the selected chat
    fetchPDFs(id);
  };
  

  // 🔹 PDF Selection
  const handleSelectPDF = async (id: string | null) => {
    setActivePDF(id);
    setActivePdfUrl(null);
    if (!id) return;
    try {
      const res = await fetch(`/api/pdfs/${id}/metadata`);
      const data = await res.json();
      setActivePdfUrl(data.signedUrl);
    } catch (err) {
      console.error("Error fetching PDF metadata:", err);
    }
  };

  // 🔹 Upload PDFs
  // const handleUploadPDF = async (files: FileList) => {
  //   setIsLoading(true);
  //   setStatus("📤 Uploading PDF...");

  //   const formData = new FormData();
  //   formData.append("file", files[0]);

  //   if (activeChat) {
  //     formData.append("chatId", activeChat);
  //   }

  //   try {
  //     const res = await fetch("/api/upload", { method: "POST", body: formData });
  //     if (!res.ok) throw new Error("Upload failed");
  //     await fetchPDFs(activeChat);
  //     setStatus("✅ Uploaded successfully!");
  //   } catch (err) {
  //     console.error("Upload error:", err);
  //     setStatus("❌ Upload failed");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  // const handleUploadPDF = async (files: FileList) => {
  //   if (!activeChat) {
  //     alert("Please create or select a chat first!");
  //     return;
  //   }
  
  //   setIsLoading(true);
  //   setStatus("📤 Uploading PDF...");
  
  //   const formData = new FormData();
  //   formData.append("file", files[0]);
  //   formData.append("chatId", activeChat); // ✅ added line
  
  //   try {
  //     const res = await fetch("/api/upload", { method: "POST", body: formData });
  //     if (!res.ok) throw new Error("Upload failed");
  //     await fetchPDFs(activeChat); // ✅ fetch PDFs for that chat
  //     setStatus("✅ Uploaded successfully!");
  //   } catch (err) {
  //     console.error("Upload error:", err);
  //     setStatus("❌ Upload failed");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleUploadPDF = async (files: FileList) => {
    if (!activeChat) {
      alert("⚠️ Please create or select a chat first!");
      return;
    }
  
    if (!files || files.length === 0) {
      alert("⚠️ No file selected!");
      return;
    }
  
    setIsLoading(true);
    setStatus("📤 Uploading PDF...");
  
    const formData = new FormData();
    formData.append("file", files[0]);
    formData.append("chatId", activeChat); // ✅ still include chatId for DB relation
  
    try {
      // 🧩 Upload to /api/upload
      const res = await fetch("/api/upload", { method: "POST", body: formData });
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
  
      // 🧩 After successful upload, re-fetch PDFs for the same chat
      await fetchPDFs(activeChat);
  
      // 🧩 Success feedback
      setStatus("✅ Uploaded successfully!");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setStatus(`❌ Upload failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  

  // 🔹 Index PDFs (chunking)
  const handleIndex = async (pdfId: string) => {
    setIsLoading(true);
    setStatus("⚙️ Indexing PDF (chunking text)...");
    try {
      const res = await fetch(`/api/pdfs/${pdfId}/index`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Indexing failed");
      setStatus(`✅ ${data.message}`);
      await fetchPDFs();
    } catch (err) {
      console.error("Indexing error:", err);
      setStatus("❌ Indexing failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Embed PDFs (vector embeddings)
  const handleEmbed = async (pdfId: string) => {
    setIsLoading(true);
    setStatus("🧠 Generating embeddings...");
    try {
      const res = await fetch(`/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Embedding failed");
      setStatus(`✅ ${data.message || "Embeddings created successfully."}`);
    } catch (err) {
      console.error("Embedding error:", err);
      setStatus("❌ Embedding failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧩 Chat messages (connected to RAG)
  const handleSendMessage = async (content: string) => {
    if (!activeChat) handleNewChat();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    updateChatMessages(userMsg);

    setIsLoading(true);
    try {
      const res = await fetch("/api/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfIds: activePDF ? [activePDF] : pdfs.map(p => p.id), question: content }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "No answer found.",
        timestamp: new Date(),
      };
      updateChatMessages(aiMsg);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  function updateChatMessages(msg: Message) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === (activeChat || prev[0]?.id)
          ? { ...chat, messages: [...chat.messages, msg] }
          : chat
      )
    );
  }

  // 🔹 Quiz / Progress
  const handleShowQuiz = () => setCurrentView("quiz");
  const handleShowProgress = () => setCurrentView("progress");
  const handleSaveProgress = (score: number, total: number, answers: QuizAnswer[], questionTypes: QuestionTypes) => {
    if (!activeChat) return;
    const quizResult: QuizResult = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      score,
      total,
      answers,
      questionTypes,
    };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? { ...chat, quizHistory: [...chat.quizHistory, quizResult] }
          : chat
      )
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        pdfs={pdfs}
        activeChat={activeChat}
        activePDF={activePDF}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onSelectPDF={handleSelectPDF}
        onUploadPDF={handleUploadPDF}
        onIndex={handleIndex}
        onEmbed={handleEmbed}
        onShowQuiz={handleShowQuiz}
        onShowProgress={handleShowProgress}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
        status={status}
        isBusy={isLoading}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat / Quiz / Progress */}
        <div
          className={
            showPDFViewer && currentView === "chat" && pdfs.length > 0
              ? "flex-1 lg:w-1/2"
              : "flex-1"
          }
        >
          {currentView === "chat" && (
            <ChatInterface
              messages={
                chats.find((c) => c.id === activeChat)?.messages || []
              }
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          )}
          {currentView === "quiz" && (
            <QuizGenerator
              onBack={() => setCurrentView("chat")}
              onSaveProgress={handleSaveProgress}
              chatId={activeChat || ""}
            />
          )}
          {currentView === "progress" && (
            <ProgressDashboard
              onBack={() => setCurrentView("chat")}
              quizHistory={
                chats.find((c) => c.id === activeChat)?.quizHistory || []
              }
            />
          )}
        </div>

        {/* PDF Viewer */}
        {currentView === "chat" && pdfs.length > 0 && (
          <div
            className={`hidden lg:flex lg:flex-col ${
              showPDFViewer ? "lg:w-1/2" : "lg:w-0"
            } border-l border-gray-200 transition-all duration-300 overflow-hidden`}
          >
            {showPDFViewer && (
              <>
                <div className="absolute right-4 top-4 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPDFViewer(false)}
                    className="rounded-full shadow-lg bg-white"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
                <PDFViewer fileUrl={activePdfUrl} />
              </>
            )}
          </div>
        )}

        {/* Reopen button */}
        {currentView === "chat" && pdfs.length > 0 && !showPDFViewer && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPDFViewer(true)}
            className="fixed right-4 top-4 z-10 rounded-full shadow-lg bg-white hidden lg:flex"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
