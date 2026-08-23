import { useState } from "react";
import { useToastsCtx } from "../../context/useToasts";
import { api } from "../../api/client";
import { errMsg } from "../../utils/formatters";
import Button from "../common/Button";
import Input, { Field } from "../common/Input";
import { AuthShell, Link } from "./AuthShell";

export function SignupScreen({ goTo }) {
  const { push } = useToastsCtx();
  const [form, setForm] = useState({ username: "", fullname: "", email: "", password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: "passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      await api.signup(form);
      push("Account created. Check your email to verify.");
      goTo("login");
    } catch (e2) {
      setErrors({ form: errMsg(e2, "could not create account") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell goTo={goTo} footer={<>Already have an account? <Link onClick={() => goTo("login")}>Sign in</Link></>}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#F3F1EC" }}>
        Create account
      </h1>
      <p style={{ fontSize: 13.5, color: "#9A9CA5", margin: "0 0 24px" }}>
        Start turning clips into loops.
      </p>
      <form onSubmit={submit}>
        <Field label="Full name">
          <Input
            required
            value={form.fullname}
            onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            placeholder="Labib Al Faisal"
          />
        </Field>
        <Field label="Username">
          <Input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="labib0x9"
          />
        </Field>
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
        <Field label="Confirm password" error={errors.confirm_password}>
          <Input
            type="password"
            required
            error={!!errors.confirm_password}
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        {errors.form && <div style={{ color: "#FF5C5C", fontSize: 13, marginBottom: 14 }}>{errors.form}</div>}
        <Button type="submit" size="lg" loading={loading} style={{ width: "100%" }}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export default SignupScreen;
