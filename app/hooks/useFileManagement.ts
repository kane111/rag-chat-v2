import { useState, useCallback } from "react";
import { useToast } from "@/app/components/Toast";
import type { FileMeta } from "@/types";

export function useFileManagement(apiBase: string) {
  const toast = useToast();
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/files`);
      if (res.ok) {
        setFiles(await res.json());
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

  return {
    files,
    uploading,
    deleteModalOpen,
    deleteFileId,
    refreshFiles,
    handleUpload,
    handleDeleteFile,
    handleRefreshFiles,
    openDeleteModal,
    closeDeleteModal,
  };
}
