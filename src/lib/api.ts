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
  ApiError,
  RateLimitInfo,
} from "@/types";

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  authed?: boolean;
  raw?: boolean;
  skipUnauthorizedEvent?: boolean;
}

export async function request<T = unknown>(
  path: string,
  {
    method = "GET",
    body,
    authed = true,
    raw = false,
    skipUnauthorizedEvent = false,
  }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined && !raw) {
    headers["Content-Type"] = "application/json";
  }
  if (authed && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : raw ? (body as BodyInit) : JSON.stringify(body),
    });
  } catch {
    const error: ApiError = { code: 0, error: "Unable to connect to FFgif server. Please check your network or backend status." };
    throw error;
  }

  // Parse Rate Limiting Headers
  const rateLimitInfo: RateLimitInfo = {
    limit: res.headers.get("X-RateLimit-Limit"),
    remaining: res.headers.get("X-RateLimit-Remaining"),
    reset: res.headers.get("X-RateLimit-Reset"),
    retryAfter: res.headers.get("Retry-After"),
  };

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (res.status === 429) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ffgif:ratelimit", {
          detail: rateLimitInfo,
        })
      );
    }
    const error: ApiError = {
      code: 429,
      error: (parsed && typeof parsed === "object" && parsed.error) ? parsed.error : "Too many requests. Rate limit reached. Please wait a moment.",
    };
    throw error;
  }

  if (!res.ok) {
    if (res.status === 401 && authed && !skipUnauthorizedEvent && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ffgif:unauthorized"));
    }

    if (parsed && typeof parsed === "object" && parsed.error) {
      const error: ApiError = {
        code: parsed.code ?? res.status,
        error: parsed.error,
      };
      throw error;
    }

    const error: ApiError = {
      code: res.status,
      error: typeof parsed === "string" && parsed ? parsed : "An unexpected server error occurred.",
    };
    throw error;
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

  async logout(): Promise<string> {
    return request<string>("/auth/logout", {
      method: "GET",
      authed: true,
    });
  },

  // ---- User Profile & Quotas ----
  async getProfile(): Promise<User> {
    return request<User>("/users/profile/me");
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    return request<User>("/users/profile/me", {
      method: "PATCH",
      body: payload,
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
            code: xhr.status,
            error: `Direct storage upload failed with status ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        reject({
          code: 0,
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
        throw { code: 500, error: "Video preprocessing failed on server" };
      }
      attempts++;
      await new Promise((res) => setTimeout(res, intervalMs));
    }
    throw { code: 408, error: "Upload processing timeout" };
  },

  async getStreamUrl(key: string): Promise<StreamResponse> {
    return request<StreamResponse>(`/uploads/${encodeURIComponent(key)}/stream`);
  },

  async getLastUpload(): Promise<LastUploadMetadata> {
    return request<LastUploadMetadata>("/uploads/last");
  },

  // ---- GIF Conversion ----
  async convert(payload: ConvertPayload): Promise<ConvertJobResponse> {
    return request<ConvertJobResponse>("/convert", {
      method: "POST",
      body: payload,
    });
  },

  async getConvertStatus(jobId: string): Promise<ConvertStatusResponse> {
    return request<ConvertStatusResponse>(`/convert/${encodeURIComponent(jobId)}/status`);
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
            reject({ code: 500, error: "GIF conversion failed during processing.", ...res });
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

  async updateGifVisibility(key: string, patch: { status: "public" | "private" } | any): Promise<{ message: string }> {
    return request<{ message: string }>(`/gifs/me/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: patch,
    });
  },

  async deleteGif(key: string): Promise<{ gif_key: string; status: string }> {
    return request<{ gif_key: string; status: string }>(`/gifs/me/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
  },

  async saveRecentGif(key: string): Promise<void> {
    return request<void>(`/gifs/me/recents/${encodeURIComponent(key)}/save`, {
      method: "POST",
    });
  },

  // ---- Sharing ----
  async shareGif(key: string, payload: SharePayload): Promise<string> {
    return request<string>(`/gifs/me/${encodeURIComponent(key)}/shares`, {
      method: "POST",
      body: payload,
    });
  },

  async listSharedGifs(): Promise<SharedGifItem[]> {
    return request<SharedGifItem[]>("/gifs/me/shares");
  },

  async revokeShare(key: string, shareWithUserId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/gifs/me/${encodeURIComponent(key)}/shares/${encodeURIComponent(shareWithUserId)}`, {
      method: "DELETE",
    });
  },
};

export default api;
