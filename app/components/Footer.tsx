"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FooterProps = {
  providerSelection?: {
    llm: { provider: string; model: string };
    embedding: { provider: string; model: string };
  } | null;
  ragSelection?: {
    retrieval_strategy: string;
    top_k: number;
    score_threshold?: number | null;
    fetch_k?: number | null;
    lambda_mult?: number | null;
    chunking_method?: string | null;
    vector_backend: string;
  } | null;
};

export function Footer({ providerSelection, ragSelection }: FooterProps) {
  const [expanded, setExpanded] = useState(false);

  if (!providerSelection && !ragSelection) {
    return null;
  }

  const hasDetails = ragSelection && (
    ragSelection.score_threshold != null ||
    ragSelection.fetch_k != null ||
    ragSelection.lambda_mult != null
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t bg-muted/50 backdrop-blur-sm shrink-0 z-40">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main row */}
        <div className="py-3.5">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Title and Models */}
            <div className="flex items-center gap-5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-xs font-semibold text-foreground uppercase tracking-wide">
                  Config
                </span>
              </div>

              {/* Models in minimal view */}
              <div className="hidden sm:flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {providerSelection && (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">LLM:</span>
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-mono truncate">
                        {providerSelection.llm.model}
                      </Badge>
                    </div>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">Emb:</span>
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] font-mono truncate">
                        {providerSelection.embedding.model}
                      </Badge>
                    </div>
                  </>
                )}

                {ragSelection && (
                  <>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">Vector:</span>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] truncate">
                        {ragSelection.vector_backend}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Toggle for details */}
            {hasDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
                aria-label={expanded ? "Hide details" : "Show details"}
              >
                <span className="hidden sm:inline">Details</span>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable details row */}
        {expanded && hasDetails && (
          <div className="border-t border-border/50 py-3 px-0">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-[10px] sm:text-xs text-muted-foreground">
              {ragSelection?.retrieval_strategy && (
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">Retrieval:</span>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                    {ragSelection.retrieval_strategy}
                  </Badge>
                  <span>(top-k: {ragSelection.top_k})</span>
                </span>
              )}

              {ragSelection?.score_threshold != null && (
                <span>
                  <span className="font-medium">Threshold:</span> {ragSelection.score_threshold.toFixed(2)}
                </span>
              )}

              {ragSelection?.fetch_k != null && (
                <span>
                  <span className="font-medium">Fetch-k:</span> {ragSelection.fetch_k}
                </span>
              )}

              {ragSelection?.lambda_mult != null && (
                <span>
                  <span className="font-medium">Lambda:</span> {ragSelection.lambda_mult.toFixed(2)}
                </span>
              )}

              {ragSelection?.chunking_method && (
                <span>
                  <span className="font-medium">Chunking:</span> {ragSelection.chunking_method}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
