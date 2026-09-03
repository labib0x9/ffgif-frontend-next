"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Plus,
  HardDrive,
  Film,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname();
  const { user, quota, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    switch (pathname) {
      case "/studio":
        return { title: "Video Studio", subtitle: "Trim & convert videos into high-FPS GIFs" };
      case "/library":
        return { title: "GIF Library", subtitle: "Manage, filter, and share your generated GIFs" };
      case "/shared":
        return { title: "Shared Hub", subtitle: "View and manage user-to-user shared GIFs" };
      case "/settings":
        return { title: "Account & Settings", subtitle: "Profile, password, quotas & preferences" };
      default:
        return { title: "Dashboard", subtitle: "FFgif Media Management" };
    }
  };

  const { title, subtitle } = getPageTitle();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-18 bg-surface-200/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-white/10"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Quota Pill */}
        {quota && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-100/90 border border-white/10 text-xs shadow-inner">
            {/* Storage indicator */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatBytes(quota.used_bytes)}</span>
              <span className="text-slate-400">/ {formatBytes(quota.total_bytes)}</span>
            </div>

            <div className="w-px h-3 bg-white/15" />

            {/* GIF Count */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>{quota.gif_count}</span>
              <span className="text-slate-400">/ {quota.gif_limit} GIFs</span>
            </div>
          </div>
        )}

        {/* Quick Create Button */}
        {pathname !== "/studio" && (
          <Link href="/studio">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              <span className="hidden sm:inline">New GIF</span>
            </Button>
          </Link>
        )}

        {/* User Avatar & Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md ring-2 ring-white/10">
              {user?.fullname ? user.fullname.charAt(0) : user?.username ? user.username.charAt(0) : "U"}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-100 border border-white/10 p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                <p className="text-xs font-bold text-white truncate">
                  {user?.fullname || user?.username || "FFgif User"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                {user?.verified && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Account</span>
                  </div>
                )}
              </div>

              <Link
                href="/studio"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Create New GIF</span>
              </Link>

              <Link
                href="/library"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Film className="w-4 h-4 text-cyan-400" />
                <span>My GIF Library</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <div className="my-1 border-t border-white/5" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
