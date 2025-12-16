"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function FileUploadZone({ onUpload, disabled = false }: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!["pdf", "docx", "txt"].some(ext => file.name.toLowerCase().endsWith(ext))) {
      alert("Only PDF, DOCX, and TXT files are supported");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90));
    }, 100);

    try {
      await onUpload(file);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Zone */}
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed py-8 px-4 text-center transition ${
        isDragActive
          ? "border-primary bg-accent"
          : "border-border bg-muted"
      } ${disabled || uploading ? "cursor-not-allowed" : "cursor-pointer"}`}
      role="presentation"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
        aria-label="File upload input"
      />

      {uploading ? (
        <div className="space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm font-medium text-foreground">Uploading...</p>
          <div className="h-1.5 sm:h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(uploadProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
        </div>
      ) : (
        <div onClick={() => !disabled && fileInputRef.current?.click()} className="space-y-3">
          <div className="mx-auto flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-foreground">Drag and drop files here</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">or click (PDF, DOCX, TXT)</p>
          <div className="flex items-center justify-center">
            <Button type="button" variant="outline" size="sm" disabled={disabled} className="text-xs">
              Browse
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
