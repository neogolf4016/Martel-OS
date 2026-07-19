"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "../../services/supabase/browser";

export function AuthPanel() {
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setMessage("");
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Account created. Check your email if confirmation is enabled.");
    else window.location.reload();
    setBusy(false);
  }
  return <main className="auth-shell"><section className="auth-card">
    <p className="eyebrow dark">MARTEL FAMILY</p><h1>Family Dashboard</h1><p className="muted">Sign in to share meals, shopping, inventory, and spending across devices.</p>
    <div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
      <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
    <input aria-label="Email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
    <input aria-label="Password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Password" value={password}
      onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && void submit()}/>
    <button className="primary wide" disabled={busy || !email || !password} onClick={() => void submit()}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
    {message && <p className="form-message" role="status">{message}</p>}
  </section></main>;
}
