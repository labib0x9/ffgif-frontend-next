import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  progress?: number; // 0 to 100
  isIndeterminate?: boolean;
  label?: string;
  sublabel?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "cyan";
  className?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  progress = 0,
  isIndeterminate = false,
  label,
  sublabel,
  color = "indigo",
  className,
  showPercent = true,
}: ProgressBarProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  const colorStyles = {
    indigo: "from-violet-600 to-indigo-500 shadow-indigo-500/50",
    emerald: "from-emerald-600 to-teal-400 shadow-emerald-500/50",
    amber: "from-amber-600 to-orange-400 shadow-amber-500/50",
    rose: "from-rose-600 to-pink-500 shadow-rose-500/50",
    cyan: "from-cyan-600 to-blue-500 shadow-cyan-500/50",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || sublabel || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {label && <span className="font-medium text-slate-200">{label}</span>}
            {sublabel && <span className="text-slate-400">{sublabel}</span>}
          </div>
          {showPercent && !isIndeterminate && (
            <span className="font-mono font-semibold text-slate-300">{safeProgress}%</span>
          )}
        </div>
      )}

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-50 border border-white/5">
        {isIndeterminate ? (
          <div
            className={cn(
              "absolute h-full w-1/3 rounded-full bg-gradient-to-r shadow-md animate-pulse",
              colorStyles[color]
            )}
            style={{
              animation: "ffgif-indeterminate 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite",
            }}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-300 shadow-md",
              colorStyles[color]
            )}
            style={{ width: `${safeProgress}%` }}
          />
        )}
      </div>
    </div>
  );
}
