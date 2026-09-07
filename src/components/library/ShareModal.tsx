"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Calendar, Clock, Share2, ShieldCheck } from "lucide-react";
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

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toastError("Invalid Email", "Please enter a valid recipient email address.");
      return;
    }

    setIsLoading(true);
    try {
      const expire_at = calculateExpiryIso();
      await api.shareGif(gifKey, {
        shared_with: email.trim(),
        expire_at,
      });

      toastSuccess("GIF Access Granted!", `Access active/renewed for ${email}.`);
      onShared?.();
      onClose();
      setEmail("");
    } catch (err: any) {
      toastError("Share Failed", getApiErrorMessage(err, "Could not share this GIF. Ensure user exists."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share GIF Access"
      description={`Grant temporary secure access to "${gifName || gifKey}"`}
      maxWidth="md"
    >
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
          <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
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
            The recipient will be able to view and download this GIF from their Shared Hub until the link expires. You can revoke access at any time.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Grant Access
          </Button>
        </div>
      </form>
    </Modal>
  );
}
