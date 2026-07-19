import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><h3>{title}</h3>{children}</section>;
}

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="page-title"><h2>{title}</h2><p>{subtitle}</p></div>;
}

export function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="stat-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

export function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}
