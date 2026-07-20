const ALLOWED_DASHBOARD_EMAILS = new Set([
  "allanmartel@hotmail.com",
  "stefaniemartel@hotmail.com"
]);

/** UX guard only. Supabase RLS remains the authoritative access boundary. */
export function isAllowedDashboardEmail(email?: string | null) {
  return Boolean(email && ALLOWED_DASHBOARD_EMAILS.has(email.trim().toLowerCase()));
}
