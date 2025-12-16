"use client";

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast";
import { useToast } from "./use-toast";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const iconForVariant = (variant?: string) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />;
      case "error":
      case "destructive":
        return <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-300" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-sky-600 dark:text-sky-300" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex flex-1 items-start gap-3">
              <div className="mt-1.5">{iconForVariant(variant)}</div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription className="max-w-[360px] break-words">{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className={cn("[--viewport-padding:16px]")} />
    </ToastProvider>
  );
}
