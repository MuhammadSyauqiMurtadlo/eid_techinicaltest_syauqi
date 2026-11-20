import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, fieldErrors } from "../lib/api";
import { Alert, Field, Spinner, btn, inputCls } from "../components/ui";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");

    const local = {};
    if (!form.email.trim()) local.email = "Email wajib diisi.";
    else if (!emailRe.test(form.email))
      local.email = "Format email tidak valid.";
    if (!form.password) local.password = "Password wajib diisi.";
    setErrors(local);
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length)
        setFormError(errorMessage(err, "Login gagal."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
            S
          </span>
          <h1 className="text-xl font-semibold">
            Smart Manufacturing Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk untuk memantau produksi
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Alert>{formError}</Alert>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              autoComplete="username"
              className={inputCls}
              value={form.email}
              onChange={set("email")}
              placeholder="admin@example.com"
              autoFocus
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={form.password}
              onChange={set("password")}
            />
          </Field>

          <button
            type="submit"
            className={`${btn.primary} w-full`}
            disabled={loading}
          >
            {loading && <Spinner className="h-4 w-4" />}
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Akun demo: <b>admin@example.com</b> atau <b>operator@example.com</b> ·
          password: <b>password</b>
        </p>
      </div>
    </div>
  );
}
