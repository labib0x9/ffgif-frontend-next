"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GifItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export interface GifCardProps {
  gif: GifItem;
  onSelect: (gif: GifItem) => void;
  onShare: (gif: GifItem) => void;
  onDelete: (gif: GifItem) => void;
  onToggleVisibility: (gif: GifItem) => void;
}

export function GifCard({
  gif,
  onSelect,
  onShare,
  onDelete,
  onToggleVisibility,
}: GifCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(
    gif.thumbnail_url && (gif.thumbnail_url.startsWith("http") || gif.thumbnail_url.startsWith("data:"))
      ? gif.thumbnail_url
      : null
  );

  const { success: toastSuccess, error: toastError } = useToast();

  const isPublic = gif.status === "public";

  // Resolve thumbnail presigned URL if missing or if thumbnail_url is a raw object key
  useEffect(() => {
    if (gif.thumbnail_url && (gif.thumbnail_url.startsWith("http") || gif.thumbnail_url.startsWith("data:"))) {
      setThumbUrl(gif.thumbnail_url);
      return;
    }
    api
      .getGifThumbnail(gif.key)
      .then((res) => {
        if (res?.thumbnail) {
          setThumbUrl(res.thumbnail);
        }
      })
      .catch(() => {
        // fallback to gif.url
      });
  }, [gif.key, gif.thumbnail_url]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(gif.url);
      setIsCopied(true);
      toastSuccess("Link Copied!", "Direct GIF URL copied to clipboard.");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toastError("Copy Failed", "Could not copy link.");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const data = await api.getDownloadUrl(gif.key);
      const url = data.url || gif.url;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${gif.name || gif.key}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toastSuccess("Downloading", "Your download will begin shortly.");
    } catch {
      if (gif.url) {
        window.open(gif.url, "_blank");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const rawSrc = isHovered ? gif.url || thumbUrl : thumbUrl || gif.url;
  const displaySrc =
    rawSrc && (rawSrc.startsWith("http://") || rawSrc.startsWith("https://") || rawSrc.startsWith("data:") || rawSrc.startsWith("/"))
      ? rawSrc
      : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(gif)}
      className="group relative rounded-2xl bg-surface-100 border border-white/10 overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Media Thumbnail Container */}
      <div className="relative aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={gif.name || gif.key}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-200 text-slate-500 font-mono text-xs">
            {gif.name || gif.key}
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <Badge variant={isPublic ? "public" : "private"} size="sm">
            {isPublic ? (
              <>
                <Globe className="w-2.5 h-2.5" />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock className="w-2.5 h-2.5" />
                <span>Private</span>
              </>
            )}
          </Badge>

          {gif.download !== undefined && gif.download > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1">
              <Download className="w-2.5 h-2.5 text-cyan-400" />
              {gif.download}
            </span>
          )}
        </div>

        {/* Hover Quick Action Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] p-3 flex flex-col justify-end gap-2 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="glass"
              className="h-8 px-2.5 text-xs"
              onClick={handleDownload}
              isLoading={isDownloading}
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              variant="glass"
              className="h-8 px-2.5 text-xs"
              onClick={handleCopyLink}
              title="Copy URL"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>

            <Button
              size="sm"
              variant="glass"
              className="h-8 px-2.5 text-xs"
              onClick={() => onShare(gif)}
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            </Button>

            <Button
              size="sm"
              variant="glass"
              className="h-8 px-2.5 text-xs"
              onClick={() => onToggleVisibility(gif)}
              title={isPublic ? "Make Private" : "Make Public"}
            >
              {isPublic ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
            </Button>

            <Button
              size="sm"
              variant="glass"
              className="h-8 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
              onClick={() => onDelete(gif)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3.5 space-y-1.5 bg-surface-100">
        <h4 className="text-xs font-bold text-white truncate tracking-tight">
          {gif.name || gif.key}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate max-w-[120px]">{gif.key}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(gif.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
