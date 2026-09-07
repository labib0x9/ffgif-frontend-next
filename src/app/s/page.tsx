"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, KeyRound, ArrowRight, ShieldCheck, Film } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function SharedPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(queryToken);

  useEffect(() => {
    if (queryToken) {
      router.push(`/s/${encodeURIComponent(queryToken)}`);
    }
  }, [queryToken, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) return;

    // If full URL was pasted, extract token
    const match = cleanToken.match(/\/s\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      router.push(`/s/${encodeURIComponent(match[1])}`);
    } else {
      router.push(`/s/${encodeURIComponent(cleanToken)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-surface-300/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-surface-200 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="font-extrabold text-lg text-white font-outfit tracking-tight">
              FF<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">gif</span>
            </span>
          </Link>

          <Link href="/login">
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Portal Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-surface-100/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-lg shadow-indigo-500/10">
              <Film className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Shared GIF Access Portal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your share token or link received via email to view and download the shared animation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Share Token or Link"
              placeholder="Paste token or link (e.g., abc123xyz...)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Shared GIF
            </Button>
          </form>

          <div className="p-3.5 rounded-2xl bg-surface-50 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              All shared links are cryptographically protected and automatically expire after their designated duration.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SharedPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SharedPortalContent />
    </Suspense>
  );
}
