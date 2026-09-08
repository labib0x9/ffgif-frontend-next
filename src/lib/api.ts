import type {
  User,
  UserQuota,
  LoginPayload,
  LoginResponse,
  SignupPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  UploadPresignedResponse,
  UploadStatusResponse,
  StreamResponse,
  LastUploadMetadata,
  ConvertPayload,
  ConvertJobResponse,
  ConvertStatusResponse,
  ConversionStatus,
  GifItem,
  GifThumbnailResponse,
  GifListResponse,
  DownloadResponse,
  SharedGifItem,
  SharePayload,
  CreateShareByTokenRequest,
  CreateShareByTokenResponse,
  SharedGifTokenResponse,
  ApiError,
  RateLimitInfo,
} from "@/types";

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:8080"
      : "";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Generate a unique Request ID (UUID v4) for distributed tracing.
 */
function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "req-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9);
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  ifMatch?: string;
  authed?: boolean;
  raw?: boolean;
  skipUnauthorizedEvent?: boolean;
}

export async function request<T = unknown>(
  path: string,
  {
    method = "GET",
    body,
    headers: customHeaders = {},
    ifMatch,
    authed = true,
    raw = false,
    skipUnauthorizedEvent = false,
  }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { ...customHeaders };

  // Set X-Request-Id header for end-to-end tracing if not provided
  if (!headers["X-Request-Id"]) {
    headers["X-Request-Id"] = generateRequestId();
  }

  // Set Content-Type for JSON payloads
  if (body !== undefined && !raw && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Set Authorization Bearer header
  if (authed && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Set If-Match header for Optimistic Concurrency Control (OCC)
  if (ifMatch) {
    headers["If-Match"] = ifMatch.replace(/^"|"$/g, "");
  }

  const requestUrl =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      method,
      headers,
      body: body === undefined ? undefined : raw ? (body as BodyInit) : JSON.stringify(body),
    });
  } catch {
    const error: ApiError = {
      status: 0,
      code: 0,
      message: "Unable to connect to FFgif server. Please check your network or backend status.",
      error: "Unable to connect to FFgif server. Please check your network or backend status.",
    };
    throw error;
  }

  // Parse Rate Limiting Headers
  const rateLimitInfo: RateLimitInfo = {
    limit: res.headers.get("X-RateLimit-Limit"),
    remaining: res.headers.get("X-RateLimit-Remaining"),
    reset: res.headers.get("X-RateLimit-Reset"),
    retryAfter: res.headers.get("Retry-After"),
  };

  // Capture ETag header if returned (unquoted)
  const rawEtag = res.headers.get("ETag");
  const etag = rawEtag ? rawEtag.replace(/^"|"$/g, "") : undefined;

  // Capture Location header if returned (e.g., /jobs/{jobId}/status or /users/{userId})
  const locationHeader = res.headers.get("Location") || undefined;

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  // Handle 429 Too Many Requests
  if (res.status === 429) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ffgif:ratelimit", {
          detail: rateLimitInfo,
        })
      );
    }
    const message =
      parsed && typeof parsed === "object" && (parsed.message || parsed.error)
        ? parsed.message || parsed.error
        : "Too many requests. Rate limit reached. Please wait a moment.";

    const error: ApiError = {
      error_code: "RATE_LIMITED",
      message,
      status: 429,
      code: 429,
      error: message,
    };
    throw error;
  }

  // Handle Non-OK responses (4xx, 5xx) with standardized error envelope: { error_code, message, status }
  if (!res.ok) {
    if (res.status === 401 && authed && !skipUnauthorizedEvent && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ffgif:unauthorized"));
    }

    if (parsed && typeof parsed === "object") {
      const errorCode = parsed.error_code || (typeof parsed.code === "string" ? parsed.code : undefined);
      const message =
        parsed.message ||
        parsed.error ||
        (res.status === 412
          ? "Precondition Failed: Resource was updated elsewhere. Please refresh."
          : res.status === 422
            ? "Validation Failed: Please verify your form inputs."
            : "An unexpected server error occurred.");

      const status = parsed.status ?? (typeof parsed.code === "number" ? parsed.code : res.status);

      const error: ApiError = {
        error_code: errorCode,
        message,
        status,
        code: status,
        error: message,
        detail: parsed.detail || parsed,
      };
      throw error;
    }

    const defaultMsg =
      res.status === 412
        ? "Precondition Failed: Resource was updated elsewhere. Please refresh."
        : res.status === 422
          ? "Validation Failed: Please verify your input."
          : typeof parsed === "string" && parsed
            ? parsed
            : "An unexpected server error occurred.";

    const error: ApiError = {
      error_code: res.status === 412 ? "PRECONDITION_FAILED" : res.status === 422 ? "VALIDATION_FAILED" : undefined,
      message: defaultMsg,
      status: res.status,
      code: res.status,
      error: defaultMsg,
    };
    throw error;
  }

  // If response is an object, attach ETag if present
  if (parsed && typeof parsed === "object") {
    if (etag && !parsed.etag) {
      parsed.etag = etag;
    }
    if (locationHeader && !parsed.location) {
      parsed.location = locationHeader;
    }
  }

  return parsed as T;
}

