"use client";

import { useState } from "react";
import { isAllowedDashboardEmail } from "../../core/access";
import { getSupabaseBrowserClient } from "../../services/supabase/browser";

export function AuthPanel() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!isAllowedDashboardEmail(email)) {
      setMessage("This private dashboard is limited to the Martel household accounts.");
      return;
    }
    setBusy(true); setMessage("");
    const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (result.error) setMessage(result.error.message);
    else window.location.reload();
    setBusy(false);
  }
  return <main className="auth-shell"><section className="auth-card">
    <p className="eyebrow dark">MARTEL FAMILY</p><h1>Family Dashboard</h1><p className="muted">Private access for Allan and Stefanie.</p>
    <input aria-label="Email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
    <input aria-label="Password" type="password" autoComplete="current-password" placeholder="Password" value={password}
      onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && void submit()}/>
    <button className="primary wide" disabled={busy || !email || !password} onClick={() => void submit()}>{busy ? "Working…" : "Sign in"}</button>
    {message && <p className="form-message" role="status">{message}</p>}
  </section></main>;
}
