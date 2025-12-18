"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";

interface MarkdownViewerProps {
  markdown: string;
  filename: string;
}

export function MarkdownViewer({ markdown, filename }: MarkdownViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!markdown) return null;

  const lines = markdown.split("\n").length;
  const chars = markdown.length;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800 border-cyan-300 dark:border-cyan-700"
        title="View raw markdown output"
      >
        View Markdown ({lines} lines, {Math.round(chars / 1024)}KB)
      </Button>

      <Modal
        isOpen={isOpen}
        title={`Raw Markdown: ${filename}`}
        description={`${lines} lines • ${Math.round(chars / 1024)}KB`}
        onClose={() => setIsOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(markdown);
              }}
            >
              Copy to Clipboard
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`} download={`${filename}.md`}>
                Download
              </a>
            </Button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-h-96 overflow-y-auto overflow-x-hidden">
            <pre className="text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap wrap-break-word leading-relaxed overflow-hidden">
              {markdown}
            </pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
