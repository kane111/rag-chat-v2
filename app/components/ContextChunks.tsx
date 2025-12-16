"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FileText, Hash, BookOpen } from "lucide-react";

export interface ContextItem {
  chunk: string;
  citation: {
    doc_id: string;
    page?: number | null;
    section?: string | null;
  };
}

interface ContextChunksProps {
  contexts: ContextItem[];
}

export function ContextChunks({ contexts }: ContextChunksProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const formatCitation = (citation: ContextItem["citation"]) => {
    return {
      docId: citation.doc_id,
      page: citation.page,
      section: citation.section,
    };
  };

  return (
    <div className="space-y-3">
      {contexts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No context retrieved yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Ask a question to see relevant sources</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Retrieved Context</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {contexts.length} {contexts.length === 1 ? 'source' : 'sources'}
            </Badge>
          </div>

          <div className="space-y-3">
            {contexts.map((ctx, idx) => {
              const citation = formatCitation(ctx.citation);
              const isExpanded = expandedIdx === idx;

              return (
                <div
                  key={`${idx}-${ctx.citation.doc_id}`}
                  className="group rounded-lg border bg-card hover:bg-accent/5 transition-all duration-200 hover:shadow-sm"
                >
                  <Button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto text-left hover:bg-transparent"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Badge 
                        variant="outline" 
                        className="shrink-0 h-6 w-6 p-0 flex items-center justify-center rounded-full font-semibold text-xs bg-primary/10 border-primary/20"
                      >
                        {idx + 1}
                      </Badge>
                      
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs font-mono">
                            <FileText className="h-3 w-3 mr-1" />
                            {citation.docId}
                          </Badge>
                          
                          {citation.page && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              Page {citation.page}
                            </Badge>
                          )}
                        </div>
                        
                        {citation.section && (
                          <p className="text-xs text-muted-foreground truncate">
                            {citation.section}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-muted-foreground shrink-0 ml-2 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </Button>

                  {isExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="rounded-md bg-muted/30 p-3 border">
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word max-h-64 overflow-y-auto custom-scrollbar">
                          {ctx.chunk}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
