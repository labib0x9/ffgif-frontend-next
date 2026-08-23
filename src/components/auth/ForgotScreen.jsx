import { useState } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import Button from "../common/Button";
import Input, { Field } from "../common/Input";
import { AuthShell, Link } from "./AuthShell";

export function ForgotScreen({ goTo }) {
  const { push } = useToastsCtx();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (e2) {
      push(errMsg(e2, "could not send reset email"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<Link onClick={() => goTo("login")}>Back to sign in</Link>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Reset password
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>
        {sent ? "Check your inbox for a reset link." : "We'll send a reset link to your email."}
      </p>
      {sent ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#3DDC97",
            fontSize: 14,
            background: "#0F1B16",
            border: "1px solid #1F3A2D",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <Icon.Check size={16} /> Email sent to {email}
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotScreen;
