import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

/* ============================================================================
   DESIGN TOKENS
   Canvas: near-black #0E0F12 · Surface: #17181C · Surface raised: #1D1F25
   Text: #F3F1EC (primary) · #9A9CA5 (secondary) · #5C5E68 (tertiary)
   Accent: #FF3D5E (loop-pink) · Accent dim: #4A1420 (accent wash)
   Success: #3DDC97 · Warn: #FFB74D · Error: #FF5C5C
   Display: Space Grotesk · Body: Inter · Mono: JetBrains Mono (timecodes/ids)
   Signature: frame-strip scrubber + recurring "loop" glyph as structural motif
============================================================================ */

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("gifapp-fonts")) return;
    const link = document.createElement("link");
    link.id = "gifapp-fonts";
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);
}

/* ============================================================================
   MOCK API LAYER
   Shaped exactly like the real endpoints in the spec. Swap the body of each
   function for a real fetch() later — call signatures won't need to change.
============================================================================ */

const uid = () => Math.random().toString(36).slice(2, 10);

// Cheap client-side guard mirroring the backend's own size cap — catches
// obviously-too-large files before spending a full upload+wait cycle on
// something that would just get rejected server-side anyway.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB

// Base URL of the Go backend. Override via VITE_API_BASE_URL in a .env file if needed.
const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "http://localhost:8080";

// Module-level token holder. Set by AuthProvider on login/logout so the api
// client can attach Authorization headers without needing React context.
let authToken = null;
function setAuthToken(token) {
  authToken = token;
}

/**
 * Core request helper.
 * - Sends JSON bodies when `body` is a plain object.
 * - Attaches `Authorization: Bearer <token>` when authed is true and a token is set.
 * - Parses the backend's error shape: { error: string, code: number }.
 * - Handles non-JSON (e.g. plain string) success bodies too, since the spec
 *   shows some endpoints returning a bare string like "logout" or "ok".
 */
async function request(path, { method = "GET", body, authed = true, raw = false } = {}) {
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
  } catch (networkErr) {
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

const api = {
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
  // 1. Ask backend for a presigned URL. Any video format is accepted here —
  // the backend transcodes to mp4 server-side; the frontend doesn't need to
  // pre-validate the format. Only filename is sent — the backend's
  // presign request no longer accepts/needs content_type.
  async createUpload(file) {
    return request("/uploads", {
      method: "POST",
      body: { filename: file.name },
    });
  },
  // 2. Actually PUT the file bytes to the presigned storage URL.
  // This goes straight to storage, not through the Go API, so no auth header.
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
  // 3. Poll until the backend confirms the file is ready. Returns
  // { status } where status is one of "uploading" (bytes still landing),
  // "processing" (transcoding to mp4), "ok" (done — /stream will now serve
  // playable mp4 bytes), or "failed".
  async uploadStatus(key) {
    return request(`/uploads/${encodeURIComponent(key)}/status`);
  },
  async getLastUpload() {
    return request("/uploads/last");
  },
  // 4. Get a presigned URL for the converted mp4, for local preview/trim.
  // Previously this fetched /uploads/{key}/stream manually (with an auth
  // header) and handed the browser a blob URL — but that downloads the
  // entire file up front and can't do real HTTP range requests, since a
  // <video src> can't carry custom headers and a blob has no byte-range
  // semantics once it's fully buffered in memory.
  // Instead, mirror the same presign pattern used for uploads: ask the
  // authed API for a short-lived, token-bearing URL that points straight
  // at storage, then hand that URL directly to <video src>. Storage serves
  // Range requests natively, so the browser can seek/scrub without
  // re-downloading the whole clip, and there's no CORS-tainted-canvas risk
  // since it's a plain cross-origin <video>, not a manual fetch+blob.
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
};

/* ============================================================================
   ICONS — minimal inline SVGs, all derived from a loop-arrow vocabulary
============================================================================ */

const Icon = {
  Loop: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 8a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" />
      <path d="M17 6l3 2-3 2" />
      <path d="M21 16a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-2" />
      <path d="M7 18l-3-2 3-2" />
    </svg>
  ),
  Upload: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  Grid: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  ),
  Gauge: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 14a8 8 0 1 1 16 0" /><path d="M12 14l3-4" /><path d="M4 14h16" />
    </svg>
  ),
  LogOut: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 19h16" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  ),
  Globe: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 21h20L12 2z" /><path d="M12 9v5" /><path d="M12 17.5v.01" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  Scissors: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.5 15.5M8.5 8.5L20 20" />
    </svg>
  ),
  Film: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M3 9h4M17 9h4M3 15h4M17 15h4" />
    </svg>
  ),
};

/* ============================================================================
   PRIMITIVE COMPONENTS
============================================================================ */

