import { useState, useEffect, useCallback, useRef } from "react";
import { api, setAuthToken } from "../api/client";
import { AuthCtx } from "./authContextDef";

const TOKEN_STORAGE_KEY = "ffgif_token";

export function AuthProvider({ children }) {
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
    setAuthToken(t);
    let profile = null;
    try {
      profile = await api.getProfile();
    } catch {
      // Profile fetch failing shouldn't block the session
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, t);
    setUser(profile ? { ...profile, id } : { id });
    setToken(t);
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const stateRef = useRef({ token, logout });
  useEffect(() => {
    stateRef.current = { token, logout };
  }, [token, logout]);

  useEffect(() => {
    const onUnauthorized = () => {
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

export default AuthProvider;
