import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import type { Message, ContextChunk } from "@/types";

type ApiError = {
  code?: string;
  message?: string;
  hint?: string;
  correlation_id?: string;
};

const parseErrorResponse = async (res: Response): Promise<ApiError> => {
  try {
    return (await res.json()) as ApiError;
  } catch (error) {
    console.error("Failed to parse error response", error);
    return {};
  }
};

export function useChatQuery(apiBase: string) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentAnswer]);

  const clearStreamingStates = useCallback(() => {
    setCurrentAnswer("");
  }, []);

  const streamQuery = useCallback(
    async (queryText: string, fileIds?: number[]) => {
      setStreaming(true);
      let streamedAnswer = "";
      let streamedContexts: ContextChunk[] = [];
      let completed = false;

      try {
        const payload: Record<string, unknown> = { query: queryText, stream: true };
        if (fileIds && fileIds.length > 0) {
          payload.file_ids = fileIds;
        }

        const res = await fetch(`${apiBase}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await parseErrorResponse(res);
          const message = err.message || res.statusText || "Request failed";
          const hint = err.hint ? ` (${err.hint})` : "";
          toast.error(`${message}${hint}`);
          return;
        }

        if (!res.body) {
          toast.error("Stream unavailable");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let eventType = "message";
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.replace("event:", "").trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5));
              }
            }

            const data = dataLines.join("\n");
            if (eventType === "context" && data) {
              try {
                streamedContexts = JSON.parse(data) as ContextChunk[];
              } catch (error) {
                console.error("Context parse error", error);
              }
            } else if (eventType === "error" && data) {
              try {
                const err = JSON.parse(data) as ApiError;
                const message = err.message || "An error occurred";
                const hint = err.hint ? ` (${err.hint})` : "";
                const correlation = err.correlation_id ? ` [id: ${err.correlation_id}]` : "";
                toast.error(`${message}${hint}${correlation}`);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `assistant-error-${Date.now()}`,
                    role: "assistant",
                    content: `Error: ${message}${hint}${correlation}`,
                    timestamp: new Date(),
                  },
                ]);
              } catch (error) {
                console.error("Error event parse failure", error);
                toast.error("Stream error occurred");
              }
              return;
            } else if (eventType !== "end" && data) {
              try {
                const chunk = JSON.parse(data);
                streamedAnswer += chunk.cleaned;
                setCurrentAnswer(streamedAnswer);
              } catch {
                streamedAnswer += data;
                setCurrentAnswer(streamedAnswer);
              }
            }
          }
        }

        completed = true;
        if (completed) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: streamedAnswer,
              contexts: streamedContexts,
              timestamp: new Date(),
            },
          ]);

          clearStreamingStates();
          toast.success("Response received");
        }
      } catch (error) {
        toast.error("Stream error occurred");
        console.error(error);
      } finally {
        setStreaming(false);
      }
    },
    [apiBase, toast, clearStreamingStates]
  );

  const runQuery = useCallback(async (fileIds?: number[]) => {
    if (!query.trim()) {
      toast.warning("Please enter a question");
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    clearStreamingStates();
    await streamQuery(currentQuery, fileIds);
  }, [query, toast, clearStreamingStates, streamQuery]);

  const handleQuestionClick = useCallback((question: string) => {
    setQuery(question);
    setTimeout(() => {
      const queryElement = document.querySelector("[data-testid='query-input']");
      queryElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }, []);

  return {
    query,
    setQuery,
    messages,
    setMessages,
    currentAnswer,
    streaming,
    messagesEndRef,
    runQuery,
    handleQuestionClick,
  };
}
