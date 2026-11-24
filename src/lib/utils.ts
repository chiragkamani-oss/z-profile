import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind and conditional CSS classes safely.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * High-performance tree walker for BigInt serialization.
 * Avoids JSON.parse(JSON.stringify()) string allocations and memory pressure,
 * executing in O(V) time with zero intermediate JSON serialization overhead.
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "bigint") {
    return (obj as bigint).toString() as unknown as T;
  }
  if (typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = serializeBigInt(value);
  }
  return result as T;
}

/**
 * Formats a date string consistently across server and client to prevent hydration mismatch.
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "--";
  try {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return "--";
  }
}
