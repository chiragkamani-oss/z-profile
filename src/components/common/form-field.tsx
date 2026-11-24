"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends InputProps {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
}

/**
 * Accessible form field component complying with SonarQube typescript:S6853 & WCAG 2.1.
 * Structurally guarantees label-to-control association and accessibility attributes.
 */
export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    { label, id, error, helperText, required, className, containerClassName, ...props },
    ref
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;
    const describedBy = errorId || helperId;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        <Label
          htmlFor={id}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {label}
          {required && <span className="font-bold text-destructive">*</span>}
        </Label>
        <Input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
          required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-[11px] text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
