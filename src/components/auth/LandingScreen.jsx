import Button from "../common/Button";
import Card from "../common/Card";
import { Icon } from "../../utils/icons";

function LoopHeroVisual() {
  const frames = 8;
  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div
        style={{
          position: "relative",
          height: 100,
          borderRadius: 14,
          overflow: "hidden",
          background: "#08090C",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 61, 94, 0.12)",
        }}
      >
        {Array.from({ length: frames }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRight: i < frames - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#282B36",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Icon.Film size={16} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255, 61, 94, 0.2)",
                animation: `ffgif-frame-sweep 2.4s linear infinite`,
                animationDelay: `${(i / frames) * 2.4}s`,
              }}
            />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "14%",
            width: "60%",
            border: "2px solid #FF3D5E",
            background: "rgba(255, 61, 94, 0.08)",
            boxShadow: "0 0 20px rgba(255, 61, 94, 0.4), inset 0 0 12px rgba(255, 61, 94, 0.15)",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
          color: "#9597A3",
          fontSize: 12.5,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <span style={{ color: "#FF3D5E", display: "flex", animation: "ffgif-glow-breathe 2s ease-in-out infinite" }}>
          <Icon.Loop size={14} />
        </span>
        looping the good 1.8 seconds, forever
      </div>
    </div>
  );
}

function HowItWorksCard({ icon, step, title, body }) {
  return (
    <Card style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(255, 61, 94, 0.18) 0%, rgba(255, 61, 94, 0.04) 100%)",
            border: "1px solid rgba(255, 61, 94, 0.3)",
            color: "#FF3D5E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 14px rgba(255, 61, 94, 0.2)",
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            color: "#FF5A78",
            fontWeight: 700,
            background: "rgba(255, 61, 94, 0.1)",
            padding: "2px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255, 61, 94, 0.2)",
          }}
        >
          {step}
        </span>
      </div>
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#F4F3EE", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: "#9597A3", lineHeight: 1.55 }}>
        {body}
      </div>
    </Card>
  );
}

export function LandingScreen({ goTo }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", position: "relative" }}>
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,61,94,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "15%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, rgba(255,61,94,0.2) 0%, rgba(255,61,94,0.05) 100%)",
                border: "1px solid rgba(255, 61, 94, 0.4)",
                color: "#FF3D5E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(255, 61, 94, 0.25)",
              }}
            >
              <Icon.Loop size={18} />
            </div>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 18, color: "#F4F3EE", letterSpacing: -0.3 }}>
              ffgif
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => goTo("login")}>
            Sign in
          </Button>
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 14px",
              borderRadius: 24,
              background: "rgba(255, 61, 94, 0.12)",
              border: "1px solid rgba(255, 61, 94, 0.35)",
              color: "#FF5A78",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 24,
              fontFamily: "JetBrains Mono, monospace",
              boxShadow: "0 0 20px rgba(255, 61, 94, 0.15)",
            }}
          >
            <Icon.Loop size={13} /> NOW LOOPING FOREVER
          </div>
          <h1
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(34px, 6.5vw, 56px)",
              color: "#F4F3EE",
              margin: "0 0 20px",
              lineHeight: 1.08,
              letterSpacing: -1.2,
            }}
          >
            Cut the boring parts.<br />
            Keep the{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FF3D5E 0%, #FF7E98 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 24px rgba(255,61,94,0.35))",
              }}
            >
              good loop
            </span>
            .
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 17.5px)",
              color: "#9597A3",
              maxWidth: 520,
              margin: "0 auto 34px",
              lineHeight: 1.6,
            }}
          >
            Drop any video, scrub to the perfect moment, and export buttery-smooth GIFs ready for team chats and social media.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" icon={<Icon.Loop size={17} />} onClick={() => goTo("signup")}>
              Start looping — it's free
            </Button>
            <Button size="lg" variant="secondary" onClick={() => goTo("login")}>
              I already have an account
            </Button>
          </div>
        </div>

        {/* Animated loop visual */}
        <LoopHeroVisual />

        {/* How it works */}
        <div style={{ marginTop: 80 }}>
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#5E616E",
              letterSpacing: 1.2,
              marginBottom: 32,
              textTransform: "uppercase",
            }}
          >
            Three steps. Instant results.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            <HowItWorksCard
              icon={<Icon.Upload size={20} />}
              step="01"
              title="Drop any video"
              body="MP4, MOV, WebM, whatever you have. Server-side transcoding handles the rest."
            />
            <HowItWorksCard
              icon={<Icon.Scissors size={20} />}
              step="02"
              title="Drag to trim"
              body="Grab dual precision handles, preview the loop live, and fine-tune your cut down to the frame."
            />
            <HowItWorksCard
              icon={<Icon.Loop size={20} />}
              step="03"
              title="Share & export"
              body="Export crystal-clear GIFs, share with teammates with expiration dates, or download instantly."
            />
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 72, fontSize: 13, color: "#4A4D59" }}>
          ffgif · high performance creative tools
        </div>
      </div>
    </div>
  );
}

export default LandingScreen;
