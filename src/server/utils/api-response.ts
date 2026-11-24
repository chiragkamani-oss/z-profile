import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { ZodError } from "zod";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(error: unknown, fallbackStatus = 500) {
  console.error("[API Error]:", error);

  if (error instanceof ZodError) {
    const fieldDetails = error.flatten().fieldErrors;
    const fromIssues = Array.isArray(error.issues)
      ? error.issues.map((issue) => issue.message).filter(Boolean)
      : [];
    const fromFlatten = Object.values(fieldDetails).flat().filter(Boolean) as string[];
    const combined = fromIssues.length > 0 ? fromIssues : fromFlatten;
    const message = combined.length > 0 ? combined.join(". ") : "Validation failed";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message,
          code: "VALIDATION_ERROR",
          details: fieldDetails,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  const message = (error as Error)?.message || "An unexpected error occurred";

  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        message,
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    { status: fallbackStatus }
  );
}
