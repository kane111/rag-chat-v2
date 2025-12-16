import { Send, Loader2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  query: string;
  streaming: boolean;
  filesCount: number;
  selectedCount: number;
  selectedFiles: { id: number; filename: string }[];
  canClear: boolean;
  onQueryChange: (query: string) => void;
  onSend: () => void;
  onClearChat: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onResetSelection: () => void;
  onRemoveFromSelection: (id: number) => void;
}

export function ChatInput({
  query,
  streaming,
  filesCount,
  selectedCount,
  selectedFiles,
  canClear,
  onQueryChange,
  onSend,
  onClearChat,
  onKeyDown,
  onResetSelection,
  onRemoveFromSelection,
}: ChatInputProps) {
  return (
    <div className="space-y-4">
      <Textarea
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Ask about your documents... (Ctrl+Enter to send)"
        data-testid="query-input"
        onKeyDown={onKeyDown}
        className="resize-none min-h-12.5 sm:min-h-15 text-xs sm:text-sm px-4 py-3"
        rows={2}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {filesCount > 0 ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">Scope:</span>
                {selectedCount > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {selectedFiles.map((f) => (
                      <span key={f.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-muted text-foreground text-[11px] hover:bg-muted/70 transition">
                        <span className="truncate max-w-48" title={f.filename}>{f.filename}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromSelection(f.id)}
                          aria-label={`Remove ${f.filename} from scope`}
                          className="ml-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition px-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>All {filesCount} file{filesCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-amber-600 dark:text-amber-500">Upload files to chat</span>
          )}
          {filesCount > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={onResetSelection}
                disabled={selectedCount === 0}
              >
                Use all files
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            onClick={onClearChat}
            disabled={!canClear || streaming}
            className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            <Eraser className="h-3 w-3 sm:h-4 sm:w-4" />
            Clear chat
          </Button>
          <Button
            onClick={onSend}
            disabled={streaming || !query.trim() || filesCount === 0}
            className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            {streaming ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Send className="h-3 w-3 sm:h-4 sm:w-4" />}
            {streaming ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
