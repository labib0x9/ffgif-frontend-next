import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ToastProvider } from "./context/ToastContext";
import { useToasts } from "./context/useToasts";
import Toast from "./components/common/Toast";
import { Icon } from "./utils/icons";
import LandingScreen from "./components/auth/LandingScreen";
import LoginScreen from "./components/auth/LoginScreen";
import SignupScreen from "./components/auth/SignupScreen";
import ForgotScreen from "./components/auth/ForgotScreen";
import Dashboard from "./components/layout/Dashboard";

function AppInner() {
  const { token, restoring } = useAuth();
  const [authScreen, setAuthScreen] = useState("landing");
  const { toasts, push, dismiss } = useToasts();

  // Surface the reason for a forced logout (session expired / invalid credentials)
  useEffect(() => {
    const onExpired = () => {
      setAuthScreen("login");
      push("Your session expired — please sign in again.", "error");
    };
    window.addEventListener("ffgif:session-expired-toast", onExpired);
    return () => window.removeEventListener("ffgif:session-expired-toast", onExpired);
  }, [push]);

  if (restoring) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
        <div style={{ color: "#FF3D5E", animation: "ffgif-loop-spin 1.4s linear infinite" }}>
          <Icon.Loop size={30} />
        </div>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "#5C5E68", letterSpacing: -0.2 }}>
          ffgif
        </span>
      </div>
    );
  }

  return (
    <ToastProvider value={{ push }}>
      {token ? (
        <Dashboard />
      ) : authScreen === "signup" ? (
        <SignupScreen goTo={setAuthScreen} />
      ) : authScreen === "forgot" ? (
        <ForgotScreen goTo={setAuthScreen} />
      ) : authScreen === "login" ? (
        <LoginScreen goTo={setAuthScreen} />
      ) : (
        <LandingScreen goTo={setAuthScreen} />
      )}
      <Toast toasts={toasts} dismiss={dismiss} />
    </ToastProvider>
  );
}

export default function App() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0E0F12",
        color: "#F3F1EC",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </div>
  );
}