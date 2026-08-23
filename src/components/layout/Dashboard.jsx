import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import Sidebar from "./Sidebar";
import QuotaBar from "./QuotaBar";
import ConverterPanel from "../converter/ConverterPanel";
import GifsPanel from "../gifs/GifsPanel";
import SharedGifsPanel from "../shared-gifs/SharedGifsPanel";
import AccountPanel from "../account/AccountPanel";

export function Dashboard() {
  const { logout } = useAuth();
  const { push } = useToastsCtx();
  const [active, setActive] = useState("convert");
  const [quota, setQuota] = useState(null);

  const refreshQuota = useCallback(async () => {
    try {
      const q = await api.getQuota();
      setQuota(q);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  const doLogout = async () => {
    try {
      await api.logout();
    } finally {
      logout();
      push("Signed out.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glow meshes */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "10%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,61,94,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "20%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Sidebar active={active} setActive={setActive} onLogout={doLogout} />
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ marginBottom: 22 }}>
            <QuotaBar quota={quota} />
          </div>
          {active === "convert" && <ConverterPanel refreshQuota={refreshQuota} />}
          {active === "gifs" && <GifsPanel onNavigateShared={() => setActive("shared")} />}
          {active === "shared" && <SharedGifsPanel onNavigateGifs={() => setActive("gifs")} />}
          {active === "account" && <AccountPanel />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
