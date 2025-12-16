import { useState, useCallback } from "react";
import type { Chunk } from "@/types";

export function useFileContent(apiBase: string) {
  const [fileChunks, setFileChunks] = useState<Map<number, Chunk[]>>(new Map());
  const [loadingChunks, setLoadingChunks] = useState<Set<number>>(new Set());
  const [showChunksFor, setShowChunksFor] = useState<number | null>(null);

  const toggleState = useCallback((current: number | null, id: number): number | null => 
    current === id ? null : id, []
  );

  const deleteFromMap = useCallback(<K, V>(map: Map<K, V>, key: K): Map<K, V> => {
    const next = new Map(map);
    next.delete(key);
    return next;
  }, []);

  const fetchFileChunks = useCallback(
    async (fileId: number) => {
      if (fileChunks.has(fileId)) {
        setShowChunksFor((current) => toggleState(current, fileId));
        return;
      }

      setLoadingChunks((prev) => new Set(prev).add(fileId));
      try {
        const res = await fetch(`${apiBase}/file/${fileId}/chunks`);
        if (res.ok) {
          const data: Chunk[] = await res.json();
          setFileChunks((prev) => new Map(prev).set(fileId, data));
          setShowChunksFor(fileId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingChunks((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
    },
    [apiBase, fileChunks, toggleState]
  );

  const clearFile = useCallback((fileId: number) => {
    setFileChunks((prev) => deleteFromMap(prev, fileId));
  }, [deleteFromMap]);

  return {
    fileChunks,
    loadingChunks,
    showChunksFor,
    fetchFileChunks,
    clearFile,
  };
}
