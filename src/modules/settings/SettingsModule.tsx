"use client";

import type { ChangeEvent } from "react";
import { Download, RefreshCcw, Upload } from "lucide-react";
import type { HouseholdSnapshot } from "../../core/domain";
import { mergeSnapshot, seedData } from "../../core/seed";
import { PageTitle, Section } from "../../shared/ui";

type Props = { configured: boolean; data: HouseholdSnapshot; email?: string | null; setData: (data: HouseholdSnapshot) => void };

export function SettingsModule({ configured, data, email, setData }: Props) {
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `martel-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setData(mergeSnapshot(JSON.parse(String(reader.result)))); }
      catch { window.alert("That file could not be imported."); }
      event.target.value = "";
    };
    reader.readAsText(file);
  }
  return <>
    <PageTitle title="Settings" subtitle="Connection details and backups."/>
    <Section title="Connection"><div className="row"><div><strong>{configured ? "Supabase shared sync enabled" : "Local device mode"}</strong>
      <small>{configured ? `Signed in as ${email || "household user"}` : "Add the three environment variables to enable shared syncing."}</small></div>
      <span className={`pill ${configured ? "" : "warning"}`}>{configured ? "Connected" : "Offline"}</span></div></Section>
    <Section title="Backups"><div className="settings-actions"><button className="secondary" onClick={exportData}><Download size={17}/> Export JSON</button>
      <label className="secondary"><Upload size={17}/> Import JSON<input hidden type="file" accept=".json,application/json" onChange={importData}/></label></div></Section>
    <Section title="Reset starter data"><button className="danger-button" onClick={() => { if (window.confirm("Reset the dashboard to the original Martel family starter data?")) setData(seedData); }}>
      <RefreshCcw size={17}/> Reset dashboard</button></Section>
  </>;
}
