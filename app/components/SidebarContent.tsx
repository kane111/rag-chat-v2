import { useEffect, useMemo, useState } from "react";
import { RefreshCw, ChevronRight, Folder, PanelsTopLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadZone } from "./FileUploadZone";
import { FileListItem } from "./FileListItem";
import { ChunksViewer } from "./ChunksViewer";
import type { FileMeta, Chunk } from "@/types";

interface SidebarContentProps {
  files: FileMeta[];
  uploading: boolean;
  fileChunks: Map<number, Chunk[]>;
  loadingChunks: Set<number>;
  showChunksFor: number | null;
  onUpload: (file: File) => Promise<void>;
  onRefresh: () => Promise<void>;
  onClose?: () => void;
  onDelete: (id: number) => void;
  onShowChunks: (id: number) => Promise<void>;
  selectedFileIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function SidebarContent({
  files,
  uploading,
  fileChunks,
  loadingChunks,
  showChunksFor,
  onUpload,
  onRefresh,
  onClose,
  onDelete,
  onShowChunks,
  selectedFileIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
}: SidebarContentProps) {
  const [activeTab, setActiveTab] = useState("files");
  const [previewFor, setPreviewFor] = useState<number | null>(null);

  const selectedChunkFile = useMemo(
    () => files.find((file) => file.id === showChunksFor) || null,
    [files, showChunksFor]
  );

  const selectedCount = selectedFileIds.size;
  const selectedFilesList = useMemo(() => files.filter(f => selectedFileIds.has(f.id)).map(f => ({ id: f.id, filename: f.filename })), [files, selectedFileIds]);

  const selectedPreviewFile = useMemo(
    () => files.find((file) => file.id === previewFor) || null,
    [files, previewFor]
  );

  const handleShowChunks = async (id: number) => {
    await onShowChunks(id);
    setActiveTab("chunks");
  };

  const handleShowPreview = async (id: number) => {
    setPreviewFor((current) => (current === id ? null : id));
    setActiveTab("preview");
  };

  // Auto-load first file data when user switches tabs without selecting a file
  useEffect(() => {
    const firstFile = files[0];
    if (!firstFile) return;

    if (activeTab === "chunks" && !showChunksFor && !loadingChunks.has(firstFile.id)) {
      handleShowChunks(firstFile.id);
    }

    if (activeTab === "preview" && previewFor === null) {
      setPreviewFor(firstFile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const chunkCount = selectedChunkFile
    ? fileChunks.get(selectedChunkFile.id)?.length || 0
    : files.length;

  const previewFilesCount = useMemo(() => files.filter(f => !!f.raw_markdown)?.length, [files]);

  const handleExportTxt = (file: FileMeta) => {
    if (!file.raw_markdown) return;
    const blob = new Blob([file.raw_markdown], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const base = file.filename.replace(/\.[^.]+$/, "");
    a.download = `${base}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const handleExportPdf = async (file: FileMeta) => {
    if (!file.raw_markdown) return;
    // @ts-ignore - module declared in types/jspdf.d.ts; ensure package installed
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 14;

    doc.setFont("courier", "normal");
    doc.setFontSize(10);

    const text = (file.raw_markdown || "").replace(/\r\n/g, "\n");
    const lines = doc.splitTextToSize(text, maxWidth);

    let y = margin + 20;
    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    const base = file.filename.replace(/\.[^.]+$/, "");
    doc.save(`${base}.pdf`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 shrink-0 border-b space-y-3 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs uppercase text-muted-foreground font-semibold">
              Knowledge Base
            </p>
            <CardTitle className="text-base sm:text-xl">Files & Ingestion</CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              Upload files, inspect chunks, and preview markdown.
            </CardDescription>
          </div>
          <div className="flex gap-1 ml-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              aria-label="Refresh files"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close sidebar"
                className="h-8 w-8 sm:h-9 sm:w-9 lg:hidden"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col px-5 py-5 min-h-0">
        <FileUploadZone onUpload={onUpload} disabled={uploading} />

        <div className="rounded-lg border bg-muted/50 px-3 py-2 flex items-start justify-between gap-3 text-[11px]">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="uppercase text-[10px] font-semibold text-muted-foreground">Chat scope</p>
            {selectedCount > 0 ? (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                {selectedFilesList.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-muted text-foreground text-[11px] hover:bg-muted/70 transition">
                    <span className="truncate max-w-48" title={f.filename}>{f.filename}</span>
                    <button
                      type="button"
                      onClick={() => onToggleSelect(f.id)}
                      aria-label={`Remove ${f.filename} from scope`}
                      className="ml-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition px-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-foreground text-sm font-medium">{files.length > 0 ? "All files" : "No files available"}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {selectedCount > 0 ? "Responses will use only the selected files." : "No selection means the chat will search all files."}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={onSelectAll}
              disabled={files.length === 0}
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="gap-2 self-start">
            <TabsTrigger value="files" className="gap-2 text-xs">
              <Folder className="h-4 w-4" /> Files
              <Badge variant="secondary" className="text-[10px] ml-1">
                {files.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="chunks" className="gap-2 text-xs">
              <PanelsTopLeft className="h-4 w-4" /> Chunks
              <Badge variant="outline" className="text-[10px] ml-1">
                {chunkCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 text-xs">
              <FileText className="h-4 w-4" /> Preview
              <Badge variant="outline" className="text-[10px] ml-1">
                {previewFilesCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2 sm:space-y-3 pb-4">
                {files.length === 0 ? (
                  <div className="rounded-lg border bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a PDF, DOCX, or TXT file to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        onDelete={onDelete}
                        onShowChunks={handleShowChunks}
                        onShowPreview={handleShowPreview}
                        showingChunks={showChunksFor === file.id}
                        showingPreview={previewFor === file.id}
                        loadingChunks={loadingChunks.has(file.id)}
                        selected={selectedFileIds.has(file.id)}
                        onToggleSelect={onToggleSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chunks" className="flex-1 min-h-0 mt-3">
            <div className="flex flex-col gap-3 h-full min-h-0">
              {selectedChunkFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{selectedChunkFile.filename}</p>
                      <p className="text-[11px]">Showing extracted chunks</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {fileChunks.get(selectedChunkFile.id)?.length || 0} chunks
                    </Badge>
                  </div>
                  {fileChunks.has(selectedChunkFile.id) ? (
                    <ScrollArea className="h-80 pr-2">
                      <ChunksViewer chunks={fileChunks.get(selectedChunkFile.id)!} isContext={false} maxHeight="" />
                    </ScrollArea>
                  ) : (
                    <div className="rounded-lg border bg-muted p-4 text-xs text-muted-foreground">Select a file from Files to load its chunks.</div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted p-4 text-xs text-muted-foreground">Pick a file in Files to inspect its chunks.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-3 max-w-full overflow-x-hidden">
            <div className="flex flex-col gap-3 h-full max-w-full overflow-x-hidden">
              {selectedPreviewFile ? (
                <div className="space-y-2 max-w-full overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate" title={selectedPreviewFile.filename}>{selectedPreviewFile.filename}</p>
                      <p className="text-[11px]">Raw Markdown Preview</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedPreviewFile.raw_markdown ? `${Math.round((selectedPreviewFile.raw_markdown.length || 0) / 1024)}KB` : "0KB"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportTxt(selectedPreviewFile)}
                        title="Export as .txt"
                      >
                        Export .txt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPdf(selectedPreviewFile)}
                        title="Export as PDF"
                      >
                        Export PDF
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 max-w-full overflow-x-hidden">
                    {selectedPreviewFile.raw_markdown ? (
                      <ScrollArea className="h-72 sm:h-80 pr-2 max-w-full overflow-x-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                          <pre className="text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap wrap-break-word leading-relaxed">
                            {selectedPreviewFile.raw_markdown}
                          </pre>
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="rounded-lg border bg-muted p-4 text-xs text-muted-foreground">No markdown available for this file.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted p-4 text-xs text-muted-foreground">Pick a file in Files to view its markdown preview.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
