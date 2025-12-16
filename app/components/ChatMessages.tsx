import { FileQuestion } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  rawContent?: string;
  contexts?: ContextChunk[];
  timestamp: Date;
};

type ContextChunk = {
  chunk: string;
  citation: {
    doc_id: string;
    filename?: string;
    page?: number | null;
    section?: string | null;
  };
};

interface ChatMessagesProps {
  messages: Message[];
  streaming: boolean;
  currentAnswer: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({
  messages,
  streaming,
  currentAnswer,
  messagesEndRef,
}: ChatMessagesProps) {
  return (
    <ScrollArea className="h-full p-3">
      <div className="space-y-4 pb-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex items-center justify-center h-full min-h-50">
            <div className="text-center space-y-2 px-4">
              <FileQuestion className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 mx-auto text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">No messages yet. Ask a question to get started!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border"
                  }`}
                >
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                    {message.role === "assistant" && message.contexts && message.contexts.length > 0 && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Context ({message.contexts.length} chunks)
                        </summary>
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary/20 text-[10px]">
                          {message.contexts.map((ctx: ContextChunk, idx: number) => (
                            <div key={idx} className="space-y-1 wrap-break-word">
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                                {ctx.citation.filename || `Doc: ${ctx.citation.doc_id}`}
                                {ctx.citation.page && ` • Page ${ctx.citation.page}`}
                                {ctx.citation.section && ` • ${ctx.citation.section}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{ctx.chunk}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {streaming && currentAnswer && (
              <div className="flex justify-start">
                <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-muted border">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word">
                      {currentAnswer}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span>Generating...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
