import { ClipboardList } from "lucide-react";
import type { Chunk } from "@/types";

interface FileChunksViewerProps {
  chunks: Chunk[];
}

export function FileChunksViewer({ chunks }: FileChunksViewerProps) {
  return (
    <div className="ml-2 sm:ml-3 rounded-lg border bg-muted p-2 sm:p-3 flex flex-col h-80 overflow-hidden">
      <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-foreground flex-wrap shrink-0 pb-2 border-b border-muted-foreground/20">
        <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
        <span className="text-[10px] sm:text-xs">Chunks ({chunks.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-2 pr-2">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="rounded-lg border bg-card p-2 text-[10px] space-y-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">Chunk #{chunk.chunk_index + 1}</span>
                <div className="flex gap-1 text-[8px] sm:text-[9px] text-muted-foreground flex-wrap">
                  {chunk.page_number && <span>p.{chunk.page_number}</span>}
                  {chunk.section_heading && (
                    <span className="line-clamp-2 text-left" title={chunk.section_heading}>
                      {chunk.section_heading}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap wrap-break-word">
                {chunk.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
