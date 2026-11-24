"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Standard confirmation dialog compliant with SonarQube S6850 (accessible heading)
 * and WCAG dialog semantics with integrated asynchronous action state.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    void onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-foreground">
            {variant === "destructive" && (
              <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={isLoading}
            onClick={handleConfirm}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
