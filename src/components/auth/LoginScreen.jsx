import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import { Icon } from "../../utils/icons";
import Button from "../common/Button";
import Input, { Field } from "../common/Input";
import { AuthShell, Link } from "./AuthShell";

export function LoginScreen({ goTo }) {
  const { login } = useAuth();
  const { push } = useToastsCtx();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await api.login(form);
      await login(res.token, res.id);
      push("Welcome back.");
    } catch (e2) {
      setErrors({ form: errMsg(e2, "could not sign in") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<>New here? <Link onClick={() => goTo("signup")}>Create an account</Link></>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Sign in
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>
        Cut, loop, ship. Pick up where you left off.
      </p>
      <form onSubmit={submit}>
        <Field label="Email">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        {errors.form && (
          <div style={{ color: "#FF5C5C", fontSize: 13, marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
            <Icon.Alert size={14} />
            {errors.form}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18, marginTop: -8 }}>
          <Link onClick={() => goTo("forgot")} small>
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginScreen;
