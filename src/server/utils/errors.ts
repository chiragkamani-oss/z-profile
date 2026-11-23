export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden - Insufficient permissions", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}
