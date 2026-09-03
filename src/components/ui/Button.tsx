import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-13 px-7 text-base gap-2.5",
      icon: "h-10 w-10 p-0 text-sm",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/20 focus:ring-indigo-500",
      secondary:
        "bg-surface-100 hover:bg-surface-50 text-slate-200 border border-white/10 hover:border-white/20 focus:ring-slate-500",
      outline:
        "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-white/15 hover:border-white/30 focus:ring-slate-400",
      ghost:
        "bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border-transparent focus:ring-slate-400",
      danger:
        "bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-600/20 border border-rose-500/30 focus:ring-rose-500",
      glass:
        "bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/10 hover:border-white/20 shadow-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
