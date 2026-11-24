import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind and conditional CSS classes safely.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses BigInt values to string or number for JSON serialization.
 */
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/**
 * Formats a date string consistently across server and client to prevent hydration mismatch.
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "--";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "--";
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return "--";
  }
}
