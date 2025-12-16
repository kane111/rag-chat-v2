"use client";

import { FileIcon } from "./FileIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText, ListTree, Loader2, Trash2 } from "lucide-react";

export interface FileMeta {
  id: number;
  filename: string;
  filetype: string;
  size_mb: number;
  uploaded_at: string;
  converted_with_docling: boolean;
  raw_markdown?: string | null;
}

interface FileListItemProps {
  file: FileMeta;
  onDelete: (id: number) => void;
  onShowChunks: (id: number) => void;
  onShowPreview: (id: number) => void;
  showingChunks: boolean;
  showingPreview: boolean;
  loadingChunks: boolean;
}

export function FileListItem({
  file,
  onDelete,
  onShowChunks,
  onShowPreview,
  showingChunks,
  showingPreview,
  loadingChunks,
}: FileListItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm hover:border-primary transition">
      {/* Header with filename and delete button */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileIcon filetype={file.filetype} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate" title={file.filename}>
            {file.filename}
          </p>
        </div>
        <Button
          onClick={() => onDelete(file.id)}
          size="sm"
          variant="ghost"
          aria-label="Delete file"
          title="Delete file"
          className="text-destructive hover:bg-destructive/10 shrink-0 h-6 w-6 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Metadata row */}
      <div className="px-4 py-2.5 border-b bg-muted/30">
        <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-xs text-muted-foreground">
          <span>{file.filetype.toUpperCase()}</span>
          <span>•</span>
          <span>{file.size_mb.toFixed(2)} MB</span>
          {file.converted_with_docling && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="gap-1 text-[8px] sm:text-xs py-0 px-1.5">
                <FileText className="h-2.5 w-2.5" /> Docling
              </Badge>
            </>
          )}
          <span>•</span>
          <span>{formatDate(file.uploaded_at)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => onShowChunks(file.id)}
            disabled={loadingChunks}
            size="sm"
            variant="outline"
            aria-label={`${showingChunks ? "Hide" : "Show"} chunks`}
            title="View file chunks"
            className="flex-1 min-w-fit text-xs gap-1"
          >
            <ListTree className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Chunks</span>
            {loadingChunks ? <Loader2 className="h-3 w-3 ml-auto animate-spin" /> : showingChunks ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </Button>
          <Button
            onClick={() => onShowPreview(file.id)}
            size="sm"
            variant="outline"
            aria-label={`${showingPreview ? "Hide" : "Show"} preview`}
            title="View markdown preview"
            className="flex-1 min-w-fit text-xs gap-1"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Preview</span>
            {showingPreview ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </Button>
        </div>
        {/* Markdown preview button removed; preview now handled in sidebar tab */}
      </div>
    </div>
  );
}
