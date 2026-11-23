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
  if (error instanceof ZodError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten().fieldErrors,
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

  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : (error as Error)?.message || "Internal server error";

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
