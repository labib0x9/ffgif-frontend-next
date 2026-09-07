"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Lock,
  UserCheck,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  MailCheck,
} from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

import { getApiErrorMessage } from "@/lib/errors";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Validation Checks
  const isUsernameValid =
    formData.username.length >= 4 &&
    formData.username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(formData.username);

  const isPasswordLengthValid =
    formData.password.length >= 5 && formData.password.length <= 70;

  const hasSpecialChar = /[!@#$%^&*]/.test(formData.password);

  const isPasswordMatch =
    formData.password.length > 0 &&
    formData.password === formData.confirm_password;

  const isFormValid =
    isUsernameValid &&
    formData.fullname.trim().length > 0 &&
    formData.email.includes("@") &&
    isPasswordLengthValid &&
    hasSpecialChar &&
    isPasswordMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage("Please fulfill all requirement rules before submitting.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      await api.signup(formData);
      setIsSuccess(true);
      toastSuccess("Account Created!", "Please check your inbox for the activation link.");
    } catch (err: any) {
      const msg = getApiErrorMessage(err, "Failed to create account. Please verify your details.");
      setErrorMessage(msg);
      toastError("Registration Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthCard
        title="Check Your Email"
        subtitle="We sent a verification link to your email address."
        footer={
          <p className="text-xs text-slate-400">
            Already verified?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in now
            </Link>
          </p>
        }
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Almost there!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We've dispatched an activation link to <strong className="text-indigo-300">{formData.email}</strong>. Click the link in the email to activate your account.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href={`/verify`}>
              <Button variant="secondary" size="sm" className="w-full">
                Enter Verification Token
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create Your Account"
      subtitle="Join FFgif to generate ultra-smooth, lightweight GIFs in seconds."
      footer={
        <p className="text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Username"
            name="username"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            leftIcon={<UserIcon className="w-4 h-4" />}
            required
            autoComplete="username"
          />

          <Input
            label="Full Name"
            name="fullname"
            placeholder="John Doe"
            value={formData.fullname}
            onChange={handleChange}
            leftIcon={<UserCheck className="w-4 h-4" />}
            required
            autoComplete="name"
          />
        </div>

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            value={formData.confirm_password}
            onChange={handleChange}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />
        </div>

        {/* Live Password & Requirements Checklist */}
        <div className="p-3 rounded-xl bg-surface-50 border border-white/5 space-y-1.5 text-xs">
          <p className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
            Password & Security Rules:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              {isUsernameValid ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={isUsernameValid ? "text-emerald-300" : "text-slate-400"}>
                Username (4–20 alphanumeric)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPasswordLengthValid ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={isPasswordLengthValid ? "text-emerald-300" : "text-slate-400"}>
                Password length (5–70 chars)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasSpecialChar ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={hasSpecialChar ? "text-emerald-300" : "text-slate-400"}>
                Special char (!@#$%^&*)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPasswordMatch ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span className={isPasswordMatch ? "text-emerald-300" : "text-slate-400"}>
                Passwords match
              </span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={!isFormValid || isLoading}
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Free Account
        </Button>
      </form>
    </AuthCard>
  );
}
