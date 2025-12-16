"use client";

import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning" | "destructive";
export type ToastMessage = {
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
};

export function ToastContainer() {
  return <Toaster />;
}

export function useToast() {
  const trigger = (message: string, type: ToastType, description?: string) => {
    const options = {
      description,
      duration: 4000,
    };

    switch (type) {
      case "success":
        return toast.success(message, options);
      case "error":
        return toast.error(message, options);
      case "warning":
        return toast.warning(message, options);
      case "info":
        return toast.info(message, options);
      case "destructive":
        return toast.error(message, options);
      default:
        return toast(message, options);
    }
  };

  return {
    toast,
    success: (message: string, description?: string) => trigger(message, "success", description),
    error: (message: string, description?: string) => trigger(message, "error", description),
    warning: (message: string, description?: string) => trigger(message, "warning", description),
    info: (message: string, description?: string) => trigger(message, "info", description),
    destructive: (message: string, description?: string) => trigger(message, "destructive", description),
  };
}
