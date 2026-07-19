"use client";

import { useState, type ReactNode } from "react";
import { CircleDollarSign, Home, LogOut, Save, ShoppingCart, Snowflake, UtensilsCrossed, Wifi, WifiOff } from "lucide-react";
import { FinanceModule } from "../modules/finance/FinanceModule";
import { GroceryModule } from "../modules/grocery/GroceryModule";
import { HomeModule } from "../modules/home/HomeModule";
import { InventoryModule } from "../modules/inventory/InventoryModule";
import { MealsModule } from "../modules/meals/MealsModule";
import type { ActiveModuleId } from "../modules/registry";
import { SettingsModule } from "../modules/settings/SettingsModule";
import { useHouseholdState } from "../services/household-state/use-household-state";
import { getSupabaseBrowserClient } from "../services/supabase/browser";

export function MartelOS({ initialUserEmail }: { initialUserEmail?: string | null }) {
  const { configured, data, ready, setData, syncState, updateData } = useHouseholdState();
  const [tab, setTab] = useState<ActiveModuleId>("home");
  async function signOut() {
    if (configured) await getSupabaseBrowserClient().auth.signOut();
    window.location.reload();
  }
  if (!ready) return <main className="loading-screen">Loading Martel Family Dashboard…</main>;
  return <main>
    <header className="topbar"><div><p className="eyebrow">MARTEL FAMILY</p><h1>Family Dashboard</h1></div>
      <div className="header-actions"><span className={`sync-badge ${syncState}`} role="status">
        {syncState === "synced" ? <Wifi size={15}/> : syncState === "offline" ? <WifiOff size={15}/> : <Save size={15}/>} {syncState}</span>
        {configured && <button className="icon-button" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><LogOut size={18}/></button>}</div></header>
    <section className="content">
      {tab === "home" && <HomeModule data={data}/>}
      {tab === "meals" && <MealsModule data={data} updateData={updateData}/>}
      {tab === "grocery" && <GroceryModule data={data} updateData={updateData}/>}
      {tab === "inventory" && <InventoryModule data={data} updateData={updateData}/>}
      {tab === "finance" && <FinanceModule data={data} updateData={updateData}/>}
      {tab === "settings" && <SettingsModule configured={configured} data={data} email={initialUserEmail} setData={setData}/>}
    </section>
    <nav className="bottom-nav" aria-label="Primary navigation">
      <Nav active={tab === "home"} onClick={() => setTab("home")} icon={<Home/>} label="Home"/>
      <Nav active={tab === "meals"} onClick={() => setTab("meals")} icon={<UtensilsCrossed/>} label="Meals"/>
      <Nav active={tab === "grocery"} onClick={() => setTab("grocery")} icon={<ShoppingCart/>} label="Shop"/>
      <Nav active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Snowflake/>} label="Inventory"/>
      <Nav active={tab === "finance"} onClick={() => setTab("finance")} icon={<CircleDollarSign/>} label="Budget"/>
      <Nav active={tab === "settings"} onClick={() => setTab("settings")} icon={<Save/>} label="Settings"/>
    </nav>
  </main>;
}

function Nav({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={onClick}>{icon}<span>{label}</span></button>;
}
