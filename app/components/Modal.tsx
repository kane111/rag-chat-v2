"use client";

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  isDangerous?: boolean;
  hideConfirm?: boolean;
}

export function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  confirmVariant = "primary",
  isDangerous = false,
  hideConfirm,
}: ModalProps) {
  const confirmVariantClass = confirmVariant === "danger" || isDangerous ? "destructive" : "default";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <div className="mt-2 space-y-3">{children}</div>}
        {!hideConfirm && (
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {onConfirm && (
              <Button variant={confirmVariantClass as any} onClick={onConfirm}>
                {confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