function Button({ variant = "primary", size = "md", children, icon, loading, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "Inter, sans-serif", fontWeight: 600, borderRadius: 10,
    border: "1px solid transparent", cursor: rest.disabled ? "not-allowed" : "pointer",
    transition: "all .15s ease", whiteSpace: "nowrap",
    opacity: rest.disabled ? 0.5 : 1,
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 13 },
    md: { padding: "10px 18px", fontSize: 14 },
    lg: { padding: "13px 24px", fontSize: 15 },
  };
  const variants = {
    primary: { background: "#FF3D5E", color: "#0E0F12", border: "1px solid #FF3D5E" },
    secondary: { background: "transparent", color: "#F3F1EC", border: "1px solid #2A2C33" },
    ghost: { background: "transparent", color: "#9A9CA5", border: "1px solid transparent" },
    danger: { background: "transparent", color: "#FF5C5C", border: "1px solid #3A2226" },
  };
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={(e) => {
        if (rest.disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "#FF5C7A";
        if (variant === "secondary") e.currentTarget.style.borderColor = "#3D3F47";
        if (variant === "ghost") e.currentTarget.style.color = "#F3F1EC";
        if (variant === "danger") { e.currentTarget.style.background = "#1F1416"; e.currentTarget.style.borderColor = "#FF5C5C"; }
      }}
      onMouseLeave={(e) => {
        if (rest.disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "#FF3D5E";
        if (variant === "secondary") e.currentTarget.style.borderColor = "#2A2C33";
        if (variant === "ghost") e.currentTarget.style.color = "#9A9CA5";
        if (variant === "danger") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#3A2226"; }
      }}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}

function Spinner({ size = 16, color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ animation: "gifapp-spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="40" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function Field({ label, error, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#9A9CA5", marginBottom: 7, letterSpacing: 0.2 }}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: "#5C5E68", marginTop: 6 }}>{hint}</div>}
      {error && (
        <div style={{ fontSize: 12.5, color: "#FF5C5C", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
          <Icon.Alert size={13} />{error}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#14151A", border: "1px solid #2A2C33",
  borderRadius: 9, padding: "11px 13px", color: "#F3F1EC", fontFamily: "Inter, sans-serif",
  fontSize: 14, outline: "none", transition: "border-color .15s ease",
};

function Input(props) {
  return (
    <input
      style={{ ...inputStyle, borderColor: props.error ? "#FF5C5C" : "#2A2C33" }}
      onFocus={(e) => (e.target.style.borderColor = props.error ? "#FF5C5C" : "#FF3D5E")}
      onBlur={(e) => (e.target.style.borderColor = props.error ? "#FF5C5C" : "#2A2C33")}
      {...props}
    />
  );
}

function Card({ children, style, ...rest }) {
  return (
    <div style={{ background: "#17181C", border: "1px solid #21232A", borderRadius: 14, ...style }} {...rest}>
      {children}
    </div>
  );
}

function Toast({ toasts, dismiss }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "#1D1F25", border: `1px solid ${t.type === "error" ? "#3A2226" : "#1F3A2D"}`,
            borderRadius: 10, padding: "12px 16px", color: "#F3F1EC", fontSize: 13.5,
            display: "flex", alignItems: "center", gap: 10, minWidth: 240, maxWidth: 360,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "gifapp-slidein .25s ease",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ color: t.type === "error" ? "#FF5C5C" : "#3DDC97", flexShrink: 0 }}>
            {t.type === "error" ? <Icon.Alert size={16} /> : <Icon.Check size={16} />}
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => dismiss(t.id)} style={{ background: "none", border: "none", color: "#5C5E68", cursor: "pointer", fontSize: 15, padding: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, push, dismiss };
}

function errMsg(e, fallback) {
  if (e && e.error) return e.error;
  return fallback || "something went wrong";
}

/* ============================================================================
   AUTH CONTEXT
============================================================================ */

const AuthCtx = createContext(null);

const TOKEN_STORAGE_KEY = "ffgif_token";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Gate rendering until we've checked localStorage for an existing session,
  // so a reload doesn't flash the login screen before restoring the user.
  const [restoring, setRestoring] = useState(true);

  // Keep the module-level token (used by the api client for auth headers)
  // in sync with React state.
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // On first mount, check localStorage for a saved token and try to restore
  // the session by re-fetching the profile with it.
  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!saved) {
      setRestoring(false);
      return;
    }
    setAuthToken(saved); // set immediately so the profile fetch below is authed
    (async () => {
      try {
        const profile = await api.getProfile();
        setToken(saved);
        setUser(profile);
      } catch {
        // Saved token is invalid/expired — clear it and fall back to login.
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(null);
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  const login = async (t, id) => {
    // Arm the auth header immediately so the profile fetch below succeeds,
    // but hold off flipping `token` (which causes Dashboard to mount) until
    // we actually have the user object — otherwise panels that read `user`
    // on mount (like Account) can render before the fetch resolves and
    // never pick up the result, since useState's initializer only runs once.
    setAuthToken(t);
    let profile = null;
    try {
      profile = await api.getProfile();
    } catch {
      // Profile fetch failing shouldn't block the session; dashboard
      // panels will surface their own errors if they need profile data.
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, t);
    setUser(profile ? { ...profile, id } : { id });
    setToken(t);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  // Listen for the global "unauthorized" signal dispatched by the api
  // client whenever any authed request comes back 401 (expired/invalid
  // token, revoked session, etc.) — not just the initial restore-on-mount
  // check. This is a ref so the listener always calls the *current*
  // logout/token closures without needing to re-subscribe on every render.
  const stateRef = useRef({ token, logout });
  useEffect(() => {
    stateRef.current = { token, logout };
  }, [token, logout]);

  useEffect(() => {
    const onUnauthorized = () => {
      // Only act if we actually think we're logged in — avoids a stray
      // event (e.g. a race during initial restore) clearing an already-
      // logged-out state and firing spurious toasts.
      if (!stateRef.current.token) return;
      stateRef.current.logout();
      window.dispatchEvent(new CustomEvent("ffgif:session-expired-toast"));
    };
    window.addEventListener("ffgif:unauthorized", onUnauthorized);
    return () => window.removeEventListener("ffgif:unauthorized", onUnauthorized);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, setUser, restoring }}>
      {children}
    </AuthCtx.Provider>
  );
}
const useAuth = () => useContext(AuthCtx);

/* ============================================================================
   AUTH SCREENS
============================================================================ */

function LandingScreen({ goTo }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", position: "relative" }}>
      <div style={{
        position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)",
        width: 900, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,61,94,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 880, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ color: "#FF3D5E" }}><Icon.Loop size={22} /></div>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17, color: "#F3F1EC", letterSpacing: -0.3 }}>ffgif</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goTo("login")}>Sign in</Button>
        </div>

        {/* hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20,
            background: "rgba(255,61,94,0.1)", border: "1px solid rgba(255,61,94,0.25)", color: "#FF3D5E",
            fontSize: 12, fontWeight: 700, marginBottom: 22, fontFamily: "JetBrains Mono, monospace",
          }}>
            <Icon.Loop size={12} /> NOW LOOPING FOREVER
          </div>
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "clamp(32px, 6vw, 54px)",
            color: "#F3F1EC", margin: "0 0 18px", lineHeight: 1.08, letterSpacing: -1,
          }}>
            Cut the boring parts.<br />
            Keep the <span style={{ color: "#FF3D5E" }}>good loop</span>.
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "#9A9CA5", maxWidth: 480, margin: "0 auto 30px", lineHeight: 1.55 }}>
            Drop a video, drag two handles, get a GIF that loops like it never wants the moment to end. No editing degree required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" icon={<Icon.Loop size={16} />} onClick={() => goTo("signup")}>Start looping — it's free</Button>
            <Button size="lg" variant="secondary" onClick={() => goTo("login")}>I already have an account</Button>
          </div>
        </div>

        {/* animated loop visual */}
        <LoopHeroVisual />

        {/* how it works */}
        <div style={{ marginTop: 72 }}>
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "#5C5E68", letterSpacing: 1, marginBottom: 28, textTransform: "uppercase" }}>
            Three steps. Zero patience required.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <HowItWorksCard icon={<Icon.Upload size={20} />} step="01" title="Drop any video" body="MP4, MOV, whatever your phone spat out. We'll sort it out." />
            <HowItWorksCard icon={<Icon.Scissors size={20} />} step="02" title="Drag to trim" body="Grab the handles, find the best 3 seconds. Live preview included." />
            <HowItWorksCard icon={<Icon.Loop size={20} />} step="03" title="Loop it forever" body="Export a GIF that's ready to haunt group chats for years." />
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 64, fontSize: 12.5, color: "#3A3C44" }}>
          ffgif · loops responsibly
        </div>
      </div>
    </div>
  );
}

// A small self-contained animation built from the same frame-strip + loop
// vocabulary used in the converter, so the marketing page actually looks
// like the product instead of a generic stock illustration.
function LoopHeroVisual() {
  const frames = 8;
  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{
        position: "relative", height: 92, borderRadius: 12, overflow: "hidden",
        background: "#0B0C0F", border: "1px solid #21232A", display: "flex",
      }}>
        {Array.from({ length: frames }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, borderRight: i < frames - 1 ? "1px solid #16171C" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#2A2C33", position: "relative", overflow: "hidden",
            }}
          >
            <Icon.Film size={16} />
            <div
              style={{
                position: "absolute", inset: 0, background: "rgba(255,61,94,0.16)",
                animation: `ffgif-frame-sweep 2.4s linear infinite`,
                animationDelay: `${(i / frames) * 2.4}s`,
              }}
            />
          </div>
        ))}
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: "12%", width: "62%",
          border: "2px solid #FF3D5E", borderRadius: 2, boxSizing: "border-box",
          boxShadow: "0 0 0 2000px rgba(11,12,15,0.6)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
        marginTop: 14, color: "#5C5E68", fontSize: 12, fontFamily: "JetBrains Mono, monospace",
      }}>
        <Icon.Loop size={13} color="#FF3D5E" />
        looping the good 1.8 seconds, forever
      </div>
    </div>
  );
}

function HowItWorksCard({ icon, step, title, body }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: "rgba(255,61,94,0.1)", color: "#FF3D5E",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#3A3C44", fontWeight: 700 }}>{step}</span>
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#8A8C96", lineHeight: 1.5 }}>{body}</div>
    </Card>
  );
}

function AuthShell({ children, footer, goTo }) {
  return (
    <div style={{
      minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,61,94,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div
          onClick={() => goTo && goTo("landing")}
          style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32, cursor: goTo ? "pointer" : "default" }}
        >
          <div style={{ color: "#FF3D5E" }}><Icon.Loop size={26} /></div>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 20, color: "#F3F1EC", letterSpacing: -0.3 }}>
            ffgif
          </span>
        </div>
        <Card style={{ padding: 32 }}>{children}</Card>
        {footer && <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "#5C5E68" }}>{footer}</div>}
      </div>
    </div>
  );
}

