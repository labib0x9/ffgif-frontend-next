"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Clock,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Film,
  Image as ImageIcon,
  LogIn,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SharedGifTokenResponse } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, getRemainingTime, isExpired } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/errors";

export function SharedGifTokenClient({ initialToken }: { initialToken?: string }) {
  const params = useParams();
  const token =
    initialToken ||
    (typeof params?.token === "string"
      ? params.token
      : Array.isArray(params?.token)
      ? params.token[0]
      : "");

  const { isAuthenticated } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [gif, setGif] = useState<SharedGifTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"gif" | "thumbnail">("gif");
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchSharedGif = useCallback(async () => {
    if (!token) {
      setError("No share token provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const data = await api.getSharedGifByToken(token);
      setGif(data);
    } catch (err: any) {
      const code = err?.error_code || (err?.status === 404 ? "SHARE_NOT_FOUND" : "ERROR");
      setErrorCode(code);
      const msg = getApiErrorMessage(
        err,
        code === "SHARE_NOT_FOUND"
          ? "This share link is invalid, revoked, or has expired."
          : "Could not load shared GIF."
      );
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSharedGif();
  }, [fetchSharedGif]);

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toastSuccess("Link Copied!", "Share link copied to clipboard.");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toastError("Copy Failed", "Could not copy link.");
    }
  };

  const handleDownload = async () => {
    if (!gif) return;
    setIsDownloading(true);
    try {
      const targetUrl = gif.url || gif.thumbnail_url;
      if (!targetUrl) {
        toastError("Download Failed", "No direct GIF link available.");
        return;
      }

      const response = await fetch(targetUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${gif.name || "shared-animation"}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      toastSuccess("Download Started", "Your shared GIF is downloading.");
    } catch {
      if (gif?.url) {
        window.open(gif.url, "_blank");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const rawDisplayUrl =
    previewMode === "thumbnail" && gif?.thumbnail_url
      ? gif.thumbnail_url
      : gif?.url || gif?.thumbnail_url;

  const expired = gif?.expires_at ? isExpired(gif.expires_at) : false;
  const remainingText = gif?.expires_at ? getRemainingTime(gif.expires_at) : null;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-300/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-surface-200 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg text-white font-outfit tracking-tight">
              FF<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">gif</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/library">
                  <Button variant="secondary" size="sm">
                    My Library
                  </Button>
                </Link>
                <Link href="/studio">
                  <Button variant="primary" size="sm">
                    Open Studio
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="secondary" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* State 1: Loading */}
        {isLoading && (
          <div className="p-12 rounded-3xl bg-surface-100/90 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Retrieving Shared GIF...</h3>
              <p className="text-xs text-slate-400">
                Fetching shared animation and metadata using secure token.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Error / Expired Token */}
        {!isLoading && error && (
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-100/90 border border-rose-500/20 backdrop-blur-xl text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {errorCode === "SHARE_NOT_FOUND" ? "Share Link Expired or Invalid" : "Unable to Open Shared GIF"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {error}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={fetchSharedGif}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Link href="/">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Successfully Loaded Shared GIF */}
        {!isLoading && gif && (
          <div className="rounded-3xl bg-surface-100/90 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Meta Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {gif.name || "Shared GIF"}
                  </h1>
                  <Badge variant={expired ? "danger" : "success"} size="sm">
                    {expired ? "Expired" : "Active Share"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">
                  Key: {gif.gif_key}
                </p>
              </div>

              {/* Expiration Timer & Mode Toggle */}
              <div className="flex items-center gap-3">
                {gif.expires_at && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 border border-white/10 text-xs font-mono text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{remainingText || formatDate(gif.expires_at)}</span>
                  </div>
                )}

                {gif.thumbnail_url && (
                  <div className="flex items-center p-1 rounded-xl bg-surface-50 border border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("gif")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        previewMode === "gif"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Film className="w-3 h-3" />
                      <span>GIF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("thumbnail")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        previewMode === "thumbnail"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Thumb</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Media Player Screen */}
            <div className="relative aspect-video max-h-[500px] w-full rounded-2xl overflow-hidden bg-black/95 border border-white/10 shadow-inner flex items-center justify-center p-2">
              {rawDisplayUrl ? (
                <img
                  key={rawDisplayUrl}
                  src={rawDisplayUrl}
                  alt={gif.name || gif.gif_key}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in fade-in duration-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Film className="w-8 h-8 text-slate-500" />
                  <span className="text-xs">No media preview available</span>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-surface-50 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Created On</span>
                  <span className="text-slate-200 font-semibold">{formatDate(gif.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Expires At</span>
                  <span className="text-slate-200 font-semibold">
                    {gif.expires_at ? formatDate(gif.expires_at) : "Never (Permanent)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Token Link</span>
                  <span className="text-emerald-400 font-semibold">Public Expiring Token</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download GIF
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCopyLink}
                  leftIcon={
                    isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  {isCopied ? "Copied Link" : "Copy Link"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/studio">
                  <Button variant="outline" size="md" leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}>
                    Create Your Own
                  </Button>
                </Link>
                {isAuthenticated && (
                  <Link href="/library">
                    <Button variant="secondary" size="md">
                      My Library
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
