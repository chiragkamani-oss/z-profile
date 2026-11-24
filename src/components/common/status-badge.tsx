import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileStatus =
  "is_ready" | "publish" | "in_review" | "review_changes" | "draft" | string;

export interface StatusBadgeProps {
  status: ProfileStatus;
  className?: string;
  showIcon?: boolean;
}

/**
 * Standardized status badge component ensuring UI consistency
 * and eliminating duplicate status badge styling throughout the app.
 */
export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  switch (status) {
    case "is_ready":
    case "publish":
      return (
        <Badge
          className={cn(
            "gap-1 border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          Ready / Approved
        </Badge>
      );

    case "in_review":
      return (
        <Badge
          className={cn(
            "gap-1 border-blue-500/20 bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400",
            className
          )}
        >
          {showIcon && <Clock className="h-3 w-3" />}
          In Review
        </Badge>
      );

    case "review_changes":
      return (
        <Badge
          className={cn(
            "gap-1 border-amber-500/20 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400",
            className
          )}
        >
          {showIcon && <AlertCircle className="h-3 w-3" />}
          Needs Changes
        </Badge>
      );

    case "draft":
    default:
      return (
        <Badge
          variant="secondary"
          className={cn("gap-1 font-medium text-muted-foreground", className)}
        >
          {showIcon && <FileText className="h-3 w-3" />}
          Draft
        </Badge>
      );
  }
}
