import { successResponse, errorResponse } from "@/server/utils/api-response";
import {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "@/server/utils/errors";
import { z } from "zod";

describe("API Response Utilities & Errors", () => {
  it("generates a standard success response with default 200 status", async () => {
    const res = successResponse({ user: "alice" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ user: "alice" });
  });

  it("generates a success response with custom status", async () => {
    const res = successResponse("created", 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBe("created");
  });

  it("handles Zod validation errors cleanly with status 400", async () => {
    const schema = z.object({ age: z.number() });
    try {
      schema.parse({ age: "invalid" });
    } catch (err) {
      const res = errorResponse(err);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toBeDefined();
    }
  });

  it("handles custom ApiErrors with their specific status codes and error codes", async () => {
    const testCases = [
      { err: new BadRequestError("bad input"), status: 400, code: "BAD_REQUEST" },
      { err: new UnauthorizedError("need auth"), status: 401, code: "UNAUTHORIZED" },
      { err: new ForbiddenError("no access"), status: 403, code: "FORBIDDEN" },
      { err: new NotFoundError("missing"), status: 404, code: "NOT_FOUND" },
      { err: new ConflictError("exists"), status: 409, code: "CONFLICT" },
      {
        err: new ApiError("server fail", 503, "UNAVAILABLE"),
        status: 503,
        code: "UNAVAILABLE",
      },
    ];

    for (const { err, status, code } of testCases) {
      const res = errorResponse(err);
      expect(res.status).toBe(status);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toBe(err.message);
      expect(body.error.code).toBe(code);
    }
  });

  it("handles generic unknown errors with fallback status 500", async () => {
    const res = errorResponse(new Error("Database disconnected"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Database disconnected");
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("handles non-error objects gracefully", async () => {
    const res = errorResponse("string error");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
