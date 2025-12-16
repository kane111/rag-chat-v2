import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  query: string;
  streaming: boolean;
  filesCount: number;
  onQueryChange: (query: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function ChatInput({
  query,
  streaming,
  filesCount,
  onQueryChange,
  onSend,
  onKeyDown,
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
        <div className="text-xs text-muted-foreground">
          {filesCount > 0 ? (
            <span>{filesCount} file{filesCount !== 1 ? "s" : ""} available</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-500">No files uploaded</span>
          )}
        </div>
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
  );
}
