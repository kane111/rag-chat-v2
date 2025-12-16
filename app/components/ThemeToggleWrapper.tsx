"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function ThemeToggleWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ThemeToggle />;
}
