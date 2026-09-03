"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, KeyRound, Check, X, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const isLengthValid = password.length >= 5 && password.length <= 70;
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = token.length > 0 && isLengthValid && hasSpecialChar && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage("Please fulfill all password requirements.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await api.resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });
      setIsSuccess(true);
      toastSuccess("Password Updated", "Your password has been successfully reset.");
    } catch (err: any) {
      const msg = err?.code === 410 ? "This reset token is invalid or expired." : err?.error || "Failed to update password.";
      setErrorMessage(msg);
      toastError("Reset Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthCard
        title="Password Updated"
        subtitle="You can now sign in with your new password."
      >
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">All Set!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your password has been securely updated.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create New Password"
      subtitle="Choose a secure password for your FFgif account."
      footer={
        <p className="text-xs text-slate-400">
          Remember your credentials?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <Input
          label="Reset Token"
          placeholder="Paste reset token from email"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          leftIcon={<KeyRound className="w-4 h-4" />}
          required
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          required
          autoComplete="new-password"
        />

        {/* Live Requirements Check */}
        <div className="p-3 rounded-xl bg-surface-50 border border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            {isLengthValid ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={isLengthValid ? "text-emerald-300" : "text-slate-400"}>
              5 to 70 characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasSpecialChar ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={hasSpecialChar ? "text-emerald-300" : "text-slate-400"}>
              Contains special character (!@#$%^&*)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMatch ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className={isMatch ? "text-emerald-300" : "text-slate-400"}>
              Passwords match
            </span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={!isFormValid || isLoading}
          isLoading={isLoading}
        >
          Reset Password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-sm">
          Loading reset form...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
