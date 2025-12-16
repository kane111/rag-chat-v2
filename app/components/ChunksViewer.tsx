import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Chunk } from "@/types";

export interface ContextItem {
  chunk: string;
  citation: {
    doc_id: string;
    page?: number | null;
    section?: string | null;
    filename?: string;
  };
}

interface ChunksViewerProps {
  chunks: (Chunk | ContextItem)[];
  isContext?: boolean;
  maxHeight?: string;
}

function isContextItem(chunk: any): chunk is ContextItem {
  return chunk.citation !== undefined;
}

function isFileChunk(chunk: any): chunk is Chunk {
  return chunk.content !== undefined && chunk.chunk_index !== undefined;
}

export function ChunksViewer({
  chunks,
  isContext = false,
  maxHeight = "h-80",
}: ChunksViewerProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (chunks.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400 text-xs">
        No {isContext ? "context" : "chunks"} retrieved yet.
      </p>
    );
  }

  return (
    <div className={`rounded-lg border bg-muted p-2 sm:p-3 flex flex-col overflow-hidden ${isContext ? "space-y-2" : `${maxHeight}`}`}>
      {!isContext && (
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-foreground flex-wrap shrink-0 pb-2 border-b border-muted-foreground/20">
          <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          <span className="text-[10px] sm:text-xs">Chunks ({chunks.length})</span>
        </div>
      )}
      <div className={isContext ? "" : "flex-1 overflow-y-auto mt-2"}>
        <div className={isContext ? "space-y-2" : "space-y-2 pr-2"}>
          {chunks.map((chunk, idx) => {
            if (isFileChunk(chunk)) {
              // Render file chunk
              return (
                <div
                  key={chunk.id}
                  className="rounded-lg border bg-card p-2 text-[10px] space-y-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-foreground">
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    <div className="flex gap-1 text-[8px] sm:text-[9px] text-muted-foreground flex-wrap">
                      {chunk.page_number && <span>p.{chunk.page_number}</span>}
                      {chunk.section_heading && (
                        <span
                          className="line-clamp-2 text-left"
                          title={chunk.section_heading}
                        >
                          {chunk.section_heading}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
                    {chunk.content}
                  </p>
                </div>
              );
            } else if (isContextItem(chunk)) {
              // Render context item
              const formatCitation = () => {
                const bits = [chunk.citation.filename || `Doc ${chunk.citation.doc_id}`];
                if (chunk.citation.page) bits.push(`p.${chunk.citation.page}`);
                if (chunk.citation.section) bits.push(chunk.citation.section);
                return bits.join(" · ");
              };

              return (
                <div
                  key={`${idx}-${chunk.citation.doc_id}`}
                  className="rounded-lg border bg-card p-3 transition hover:border-primary/30"
                >
                  <Button
                    onClick={() =>
                      setExpandedIdx(expandedIdx === idx ? null : idx)
                    }
                    variant="ghost"
                    className="w-full justify-between px-0 text-left"
                    aria-expanded={expandedIdx === idx}
                  >
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                      {formatCitation()}
                    </p>
                    <span className="text-muted-foreground shrink-0">
                      {expandedIdx === idx ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </Button>

                  {expandedIdx === idx && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground whitespace-pre-wrap wrap-break-word max-h-48 overflow-y-auto">
                      {chunk.chunk}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
