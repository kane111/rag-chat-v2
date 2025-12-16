"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./components/Modal";
import { Footer } from "./components/Footer";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { SidebarContent } from "./components/SidebarContent";
import { CollapsedSidebar } from "./components/CollapsedSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFileManagement } from "./hooks/useFileManagement";
import { useFileContent } from "./hooks/useFileContent";
import { useChatQuery } from "./hooks/useChatQuery";
import type { ProviderSelection, RagSelection } from "@/types";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [providerSelection, setProviderSelection] = useState<ProviderSelection | null>(null);
  const [ragSelection, setRagSelection] = useState<RagSelection | null>(null);

  const apiBase = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (envBase) return envBase;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.port === "3000") return "http://localhost:8000";
      return `${url.protocol}//${url.host}`;
    }
    return "http://localhost:8000";
  }, []);

  // Hooks for managing different features
  const fileManagement = useFileManagement(apiBase);
  const fileContent = useFileContent(apiBase);
  const chat = useChatQuery(apiBase);

  useEffect(() => {
    fileManagement.refreshFiles();
    loadProviderAndRagConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
      setSidebarOpen(event.matches);
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener("change", handleMediaChange as (event: MediaQueryListEvent) => void);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange as (event: MediaQueryListEvent) => void);
    };
  }, []);

  async function loadProviderAndRagConfig() {
    try {
      const [providerRes, ragRes] = await Promise.all([
        fetch(`${apiBase}/providers/selection`),
        fetch(`${apiBase}/providers/rag/selection`),
      ]);
      if (providerRes.ok) {
        const data = await providerRes.json();
        setProviderSelection(data);
      }
      if (ragRes.ok) {
        const data = await ragRes.json();
        setRagSelection(data.selection);
      }
    } catch (error) {
      console.error("Failed to load provider/RAG config", error);
    }
  }

  const desktopColumns = sidebarOpen && isDesktop ? "minmax(0, 1fr) 360px" : "1fr";

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col pb-24">
      <Modal
        isOpen={fileManagement.deleteModalOpen}
        title="Delete file?"
        description="This action cannot be undone. The file and all its chunks will be permanently deleted."
        onClose={fileManagement.closeDeleteModal}
        onConfirm={() => {
          if (fileManagement.deleteFileId) {
            fileManagement.handleDeleteFile(fileManagement.deleteFileId);
          }
        }}
        confirmText="Delete"
        confirmVariant="danger"
        isDangerous={true}
      />

      <div className="flex-1 relative flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 h-full flex flex-col">
              <div
                className="grid h-full gap-4 sm:gap-6"
                style={{ gridTemplateColumns: desktopColumns }}
              >
                {/* Main chat area */}
                <div className="min-w-0 flex flex-col">
                  <Card className="flex flex-col h-full shadow-lg bg-card/80 backdrop-blur-sm border-border/70">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] px-5 py-2 border-b bg-muted/50">
                      <Badge variant="secondary" className="text-[10px]">
                        {fileManagement.files.length} file{fileManagement.files.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        KB {sidebarOpen ? "open" : "hidden"}
                      </Badge>
                      {chat.streaming && (
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Generating
                        </Badge>
                      )}
                    </div>

                    <div className="pb-1 sm:pb-2 shrink-0 border-b bg-linear-to-r from-background to-muted/20 space-y-3 px-5 py-4">
                      <ChatHeader
                        streaming={chat.streaming}
                        messagesCount={chat.messages.length}
                        filesCount={fileManagement.files.length}
                        sidebarOpen={sidebarOpen}
                        onClearChat={() => chat.setMessages([])}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <ChatMessages
                        messages={chat.messages}
                        streaming={chat.streaming}
                        currentAnswer={chat.currentAnswer}
                        messagesEndRef={chat.messagesEndRef}
                      />
                    </div>

                    <div className="shrink-0 border-t bg-muted/40 px-5 py-4">
                      <ChatInput
                        query={chat.query}
                        streaming={chat.streaming}
                        filesCount={fileManagement.files.length}
                        onQueryChange={chat.setQuery}
                        onSend={chat.runQuery}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey) {
                            chat.runQuery();
                          }
                        }}
                      />
                    </div>
                  </Card>
                </div>

                {/* Knowledge base (desktop) */}
                {isDesktop && sidebarOpen && (
                  <div className="hidden lg:flex">
                    <SidebarContent
                      files={fileManagement.files}
                      uploading={fileManagement.uploading}
                      fileChunks={fileContent.fileChunks}
                      loadingChunks={fileContent.loadingChunks}
                      showChunksFor={fileContent.showChunksFor}
                      onUpload={fileManagement.handleUpload}
                      onRefresh={fileManagement.handleRefreshFiles}
                      onMinimize={() => setSidebarOpen(false)}
                      onDelete={fileManagement.openDeleteModal}
                      onShowChunks={fileContent.fetchFileChunks}
                    />
                  </div>
                )}

                {isDesktop && !sidebarOpen && (
                  <div className="hidden lg:flex items-start justify-end">
                    <CollapsedSidebar
                      filesCount={fileManagement.files.length}
                      onExpand={() => setSidebarOpen(true)}
                      onRefresh={fileManagement.handleRefreshFiles}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile knowledge base drawer */}
      {!isDesktop && (
        <div
          className={`fixed inset-0 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
          aria-hidden={!sidebarOpen}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md sm:w-[88vw] bg-background border-l shadow-2xl p-3 flex flex-col overflow-hidden">
            <SidebarContent
              files={fileManagement.files}
              uploading={fileManagement.uploading}
              fileChunks={fileContent.fileChunks}
              loadingChunks={fileContent.loadingChunks}
              showChunksFor={fileContent.showChunksFor}
              onUpload={fileManagement.handleUpload}
              onRefresh={fileManagement.handleRefreshFiles}
              onMinimize={() => setSidebarOpen(false)}
              onDelete={fileManagement.openDeleteModal}
              onShowChunks={fileContent.fetchFileChunks}
            />
          </div>
        </div>
      )}

      <Footer providerSelection={providerSelection} ragSelection={ragSelection} />
    </div>
  );
}