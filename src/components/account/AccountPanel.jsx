import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import PageHeader from "../common/PageHeader";
import Card from "../common/Card";
import Button from "../common/Button";
import Input, { Field } from "../common/Input";

function SectionTitle({ icon, children, danger }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: danger ? "rgba(255, 92, 92, 0.15)" : "rgba(255, 61, 94, 0.15)",
          color: danger ? "#FF5C5C" : "#FF3D5E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: danger ? "#FF5C5C" : "#F4F3EE",
          letterSpacing: -0.2,
        }}
      >
        {children}
      </span>
    </div>
  );
}

export function AccountPanel() {
  const { user, setUser, logout } = useAuth();
  const { push } = useToastsCtx();
  const [profile, setProfile] = useState({ username: user?.username || "", fullname: user?.fullname || "" });
  const [pwForm, setPwForm] = useState({ current_password: "", password: "", confirm_password: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({ username: user.username || "", fullname: user.fullname || "" });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(profile);
      setUser((u) => ({ ...u, ...res }));
      push("Profile updated.");
    } catch (e2) {
      push(errMsg(e2, "could not update profile"), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwError(null);
    if (pwForm.password !== pwForm.confirm_password) {
      setPwError("passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await api.changePassword(pwForm);
      push("Password changed.");
      setPwForm({ current_password: "", password: "", confirm_password: "" });
    } catch (e2) {
      setPwError(errMsg(e2, "could not change password"));
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    if (!deletePw) return;
    try {
      await api.deleteAccount(deletePw);
      push("Account deleted.");
      logout();
    } catch (e) {
      push(errMsg(e, "could not delete account"), "error");
    }
  };

  return (
    <div>
      <PageHeader title="Account" subtitle="Manage your profile, security, and credentials." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 580 }}>
        <Card style={{ padding: 24 }}>
          <SectionTitle icon={<Icon.User size={16} />}>Profile</SectionTitle>
          <form onSubmit={saveProfile}>
            <Field label="Full name">
              <Input value={profile.fullname} onChange={(e) => setProfile({ ...profile, fullname: e.target.value })} />
            </Field>
            <Field label="Username">
              <Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input value={user?.email || ""} disabled style={{ opacity: 0.55 }} />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </form>
        </Card>

        <Card style={{ padding: 24 }}>
          <SectionTitle icon={<Icon.Lock size={16} />}>Change password</SectionTitle>
          <form onSubmit={changePw}>
            <Field label="Current password">
              <Input
                type="password"
                required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                required
                value={pwForm.password}
                onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
              />
            </Field>
            <Field label="Confirm new password" error={pwError}>
              <Input
                type="password"
                required
                error={!!pwError}
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              />
            </Field>
            <Button type="submit" loading={savingPw}>
              Update password
            </Button>
          </form>
        </Card>

        <Card style={{ padding: 24, borderColor: "rgba(255, 92, 92, 0.25)" }}>
          <SectionTitle icon={<Icon.Alert size={16} />} danger>
            Danger zone
          </SectionTitle>
          <p style={{ fontSize: 13.5, color: "#9597A3", marginBottom: 18, lineHeight: 1.55 }}>
            Deleting your account permanently removes all your GIFs, uploads, and data. This action cannot be reversed.
          </p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </Card>
      </div>

      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 7, 10, 0.75)",
            backdropFilter: "blur(12px)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Card onClick={(e) => e.stopPropagation()} style={{ padding: 26, maxWidth: 400, width: "100%" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(255, 92, 92, 0.15)",
                  color: "#FF5C5C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon.Alert size={22} />
              </div>
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 17, fontWeight: 700, color: "#F4F3EE", marginBottom: 6 }}>
                  Delete your account?
                </div>
                <div style={{ fontSize: 13, color: "#9597A3", lineHeight: 1.5 }}>
                  This will permanently erase your profile and all GIFs.
                </div>
              </div>
            </div>
            <Field label="Confirm with your password">
              <Input
                type="password"
                autoFocus
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeletePw("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!deletePw}
                onClick={doDelete}
                style={{ background: "#FF5C5C", color: "#0B0C10", borderColor: "#FF5C5C" }}
              >
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AccountPanel;
