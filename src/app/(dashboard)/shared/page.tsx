"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Share2,
  Clock,
  Trash2,
  Copy,
  Check,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SharedGifItem } from "@/types";
import { api } from "@/lib/api";
import { formatDate, getRemainingTime, isExpired } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function SharedHubPage() {
  const [sharedGifs, setSharedGifs] = useState<SharedGifItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Revoke state
  const [revokeItem, setRevokeItem] = useState<SharedGifItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const fetchShared = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listSharedGifs();
      setSharedGifs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toastError("Failed to Load Shared GIFs", err?.error || "Could not fetch shared records.");
      setSharedGifs([]);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchShared();
  }, [fetchShared]);

  const handleCopyLink = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toastSuccess("Link Copied!", "Shared GIF link copied to clipboard.");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toastError("Copy Failed", "Could not copy link.");
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokeItem) return;
    setIsRevoking(true);
    try {
      await api.revokeShare(revokeItem.gif_key, revokeItem.shared_with);
      setSharedGifs((prev) => prev.filter((item) => item.id !== revokeItem.id));
      toastSuccess("Access Revoked", `Revoked access for ${revokeItem.shared_with}.`);
      setRevokeItem(null);
    } catch (err: any) {
      toastError("Revoke Failed", err?.error || "Could not revoke share access.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface-100/90 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Shared Access Management
            </h2>
            <p className="text-xs text-slate-400">
              Manage temporary user-to-user links, track expiration countdowns, and revoke privileges.
            </p>
          </div>
        </div>

        <Link href="/library">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Share from Library
          </Button>
        </Link>
      </div>

      {/* Shared Items Grid / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-surface-100 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : sharedGifs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-100/50 border border-white/10 space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-50 border border-white/10 text-cyan-400 flex items-center justify-center mx-auto shadow-xl">
            <Share2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">No Shared GIFs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have not shared any GIFs or had any GIFs shared with your account yet.
            </p>
          </div>
          <Link href="/library" className="inline-block pt-2">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
              Go to GIF Library
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sharedGifs.map((item) => {
            const expired = isExpired(item.expires_at);
            const remaining = getRemainingTime(item.expires_at);

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-surface-100/90 border border-white/10 overflow-hidden shadow-xl flex flex-col justify-between hover:border-indigo-500/30 transition-all"
              >
                {/* Media Preview */}
                <div className="relative aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden">
                  {item.url || item.thumbnail_url ? (
                    <img
                      src={item.url || item.thumbnail_url}
                      alt={item.name || item.gif_key}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-200 text-slate-500 font-mono text-xs">
                      {item.name || item.gif_key}
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3">
                    <Badge variant={expired ? "danger" : "success"} size="sm">
                      {expired ? "Expired" : "Active Share"}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{remaining}</span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{item.name || item.gif_key}</h4>
                    <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      Key: {item.gif_key}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-50 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Shared with:</span>
                      <span className="font-semibold text-white truncate max-w-[160px]">
                        {item.shared_with}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Expires at:</span>
                      <span className="text-slate-300 text-[11px]">
                        {formatDate(item.expires_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyLink(item.url, item.id)}
                      leftIcon={
                        copiedKey === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                      className="flex-1"
                    >
                      {copiedKey === item.id ? "Copied" : "Copy Link"}
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setRevokeItem(item)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        isOpen={!!revokeItem}
        onClose={() => setRevokeItem(null)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Share Access?"
        description={`Are you sure you want to revoke access for ${revokeItem?.shared_with}? They will immediately lose access to view or download this GIF.`}
        confirmText="Revoke Access"
        variant="danger"
        isLoading={isRevoking}
      />
    </div>
  );
}