function LoginScreen({ goTo }) {
  const { login } = useAuth();
  const { push } = useToastsCtx();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await api.login(form);
      await login(res.token, res.id);
      push("Welcome back.");
    } catch (e2) {
      setErrors({ form: errMsg(e2, "could not sign in") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<>New here? <Link onClick={() => goTo("signup")}>Create an account</Link></>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Sign in
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>Cut, loop, ship. Pick up where you left off.</p>
      <form onSubmit={submit}>
        <Field label="Email">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </Field>
        {errors.form && <div style={{ color: "#FF5C5C", fontSize: 13, marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}><Icon.Alert size={14} />{errors.form}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18, marginTop: -8 }}>
          <Link onClick={() => goTo("forgot")} small>Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>Sign in</Button>
      </form>
    </AuthShell>
  );
}

function Link({ children, onClick, small }) {
  return (
    <span onClick={onClick} style={{ color: "#FF3D5E", cursor: "pointer", fontWeight: 600, fontSize: small ? 12.5 : "inherit" }}>
      {children}
    </span>
  );
}

function SignupScreen({ goTo }) {
  const { push } = useToastsCtx();
  const [form, setForm] = useState({ username: "", fullname: "", email: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: "passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await api.signup(form);
      push("Account created. Check your email to verify.");
      goTo("login");
    } catch (e2) {
      setErrors({ form: errMsg(e2, "could not create account") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<>Already have an account? <Link onClick={() => goTo("login")}>Sign in</Link></>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Create account
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>Start turning clips into loops.</p>
      <form onSubmit={submit}>
        <Field label="Full name">
          <Input required value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} placeholder="Labib Al Faisal" />
        </Field>
        <Field label="Username">
          <Input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="labib0x9" />
        </Field>
        <Field label="Email">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </Field>
        <Field label="Confirm password" error={errors.confirm_password}>
          <Input type="password" required error={!!errors.confirm_password} value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} placeholder="••••••••" />
        </Field>
        {errors.form && <div style={{ color: "#FF5C5C", fontSize: 13, marginBottom: 14 }}>{errors.form}</div>}
        <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>Create account</Button>
      </form>
    </AuthShell>
  );
}

function ForgotScreen({ goTo }) {
  const { push } = useToastsCtx();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (e2) {
      push(errMsg(e2, "could not send reset email"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<Link onClick={() => goTo("login")}>Back to sign in</Link>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Reset password
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>
        {sent ? "Check your inbox for a reset link." : "We'll send a reset link to your email."}
      </p>
      {sent ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#3DDC97", fontSize: 14, background: "#0F1B16", border: "1px solid #1F3A2D", borderRadius: 10, padding: "12px 14px" }}>
          <Icon.Check size={16} /> Email sent to {email}
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}

/* ============================================================================
   TOAST CONTEXT (shared between auth screens + dashboard)
============================================================================ */
const ToastCtx = createContext(null);
const useToastsCtx = () => useContext(ToastCtx);

/* ============================================================================
   DASHBOARD SHELL
============================================================================ */

function formatBytes(b) {
  if (b === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function timecode(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function Sidebar({ active, setActive, onLogout }) {
  const { user } = useAuth();
  const items = [
    { id: "convert", label: "Convert", icon: Icon.Upload },
    { id: "gifs", label: "My GIFs", icon: Icon.Grid },
    { id: "account", label: "Account", icon: Icon.User },
  ];
  return (
    <div style={{
      width: 232, flexShrink: 0, background: "#111217", borderRight: "1px solid #1E2026",
      display: "flex", flexDirection: "column", padding: "22px 16px", height: "100%", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px 26px" }}>
        <div style={{ color: "#FF3D5E" }}><Icon.Loop size={22} /></div>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17, color: "#F3F1EC", letterSpacing: -0.3 }}>ffgif</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <div
              key={it.id}
              onClick={() => setActive(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9,
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: isActive ? "#F3F1EC" : "#8A8C96",
                background: isActive ? "#1D1F25" : "transparent",
                transition: "all .15s ease",
              }}
            >
              <span style={{ color: isActive ? "#FF3D5E" : "#5C5E68" }}><it.icon size={17} /></span>
              {it.label}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: "1px solid #1E2026", paddingTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#21232A", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#FF3D5E",
          fontFamily: "Space Grotesk, sans-serif", flexShrink: 0,
        }}>
          {(user?.fullname || "U").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F3F1EC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.fullname}
          </div>
          <div style={{ fontSize: 11.5, color: "#5C5E68", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            @{user?.username}
          </div>
        </div>
        <button onClick={onLogout} title="Log out" style={{ background: "none", border: "none", color: "#5C5E68", cursor: "pointer", padding: 4, display: "flex" }}>
          <Icon.LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function QuotaBar({ quota }) {
  if (!quota) return null;
  const pct = Math.min(100, (quota.used_bytes / quota.total_bytes) * 100);
  const gifPct = Math.min(100, (quota.gif_count / quota.gif_limit) * 100);
  return (
    <Card style={{ padding: "16px 18px", display: "flex", gap: 28, alignItems: "center" }}>
      <MiniMeter label="Storage" pct={pct} valueText={`${formatBytes(quota.used_bytes)} / ${formatBytes(quota.total_bytes)}`} />
      <div style={{ width: 1, height: 30, background: "#21232A" }} />
      <MiniMeter label="GIFs" pct={gifPct} valueText={`${quota.gif_count} / ${quota.gif_limit}`} />
    </Card>
  );
}

function MiniMeter({ label, pct, valueText }) {
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "#9A9CA5", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: "#5C5E68", fontFamily: "JetBrains Mono, monospace" }}>{valueText}</span>
      </div>
      <div style={{ height: 5, background: "#21232A", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct > 85 ? "#FF5C5C" : "#FF3D5E", borderRadius: 4, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

/* ============================================================================
   CONVERTER FLOW — upload → frame-strip trim → configure → job progress
============================================================================ */

function ConverterPanel({ quota, refreshQuota }) {
  const { push } = useToastsCtx();
  const [stage, setStage] = useState("upload"); // upload | converting_preview | trim | converting | done
  const [originalFile, setOriginalFile] = useState(null); // raw file as picked, any format
  const [previewUrl, setPreviewUrl] = useState(null); // presigned stream URL — null until the user asks to play
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [uploadKey, setUploadKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 5 });
  const [config, setConfig] = useState({ width: 480, fps: 10, loop: true });
  const [job, setJob] = useState(null);
  const [resultKey, setResultKey] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpload, setLastUpload] = useState(null); // { key, filename, ... } or null if none/unavailable
  const [lastUploadChecked, setLastUploadChecked] = useState(false);
  const [loadingLastUpload, setLoadingLastUpload] = useState(false);
  // Live value of GET /uploads/{key}/status while we're polling it —
  // "uploading" | "processing" | "ok" | "failed". Drives the
  // ConvertingPreviewStage animation/label so it reflects whichever
  // in-progress step the backend is actually on.
  const [uploadStatus, setUploadStatus] = useState(null);
  const videoRef = useRef(null);

  // On entry, quietly check whether the user has a previous upload they
  // could resume with. Any failure (404, no upload yet, network hiccup)
  // just means "don't show the banner" — this should never block or error
  // the main upload flow.
  useEffect(() => {
    (async () => {
      try {
        const last = await api.getLastUpload();
        if (last && last.key) setLastUpload(last);
      } catch {
        setLastUpload(null);
      } finally {
        setLastUploadChecked(true);
      }
    })();
  }, []);

  // trim.end is clamped to a small safety margin below the reported
  // duration — the backend's own ffprobe-measured duration can differ from
  // whatever the browser later measures by a fraction of a second, and
  // without the margin a trim.end dragged all the way to the edge could
  // land just past what the backend considers valid and get rejected.
  const DURATION_SAFETY_MARGIN = 0.05;

  // Shared by both "fresh upload" and "use last upload": once status is
  // "ok", call GET /uploads/last to get the authoritative key + metadata
  // (filename, size, ffprobe duration) and move straight to the trim
  // screen. This does NOT fetch a stream URL — trimming only needs the
  // duration number, not the actual video bytes, so there's no reason to
  // ask the backend for a presigned stream link until the user actually
  // wants to play the preview. requestStreamUrl (below) handles that,
  // triggered lazily from TrimStage's play button.
  const enterTrimStage = async (fallbackMeta) => {
    const last = await api.getLastUpload().catch(() => null);
    const key = last?.key || fallbackMeta?.key;
    if (!key) throw { code: 404, error: "could not find that upload" };
    setUploadKey(key);
    const durationSec = last?.duration_sec || 0;
    const safeDuration = Math.max(0, durationSec - DURATION_SAFETY_MARGIN);
    setMeta({
      filename: last?.filename || fallbackMeta?.filename || "video",
      size_bytes: last?.size_bytes ?? fallbackMeta?.size_bytes ?? 0,
      duration_sec: durationSec,
      safe_duration_sec: safeDuration,
    });
    setTrim({ start: 0, end: Math.min(8, safeDuration || 8) });
    setPreviewUrl(null);
    setStreamError(null);
    setStage("trim");
  };

  // Lazily fetches a presigned stream URL — only called once the user
  // actually clicks play on the trim screen, not eagerly on entry. Safe to
  // call more than once (e.g. after a failed attempt); no-ops if a preview
  // is already loaded or a fetch is already in flight.
  const requestStreamUrl = useCallback(async () => {
    if (!uploadKey || previewUrl || streamLoading) return;
    setStreamLoading(true);
    setStreamError(null);
    try {
      const { url } = await api.getStreamUrl(uploadKey);
      setPreviewUrl(url);
    } catch (e) {
      setStreamError(errMsg(e, "could not load the video"));
    } finally {
      setStreamLoading(false);
    }
  }, [uploadKey, previewUrl, streamLoading]);

  // Fallback for when GET /uploads/last didn't include a duration_sec (or
  // it was 0) — since we no longer eagerly load the video just to measure
  // its duration, that number might not be known until the user actually
  // presses play and the browser reports it via loadedmetadata. If that
  // happens, backfill meta/trim from the real, browser-measured duration
  // rather than leaving the frame strip stuck showing a zero-length clip.
  const onDurationDiscovered = useCallback((durationSec) => {
    setMeta((m) => {
      if (!m || m.duration_sec) return m; // already had a real duration — don't override
      const safeDuration = Math.max(0, durationSec - DURATION_SAFETY_MARGIN);
      setTrim({ start: 0, end: Math.min(8, safeDuration || 8) });
      return { ...m, duration_sec: durationSec, safe_duration_sec: safeDuration };
    });
  }, []);

  // Polls /uploads/{key}/status until the backend reports the mp4 is ready.
  // Status values: "uploading" and "processing" are both in-progress states
  // (keep polling), "ok" means ready, "failed" is terminal. If the backend
  // includes a reason for a failure (e.g. "unsupported codec", "file too
  // large", "no video stream"), surface that instead of a generic message.
  // Throws if it fails or takes too long. Shared by both fresh uploads and
  // resuming from the last upload. Calls onStatus on every poll tick so the
  // caller can drive a live animation that reflects whichever in-progress
  // status is currently reported.
  const pollUntilReady = async (key, onStatus) => {
    const deadline = Date.now() + 60000; // transcoding can take longer than the original upload
    while (Date.now() < deadline) {
      const s = await api.uploadStatus(key);
      onStatus?.(s.status);
      if (s.status === "ok") return;
      if (s.status === "failed") {
        throw { code: 500, error: s.reason || s.error || "video conversion failed" };
      }
      // "uploading", "processing" (or any other in-progress value) — keep polling.
      await new Promise((r) => setTimeout(r, 800));
    }
    throw { code: 504, error: "video took too long to convert" };
  };

  const useLastUpload = async () => {
    if (!lastUpload) return;
    setError(null);
    setLoadingLastUpload(true);
    setUploadKey(lastUpload.key);
    try {
      // No status re-check here — GET /uploads/last only ever returns an
      // upload that's already done converting, so go straight to the trim
      // screen instead of re-polling /uploads/{key}/status first.
      await enterTrimStage(lastUpload);
    } catch (e) {
      setError(errMsg(e, "could not load your last upload"));
      setStage("upload");
    } finally {
      setLoadingLastUpload(false);
    }
  };

  const onPickFile = async (f, rejectionReason) => {
    if (rejectionReason) {
      setError(rejectionReason);
      return;
    }
    if (!f) return;
    // Accept any video format here — the backend transcodes to mp4, the
    // frontend doesn't gate on file type at all. Size is the one thing
    // cheap to check client-side before spending a full upload+wait cycle
    // on something the backend will reject anyway.
    if (f.size > MAX_UPLOAD_BYTES) {
      setError(`this file is ${formatBytes(f.size)}, max is ${formatBytes(MAX_UPLOAD_BYTES)}`);
      return;
    }
    setError(null);
    setOriginalFile(f);
    setUploading(true);
    setStage("upload");
    try {
      // 1. Ask backend for a presigned upload URL + key.
      const created = await api.createUpload(f);
      setUploadKey(created.key);

      // 2. Upload the original file bytes straight to storage, whatever
      // format it's in — the backend handles transcoding to mp4.
      await api.putToPresignedUrl(created.upload_url, f);

      // 3. Poll until the backend reports status: "ok" — at that point
      // GET /uploads/last is the source of truth for the key + metadata
      // (see enterTrimStage), not this response.
      setUploading(false);
      setStage("converting_preview");
      setUploadStatus("uploading");
      await pollUntilReady(created.key, setUploadStatus);

      // 4. Fetch key/filename/size/duration from GET /uploads/last and move
      // to the trim screen. No stream URL is requested yet — that only
      // happens if/when the user clicks play.
      await enterTrimStage({ key: created.key, filename: f.name, size_bytes: f.size });
      setLastUpload({ key: created.key, filename: f.name, size_bytes: f.size });
    } catch (e) {
      setError(errMsg(e, "upload failed"));
      setStage("upload");
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  };

  const startConvert = async () => {
    setError(null);
    if (trim.end <= trim.start) {
      setError("end time must be after start time");
      return;
    }
    // Clamp to the safety-margined duration even if something upstream
    // (e.g. a stale drag position) let trim.end creep past it — the
    // backend's ffprobe-measured duration can be a hair shorter than what
    // the browser reported.
    const safeEnd = meta?.safe_duration_sec ? Math.min(trim.end, meta.safe_duration_sec) : trim.end;
    try {
      const res = await api.convert({
        upload_key: uploadKey,
        start_time: trim.start,
        end_time: safeEnd,
        width: config.width,
        fps: config.fps,
        loop: config.loop,
      });
      setJob(res);
      setStage("converting");
    } catch (e) {
      setError(errMsg(e, "could not start conversion"));
    }
  };

  useEffect(() => {
    if (stage !== "converting" || !job) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.convertStatus(job.job_id);
        if (cancelled) return;
        setJob((j) => ({ ...j, ...res }));
        if (res.status === "completed") {
          setResultKey(res.gif_id);
          setStage("done");
          refreshQuota();
          push("Your GIF is ready.");
        } else if (res.status === "failed" || res.status === "error") {
          setError("conversion failed — try again with a different range or settings");
          setStage("trim");
        } else {
          setTimeout(poll, 700);
        }
      } catch (e) {
        if (!cancelled) push(errMsg(e, "conversion status check failed"), "error");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [stage, job?.job_id]);

  const reset = () => {
    setStage("upload"); setOriginalFile(null); setPreviewUrl(null); setMeta(null); setUploadKey(null);
    setJob(null); setResultKey(null); setError(null); setTrim({ start: 0, end: 5 });
    setStreamLoading(false); setStreamError(null);
  };

  return (
    <div>
      <PageHeader title="Convert" subtitle="Trim a video and export it as a looping GIF." />
      {error && (
        <div style={{ background: "#1F1416", border: "1px solid #3A2226", borderRadius: 10, padding: "11px 14px", marginBottom: 18, color: "#FF8A8A", fontSize: 13.5, display: "flex", gap: 8, alignItems: "center" }}>
          <Icon.Alert size={15} /> {error}
        </div>
      )}

      {stage === "upload" && (
        <>
          {lastUploadChecked && lastUpload && (
            <LastUploadBanner
              upload={lastUpload}
              loading={loadingLastUpload}
              onUse={useLastUpload}
            />
          )}
          <UploadDropzone uploading={uploading} onPick={onPickFile} />
        </>
      )}

      {stage === "converting_preview" && (
        <ConvertingPreviewStage filename={originalFile?.name || lastUpload?.filename} status={uploadStatus} />
      )}

      {stage === "trim" && meta && (
        <TrimStage
          previewUrl={previewUrl}
          streamLoading={streamLoading}
          streamError={streamError}
          onRequestStream={requestStreamUrl}
          onDurationDiscovered={onDurationDiscovered}
          meta={meta}
          trim={trim}
          setTrim={setTrim}
          config={config}
          setConfig={setConfig}
          onConvert={startConvert}
          onCancel={reset}
          videoRef={videoRef}
        />
      )}

      {stage === "converting" && (
        <ConvertingStage job={job} />
      )}

      {stage === "done" && (
        <DoneStage resultKey={resultKey} onAnother={reset} />
      )}
    </div>
  );
}

function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 24, fontWeight: 700, color: "#F3F1EC", margin: "0 0 5px" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13.5, color: "#8A8C96", margin: 0 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function LastUploadBanner({ upload, loading, onUse }) {
  return (
    <Card style={{
      padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
      border: "1px solid #2A2C33", background: "#15161B",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, background: "rgba(255,61,94,0.1)", color: "#FF3D5E",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon.Film size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#F3F1EC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Continue with your last upload
        </div>
        <div style={{ fontSize: 12, color: "#5C5E68", fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {upload.filename || upload.key}
          {upload.size_bytes ? ` · ${formatBytes(upload.size_bytes)}` : ""}
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={onUse} loading={loading} style={{ flexShrink: 0 }}>
        Use this
      </Button>
    </Card>
  );
}

function UploadDropzone({ uploading, onPick }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      onPick(null, "that doesn't look like a video file");
      return;
    }
    onPick(f);
  };

  return (
    <Card
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        padding: "64px 24px", textAlign: "center", cursor: uploading ? "default" : "pointer",
        border: `1.5px dashed ${drag ? "#FF3D5E" : "#2A2C33"}`, background: drag ? "#1A141A" : "#14151A",
        transition: "all .15s ease",
      }}
    >
      <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      {uploading ? (
        <FrameScanLoader label="Uploading…" sublabel="Sending your video over — hang tight." />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18, color: drag ? "#FF3D5E" : "#5C5E68" }}>
            <Icon.Film size={40} />
          </div>
          <div style={{ color: "#F3F1EC", fontWeight: 600, fontSize: 16, marginBottom: 6, fontFamily: "Space Grotesk, sans-serif" }}>
            Drop a video here
          </div>
          <div style={{ color: "#5C5E68", fontSize: 13.5 }}>or click to browse · any video format, we'll convert it</div>
        </>
      )}
    </Card>
  );
}

/* ---- Frame strip scrubber: the signature element ---- */
function FrameStrip({ duration, maxEnd, start, end, onChange, previewUrl, videoRef }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null); // 'start' | 'end' | null
  const clampEnd = maxEnd ?? duration;

  const pctOf = (sec) => (duration ? (sec / duration) * 100 : 0);

  const handleMove = useCallback((clientX) => {
    if (!trackRef.current || !drag) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const sec = ratio * duration;
    if (drag === "start") {
      const next = Math.min(sec, end - 0.2);
      onChange({ start: next, end });
      // Live-scrub: jump the preview to wherever the start handle is right
      // now, so you can see exactly where the trimmed clip will begin.
      if (videoRef?.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = next;
      }
    } else {
      // Can't drag past maxEnd (a small safety margin below the browser's
      // reported duration) — keeps the selection inside what the backend's
      // own ffprobe-measured duration will actually accept.
      const next = Math.min(Math.max(sec, start + 0.2), clampEnd);
      onChange({ start, end: next });
      // Same live-scrub behavior for the end handle, so dragging it shows
      // you where the clip will cut off.
      if (videoRef?.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = next;
      }
    }
  }, [drag, duration, start, end, onChange, videoRef, clampEnd]);

  useEffect(() => {
    if (!drag) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => setDrag(null);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [drag, handleMove]);

  const startDrag = (which) => {
    setDrag(which);
    // Seek immediately on mousedown too, not just on first move, so a quick
    // click-without-drag still previews that point.
    if (videoRef?.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = which === "start" ? start : end;
    }
  };

  // Generate a row of repeated "frame" cells using the same poster video,
  // offset by background-position to simulate distinct frames without
  // server-side thumbnailing.
  const FRAME_COUNT = 14;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#8A8C96", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", gap: 6, alignItems: "center" }}>
          <Icon.Scissors size={13} /> Trim range
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#FF3D5E" }}>
          {timecode(start)} → {timecode(end)} <span style={{ color: "#5C5E68" }}>({(end - start).toFixed(1)}s)</span>
        </span>
      </div>
      <div
        ref={trackRef}
        style={{
          position: "relative", height: 64, borderRadius: 8, overflow: "hidden",
          background: "#0B0C0F", border: "1px solid #21232A", userSelect: "none",
        }}
      >
        {/* frame strip background */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {Array.from({ length: FRAME_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, borderRight: i < FRAME_COUNT - 1 ? "1px solid #16171C" : "none",
                background: "linear-gradient(135deg, #1B1C22 0%, #14151A 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#2A2C33",
              }}
            >
              <Icon.Film size={14} />
            </div>
          ))}
        </div>
        {/* dimmed regions outside selection */}
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pctOf(start)}%`, background: "rgba(11,12,15,0.78)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, height: "100%", width: `${100 - pctOf(end)}%`, background: "rgba(11,12,15,0.78)" }} />
        {/* selection border */}
        <div style={{
          position: "absolute", top: 0, height: "100%",
          left: `${pctOf(start)}%`, width: `${pctOf(end) - pctOf(start)}%`,
          border: "2px solid #FF3D5E", boxSizing: "border-box", pointerEvents: "none",
        }} />
        {/* handles */}
        <Handle pct={pctOf(start)} onDown={() => startDrag("start")} />
        <Handle pct={pctOf(end)} onDown={() => startDrag("end")} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#5C5E68" }}>00:00.0</span>
        <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#5C5E68" }}>{timecode(duration)}</span>
      </div>
    </div>
  );
}

function Handle({ pct, onDown }) {
  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); onDown(); }}
      style={{
        position: "absolute", top: 0, height: "100%", left: `${pct}%`, width: 14,
        marginLeft: -7, cursor: "ew-resize", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2,
      }}
    >
      <div style={{ width: 4, height: "70%", background: "#FF3D5E", borderRadius: 3, boxShadow: "0 0 0 3px rgba(255,61,94,0.15)" }} />
    </div>
  );
}

/* ---- Shown in place of the <video> until the user asks to play — the
   stream URL is only fetched on demand, not eagerly on entering trim. ---- */
function VideoPosterPlayButton({ loading, error, onPlay }) {
  return (
    <div
      onClick={!loading ? onPlay : undefined}
      style={{
        aspectRatio: "16 / 9", borderRadius: 10, background: "#000", marginBottom: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: loading ? "default" : "pointer", position: "relative", overflow: "hidden",
        border: "1px solid #21232A",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, background: "linear-gradient(135deg, #17181C, #0B0C0F)",
      }} />
      <div style={{ position: "relative", textAlign: "center", padding: 20 }}>
        {loading ? (
          <>
            <Spinner size={30} color="#FF3D5E" />
            <div style={{ marginTop: 12, fontSize: 13, color: "#9A9CA5" }}>Loading video…</div>
          </>
        ) : error ? (
          <>
            <div style={{ color: "#FF5C5C", marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon.Alert size={24} /></div>
            <div style={{ fontSize: 13, color: "#9A9CA5", marginBottom: 14 }}>{error}</div>
            <Button size="sm" variant="secondary" onClick={onPlay}>Try again</Button>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "rgba(255,61,94,0.14)",
              border: "1.5px solid rgba(255,61,94,0.4)", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 12px", color: "#FF3D5E",
            }}>
              <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div style={{ fontSize: 13.5, color: "#F3F1EC", fontWeight: 600 }}>Click to load preview</div>
          </>
        )}
      </div>
    </div>
  );
}

function TrimStage({ previewUrl, streamLoading, streamError, onRequestStream, onDurationDiscovered, meta, trim, setTrim, config, setConfig, onConvert, onCancel, videoRef }) {
  // Keep the latest trim values available inside the timeupdate handler
  // without having to re-attach the listener on every drag tick.
  const trimRef = useRef(trim);
  useEffect(() => { trimRef.current = trim; }, [trim]);

  // Loop playback within [start, end] so the preview behaves like the GIF
  // will once exported, instead of playing through to the end of the video.
  // Only relevant once previewUrl actually exists — before that there's no
  // <video> element mounted yet (see the poster/play-button branch below).
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewUrl) return;
    const onTimeUpdate = () => {
      const { start, end } = trimRef.current;
      if (v.currentTime < start || v.currentTime >= end) {
        v.currentTime = start;
        // If we were mid-playback when we hit the end, keep playing from
        // the top of the loop instead of stalling there.
        if (!v.paused) v.play().catch(() => {});
      }
    };
    const onPlay = () => {
      // Starting playback always begins from the trim start, not wherever
      // a previous drag/scrub happened to leave the playhead.
      const { start, end } = trimRef.current;
      if (v.currentTime < start || v.currentTime >= end) v.currentTime = start;
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
    };
  }, [videoRef, previewUrl]);

  // Rough client-side size estimate — doesn't account for the actual
  // palette-generation step, just a heuristic (KB/frame scales with the
  // square of width, calibrated loosely around typical GIF compression at
  // 480px). Purely a "heads up" for the user, not a precise prediction.
  const frameCount = Math.max(0, Math.round((trim.end - trim.start) * config.fps));
  const estKbPerFrame = 40 * Math.pow(config.width / 480, 2);
  const estimatedSizeMB = ((frameCount * estKbPerFrame) / 1024).toFixed(1);
  const estimatedLarge = frameCount * estKbPerFrame > 8000; // ~8MB+

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
      <Card style={{ padding: 20 }}>
        {previewUrl ? (
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            autoPlay
            className="ffgif-no-audio-video"
            onLoadedMetadata={(e) => onDurationDiscovered?.(e.currentTarget.duration)}
            style={{ width: "100%", borderRadius: 10, background: "#000", display: "block", marginBottom: 18 }}
          />
        ) : (
          <VideoPosterPlayButton
            loading={streamLoading}
            error={streamError}
            onPlay={onRequestStream}
          />
        )}
        <FrameStrip
          duration={meta.duration_sec}
          maxEnd={meta.safe_duration_sec}
          start={trim.start}
          end={trim.end}
          onChange={setTrim}
          previewUrl={previewUrl}
          videoRef={videoRef}
        />
        <div style={{ display: "flex", gap: 18, marginTop: 16, fontSize: 12.5, color: "#5C5E68", fontFamily: "JetBrains Mono, monospace" }}>
          <span>{meta.filename}</span>
          <span>{formatBytes(meta.size_bytes)}</span>
          <span>{timecode(meta.duration_sec)} total</span>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, color: "#F3F1EC", margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon.Loop size={16} color="#FF3D5E" /> Export settings
        </h3>

        <Field label="Width" hint="height scales automatically">
          <SegmentedControl
            options={[{ v: 320, l: "320px" }, { v: 480, l: "480px" }, { v: 640, l: "640px" }]}
            value={config.width}
            onChange={(width) => setConfig({ ...config, width })}
          />
        </Field>

        <Field label="Frame rate">
          <SegmentedControl
            options={[{ v: 8, l: "8 fps" }, { v: 10, l: "10 fps" }, { v: 15, l: "15 fps" }, { v: 24, l: "24 fps" }]}
            value={config.fps}
            onChange={(fps) => setConfig({ ...config, fps })}
          />
        </Field>

        <div
          onClick={() => setConfig({ ...config, loop: !config.loop })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
            background: "#14151A", border: "1px solid #21232A", borderRadius: 10, cursor: "pointer", marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon.Loop size={16} color={config.loop ? "#FF3D5E" : "#5C5E68"} />
            <span style={{ fontSize: 13.5, color: "#F3F1EC", fontWeight: 600 }}>Loop forever</span>
          </div>
          <Toggle checked={config.loop} />
        </div>

        <div style={{ background: "#14151A", border: "1px solid #21232A", borderRadius: 10, padding: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 11.5, color: "#5C5E68", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, fontWeight: 700 }}>Estimated output</div>
          <div style={{ display: "flex", gap: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#9A9CA5" }}>
            <span>{(trim.end - trim.start).toFixed(1)}s clip</span>
            <span>{frameCount} frames</span>
            <span>{config.width}px wide</span>
          </div>
          {estimatedLarge && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#FFB74D" }}>
              <Icon.Alert size={13} />
              This may produce a large file (~{estimatedSizeMB}MB) — try a shorter clip, lower width, or fewer fps.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={onConvert} icon={<Icon.Loop size={15} />} style={{ flex: 2 }}>Convert to GIF</Button>
        </div>
      </Card>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "JetBrains Mono, monospace",
            border: `1px solid ${value === o.v ? "#FF3D5E" : "#2A2C33"}`,
            background: value === o.v ? "rgba(255,61,94,0.12)" : "transparent",
            color: value === o.v ? "#FF3D5E" : "#9A9CA5",
            transition: "all .12s ease",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#FF3D5E" : "#2A2C33", position: "relative", transition: "background .15s ease" }}>
      <div style={{
        position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: "50%",
        background: "#0E0F12", transition: "left .15s ease",
      }} />
    </div>
  );
}

// Shared "waiting" animation for both the raw upload (PUT to storage) and
// the backend transcode-to-mp4 step. Reuses the frame-strip motif from the
// trim UI and landing hero, with a scan-line that sweeps across continuously
// to read as "actively working through your video" rather than a generic
// spinner with no sense of what's happening.
function FrameScanLoader({ label, sublabel, frames = 10 }) {
  return (
    <div style={{ maxWidth: 360, margin: "0 auto" }}>
      <div style={{
        position: "relative", height: 70, borderRadius: 10, overflow: "hidden",
        background: "#0B0C0F", border: "1px solid #21232A", display: "flex", marginBottom: 18,
      }}>
        {Array.from({ length: frames }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, borderRight: i < frames - 1 ? "1px solid #16171C" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#23252C",
            }}
          >
            <Icon.Film size={13} />
          </div>
        ))}
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: 0, width: "26%",
          background: "linear-gradient(90deg, transparent, rgba(255,61,94,0.35), transparent)",
          animation: "ffgif-scan 1.6s ease-in-out infinite",
        }} />
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12.5, color: "#8A8C96", lineHeight: 1.5 }}>{sublabel}</div>
      )}
    </div>
  );
}

// Mirrors GET /uploads/{key}/status, whose value is one of "uploading",
// "processing", "ok", or "failed". This stage only ever renders while
// we're actively polling (the parent swaps to "trim" the instant status
// flips to "ok", and bails to an error on "failed"), so status here is
// always one of the two in-progress values — the scan-line animation runs
// continuously the whole time, and the label swaps between them so it's
// clear which step the backend is actually on.
function ConvertingPreviewStage({ filename, status }) {
  const label =
    status === "processing" ? "Converting to MP4"
    : status === "failed" ? "Upload failed"
    : "Uploading";
  return (
    <Card style={{ padding: "48px 24px", textAlign: "center" }}>
      <FrameScanLoader
        label={label}
        sublabel={
          <>
            <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#9A9CA5" }}>{filename || "your video"}</span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#FF3D5E", flexShrink: 0,
                animation: "ffgif-pulse-dot 1s ease-in-out infinite",
              }} />
              This can take a moment for larger files or uncommon formats.
            </span>
          </>
        }
      />
    </Card>
  );
}

function ConvertingStage({ job }) {
  const progress = job?.progress || 0;
  return (
    <Card style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, margin: "0 auto 24px", borderRadius: "50%",
        background: "rgba(255,61,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#FF3D5E",
      }}>
        <div style={{ animation: "ffgif-loop-spin 1.4s linear infinite" }}>
          <Icon.Loop size={28} />
        </div>
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 17, fontWeight: 700, color: "#F3F1EC", marginBottom: 8 }}>
        Rendering your loop
      </div>
      <div style={{ fontSize: 13, color: "#8A8C96", marginBottom: 24, fontFamily: "JetBrains Mono, monospace" }}>
        job {job?.job_id} · {job?.status}
      </div>
      <div style={{ maxWidth: 280, margin: "0 auto" }}>
        <div style={{ height: 6, background: "#21232A", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#FF3D5E", borderRadius: 4, transition: "width .5s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "#5C5E68", marginTop: 8, fontFamily: "JetBrains Mono, monospace" }}>{progress}%</div>
      </div>
    </Card>
  );
}

function DoneStage({ resultKey, onAnother }) {
  const [gifUrl, setGifUrl] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.downloadGif(resultKey);
      setGifUrl(res.url);
    } catch (e) {
      setLoadError(errMsg(e, "couldn't load the preview"));
    } finally {
      setLoading(false);
    }
  }, [resultKey]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  return (
    <Card style={{ padding: "32px 24px", textAlign: "center" }}>
      <div style={{
        width: 48, height: 48, margin: "0 auto 16px", borderRadius: "50%",
        background: "rgba(61,220,151,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3DDC97",
      }}>
        <Icon.Check size={22} />
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 700, color: "#F3F1EC", marginBottom: 8 }}>
        Loop's ready
      </div>
      <div style={{ fontSize: 13, color: "#8A8C96", marginBottom: 22, fontFamily: "JetBrains Mono, monospace" }}>{resultKey}</div>

      <div style={{
        maxWidth: 380, margin: "0 auto 22px", borderRadius: 12, overflow: "hidden",
        background: "#0B0C0F", border: "1px solid #21232A", minHeight: 180,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {loading ? (
          <Spinner size={28} color="#FF3D5E" />
        ) : loadError ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ color: "#FF5C5C", marginBottom: 10, display: "flex", justifyContent: "center" }}><Icon.Alert size={22} /></div>
            <div style={{ fontSize: 13, color: "#9A9CA5", marginBottom: 14 }}>{loadError}</div>
            <Button size="sm" variant="secondary" onClick={loadPreview}>Try again</Button>
          </div>
        ) : (
          <img
            src={gifUrl}
            alt="Converted GIF preview"
            style={{ width: "100%", display: "block" }}
            onError={() => setLoadError("the gif loaded but couldn't be displayed")}
          />
        )}
      </div>

      <div style={{ fontSize: 13, color: "#8A8C96", marginBottom: 24 }}>Find it under My GIFs to rename, share, or download anytime.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {gifUrl && !loadError && (
          <Button variant="secondary" icon={<Icon.Download size={14} />} onClick={() => window.open(gifUrl, "_blank")}>
            Download
          </Button>
        )}
        <Button onClick={onAnother}>Convert another</Button>
      </div>
    </Card>
  );
}

/* ============================================================================
   MY GIFS — list/grid + detail drawer
============================================================================ */

function GifsPanel() {
  const { push } = useToastsCtx();
  const [filter, setFilter] = useState("all");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Cache of key -> presigned file URL, shared between grid cards and the
  // detail drawer so the same gif is never fetched twice in one session.
  const [urlCache, setUrlCache] = useState({});

  const cacheUrl = useCallback((key, url) => {
    setUrlCache((prev) => (prev[key] === url ? prev : { ...prev, [key]: url }));
  }, []);

  const load = useCallback(async (status) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.listGifs(status);
      // Guard against a missing/null/malformed body — treat anything that
      // isn't an array as "no gifs" rather than letting .map blow up or
      // silently rendering nothing.
      setGifs(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setGifs([]);
      setLoadError(errMsg(e, "could not load your gifs"));
      push(errMsg(e, "could not load gifs"), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(filter); }, [filter, load]);

  const onRename = async (key, name) => {
    try {
      await api.updateGif(key, { name });
      setGifs((g) => g.map((x) => (x.key === key ? { ...x, name } : x)));
      push("Renamed.");
    } catch (e) {
      push(errMsg(e, "rename failed"), "error");
    }
  };

  const onToggleVisibility = async (key, status) => {
    try {
      await api.updateGif(key, { status });
      setGifs((g) => g.map((x) => (x.key === key ? { ...x, status } : x)));
      push(status === "public" ? "Made public." : "Made private.");
    } catch (e) {
      push(errMsg(e, "could not update"), "error");
    }
  };

  const onDelete = async (key) => {
    try {
      await api.deleteGif(key);
      setGifs((g) => g.filter((x) => x.key !== key));
      setConfirmDelete(null);
      setSelected(null);
      push("Deleted.");
    } catch (e) {
      push(errMsg(e, "delete failed"), "error");
    }
  };

  const onDownload = async (key) => {
    try {
      const res = await api.downloadGif(key);
      window.open(res.url, "_blank");
    } catch (e) {
      push(errMsg(e, "download failed"), "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="My GIFs"
        subtitle={`${gifs.length} loop${gifs.length === 1 ? "" : "s"}`}
        right={
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "private", "public"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${filter === f ? "#FF3D5E" : "#2A2C33"}`,
                  background: filter === f ? "rgba(255,61,94,0.12)" : "transparent",
                  color: filter === f ? "#FF3D5E" : "#9A9CA5", textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <GifGridSkeleton />
      ) : loadError ? (
        <EmptyState
          icon={<Icon.Alert size={32} />}
          title="Couldn't load your gifs"
          subtitle={loadError}
          action={<Button variant="secondary" onClick={() => load(filter)} style={{ marginTop: 4 }}>Try again</Button>}
        />
      ) : gifs.length === 0 ? (
        <EmptyState
          icon={<Icon.Grid size={32} />}
          title="No loops yet"
          subtitle="Convert a video to see it appear here."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {gifs.map((g) => (
            <GifCard
              key={g.key}
              gif={g}
              cachedUrl={urlCache[g.key]}
              onResolvedUrl={(url) => cacheUrl(g.key, url)}
              onOpen={() => setSelected(g)}
              onDelete={() => setConfirmDelete(g)}
              onDownload={() => onDownload(g.key)}
            />
          ))}
        </div>
      )}

      {selected && (
        <GifDetailDrawer
          gif={selected}
          cachedUrl={urlCache[selected.key]}
          onResolvedUrl={(url) => cacheUrl(selected.key, url)}
          onClose={() => setSelected(null)}
          onRename={onRename}
          onToggleVisibility={onToggleVisibility}
          onDelete={() => setConfirmDelete(selected)}
          onDownload={() => onDownload(selected.key)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this GIF?"
          body={`"${confirmDelete.name || confirmDelete.key}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => onDelete(confirmDelete.key)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function GifGridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12, background: "#17181C", border: "1px solid #21232A", height: 190,
            animation: "gifapp-pulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Card style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ color: "#3A3C44", marginBottom: 16, display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "#8A8C96", marginBottom: action ? 20 : 0 }}>{subtitle}</div>
      {action}
    </Card>
  );
}

function GifCard({ gif, cachedUrl, onResolvedUrl, onOpen, onDelete, onDownload }) {
  const [hover, setHover] = useState(false);
  const [thumbUrl, setThumbUrl] = useState(null); // static first-frame, as a canvas-derived data URL
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Draws the gif's first rendered frame onto an offscreen canvas, then
    // reads that canvas back out as a static PNG data URL. A canvas only
    // captures whatever frame was current at drawImage() time and never
    // animates itself, so this gives us a real "thumbnail" even without a
    // dedicated static-thumbnail endpoint — the source is the live
    // animated gif, frozen client-side.
    const extractFirstFrame = (gifUrl) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          setThumbUrl(canvas.toDataURL("image/png"));
        } catch {
          // toDataURL throws if the storage host doesn't send permissive
          // CORS headers (canvas gets "tainted" by cross-origin pixel data).
          // Fall back to showing the live gif directly — still a preview,
          // just not frozen to a single frame.
          if (!cancelled) setThumbUrl(gifUrl);
        }
      };
      img.onerror = () => { if (!cancelled) setThumbError(true); };
      img.src = gifUrl;
    };

    const useCanvasFallback = () => {
      if (cachedUrl) {
        extractFirstFrame(cachedUrl);
        return;
      }
      (async () => {
        try {
          const res = await api.downloadGif(gif.key);
          if (cancelled) return;
          onResolvedUrl(res.url);
          extractFirstFrame(res.url);
        } catch {
          if (!cancelled) setThumbError(true);
        }
      })();
    };

    // Prefer a real backend-generated thumbnail when the API exposes one —
    // skips the canvas/CORS-tainting workaround entirely. Still fall back
    // to the canvas approach if the thumbnail URL 404s or fails to load,
    // so a missing/broken thumbnail doesn't just show a broken-image icon.
    if (gif.thumbnail_url) {
      const probe = new Image();
      probe.onload = () => { if (!cancelled) setThumbUrl(gif.thumbnail_url); };
      probe.onerror = () => { if (!cancelled) useCanvasFallback(); };
      probe.src = gif.thumbnail_url;
      return () => { cancelled = true; };
    }

    useCanvasFallback();
    return () => { cancelled = true; };
    // Only re-run if the underlying gif key/thumbnail changes — cachedUrl
    // updates are handled inside useCanvasFallback without refetching.
  }, [gif.key, gif.thumbnail_url]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 12, background: "#17181C", border: `1px solid ${hover ? "#3D3F47" : "#21232A"}`,
        overflow: "hidden", cursor: "pointer", transition: "border-color .15s ease",
      }}
      onClick={onOpen}
    >
      <div style={{
        height: 120, background: "linear-gradient(135deg, #1D1F25, #14151A)", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#2A2C33", position: "relative",
      }}>
        {thumbUrl && !thumbError ? (
          <img
            src={thumbUrl}
            alt={gif.name || "GIF preview"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setThumbError(true)}
          />
        ) : thumbError ? (
          <Icon.Alert size={22} color="#5C5E68" />
        ) : (
          <div style={{ animation: "ffgif-loop-spin 1.4s linear infinite" }}>
            <Icon.Film size={22} />
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5 }}>
          <Badge type={gif.status} />
        </div>
        {hover && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,15,18,0.55)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IconButton onClick={(e) => { e.stopPropagation(); onDownload(); }} icon={<Icon.Download size={15} />} />
            <IconButton onClick={(e) => { e.stopPropagation(); onDelete(); }} icon={<Icon.Trash size={15} />} danger />
          </div>
        )}
      </div>
      <div style={{ padding: "11px 13px" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#F3F1EC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>
          {gif.name || "Untitled loop"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#5C5E68", fontFamily: "JetBrains Mono, monospace" }}>
          <span>{timeAgo(gif.created_at)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.Download size={11} />{gif.download}</span>
        </div>
      </div>
    </div>
  );
}

function Badge({ type }) {
  const isPublic = type === "public";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700,
      padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.3,
      background: isPublic ? "rgba(61,220,151,0.14)" : "rgba(154,156,165,0.14)",
      color: isPublic ? "#3DDC97" : "#9A9CA5",
    }}>
      {isPublic ? <Icon.Globe size={10} /> : <Icon.Lock size={10} />}
      {type}
    </span>
  );
}

function IconButton({ icon, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
        background: danger ? "rgba(255,92,92,0.15)" : "rgba(255,255,255,0.1)",
        color: danger ? "#FF5C5C" : "#F3F1EC", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </button>
  );
}

function GifDetailDrawer({ gif, cachedUrl, onResolvedUrl, onClose, onRename, onToggleVisibility, onDelete, onDownload }) {
  const [name, setName] = useState(gif.name || "");
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(cachedUrl || null);
  const [previewError, setPreviewError] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(!cachedUrl);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await api.downloadGif(gif.key);
      setUrl(res.url);
      onResolvedUrl(res.url);
    } catch (e) {
      setPreviewError(errMsg(e, "couldn't load the preview"));
    } finally {
      setLoadingPreview(false);
    }
  }, [gif.key, onResolvedUrl]);

  useEffect(() => {
    if (cachedUrl) {
      setUrl(cachedUrl);
      setLoadingPreview(false);
      return;
    }
    loadPreview();
    // Only re-fetch if the gif itself changes; cachedUrl arriving later is
    // handled by the branch above without a duplicate request.
  }, [gif.key]);

  const saveName = () => {
    onRename(gif.key, name);
    setEditing(false);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(8,8,10,0.6)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 380, maxWidth: "92vw", height: "100%", background: "#15161B", borderLeft: "1px solid #21232A",
        padding: 24, boxSizing: "border-box", overflowY: "auto", animation: "gifapp-slideleft .2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 12, color: "#5C5E68", fontFamily: "JetBrains Mono, monospace" }}>{gif.key}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5C5E68", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{
          height: 200, borderRadius: 12, background: "linear-gradient(135deg, #1D1F25, #14151A)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#2A2C33", marginBottom: 20,
          overflow: "hidden",
        }}>
          {loadingPreview ? (
            <Spinner size={26} color="#FF3D5E" />
          ) : previewError ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ color: "#FF5C5C", marginBottom: 8, display: "flex", justifyContent: "center" }}><Icon.Alert size={20} /></div>
              <div style={{ fontSize: 12.5, color: "#9A9CA5", marginBottom: 10 }}>{previewError}</div>
              <Button size="sm" variant="secondary" onClick={loadPreview}>Try again</Button>
            </div>
          ) : (
            <img
              src={url}
              alt={gif.name || "GIF preview"}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={() => setPreviewError("the gif loaded but couldn't be displayed")}
            />
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Untitled loop" />
            <Button size="sm" onClick={saveName}>Save</Button>
          </div>
        ) : (
          <div onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, cursor: "pointer" }}>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, color: "#F3F1EC", margin: 0 }}>{gif.name || "Untitled loop"}</h2>
            <Icon.Edit size={14} color="#5C5E68" />
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <DetailStat label="Created" value={timeAgo(gif.created_at)} />
          <DetailStat label="Downloads" value={gif.download} />
        </div>

        <div
          onClick={() => onToggleVisibility(gif.key, gif.status === "public" ? "private" : "public")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px",
            background: "#1D1F25", border: "1px solid #21232A", borderRadius: 10, cursor: "pointer", marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {gif.status === "public" ? <Icon.Globe size={16} color="#3DDC97" /> : <Icon.Lock size={16} color="#9A9CA5" />}
            <div>
              <div style={{ fontSize: 13.5, color: "#F3F1EC", fontWeight: 600 }}>{gif.status === "public" ? "Public" : "Private"}</div>
              <div style={{ fontSize: 11.5, color: "#5C5E68" }}>{gif.status === "public" ? "Anyone with the link can view" : "Only you can see this"}</div>
            </div>
          </div>
          <Toggle checked={gif.status === "public"} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon={<Icon.Download size={14} />} onClick={onDownload} style={{ flex: 1 }}>Download</Button>
          <Button variant="danger" icon={<Icon.Trash size={14} />} onClick={onDelete} style={{ flex: 1 }}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: "#1D1F25", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, color: "#5C5E68", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#F3F1EC", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(8,8,10,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 380, width: "100%" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ color: "#FF5C5C", flexShrink: 0 }}><Icon.Alert size={22} /></div>
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 13.5, color: "#9A9CA5", lineHeight: 1.5 }}>{body}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} style={{ background: "#FF5C5C", color: "#0E0F12", borderColor: "#FF5C5C" }}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   ACCOUNT PANEL
============================================================================ */

function AccountPanel() {
  const { user, setUser, logout } = useAuth();
  const { push } = useToastsCtx();
  const [profile, setProfile] = useState({ username: user?.username || "", fullname: user?.fullname || "" });
  const [pwForm, setPwForm] = useState({ current_password: "", password: "", confirm_password: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");

  // The profile fetch after login resolves asynchronously, so `user` can
  // still be null/incomplete at the moment this panel first mounts (e.g.
  // navigating straight to Account right after signing in). Keep the local
  // form in sync whenever `user` actually updates, rather than only reading
  // it once via useState's initializer.
  useEffect(() => {
    if (user) {
      setProfile({ username: user.username || "", fullname: user.fullname || "" });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(profile);
      setUser((u) => ({ ...u, ...res }));
      push("Profile updated.");
    } catch (e2) {
      push(errMsg(e2, "could not update profile"), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.password !== pwForm.confirm_password) {
      setPwError("passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await api.changePassword(pwForm);
      push("Password changed.");
      setPwForm({ current_password: "", password: "", confirm_password: "" });
    } catch (e2) {
      setPwError(errMsg(e2, "could not change password"));
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    if (!deletePw) return;
    try {
      await api.deleteAccount(deletePw);
      push("Account deleted.");
      logout();
    } catch (e) {
      push(errMsg(e, "could not delete account"), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Account" subtitle="Manage your profile, security, and data." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, maxWidth: 560 }}>
        <Card style={{ padding: 22 }}>
          <SectionTitle icon={<Icon.User size={15} />}>Profile</SectionTitle>
          <form onSubmit={saveProfile}>
            <Field label="Full name">
              <Input value={profile.fullname} onChange={(e) => setProfile({ ...profile, fullname: e.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={user?.email} disabled style={{ opacity: 0.6 }} />
            </Field>
            <Button type="submit" loading={savingProfile}>Save changes</Button>
          </form>
        </Card>

        <Card style={{ padding: 22 }}>
          <SectionTitle icon={<Icon.Lock size={15} />}>Change password</SectionTitle>
          <form onSubmit={changePw}>
            <Field label="Current password">
              <Input type="password" required value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </Field>
            <Field label="New password">
              <Input type="password" required value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} />
            </Field>
            <Field label="Confirm new password" error={pwError}>
              <Input type="password" required error={!!pwError} value={pwForm.confirm_password} onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
            </Field>
            <Button type="submit" loading={savingPw}>Update password</Button>
          </form>
        </Card>

        <Card style={{ padding: 22, borderColor: "#3A2226" }}>
          <SectionTitle icon={<Icon.Alert size={15} color="#FF5C5C" />} danger>Danger zone</SectionTitle>
          <p style={{ fontSize: 13, color: "#9A9CA5", marginBottom: 16, lineHeight: 1.5 }}>
            Deleting your account permanently removes your GIFs, uploads, and profile. This can't be undone.
          </p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete account</Button>
        </Card>
      </div>

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(false)} style={{ position: "fixed", inset: 0, background: "rgba(8,8,10,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 380, width: "100%" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ color: "#FF5C5C", flexShrink: 0 }}><Icon.Alert size={22} /></div>
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F3F1EC", marginBottom: 6 }}>
                  Delete your account?
                </div>
                <div style={{ fontSize: 13.5, color: "#9A9CA5", lineHeight: 1.5 }}>
                  This permanently removes your profile, uploads, and GIFs. There is no undo.
                </div>
              </div>
            </div>
            <Field label="Confirm with your password">
              <Input
                type="password"
                autoFocus
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => { setConfirmDelete(false); setDeletePw(""); }}>Cancel</Button>
              <Button
                size="sm"
                disabled={!deletePw}
                onClick={doDelete}
                style={{ background: "#FF5C5C", color: "#0E0F12", borderColor: "#FF5C5C" }}
              >
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, children, danger }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
      <span style={{ color: danger ? "#FF5C5C" : "#FF3D5E" }}>{icon}</span>
      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: danger ? "#FF5C5C" : "#F3F1EC" }}>{children}</span>
    </div>
  );
}

/* ============================================================================
   DASHBOARD ROOT
============================================================================ */

function Dashboard() {
  const { logout } = useAuth();
  const { push } = useToastsCtx();
  const [active, setActive] = useState("convert");
  const [quota, setQuota] = useState(null);

  const refreshQuota = useCallback(async () => {
    try {
      const q = await api.getQuota();
      setQuota(q);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { refreshQuota(); }, [refreshQuota]);

  const doLogout = async () => {
    try {
      await api.logout();
    } finally {
      logout();
      push("Signed out.");
    }
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar active={active} setActive={setActive} onLogout={doLogout} />
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 32px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}>
            <QuotaBar quota={quota} />
          </div>
          {active === "convert" && <ConverterPanel quota={quota} refreshQuota={refreshQuota} />}
          {active === "gifs" && <GifsPanel />}
          {active === "account" && <AccountPanel />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ROOT APP
============================================================================ */

function AppInner() {
  const { token, restoring } = useAuth();
  const [authScreen, setAuthScreen] = useState("landing");
  const { toasts, push, dismiss } = useToasts();

  // Surface the reason for a forced logout (session expired / invalid
  // credentials) once AuthProvider has already cleared the token. Kept
  // separate from AuthProvider itself so the toast system (which lives
  // above the ToastCtx.Provider boundary) doesn't need to be threaded
  // through the auth context.
  useEffect(() => {
    const onExpired = () => {
      setAuthScreen("login");
      push("Your session expired — please sign in again.", "error");
    };
    window.addEventListener("ffgif:session-expired-toast", onExpired);
    return () => window.removeEventListener("ffgif:session-expired-toast", onExpired);
  }, [push]);

  if (restoring) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
        <div style={{ color: "#FF3D5E", animation: "ffgif-loop-spin 1.4s linear infinite" }}>
          <Icon.Loop size={30} />
        </div>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "#5C5E68", letterSpacing: -0.2 }}>
          ffgif
        </span>
      </div>
    );
  }

  return (
    <ToastCtx.Provider value={{ push }}>
      {token ? (
        <Dashboard />
      ) : authScreen === "signup" ? (
        <SignupScreen goTo={setAuthScreen} />
      ) : authScreen === "forgot" ? (
        <ForgotScreen goTo={setAuthScreen} />
      ) : authScreen === "login" ? (
        <LoginScreen goTo={setAuthScreen} />
      ) : (
        <LandingScreen goTo={setAuthScreen} />
      )}
      <Toast toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export default function App() {
  useFonts();
  return (
    <div style={{
      width: "100%", height: "100vh", background: "#0E0F12", color: "#F3F1EC",
      fontFamily: "Inter, sans-serif", overflow: "hidden",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: rgba(255,61,94,0.3); }
        @keyframes gifapp-spin { to { transform: rotate(360deg); } }
        @keyframes gifapp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes gifapp-slidein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gifapp-slideleft { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ffgif-frame-sweep { 0%, 87.5%, 100% { opacity: 0; } 6% { opacity: 1; } 12.5% { opacity: 0; } }
        @keyframes ffgif-scan { 0% { left: -26%; } 100% { left: 100%; } }
        @keyframes ffgif-loop-spin { to { transform: rotate(360deg); } }
        @keyframes ffgif-pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1); } }
        input::placeholder { color: #4A4C54; }
        /* The backend strips audio from every converted clip (-an), so the
           trim preview video never has an audio track. Native controls
           still render a mute/volume icon that does nothing — hide it
           where the browser supports targeting individual control parts.
           Webkit/Blink-only (Chrome, Safari, Edge); Firefox has no
           equivalent selector, so its volume icon is left as-is there. */
        .ffgif-no-audio-video::-webkit-media-controls-mute-button,
        .ffgif-no-audio-video::-webkit-media-controls-volume-slider,
        .ffgif-no-audio-video::-webkit-media-controls-volume-slider-container {
          display: none !important;
        }
        input:disabled { cursor: not-allowed; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #2A2C33; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </div>
  );
}