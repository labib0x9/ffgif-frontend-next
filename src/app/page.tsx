"use client";

import React from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  Share2,
  ArrowRight,
  Sparkles,
  Cpu,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-surface-200/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 h-18 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface-300 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FFgif
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            Security & Storage
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/studio">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="shadow-lg shadow-indigo-600/30"
            >
              Launch Studio
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 max-w-5xl mx-auto text-center space-y-8 z-10">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-inner">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Next-Gen Asynchronous Video-to-GIF Architecture</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Transform Videos into{" "}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Silky Smooth GIFs
          </span>{" "}
          at Cloud Speed
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Direct MinIO presigned uploads, frame-accurate trimming, customizable framerates up to 30 FPS, and instantaneous sharing with built-in access expiration.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/studio" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="primary"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto text-base font-bold px-8 shadow-xl shadow-indigo-600/40"
            >
              Start Converting Free
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base">
              Sign In to Account
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 text-xs font-semibold text-slate-300">
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Direct MinIO S3 Upload</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>RabbitMQ + Redis Engine</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Frame-Accurate Scrubbing</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Expiring Share Links</span>
          </div>
        </div>
      </section>

      {/* Interactive Studio Preview Card */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto w-full z-10">
        <div className="rounded-3xl bg-surface-100/80 border border-white/10 p-4 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Top Window Dots */}
          <div className="flex items-center justify-between pb-6 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400">FFgif Studio - Interactive Demo</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 items-center">
            {/* Left Preview Screen */}
            <div className="lg:col-span-2 relative aspect-video rounded-2xl bg-black/90 border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
              <div className="text-center space-y-3 p-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
                <h4 className="text-sm font-bold text-white">Dual-Slider Trim Timeline</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Drag start and end timestamps to preview looped slices in real-time.
                </p>
              </div>
            </div>

            {/* Right Settings Mock */}
            <div className="space-y-4 p-5 rounded-2xl bg-surface-200/80 border border-white/5 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-300">Framerate (FPS)</span>
                <div className="h-2 rounded-full bg-indigo-600 w-3/4" />
                <span className="text-[11px] font-mono text-indigo-300 font-bold">24 FPS (Cinematic)</span>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-300">Resolution</span>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold text-[10px]">
                    480p
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-50 text-slate-400 text-[10px]">
                    720p
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-50 text-slate-400 text-[10px]">
                    1080p
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/studio" className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Try Conversion Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 max-w-6xl mx-auto w-full z-10">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Extreme Speed & Quality
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Everything you need to convert, optimize, store, and distribute video-based GIFs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-surface-100/80 border border-white/10 space-y-4 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Direct MinIO Cloud Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Videos upload straight from your browser to MinIO storage via signed PUT URLs with real-time percentage progress.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface-100/80 border border-white/10 space-y-4 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">RabbitMQ Async Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Conversions are processed asynchronously across worker queues with 1.5s live polling updates and Redis cache acceleration.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface-100/80 border border-white/10 space-y-4 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Granular Share Links</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share GIFs with team members with preset or custom expiration timestamps and instant access revocation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">FFgif</span>
            <span>— Asynchronous Video to GIF Studio</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <Link href="/studio" className="hover:text-white transition-colors">
              Studio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
