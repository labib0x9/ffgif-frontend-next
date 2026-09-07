"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

import { getApiErrorMessage } from "@/lib/errors";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/studio";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await api.login({ email, password });
      if (data && data.token) {
        await login(data.token);
        toastSuccess("Welcome back!", "Signed in successfully.");
        router.push(redirectPath);
      } else {
        throw { status: 500, code: 500, message: "Missing token in login response" };
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Login failed. Please verify credentials.");
      setErrorMessage(msg);
      toastError("Login Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefillDemo = () => {
    setEmail("anonymous@ffgif.local");
    setPassword("anonymous@ffgif");
    setErrorMessage(null);
  };

  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your FFgif account to access your studio and library."
      footer={
        <p className="text-xs text-slate-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Create account
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
          label="Email Address"
          type="email"
          placeholder="anonymous@ffgif.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="anonymous@ffgif"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          Sign In
        </Button>

        {/* Demo Credentials Prefill helper */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePrefillDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-50 hover:bg-surface-100 border border-white/5 text-[11px] text-slate-300 hover:text-white flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-white">Prefill Demo Account</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 group-hover:text-indigo-300">
              anonymous@ffgif.local
            </span>
          </button>
        </div>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 text-sm">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
