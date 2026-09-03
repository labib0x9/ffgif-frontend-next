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
  Play,
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
    gif.thumbnail_url && (gif.thumbnail_url.startsWith("http://") || gif.thumbnail_url.startsWith("https://") || gif.thumbnail_url.startsWith("data:"))
      ? gif.thumbnail_url
      : null
  );

  const { success: toastSuccess, error: toastError } = useToast();

  const isPublic = gif.status === "public";

  // Fetch presigned thumbnail URL for every GIF card to give clean static overview
  useEffect(() => {
    if (gif.thumbnail_url && (gif.thumbnail_url.startsWith("http://") || gif.thumbnail_url.startsWith("https://") || gif.thumbnail_url.startsWith("data:"))) {
      setThumbUrl(gif.thumbnail_url);
      return;
    }

    let isMounted = true;
    api
      .getGifThumbnail(gif.key)
      .then((res) => {
        if (isMounted && res?.thumbnail) {
          setThumbUrl(res.thumbnail);
        }
      })
      .catch(() => {
        // Non-critical fallback
      });

    return () => {
      isMounted = false;
    };
  }, [gif.key, gif.thumbnail_url]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const urlToCopy = gif.url || thumbUrl || "";
      if (!urlToCopy) {
        toastError("Copy Failed", "No URL available.");
        return;
      }
      await navigator.clipboard.writeText(urlToCopy);
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

  // The card displays the thumbnail overview
  const rawSrc = thumbUrl || (gif.url && (gif.url.startsWith("http://") || gif.url.startsWith("https://") || gif.url.startsWith("data:")) ? gif.url : null);
  const displaySrc = rawSrc && rawSrc.trim().length > 0 ? rawSrc : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(gif)}
      className="group relative rounded-2xl bg-surface-100 border border-white/10 overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Media Thumbnail Overview Container */}
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

        {/* Top-Right Download Pill */}
        {gif.download !== undefined && gif.download > 0 && (
          <div className="absolute top-2.5 right-2.5 pointer-events-none">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-black/70 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1">
              <Download className="w-2.5 h-2.5 text-cyan-400" />
              {gif.download}
            </span>
          </div>
        )}

        {/* Subtle Center Play Icon on Hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-11 h-11 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 backdrop-blur-sm transform transition-transform group-hover:scale-110">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Hover Action Bar at Bottom of Image */}
        <div
          className={`absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center gap-1.5 transition-opacity duration-200 ${
            isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="glass"
            className="h-7 px-2 text-xs"
            onClick={handleDownload}
            isLoading={isDownloading}
            title="Download GIF"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="glass"
            className="h-7 px-2 text-xs"
            onClick={handleCopyLink}
            title="Copy Direct URL"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            size="sm"
            variant="glass"
            className="h-7 px-2 text-xs"
            onClick={() => onShare(gif)}
            title="Share Access"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          </Button>

          <Button
            size="sm"
            variant="glass"
            className="h-7 px-2 text-xs"
            onClick={() => onToggleVisibility(gif)}
            title={isPublic ? "Make Private" : "Make Public"}
          >
            {isPublic ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
          </Button>

          <Button
            size="sm"
            variant="glass"
            className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
            onClick={() => onDelete(gif)}
            title="Delete GIF"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Card Info Footer: Title and Type cleanly aligned without overlap */}
      <div className="p-3.5 space-y-2 bg-surface-100">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h4
            className="text-xs font-bold text-white truncate flex-1 min-w-0"
            title={gif.name || gif.key}
          >
            {gif.name || gif.key}
          </h4>
          <Badge variant={isPublic ? "public" : "private"} size="sm" className="shrink-0">
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
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate max-w-[120px]" title={gif.key}>
            {gif.key}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(gif.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
