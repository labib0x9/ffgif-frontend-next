"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GifItem } from "@/types";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ShareModal } from "@/components/library/ShareModal";

export interface GifResultViewerProps {
  gif: GifItem;
  onReset: () => void;
  onUpdateGif?: (updated: GifItem) => void;
}

export function GifResultViewer({ gif, onReset, onUpdateGif }: GifResultViewerProps) {
  const [currentGif, setCurrentGif] = useState<GifItem>(gif);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(gif.persist || false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  // If direct GIF URL is missing on mount, resolve via download URL
  useEffect(() => {
    if (!currentGif.url || currentGif.url.trim() === "") {
      api
        .getDownloadUrl(currentGif.key)
        .then((res) => {
          if (res?.url) {
            setCurrentGif((prev) => {
              const updated = { ...prev, url: res.url };
              onUpdateGif?.(updated);
              return updated;
            });
          }
        })
        .catch(() => {
          // Fallback
        });
    }
  }, [currentGif.key, currentGif.url, onUpdateGif]);

  const handleCopyLink = async () => {
    try {
      const urlToCopy = currentGif.url || "";
      if (!urlToCopy) {
        toastError("No URL Available", "GIF link is not ready yet.");
        return;
      }
      await navigator.clipboard.writeText(urlToCopy);
      setIsCopied(true);
      toastSuccess("Link Copied!", "Direct GIF URL copied to clipboard.");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toastError("Copy Failed", "Could not copy link to clipboard.");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const downloadData = await api.getDownloadUrl(currentGif.key);
      const downloadUrl = downloadData.url || currentGif.url;

      if (!downloadUrl) {
        toastError("Download Failed", "No download URL available.");
        return;
      }

      // Trigger direct download
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${currentGif.name || currentGif.key}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toastSuccess("Download Started", "Your GIF is downloading now.");
    } catch {
      if (currentGif.url) {
        window.open(currentGif.url, "_blank");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleVisibility = async () => {
    const nextStatus = currentGif.status === "public" ? "private" : "public";
    setIsTogglingVisibility(true);
    try {
      await api.updateGifVisibility(currentGif.key, { status: nextStatus });
      const updated = { ...currentGif, status: nextStatus };
      setCurrentGif(updated);
      onUpdateGif?.(updated);
      toastSuccess("Visibility Updated", `GIF is now ${nextStatus}.`);
    } catch (err: any) {
      toastError("Update Failed", err?.error || "Could not change visibility.");
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (isSaved) return;
    setIsSaving(true);
    try {
      await api.saveRecentGif(currentGif.key);
      setIsSaved(true);
      const updated = { ...currentGif, persist: true };
      setCurrentGif(updated);
      onUpdateGif?.(updated);
      toastSuccess("Saved to Library", "This GIF is now permanently stored in your library.");
    } catch (err: any) {
      toastError("Save Failed", err?.error || "Could not save to library.");
    } finally {
      setIsSaving(false);
    }
  };

  const isPublic = currentGif.status === "public";
  const displayGifSrc = currentGif.url && currentGif.url.trim().length > 0 ? currentGif.url : null;

  return (
    <div className="rounded-3xl bg-surface-100/90 border border-white/10 p-6 shadow-2xl backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-surface-200 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentGif.name || "Converted GIF Output"}
              </h3>
              <Badge variant={isPublic ? "public" : "private"} size="sm">
                {isPublic ? "Public" : "Private"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Key: {currentGif.key}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Create Another GIF
        </Button>
      </div>

      {/* Main GIF Playback Screen */}
      <div className="relative aspect-video max-h-[480px] w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-inner flex items-center justify-center p-2">
        {displayGifSrc ? (
          <img
            key={displayGifSrc}
            src={displayGifSrc}
            alt={currentGif.name || "Converted GIF"}
            onLoad={() => setIsImageLoaded(true)}
            className={`max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Loading converted GIF...</span>
          </div>
        )}

        {/* Floating Quick Copy Link Pill */}
        {displayGifSrc && (
          <div className="absolute top-4 right-4">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all shadow-lg"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
        {/* Instant Download */}
        <Button
          variant="primary"
          onClick={handleDownload}
          isLoading={isDownloading}
          leftIcon={<Download className="w-4 h-4" />}
          className="col-span-2 sm:col-span-1 shadow-lg shadow-indigo-600/20"
        >
          Download GIF
        </Button>

        {/* Copy Direct Link */}
        <Button
          variant="secondary"
          onClick={handleCopyLink}
          leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        >
          {isCopied ? "Copied" : "Copy URL"}
        </Button>

        {/* Share with User */}
        <Button
          variant="secondary"
          onClick={() => setShareModalOpen(true)}
          leftIcon={<Share2 className="w-4 h-4 text-cyan-400" />}
        >
          Share
        </Button>

        {/* Toggle Public/Private */}
        <Button
          variant="outline"
          onClick={handleToggleVisibility}
          isLoading={isTogglingVisibility}
          leftIcon={isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
        >
          {isPublic ? "Make Private" : "Make Public"}
        </Button>

        {/* Save to Permanent Library */}
        <Button
          variant={isSaved ? "glass" : "outline"}
          onClick={handleSaveToLibrary}
          isLoading={isSaving}
          disabled={isSaved}
          leftIcon={isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
        >
          {isSaved ? "Saved in Library" : "Save to Library"}
        </Button>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        gifKey={currentGif.key}
        gifName={currentGif.name}
      />
    </div>
  );
}
