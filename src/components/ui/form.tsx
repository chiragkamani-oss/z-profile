"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type FormItemContextValue = {
  id: string;
  error?: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

/**
 * Standard shadcn/ui FormItem container.
 * Generates and shares unique accessible IDs to guarantee Sonar S6853 & WCAG compliance.
 */
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { error?: string }
>(({ className, error, id: customId, ...props }, ref) => {
  const generatedId = React.useId();
  const id = customId || generatedId;

  return (
    <FormItemContext.Provider value={{ id, error }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

/**
 * Standard shadcn/ui FormLabel.
 * Automatically binds htmlFor to the parent FormItem's control ID.
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { id, error } = React.useContext(FormItemContext);

  return (
    <Label
      ref={ref}
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        error && "text-destructive",
        className
      )}
      htmlFor={id}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

/**
 * Standard shadcn/ui FormControl.
 * Wraps form inputs and associates accessible IDs, aria-describedby, and aria-invalid.
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { id, error } = React.useContext(FormItemContext);

  return (
    <Slot
      ref={ref}
      id={id}
      aria-describedby={
        error
          ? `${id}-form-item-description ${id}-form-item-message`
          : `${id}-form-item-description`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

/**
 * Standard shadcn/ui FormDescription.
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { id } = React.useContext(FormItemContext);

  return (
    <p
      ref={ref}
      id={`${id}-form-item-description`}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

/**
 * Standard shadcn/ui FormMessage.
 * Displays field-level validation errors.
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const { id, error } = React.useContext(FormItemContext);
  const body = error || children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={`${id}-form-item-message`}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
