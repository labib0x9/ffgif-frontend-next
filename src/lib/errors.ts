import { ApiError } from "@/types";

/**
 * Standardized mapping of backend error codes to descriptive human messages.
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: "Please check your inputs and fulfill all validation requirements.",
  PRECONDITION_FAILED: "This item was modified in another session. Please refresh to load the latest data.",
  AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please verify your credentials and try again.",
  AUTH_USER_NOT_VERIFIED: "Your account is not verified yet. Please check your email or request a new verification link.",
  AUTH_USER_EXISTS: "An account with this email address or username already exists.",
  AUTH_USER_NOT_FOUND: "No account found matching the provided details.",
  AUTH_RESET_TOKEN_INVALID: "This password reset token is invalid or has expired.",
  AUTH_VERIFY_TOKEN_INVALID: "This verification token is invalid or has expired.",
  GIF_NOT_FOUND: "The requested GIF was not found or has been removed.",
  GIF_FORBIDDEN: "You do not have permission to view, modify, or delete this GIF.",
  JOB_NOT_FOUND: "The conversion job was not found or has expired.",
  SHARE_NOT_FOUND: "The shared link was not found or has expired.",
  SHARE_FORBIDDEN: "You do not have permission to access or revoke this share.",
  RATE_LIMITED: "Too many requests. Please slow down and wait a moment before retrying.",
};

/**
 * Extracts a clean, user-friendly error message from an API error or unexpected exception.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (!err) return fallback;

  if (typeof err === "string") return err;

  const apiErr = err as Partial<ApiError>;

  // Check specific error code mapping first if message is generic
  if (apiErr.error_code && ERROR_CODE_MESSAGES[apiErr.error_code]) {
    // If backend provided a specific detailed message, prefer that; otherwise use code message
    if (apiErr.message && apiErr.message !== apiErr.error_code) {
      return apiErr.message;
    }
    return ERROR_CODE_MESSAGES[apiErr.error_code];
  }

  // Next check backend message field
  if (apiErr.message && typeof apiErr.message === "string") {
    return apiErr.message;
  }

  // Next check legacy error field
  if (apiErr.error && typeof apiErr.error === "string") {
    return apiErr.error;
  }

  // Next check standard Error instance
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

/**
 * Returns the error code from an unknown error object if present.
 */
export function getApiErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const apiErr = err as Partial<ApiError>;
  return apiErr.error_code || (typeof apiErr.code === "string" ? apiErr.code : undefined);
}

/**
 * Checks if the error is an Optimistic Concurrency Control (OCC) conflict (412 Precondition Failed).
 */
export function isPreconditionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const apiErr = err as Partial<ApiError>;
  return (
    apiErr.status === 412 ||
    apiErr.code === 412 ||
    apiErr.error_code === "PRECONDITION_FAILED"
  );
}

/**
 * Checks if the error is a validation error (422 Unprocessable Entity).
 */
export function isValidationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const apiErr = err as Partial<ApiError>;
  return (
    apiErr.status === 422 ||
    apiErr.code === 422 ||
    apiErr.error_code === "VALIDATION_FAILED"
  );
}
