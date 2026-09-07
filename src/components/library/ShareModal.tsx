"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Calendar,
  Clock,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/errors";

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  gifKey: string;
  gifName?: string;
  onShared?: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  gifKey,
  gifName,
  onShared,
}: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<"1h" | "24h" | "7d" | "30d" | "custom">("24h");
  const [customDate, setCustomDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const presets = [
    { id: "1h", label: "1 Hour", durationMs: 60 * 60 * 1000 },
    { id: "24h", label: "24 Hours", durationMs: 24 * 60 * 60 * 1000 },
    { id: "7d", label: "7 Days", durationMs: 7 * 24 * 60 * 60 * 1000 },
    { id: "30d", label: "30 Days", durationMs: 30 * 24 * 60 * 60 * 1000 },
    { id: "custom", label: "Custom Date", durationMs: 0 },
  ];

  const calculateExpiryIso = (): string => {
    if (expiryPreset === "custom" && customDate) {
      return new Date(customDate).toISOString();
    }
    const preset = presets.find((p) => p.id === expiryPreset);
    const ms = preset?.durationMs || 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms).toISOString();
  };

  const handleReset = () => {
    setEmail("");
    setCreatedToken(null);
    setRecipientEmail("");
    setIsCopied(false);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const shareUrl =
    typeof window !== "undefined" && createdToken
      ? `${window.location.origin}/s/${createdToken}`
      : createdToken
      ? `/s/${createdToken}`
      : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toastSuccess("Link Copied!", "Share link copied to clipboard.");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toastError("Copy Failed", "Could not copy link to clipboard.");
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toastError("Invalid Email", "Please enter a valid recipient email address.");
      return;
    }

    setIsLoading(true);
    try {
      const expire_at = calculateExpiryIso();
      const res = await api.createShareToken({
        gif_key: gifKey,
        email: trimmedEmail,
        expire_at,
      });

      setCreatedToken(res.token);
      setRecipientEmail(trimmedEmail);
      toastSuccess("Share Link Created!", `Email notification queued for ${trimmedEmail}.`);
      onShared?.();
    } catch (err: any) {
      toastError("Share Failed", getApiErrorMessage(err, "Could not generate share link for this GIF."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={createdToken ? "Share Link Ready" : "Share GIF Access"}
      description={
        createdToken
          ? `Expiring link created for "${gifName || gifKey}"`
          : `Grant secure, expiring access to "${gifName || gifKey}"`
      }
      maxWidth="md"
    >
      {createdToken ? (
        /* Success Screen */
        <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-emerald-300">
                Notification Email Queued
              </p>
              <p className="text-slate-300">
                An invitation with the secure link was sent to{" "}
                <span className="font-semibold text-white">{recipientEmail}</span>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Shareable Web Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-surface-50 border border-white/10 text-xs font-mono text-indigo-300 truncate select-all">
                {shareUrl}
              </div>
              <Button
                type="button"
                variant={isCopied ? "glass" : "primary"}
                onClick={handleCopyLink}
                size="md"
                leftIcon={
                  isCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )
                }
              >
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-50 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              The recipient will be able to view and download this GIF at{" "}
              <code className="text-cyan-300">/s/{createdToken.substring(0, 8)}...</code>{" "}
              until the expiration period ends.
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Share with Another
            </Button>

            <div className="flex items-center gap-2">
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Open Link
                </Button>
              </a>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleModalClose}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleShare} className="space-y-4 pt-2">
          <Input
            label="Recipient User Email"
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Expiration Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Access Expiration Period
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setExpiryPreset(p.id as any)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                    expiryPreset === p.id
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20"
                      : "bg-surface-50 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          {expiryPreset === "custom" && (
            <div className="animate-in fade-in duration-200">
              <Input
                label="Select Expiration Date & Time"
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-50 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Generates an authenticated token link (<code className="text-cyan-300">/s/&#123;token&#125;</code>) and immediately sends an email notification to the recipient.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Generate Share Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
