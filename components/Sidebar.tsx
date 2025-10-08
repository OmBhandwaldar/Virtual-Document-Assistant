"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquarePlus,
  FileText,
  BarChart3,
  Menu,
  X,
  Database,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface ServerPDF {
  id: string;
  title: string;
  filename: string;
  storagePath: string;
  indexedAt?: string | null;
}

interface SidebarProps {
  chats: Chat[];
  pdfs: ServerPDF[];
  activeChat: string | null;
  activePDF: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onSelectPDF: (id: string | null) => void;
  onUploadPDF: (files: FileList) => void;
  onIndex: (pdfId: string) => void;
  onEmbed: (pdfId: string) => void;
  onShowQuiz: () => void;
  onShowProgress: () => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
  status?: string;
  isBusy?: boolean;
}

export default function Sidebar({
  chats,
  pdfs,
  activeChat,
  activePDF,
  onNewChat,
  onSelectChat,
  onSelectPDF,
  onUploadPDF,
  onIndex,
  onEmbed,
  onShowQuiz,
  onShowProgress,
  isMobileOpen,
  onMobileToggle,
  status,
  isBusy,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"chats" | "pdfs">("pdfs");

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-[280px] bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Document Assistant
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMobileToggle}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pdfs")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "pdfs"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            PDFs
          </button>
          <button
            onClick={() => setActiveTab("chats")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "chats"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Chats
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === "pdfs" ? (
            <div className="p-2 space-y-1">
              {/* Upload */}
              <div className="mb-3">
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center justify-center w-full px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Upload PDF
                  </span>
                </label>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && onUploadPDF(e.target.files)}
                />
              </div>

              {pdfs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No PDFs uploaded yet
                </p>
              ) : (
                pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all border hover:bg-white hover:shadow-sm mb-1",
                      activePDF === pdf.id
                        ? "bg-white shadow-md border-purple-300"
                        : "border-gray-200"
                    )}
                  >
                    <div
                      onClick={() => onSelectPDF(pdf.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pdf.title || pdf.filename}
                        </p>
                      </div>
                    </div>

                    {/* Index + Embed controls */}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        // size="xs"
                        onClick={() => onIndex(pdf.id)}
                        disabled={isBusy}
                        className="flex items-center gap-1 rounded-lg text-xs"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Layers className="h-3 w-3 text-purple-600" />
                        )}
                        Index
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        // size="xs"
                        onClick={() => onEmbed(pdf.id)}
                        disabled={isBusy}
                        className="flex items-center gap-1 rounded-lg text-xs"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Database className="h-3 w-3 text-blue-600" />
                        )}
                        Embed
                      </Button>
                    </div>

                    {/* Status */}
                    {pdf.indexedAt ? (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Indexed
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Not indexed
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No chats yet. Start a new chat!
                </p>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all hover:bg-white hover:shadow-sm",
                      activeChat === chat.id
                        ? "bg-white shadow-md border border-purple-200"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chat.timestamp.toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {status && (
            <p className="text-xs text-gray-600 text-center">{status}</p>
          )}
          <Button
            onClick={onShowQuiz}
            variant="outline"
            className="w-full justify-start rounded-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Quiz
          </Button>
          <Button
            onClick={onShowProgress}
            variant="outline"
            className="w-full justify-start rounded-lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Progress
          </Button>
        </div>
      </div>

      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-30 lg:hidden rounded-full shadow-lg bg-white"
        onClick={onMobileToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  );
}
