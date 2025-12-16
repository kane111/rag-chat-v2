"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function TopMenuBar() {
  const pathname = usePathname();
  const isConfigPage = pathname === "/config";

  return (
    <div className="border-b bg-card sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">RAG Chat</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Hybrid RAG chat over your documents</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {isConfigPage ? (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" /> Home
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/config">
                <Sparkles className="h-4 w-4" /> Configure
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
