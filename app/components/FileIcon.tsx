"use client";

import { ReactElement } from "react";

interface FileIconProps {
  filetype: string;
  className?: string;
}

export function FileIcon({ filetype, className = "w-4 h-4" }: FileIconProps) {
  const type = filetype.toLowerCase();

  const iconMap: Record<string, ReactElement> = {
    pdf: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
      </svg>
    ),
    docx: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
      </svg>
    ),
    txt: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6zm-2 12H8v-2h4v2zm4-4H8v-2h8v2z" />
      </svg>
    ),
  };

  const colorMap: Record<string, string> = {
    pdf: "text-rose-600 dark:text-rose-400",
    docx: "text-sky-600 dark:text-sky-400",
    txt: "text-slate-600 dark:text-slate-400",
  };

  return (
    <span className={colorMap[type] || "text-slate-400"} title={type.toUpperCase()}>
      {iconMap[type] || iconMap.txt}
    </span>
  );
}
