"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { User, UserQuota } from "@/types";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  token: string | null;
  quota: UserQuota | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
  refreshQuota: () => Promise<UserQuota | null>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "ffgif_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { error: toastError } = useToast();

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const refreshQuota = useCallback(async (): Promise<UserQuota | null> => {
    try {
      const q = await api.getQuota();
      setQuota(q);
      return q;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setQuota(null);
      router.push("/login");
    }
  }, [token, router]);

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem(TOKEN_KEY, newToken);
      setAuthToken(newToken);
      setTokenState(newToken);
      try {
        const [profile, quotaData] = await Promise.all([api.getProfile(), api.getQuota()]);
        setUser(profile);
        setQuota(quotaData);
      } catch (err: any) {
        console.error("Error fetching user data after login:", err);
      }
    },
    []
  );

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setAuthToken(savedToken);
        setTokenState(savedToken);
        try {
          const [profile, quotaData] = await Promise.all([api.getProfile(), api.getQuota()]);
          setUser(profile);
          setQuota(quotaData);
        } catch {
          // If token verification fails on boot
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
          setTokenState(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Handle global 401 unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setQuota(null);
      toastError("Session Expired", "Your session has expired or is invalid. Please sign in again.");
      router.push("/login");
    };

    window.addEventListener("ffgif:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("ffgif:unauthorized", handleUnauthorized);
  }, [router, toastError]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        quota,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshProfile,
        refreshQuota,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
