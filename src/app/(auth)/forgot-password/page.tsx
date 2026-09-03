"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Send, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await api.forgotPassword(email);
      setIsSent(true);
      toastSuccess("Check your inbox", "A password reset link has been dispatched.");
    } catch (err: any) {
      const msg = err?.code === 404 ? "No account found with this email address." : err?.error || "Failed to process request.";
      setErrorMessage(msg);
      toastError("Request Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset Your Password"
      subtitle="Enter your account email to receive a password reset link."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      }
    >
      {isSent ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Reset Email Dispatched</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              If an account exists for <strong className="text-indigo-300">{email}</strong>, you will receive a secure password reset link shortly.
            </p>
          </div>

          <div className="pt-3">
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <Input
            label="Account Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
