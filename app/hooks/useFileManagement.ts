import { useState, useCallback } from "react";
import { useToast } from "@/app/components/Toast";
import type { FileMeta } from "@/types";

export function useFileManagement(apiBase: string) {
  const toast = useToast();
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/files`);
      if (res.ok) {
        const incoming = (await res.json()) as FileMeta[];
        setFiles(incoming);
        // Keep only selections that still exist
        setSelectedFileIds((prev) => {
          const allowed = new Set(incoming.map((f) => f.id));
          const next = new Set<number>();
          prev.forEach((id) => {
            if (allowed.has(id)) next.add(id);
          });
          return next;
        });
      }
    } catch (error) {
      console.error(error);
    }
  }, [apiBase]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${apiBase}/ingest`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const detail = await res.text();
          toast.error(`Upload failed: ${detail}`);
          return;
        }
        await res.json();
        toast.success("File ingested successfully");
        await refreshFiles();
      } catch (error) {
        toast.error("Upload error occurred");
        console.error(error);
      } finally {
        setUploading(false);
      }
    },
    [apiBase, toast, refreshFiles]
  );

  const handleDeleteFile = useCallback(
    async (id: number) => {
      setDeleteModalOpen(false);
      try {
        await fetch(`${apiBase}/file/${id}`, { method: "DELETE" });
        await refreshFiles();
        toast.success("File deleted successfully");
      } catch (error) {
        toast.error("Failed to delete file");
        console.error(error);
      }
    },
    [apiBase, toast, refreshFiles]
  );

  const handleRefreshFiles = useCallback(async () => {
    try {
      await refreshFiles();
      toast.info("Files refreshed");
    } catch {
      toast.error("Failed to refresh files");
    }
  }, [refreshFiles, toast]);

  const openDeleteModal = useCallback((id: number) => {
    setDeleteFileId(id);
    setDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteFileId(null);
  }, []);

  const toggleFileSelection = useCallback((id: number) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllFiles = useCallback(() => {
    setSelectedFileIds(new Set(files.map((file) => file.id)));
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  return {
    files,
    selectedFileIds,
    uploading,
    deleteModalOpen,
    deleteFileId,
    refreshFiles,
    handleUpload,
    handleDeleteFile,
    handleRefreshFiles,
    openDeleteModal,
    closeDeleteModal,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
  };
}