export const api = {
  // ---- Authentication ----
  async signup(payload: SignupPayload): Promise<string> {
    return request<string>("/auth/signup", {
      method: "POST",
      body: payload,
      authed: false,
    });
  },

  async verify(token: string): Promise<string> {
    return request<string>(`/auth/verify?token=${encodeURIComponent(token)}`, {
      method: "GET",
      authed: false,
    });
  },

  async resendVerify(email: string): Promise<string> {
    return request<string>("/auth/verify/resend", {
      method: "POST",
      body: { email },
      authed: false,
    });
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
      authed: false,
    });
  },

  async forgotPassword(email: string): Promise<string> {
    return request<string>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      authed: false,
    });
  },

  async validateResetToken(token: string): Promise<{ token: string }> {
    return request<{ token: string }>(`/auth/reset?token=${encodeURIComponent(token)}`, {
      method: "GET",
      authed: false,
    });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<string> {
    return request<string>("/auth/reset", {
      method: "POST",
      body: payload,
      authed: false,
    });
  },

  /**
   * POST /auth/logout with Bearer token
   */
  async logout(): Promise<string> {
    return request<string>("/auth/logout", {
      method: "POST",
      authed: true,
    });
  },

  // ---- User Profile & Quotas ----
  async getProfile(): Promise<User> {
    return request<User>("/users/profile/me");
  },

  /**
   * PATCH /users/profile/me with optimistic locking (If-Match: <updated_at>) and partial fields
   */
  async updateProfile(
    payload: Partial<Pick<User, "username" | "fullname" | "email" | "avatar_url">>,
    ifMatch?: string
  ): Promise<User> {
    return request<User>("/users/profile/me", {
      method: "PATCH",
      body: payload,
      ifMatch,
    });
  },

  async getQuota(): Promise<UserQuota> {
    return request<UserQuota>("/users/me/quota");
  },

  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    return request<string>("/users/change-password", {
      method: "PATCH",
      body: payload,
      skipUnauthorizedEvent: true,
    });
  },

  async deleteAccount(password: string): Promise<string> {
    return request<string>("/users/me", {
      method: "DELETE",
      body: { password },
    });
  },

  // ---- Video Upload & Preprocessing ----
  async createUpload(filename: string): Promise<UploadPresignedResponse> {
    return request<UploadPresignedResponse>("/uploads", {
      method: "POST",
      body: { filename },
    });
  },

  /**
   * Direct-to-MinIO upload via presigned PUT URL with upload progress reporting.
   */
  async uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject({
            status: xhr.status,
            code: xhr.status,
            message: `Direct storage upload failed with status ${xhr.status}`,
            error: `Direct storage upload failed with status ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        reject({
          status: 0,
          code: 0,
          message: "Network error during direct storage upload",
          error: "Network error during direct storage upload",
        });
      };

      xhr.send(file);
    });
  },

  async getUploadStatus(key: string): Promise<UploadStatusResponse> {
    return request<UploadStatusResponse>(`/uploads/${encodeURIComponent(key)}/status`);
  },

  /**
   * Polls upload status until "ok" or "failed"
   */
  async pollUploadStatus(
    key: string,
    { intervalMs = 1200, maxAttempts = 40, signal }: { intervalMs?: number; maxAttempts?: number; signal?: AbortSignal } = {}
  ): Promise<UploadStatusResponse> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const data = await this.getUploadStatus(key);
      if (data.status === "ok") return data;
      if (data.status === "failed") {
        throw {
          status: 500,
          code: 500,
          message: "Video preprocessing failed on server",
          error: "Video preprocessing failed on server",
        };
      }
      attempts++;
      await new Promise((res) => setTimeout(res, intervalMs));
    }
    throw {
      status: 408,
      code: 408,
      message: "Upload processing timeout",
      error: "Upload processing timeout",
    };
  },

  /**
   * Retrieves presigned streaming URL for video playback.
   * Accepts either an upload/converted key or a location path (e.g. "/uploads/converted_xxx.mp4/stream").
   */
  async getStreamUrl(keyOrPath: string): Promise<StreamResponse> {
    const path =
      keyOrPath.startsWith("/") || keyOrPath.startsWith("http://") || keyOrPath.startsWith("https://")
        ? keyOrPath
        : `/uploads/${encodeURIComponent(keyOrPath)}/stream`;
    return request<StreamResponse>(path);
  },

  /**
   * Retrieves presigned streaming URL from the Location header path.
   */
  async getStreamFromLocation(locationPath: string): Promise<StreamResponse> {
    return this.getStreamUrl(locationPath);
  },

  async getLastUpload(): Promise<LastUploadMetadata> {
    return request<LastUploadMetadata>("/uploads/last");
  },

  // ---- GIF Conversion & Jobs ----
  /**
   * POST /jobs (was /convert) - Returns 202 Accepted with Location header / job response
   */
  async convert(payload: ConvertPayload): Promise<ConvertJobResponse> {
    const res = await request<ConvertJobResponse | any>("/jobs", {
      method: "POST",
      body: payload,
    });

    // If backend returns object with job_id, return it
    if (res && typeof res === "object" && res.job_id) {
      return res as ConvertJobResponse;
    }

    // Extract job ID from Location header if available: /jobs/{jobId}/status
    if (res && typeof res === "object" && res.location) {
      const match = res.location.match(/\/jobs\/([^/]+)/);
      if (match && match[1]) {
        return {
          job_id: match[1],
          status: "queued",
          location: res.location,
        };
      }
    }

    return res as ConvertJobResponse;
  },

  /**
   * GET /jobs/{jobId}/status (was /convert/{jobId}/status)
   */
  async getConvertStatus(jobId: string): Promise<ConvertStatusResponse> {
    return request<ConvertStatusResponse>(`/jobs/${encodeURIComponent(jobId)}/status`);
  },

  /**
   * Polls conversion status every 1.5s until "completed" or "failed"
   */
  async pollConversion(
    jobId: string,
    {
      onStatus,
      intervalMs = 1500,
      signal,
    }: {
      onStatus?: (status: ConversionStatus, progress?: number) => void;
      intervalMs?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<ConvertStatusResponse> {
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;
      let settled = false;

      const cleanup = () => {
        settled = true;
        if (timer) clearTimeout(timer);
      };

      const poll = async () => {
        if (settled || signal?.aborted) return;
        try {
          const res = await this.getConvertStatus(jobId);
          if (settled || signal?.aborted) return;

          onStatus?.(res.status, res.progress);

          if (res.status === "completed") {
            cleanup();
            resolve(res);
          } else if (res.status === "failed") {
            cleanup();
            reject({
              status: 500,
              code: 500,
              message: "GIF conversion failed during processing.",
              error: "GIF conversion failed during processing.",
              ...res,
            });
          } else {
            timer = setTimeout(poll, intervalMs);
          }
        } catch (err) {
          if (settled || signal?.aborted) return;
          cleanup();
          reject(err);
        }
      };

      if (signal) {
        signal.addEventListener("abort", () => {
          cleanup();
          reject(new DOMException("Aborted", "AbortError"));
        });
      }

      timer = setTimeout(poll, 100);
    });
  },

  // ---- GIF Library ----
  async listGifs(status?: "all" | "public" | "private"): Promise<GifListResponse | GifItem[]> {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return request<GifListResponse | GifItem[]>(`/gifs/me${query}`);
  },

  async getRecentGifs(): Promise<GifItem[]> {
    return request<GifItem[]>("/gifs/me/recents");
  },

  async getGif(key: string): Promise<GifItem> {
    return request<GifItem>(`/gifs/me/${encodeURIComponent(key)}`);
  },

  async getGifThumbnail(key: string): Promise<GifThumbnailResponse> {
    return request<GifThumbnailResponse>(`/gifs/me/${encodeURIComponent(key)}/thumbnail`);
  },

  async getDownloadUrl(key: string): Promise<DownloadResponse> {
    return request<DownloadResponse>(`/gifs/me/${encodeURIComponent(key)}/download`);
  },

  /**
   * PATCH /gifs/me/{key} with partial update and optimistic locking (If-Match: <updated_at>)
   */
  async updateGif(
    key: string,
    patch: { name?: string; status?: "public" | "private" | string; persist?: boolean },
    ifMatch?: string
  ): Promise<GifItem | { message: string }> {
    return request<GifItem | { message: string }>(`/gifs/me/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: patch,
      ifMatch,
    });
  },

  async updateGifVisibility(
    key: string,
    patch: { status: "public" | "private" } | any,
    ifMatch?: string
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/gifs/me/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: patch,
      ifMatch,
    });
  },

  async deleteGif(key: string): Promise<{ gif_key: string; status: string } | string> {
    return request<{ gif_key: string; status: string } | string>(`/gifs/me/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
  },

  async saveRecentGif(key: string, ifMatch?: string): Promise<void> {
    // Uses PATCH /gifs/me/{key} with { persist: true } or POST /gifs/me/recents/{key}/save
    try {
      await request<void>(`/gifs/me/${encodeURIComponent(key)}`, {
        method: "PATCH",
        body: { persist: true },
        ifMatch,
      });
    } catch {
      await request<void>(`/gifs/me/recents/${encodeURIComponent(key)}/save`, {
        method: "POST",
      });
    }
  },

  // ---- Sharing ----
  /**
   * POST /gifs/me/{key}/shares (upserts/renews expire_at if share already exists)
   */
  async shareGif(key: string, payload: SharePayload): Promise<string> {
    return request<string>(`/gifs/me/${encodeURIComponent(key)}/shares`, {
      method: "POST",
      body: payload,
    });
  },

  async listSharedGifs(): Promise<SharedGifItem[]> {
    return request<SharedGifItem[]>("/gifs/me/shares");
  },

  async revokeShare(key: string, shareWithUserId: string): Promise<{ message: string } | string> {
    return request<{ message: string } | string>(
      `/gifs/me/${encodeURIComponent(key)}/shares/${encodeURIComponent(shareWithUserId)}`,
      {
        method: "DELETE",
      }
    );
  },

  // ---- Token-Based Sharing ----
  /**
   * POST /s - Generates a share token and queues an email notification with /s/{token}
   */
  async createShareToken(payload: CreateShareByTokenRequest): Promise<CreateShareByTokenResponse> {
    return request<CreateShareByTokenResponse>("/s", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * GET /s/{token} - Fetches shared GIF details using a valid share token (Public endpoint, no auth required)
   */
  async getSharedGifByToken(token: string): Promise<SharedGifTokenResponse> {
    return request<SharedGifTokenResponse>(`/s/${encodeURIComponent(token)}`, {
      authed: false,
    });
  },
};

export default api;
