import { Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription } from "@/components/ui/card";

interface ChatHeaderProps {
  streaming: boolean;
  messagesCount: number;
  filesCount: number;
  onClearChat: () => void;
  onToggleSidebar: () => void;
}

export function ChatHeader({
  streaming,
  messagesCount,
  filesCount,
  onClearChat,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="min-w-0 flex-1">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Chat</span>
        </CardTitle>
        <CardDescription className="text-xs mt-2">
          {streaming ? "Generating response..." : "Ask questions about your documents"}
        </CardDescription>
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearChat}
          title="Clear conversation"
          className="h-8 w-8"
          disabled={messagesCount === 0}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
