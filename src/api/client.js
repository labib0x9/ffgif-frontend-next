export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB

// Base URL of the Go backend.
// In dev mode (vite server), it defaults to http://localhost:8080.
// In production builds served by Go, it defaults to "" (same-origin relative requests).
// Override via VITE_API_BASE_URL in .env if needed.
export const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL !== undefined)
    ? import.meta.env.VITE_API_BASE_URL
    : (import.meta.env?.DEV ? "http://localhost:8080" : "");

// Module-level token holder. Set by AuthProvider on login/logout so the api
// client can attach Authorization headers without needing React context.
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

/**
 * Core request helper.
 * - Sends JSON bodies when `body` is a plain object.
 * - Attaches `Authorization: Bearer <token>` when authed is true and a token is set.
 * - Parses the backend's error shape: { error: string, code: number }.
 * - Handles non-JSON (e.g. plain string) success bodies too, since the spec
 *   shows some endpoints returning a bare string like "logout" or "ok".
 */
export async function request(path, { method = "GET", body, authed = true, raw = false } = {}) {
  const headers = {};
  if (body !== undefined && !raw) headers["Content-Type"] = "application/json";
  if (authed && authToken) headers["Authorization"] = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
  } catch {
    throw { code: 0, error: "could not reach server" };
  }

  const text = await res.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text; // plain-text body, e.g. "logout", "ok", "user created"
    }
  }

  if (!res.ok) {
    // A 401 on an authed request means the token is invalid/expired —
    // broadcast this so AuthProvider can force a logout, no matter which
    // panel/component triggered the request. Skip this for the initial
    // login/signup calls themselves (authed: false), since a bad password
    // there is just a normal form error, not a dead session.
    if (res.status === 401 && authed) {
      window.dispatchEvent(new CustomEvent("ffgif:unauthorized"));
    }
    // Expected error shape: { error: "message", code: status_code }
    if (parsed && typeof parsed === "object" && parsed.error) {
      throw { code: parsed.code ?? res.status, error: parsed.error };
    }
    throw { code: res.status, error: typeof parsed === "string" && parsed ? parsed : "something went wrong" };
  }

  return parsed;
}

export const api = {
  // ---- auth ----
  async signup(payload) {
    return request("/auth/signup", { method: "POST", body: payload, authed: false });
  },
  async login(payload) {
    return request("/auth/login", { method: "POST", body: payload, authed: false });
  },
  async logout() {
    return request("/auth/logout", { method: "GET" });
  },
  async resendVerify(email) {
    return request("/auth/verify/resend", { method: "POST", body: { email }, authed: false });
  },
  async forgotPassword(email) {
    return request("/auth/forgot-password", { method: "POST", body: { email }, authed: false });
  },
  async resetPassword(payload) {
    return request("/auth/reset", { method: "POST", body: payload, authed: false });
  },

  // ---- user ----
  async getProfile() {
    return request("/users/profile/me");
  },
  async updateProfile(payload) {
    return request("/users/profile/me", { method: "PATCH", body: payload });
  },
  async getQuota() {
    return request("/users/me/quota");
  },
  async changePassword(payload) {
    return request("/users/change-password", { method: "PATCH", body: payload });
  },
  async deleteAccount(password) {
    return request("/users/me", { method: "DELETE", body: { password } });
  },

  // ---- uploads ----
  async createUpload(file) {
    return request("/uploads", {
      method: "POST",
      body: { filename: file.name },
    });
  },
  async putToPresignedUrl(uploadUrl, file) {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) {
      throw { code: res.status, error: "could not upload file to storage" };
    }
  },
  async uploadStatus(key) {
    return request(`/uploads/${encodeURIComponent(key)}/status`);
  },
  async getLastUpload() {
    return request("/uploads/last");
  },
  async getStreamUrl(key) {
    return request(`/uploads/${encodeURIComponent(key)}/stream`);
  },

  // ---- convert ----
  async convert(payload) {
    return request("/convert", { method: "POST", body: payload });
  },
  async convertStatus(jobId) {
    return request(`/convert/${encodeURIComponent(jobId)}/status`);
  },

  // ---- gifs ----
  async listGifs(status) {
    return request(`/gifs/me?status=${encodeURIComponent(status)}`);
  },
  async getGif(key) {
    return request(`/gifs/me/${encodeURIComponent(key)}`);
  },
  async downloadGif(key) {
    return request(`/gifs/me/${encodeURIComponent(key)}/download`);
  },
  async updateGif(key, patch) {
    return request(`/gifs/me/${encodeURIComponent(key)}`, { method: "PATCH", body: patch });
  },
  async deleteGif(key) {
    return request(`/gifs/me/${encodeURIComponent(key)}`, { method: "DELETE" });
  },
  async shareGif(key, payload) {
    return request(`/gifs/me/${encodeURIComponent(key)}/shares`, { method: "POST", body: payload });
  },
  async listSharedGifs() {
    return request("/gifs/me/shares");
  },
};

export default api;
