"use client";

import React, { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Lock,
  HardDrive,
  Film,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Save,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

export default function SettingsPage() {
  const { user, quota, updateUser, refreshQuota, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    fullname: user?.fullname || "",
    avatar_url: user?.avatar_url || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    confirm_password: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateProfile({
        ...profileForm,
        email: user?.email || "",
        verified: user?.verified || false,
      });
      updateUser(profileForm);
      toastSuccess("Profile Updated", "Your account profile was successfully updated.");
    } catch (err: any) {
      toastError("Update Failed", err?.error || "Could not update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm_password) {
      toastError("Password Mismatch", "New password and confirm password must match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword(passwordForm);
      toastSuccess("Password Changed", "Your password has been changed successfully.");
      setPasswordForm({ current_password: "", password: "", confirm_password: "" });
    } catch (err: any) {
      toastError("Password Change Failed", err?.error || "Could not change password. Check current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toastError("Password Required", "Please enter your password to confirm account deletion.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.deleteAccount(deletePassword);
      toastSuccess("Account Deleted", "Your FFgif account and data have been removed.");
      logout();
    } catch (err: any) {
      toastError("Deletion Failed", err?.error || "Incorrect password or failed to delete account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const storagePercent = quota?.total_bytes
    ? Math.min(100, Math.round((quota.used_bytes / quota.total_bytes) * 100))
    : 0;

  const gifPercent = quota?.gif_limit
    ? Math.min(100, Math.round((quota.gif_count / quota.gif_limit) * 100))
    : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Storage & GIF Quota Meters Card */}
      <div className="rounded-3xl bg-surface-100/90 border border-white/10 p-6 shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Usage & Resource Quotas
              </h3>
              <p className="text-xs text-slate-400">
                Live capacity allocation for storage and concurrent GIF creations.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshQuota()}
            className="text-xs"
          >
            Refresh Meters
          </Button>
        </div>

        {quota ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Storage Meter */}
            <div className="p-4 rounded-2xl bg-surface-200/70 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  Cloud Storage Space
                </span>
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {formatBytes(quota.used_bytes)} / {formatBytes(quota.total_bytes)}
                </span>
              </div>
              <ProgressBar
                progress={storagePercent}
                color={storagePercent > 85 ? "rose" : storagePercent > 60 ? "amber" : "indigo"}
                showPercent={true}
              />
              <p className="text-[11px] text-slate-400">
                {formatBytes(Math.max(0, quota.total_bytes - quota.used_bytes))} remaining
              </p>
            </div>

            {/* GIF Counter Meter */}
            <div className="p-4 rounded-2xl bg-surface-200/70 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cyan-400" />
                  Active GIFs Stored
                </span>
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {quota.gif_count} / {quota.gif_limit} GIFs
                </span>
              </div>
              <ProgressBar
                progress={gifPercent}
                color={gifPercent > 85 ? "rose" : gifPercent > 60 ? "amber" : "cyan"}
                showPercent={true}
              />
              <p className="text-[11px] text-slate-400">
                {Math.max(0, quota.gif_limit - quota.gif_count)} GIF slots available
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Loading quota statistics...</p>
        )}
      </div>

      {/* Profile Details Form */}
      <div className="rounded-3xl bg-surface-100/90 border border-white/10 p-6 shadow-xl backdrop-blur-xl space-y-6">
        <div className="pb-3 border-b border-white/5">
          <h3 className="text-base font-bold text-white tracking-tight">Profile Information</h3>
          <p className="text-xs text-slate-400">Manage your display name, username, and public avatar.</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Username"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            <Input
              label="Full Name"
              value={profileForm.fullname}
              onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address (Verified)"
              value={user?.email || ""}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Email cannot be directly changed."
            />

            <Input
              label="Avatar Image URL (Optional)"
              placeholder="https://..."
              value={profileForm.avatar_url}
              onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Password Management */}
      <div className="rounded-3xl bg-surface-100/90 border border-white/10 p-6 shadow-xl backdrop-blur-xl space-y-6">
        <div className="pb-3 border-b border-white/5">
          <h3 className="text-base font-bold text-white tracking-tight">Security & Password</h3>
          <p className="text-xs text-slate-400">Update your account password to ensure maximum security.</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={passwordForm.current_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, current_password: e.target.value })
            }
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
              }
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="secondary"
              isLoading={isChangingPassword}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl bg-rose-500/5 border border-rose-500/20 p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-300 tracking-tight">Danger Zone</h3>
            <p className="text-xs text-slate-400">
              Permanently delete your account and all associated conversion records.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Password Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Confirmation"
        description="This action cannot be undone. All your uploaded clips, conversions, and shared links will be permanently deleted."
        maxWidth="md"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
          <Input
            label="Enter Account Password to Confirm"
            type="password"
            placeholder="••••••••"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isDeletingAccount}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirm Account Deletion
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
