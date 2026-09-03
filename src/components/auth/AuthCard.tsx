import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

export interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface-300 rounded-[14px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FFgif
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Asynchronous Video to GIF Studio</p>
          </div>
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-surface-100/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative z-10">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="mt-6 pt-5 border-t border-white/5 text-center">{footer}</div>}
      </div>

      {/* Bottom Legal / Nav */}
      <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 FFgif Engine. Ultra-fast, cloud-powered GIF conversions.</p>
      </div>
    </div>
  );
}
