import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/app/components/Toast";
import type { Message, ContextChunk } from "@/types";

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
    async (queryText: string) => {
      setStreaming(true);
      let streamedAnswer = "";
      let streamedContexts: ContextChunk[] = [];

      try {
        const res = await fetch(`${apiBase}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({ query: queryText, stream: true }),
        });

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
      } catch (error) {
        toast.error("Stream error occurred");
        console.error(error);
      } finally {
        setStreaming(false);
      }
    },
    [apiBase, toast, clearStreamingStates]
  );

  const runQuery = useCallback(async () => {
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
    await streamQuery(currentQuery);
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
