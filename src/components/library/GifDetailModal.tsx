"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GifItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Download,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Trash2,
  Film,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

export interface GifDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  gif: GifItem | null;
  onShare: (gif: GifItem) => void;
  onDelete: (gif: GifItem) => void;
  onToggleVisibility: (gif: GifItem) => void;
}

export function GifDetailModal({
  isOpen,
  onClose,
  gif,
  onShare,
  onDelete,
  onToggleVisibility,
}: GifDetailModalProps) {
  const [currentGif, setCurrentGif] = useState<GifItem | null>(gif);
  const [previewMode, setPreviewMode] = useState<"gif" | "thumbnail">("gif");
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    setCurrentGif(gif);
    setPreviewMode("gif");

    if (gif) {
      // Ensure we have a valid direct GIF streaming/download URL to play
      if (!gif.url || (!gif.url.startsWith("http://") && !gif.url.startsWith("https://") && !gif.url.startsWith("data:"))) {
        api
          .getDownloadUrl(gif.key)
          .then((res) => {
            if (res?.url) {
              setCurrentGif((prev) => (prev ? { ...prev, url: res.url } : null));
            }
          })
          .catch(() => {
            // ignore
          });
      }

      // Ensure we have the presigned thumbnail
      if (!gif.thumbnail_url || (!gif.thumbnail_url.startsWith("http://") && !gif.thumbnail_url.startsWith("https://"))) {
        api
          .getGifThumbnail(gif.key)
          .then((res) => {
            if (res?.thumbnail) {
              setCurrentGif((prev) => (prev ? { ...prev, thumbnail_url: res.thumbnail } : null));
            }
          })
          .catch(() => {
            // ignore
          });
      }
    }
  }, [gif]);

  if (!currentGif) return null;

  const isPublic = currentGif.status === "public";
  const rawUrl =
    previewMode === "thumbnail" && currentGif.thumbnail_url
      ? currentGif.thumbnail_url
      : currentGif.url || currentGif.thumbnail_url || null;
  const displayUrl =
    rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:") || rawUrl.startsWith("/"))
      ? rawUrl
      : null;
  const hasThumb =
    currentGif.thumbnail_url && (currentGif.thumbnail_url.startsWith("http://") || currentGif.thumbnail_url.startsWith("https://"));

  const handleCopy = async () => {
    if (!displayUrl) {
      toastError("Copy Failed", "No URL available to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(displayUrl);
      setIsCopied(true);
      toastSuccess(
        "Link Copied!",
        previewMode === "thumbnail" ? "Thumbnail URL copied." : "Direct GIF URL copied."
      );
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toastError("Copy Failed", "Could not copy link.");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const data = await api.getDownloadUrl(currentGif.key);
      const url = data.url || currentGif.url;
      if (!url) {
        toastError("Download Failed", "No download link available.");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentGif.name || currentGif.key}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toastSuccess("Download Started", "Downloading GIF file.");
    } catch {
      if (currentGif.url) {
        window.open(currentGif.url, "_blank");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentGif.name || "GIF Details"}
      description={`Unique Key: ${currentGif.key}`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-1">
        {/* GIF / Thumbnail Preview Switcher Header */}
        {hasThumb && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Viewing Mode</span>
            <div className="flex items-center p-1 rounded-xl bg-surface-50 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode("gif")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  previewMode === "gif"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Playing GIF</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("thumbnail")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  previewMode === "thumbnail"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Static Thumbnail</span>
              </button>
            </div>
          </div>
        )}

        {/* Media Preview Screen - Plays the GIF */}
        <div className="relative aspect-video max-h-[400px] w-full rounded-2xl bg-black/90 border border-white/10 flex items-center justify-center overflow-hidden p-2">
          {displayUrl ? (
            <img
              key={displayUrl}
              src={displayUrl}
              alt={currentGif.name || currentGif.key}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-in fade-in duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              <span className="text-xs font-medium">Loading GIF animation...</span>
            </div>
          )}
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface-50 border border-white/5 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Status</span>
            <div className="mt-1">
              <Badge variant={isPublic ? "public" : "private"} size="sm">
                {isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Downloads</span>
            <span className="font-mono font-bold text-white mt-1 block">
              {currentGif.download ?? 0}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-[11px] text-slate-400 block font-medium">Created On</span>
            <span className="text-slate-200 mt-1 block truncate">
              {formatDate(currentGif.created_at)}
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              isLoading={isDownloading}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download GIF
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {isCopied ? "Copied" : previewMode === "thumbnail" ? "Copy Thumb" : "Copy URL"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onShare(currentGif)}
              leftIcon={<Share2 className="w-4 h-4 text-cyan-400" />}
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleVisibility(currentGif)}
              leftIcon={isPublic ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
            >
              {isPublic ? "Make Private" : "Make Public"}
            </Button>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(currentGif)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
