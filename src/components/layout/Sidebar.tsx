"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wand2,
  Film,
  Share2,
  Settings,
  HardDrive,
  LogOut,
  Sparkles,
  Flame,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBytes } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, quota, logout } = useAuth();

  const navItems = [
    {
      label: "Studio",
      href: "/studio",
      icon: Wand2,
      badge: "Create",
    },
    {
      label: "GIF Library",
      href: "/library",
      icon: Film,
      count: quota?.gif_count,
    },
    {
      label: "Shared Hub",
      href: "/shared",
      icon: Share2,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const storagePercent = quota?.total_bytes
    ? Math.min(100, Math.round((quota.used_bytes / quota.total_bytes) * 100))
    : 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-surface-200/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/5">
          <Link
            href="/studio"
            className="flex items-center gap-3 group"
            onClick={() => onClose?.()}
          >
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
                  STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Async GIF Engine</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/studio" && pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-white border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-surface-50 text-slate-300 border border-white/5">
                    {item.count}
                  </span>
                )}

                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-indigo-500 shadow-sm shadow-indigo-500" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Quota & User Profile Footer */}
        <div className="p-4 border-t border-white/10 space-y-4 bg-surface-300/40">
          {/* Quota Meter */}
          {quota && (
            <div className="p-3 rounded-xl bg-surface-100/80 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Storage</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {formatBytes(quota.used_bytes)} / {formatBytes(quota.total_bytes)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    storagePercent > 85
                      ? "bg-rose-500"
                      : storagePercent > 60
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>GIFs Used</span>
                <span className="font-mono text-slate-300 font-semibold">
                  {quota.gif_count} / {quota.gif_limit}
                </span>
              </div>
            </div>
          )}

          {/* User Section */}
          <div className="flex items-center justify-between pt-1">
            <Link
              href="/settings"
              onClick={() => onClose?.()}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 ring-2 ring-white/10">
                {user?.fullname ? user.fullname.charAt(0) : user?.username ? user.username.charAt(0) : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullname || user?.username || "FFgif User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
