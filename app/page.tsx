"use client";

import { useEffect, useState } from "react";
import { AuthPanel } from "../src/modules/auth/AuthPanel";
import { isAllowedDashboardEmail } from "../src/core/access";
import { MartelOS } from "../src/shell/MartelOS";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../src/services/supabase/browser";

export default function Page() {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(isAllowedDashboardEmail(data.user?.email) ? data.user?.email || null : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(isAllowedDashboardEmail(session?.user?.email) ? session?.user?.email || null : null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [configured]);

  if (loading) {
    return <main className="loading-screen">Loading Martel Family Dashboard…</main>;
  }

  if (configured && !email) {
    return <AuthPanel />;
  }

  return <MartelOS initialUserEmail={email} />;
}
