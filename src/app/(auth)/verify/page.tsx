"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail, Send, ArrowRight, KeyRound } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

function VerifyContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    tokenFromUrl ? "verifying" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const handleVerify = useCallback(
    async (tokenToUse: string) => {
      if (!tokenToUse) return;
      setStatus("verifying");
      setErrorMessage(null);

      try {
        await api.verify(tokenToUse);
        setStatus("success");
        toastSuccess("Account Verified!", "You can now sign in with your credentials.");
      } catch (err: any) {
        setStatus("error");
        const msg = err?.error || "This verification token is invalid or has expired.";
        setErrorMessage(msg);
        toastError("Verification Failed", msg);
      }
    },
    [toastSuccess, toastError]
  );

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl, handleVerify]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastError("Email Required", "Please enter your registration email.");
      return;
    }

    setIsResending(true);
    try {
      await api.resendVerify(email);
      toastSuccess("Verification Email Sent", "Please check your inbox for the new activation link.");
    } catch (err: any) {
      toastError("Resend Failed", err?.error || "Could not send verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthCard
      title="Account Verification"
      subtitle="Verify your email address to unlock full conversion limits."
      footer={
        <p className="text-xs text-slate-400">
          Back to{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign In
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {/* Verification State Box */}
        {status === "verifying" && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">Verifying your token...</h3>
              <p className="text-xs text-slate-400 mt-1">Please wait a moment while we activate your account.</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Account Verified!</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your email has been confirmed. Your FFgif account is now fully active.
              </p>
            </div>
            <Link href="/login" className="block pt-2">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-start gap-3 text-rose-300 text-xs">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block font-semibold text-white">Verification Failed</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Token Verification / Resend Email Section */}
        {status !== "success" && (
          <div className="space-y-6">
            {/* Manual Token Input */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Manual Token Verification
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste ?token= here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleVerify(token)}
                  disabled={!token || status === "verifying"}
                  className="shrink-0"
                >
                  Verify
                </Button>
              </div>
            </div>

            {/* Resend Activation Link Form */}
            <form onSubmit={handleResend} className="space-y-3 pt-4 border-t border-white/5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Resend Activation Link
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your registration email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={isResending}
                  className="shrink-0"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Resend
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-sm">
          Loading verification...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
