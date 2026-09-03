import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "neutral" | "public" | "private";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "neutral", size = "md", children, ...props }: BadgeProps) {
  const variantStyles = {
    primary: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    info: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    neutral: "bg-slate-800 text-slate-300 border-white/10",
    public: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    private: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border backdrop-blur-sm select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
