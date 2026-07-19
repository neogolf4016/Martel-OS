"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, ChevronDown, ChevronUp, CircleDollarSign, Download, Home, LogOut,
  Minus, Plus, RefreshCcw, Save, ShoppingCart, Snowflake, Upload,
  UtensilsCrossed, Wifi, WifiOff
} from "lucide-react";
import { createSupabaseBrowserClient, householdKey, isSupabaseConfigured } from "../lib/supabase";
import { AppData, GroceryItem, InventoryItem } from "../lib/types";
import { DAYS, seedData } from "../lib/seed";

type Props = {
  initialUserEmail?: string | null;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function mergeData(value: unknown): AppData {
  const candidate = value as Partial<AppData> | null;
  return {
    ...seedData,
    ...(candidate || {}),
    meals: candidate?.meals || seedData.meals,
    weeklyPlan: candidate?.weeklyPlan || seedData.weeklyPlan,
    groceries: candidate?.groceries || seedData.groceries,
    inventory: candidate?.inventory || seedData.inventory,
    budgetEntries: candidate?.budgetEntries || seedData.budgetEntries
  };
}

export default function Dashboard({ initialUserEmail }: Props) {
  const configured = isSupabaseConfigured();
  const supabase = configured ? createSupabaseBrowserClient() : null;
  const [data, setData] = useState<AppData>(seedData);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [newGrocery, setNewGrocery] = useState("");
  const [newInventory, setNewInventory] = useState("");
  const [budgetForm, setBudgetForm] = useState({
    store: "Walmart",
    amount: "",
    category: "Groceries" as "Groceries" | "Household"
  });
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"loading" | "synced" | "saving" | "offline" | "error">("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    async function load() {
      if (!configured || !supabase) {
        const saved = localStorage.getItem("martel-family-dashboard");
        setData(saved ? mergeData(JSON.parse(saved)) : seedData);
        setSyncState("offline");
        setReady(true);
        return;
      }

      const { data: row, error } = await supabase
        .from("app_state")
        .select("data")
        .eq("household_key", householdKey)
        .maybeSingle();

      if (error) {
        setSyncState("error");
        setReady(true);
        return;
      }

      if (row?.data) {
        setData(mergeData(row.data));
      } else {
        await supabase
          .from("app_state")
          .upsert({
            household_key: householdKey,
            data: seedData,
            updated_at: new Date().toISOString()
          });
        setData(seedData);
      }

      setSyncState("synced");
      setReady(true);
    }

    load();
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!configured || !supabase) {
      localStorage.setItem("martel-family-dashboard", JSON.stringify(data));
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncState("saving");

    saveTimer.current = setTimeout(async () => {
      const next = { ...data, updatedAt: new Date().toISOString() };
      const { error } = await supabase
        .from("app_state")
        .upsert({
          household_key: householdKey,
          data: next,
          updated_at: new Date().toISOString()
        });

      setSyncState(error ? "error" : "synced");
    }, 600);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready]);

  useEffect(() => {
    if (!configured || !supabase) return;

    const channel = supabase
      .channel(`app-state-${householdKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_state",
          filter: `household_key=eq.${householdKey}`
        },
        payload => {
          const row = payload.new as { data?: AppData };
          if (row?.data) {
            skipNextSave.current = true;
            setData(mergeData(row.data));
            setSyncState("synced");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = useMemo(
    () => data.budgetEntries
      .filter(e => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0),
    [data.budgetEntries, monthKey]
  );

  const remaining = data.monthlyBudget - monthSpend;
  const activeGroceries = data.groceries.filter(g => !g.checked);
  const lowInventory = data.inventory.filter(i => i.quantity <= i.lowAt);

  function updateData(patch: Partial<AppData>) {
    setData(prev => ({ ...prev, ...patch }));
  }

  function toggleGrocery(id: string) {
    updateData({
      groceries: data.groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g)
    });
  }

  function adjustGrocery(id: string, delta: number) {
    updateData({
      groceries: data.groceries.map(g =>
        g.id === id ? { ...g, quantity: Math.max(1, g.quantity + delta) } : g
      )
    });
  }

  function addGrocery() {
    const name = newGrocery.trim();
    if (!name) return;

    const item: GroceryItem = {
      id: crypto.randomUUID(),
      name,
      category: "Other",
      store: "Either",
      quantity: 1,
      checked: false,
      staple: false
    };

    updateData({ groceries: [...data.groceries, item] });
    setNewGrocery("");
  }

  function addInventory() {
    const name = newInventory.trim();
    if (!name) return;

    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name,
      category: "Freezer",
      quantity: 1,
      unit: "item",
      lowAt: 1
    };

    updateData({ inventory: [...data.inventory, item] });
    setNewInventory("");
  }

  function adjustInventory(id: string, delta: number) {
    updateData({
      inventory: data.inventory.map(i =>
        i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
      )
    });
  }

  function addBudgetEntry() {
    const amount = Number(budgetForm.amount);
    if (!amount || amount <= 0) return;

    updateData({
      budgetEntries: [
        ...data.budgetEntries,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          store: budgetForm.store,
          amount,
          category: budgetForm.category
        }
      ]
    });

    setBudgetForm({ ...budgetForm, amount: "" });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `martel-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(mergeData(JSON.parse(String(reader.result))));
      } catch {
        alert("That file could not be imported.");
      }
    };
    reader.readAsText(file);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  }

  if (!ready) {
    return <main className="loading-screen">Loading Martel Family Dashboard…</main>;
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">MARTEL FAMILY</p>
          <h1>Family Dashboard</h1>
        </div>

        <div className="header-actions">
          <span className={`sync-badge ${syncState}`}>
            {syncState === "synced" ? <Wifi size={15}/> : syncState === "offline" ? <WifiOff size={15}/> : <Save size={15}/>}
            {syncState}
          </span>
          <button className="icon-button" onClick={exportData} title="Export dashboard"><Download size={18}/></button>
          <label className="icon-button" title="Import dashboard">
            <Upload size={18}/>
            <input hidden type="file" accept=".json" onChange={importData}/>
          </label>
          {configured && (
            <button className="icon-button" onClick={signOut} title="Sign out"><LogOut size={18}/></button>
          )}
        </div>
      </header>

      <section className="content">
        {tab === "home" && (
          <>
            <div className="hero-card">
              <div>
                <p className="eyebrow">THIS WEEK</p>
                <h2>Meals, shopping and home inventory in one place.</h2>
                <p>
                  {activeGroceries.length} items to buy · {lowInventory.length} inventory items running low
                </p>
              </div>
              <div className="budget-ring">
                <span>{currency(Math.max(0, remaining))}</span>
                <small>remaining</small>
              </div>
            </div>

            <div className="stats-grid">
              <Stat icon={<UtensilsCrossed/>} label="Meals planned" value="7" />
              <Stat icon={<ShoppingCart/>} label="Items to buy" value={String(activeGroceries.length)} />
              <Stat icon={<Snowflake/>} label="Low inventory" value={String(lowInventory.length)} />
              <Stat icon={<CircleDollarSign/>} label="Spent this month" value={currency(monthSpend)} />
            </div>

            <Section title="Weekly dinner plan">
              <div className="week-grid">
                {DAYS.map(day => {
                  const meal = data.meals.find(m => m.id === data.weeklyPlan[day]);
                  return (
                    <div className="day-card" key={day}>
                      <span>{day.slice(0, 3)}</span>
                      <strong>{meal?.name || "Open night"}</strong>
                    </div>
                  );
                })}
              </div>
            </Section>

            <div className="two-col">
              <Section title="Running low">
                {lowInventory.length === 0
                  ? <Empty text="Everything is stocked."/>
                  : lowInventory.map(item => (
                      <div className="row" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.category}</small>
                        </div>
                        <span className="pill warning">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
              </Section>

              <Section title="Next shopping trip">
                {activeGroceries.slice(0, 7).map(item => (
                  <div className="row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.store}</small>
                    </div>
                    <span className="pill">x{item.quantity}</span>
                  </div>
                ))}
              </Section>
            </div>
          </>
        )}

        {tab === "meals" && (
          <>
            <PageTitle title="Meal Planner" subtitle="Your core family dinner rotation."/>
            <Section title="This week's plan">
              <div className="planner">
                {DAYS.map(day => (
                  <label className="planner-row" key={day}>
                    <span>{day}</span>
                    <select
                      value={data.weeklyPlan[day] || ""}
                      onChange={e =>
                        updateData({ weeklyPlan: { ...data.weeklyPlan, [day]: e.target.value } })
                      }
                    >
                      <option value="">Open night</option>
                      {data.meals.map(meal => (
                        <option key={meal.id} value={meal.id}>{meal.name}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </Section>

            <Section title="Core meals">
              <div className="meal-grid">
                {data.meals.map(meal => (
                  <article className="meal-card" key={meal.id}>
                    <button
                      className="meal-heading"
                      onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                    >
                      <div>
                        <strong>{meal.name}</strong>
                        <small>{meal.protein}</small>
                      </div>
                      {expandedMeal === meal.id ? <ChevronUp/> : <ChevronDown/>}
                    </button>

                    {expandedMeal === meal.id && (
                      <div className="meal-body">
                        <p><b>Sides:</b> {meal.sides.join(", ")}</p>
                        {meal.notes && <p>{meal.notes}</p>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === "groceries" && (
          <>
            <PageTitle title="Grocery List" subtitle="Shared live between phones when Supabase is connected."/>
            <div className="add-bar">
              <input
                value={newGrocery}
                onChange={e => setNewGrocery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addGrocery()}
                placeholder="Add an item"
              />
              <button className="primary" onClick={addGrocery}><Plus size={18}/> Add</button>
            </div>

            {["Walmart", "Sam's Club", "Amazon", "Target", "Either"].map(store => {
              const items = data.groceries.filter(g => g.store === store);
              if (!items.length) return null;

              return (
                <Section key={store} title={store}>
                  {items.map(item => (
                    <div className={`grocery-row ${item.checked ? "done" : ""}`} key={item.id}>
                      <button className="check-button" onClick={() => toggleGrocery(item.id)}>
                        {item.checked ? <Check size={16}/> : null}
                      </button>
                      <div className="grow">
                        <strong>{item.name}</strong>
                        <small>{item.category}{item.staple ? " · staple" : ""}</small>
                      </div>
                      <div className="stepper">
                        <button onClick={() => adjustGrocery(item.id, -1)}><Minus size={14}/></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => adjustGrocery(item.id, 1)}><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </Section>
              );
            })}
          </>
        )}

        {tab === "inventory" && (
          <>
            <PageTitle title="Home Inventory" subtitle="Freezer, pantry, refrigerator, and household supplies."/>
            <div className="add-bar">
              <input
                value={newInventory}
                onChange={e => setNewInventory(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addInventory()}
                placeholder="Add inventory item"
              />
              <button className="primary" onClick={addInventory}><Plus size={18}/> Add</button>
            </div>

            {(["Freezer", "Pantry", "Refrigerator", "Household"] as const).map(category => (
              <Section key={category} title={category}>
                {data.inventory.filter(i => i.category === category).length === 0
                  ? <Empty text="No items yet."/>
                  : data.inventory.filter(i => i.category === category).map(item => (
                      <div className="inventory-row" key={item.id}>
                        <div className="grow">
                          <strong>{item.name}</strong>
                          <small>{item.quantity <= item.lowAt ? "Running low" : "Stocked"}</small>
                        </div>
                        <div className="stepper">
                          <button onClick={() => adjustInventory(item.id, -1)}><Minus size={14}/></button>
                          <span>{item.quantity} {item.unit}</span>
                          <button onClick={() => adjustInventory(item.id, 1)}><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
              </Section>
            ))}
          </>
        )}

        {tab === "budget" && (
          <>
            <PageTitle title="Food & Household Budget" subtitle="Track purchases by store and category."/>
            <div className="budget-summary">
              <label>
                Monthly budget
                <input
                  type="number"
                  value={data.monthlyBudget}
                  onChange={e => updateData({ monthlyBudget: Number(e.target.value) || 0 })}
                />
              </label>
              <div>
                <small>Spent this month</small>
                <strong>{currency(monthSpend)}</strong>
              </div>
              <div>
                <small>Remaining</small>
                <strong className={remaining < 0 ? "negative" : ""}>{currency(remaining)}</strong>
              </div>
            </div>

            <Section title="Add purchase">
              <div className="budget-form">
                <select
                  value={budgetForm.store}
                  onChange={e => setBudgetForm({ ...budgetForm, store: e.target.value })}
                >
                  <option>Walmart</option>
                  <option>Sam's Club</option>
                  <option>Amazon</option>
                  <option>Target</option>
                  <option>Other</option>
                </select>
                <select
                  value={budgetForm.category}
                  onChange={e =>
                    setBudgetForm({
                      ...budgetForm,
                      category: e.target.value as "Groceries" | "Household"
                    })
                  }
                >
                  <option>Groceries</option>
                  <option>Household</option>
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={budgetForm.amount}
                  onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                />
                <button className="primary" onClick={addBudgetEntry}>Add purchase</button>
              </div>
            </Section>

            <Section title="Recent purchases">
              {data.budgetEntries.length === 0
                ? <Empty text="No purchases entered yet."/>
                : [...data.budgetEntries].reverse().map(entry => (
                    <div className="row" key={entry.id}>
                      <div>
                        <strong>{entry.store}</strong>
                        <small>{entry.date} · {entry.category}</small>
                      </div>
                      <strong>{currency(entry.amount)}</strong>
                    </div>
                  ))}
            </Section>
          </>
        )}

        {tab === "settings" && (
          <>
            <PageTitle title="Settings" subtitle="Connection details and backups."/>
            <Section title="Connection">
              <div className="row">
                <div>
                  <strong>{configured ? "Supabase shared sync enabled" : "Local device mode"}</strong>
                  <small>
                    {configured
                      ? `Signed in as ${initialUserEmail || "household user"}`
                      : "Add the three environment variables to enable shared syncing."}
                  </small>
                </div>
                <span className={`pill ${configured ? "" : "warning"}`}>
                  {configured ? "Connected" : "Offline"}
                </span>
              </div>
            </Section>

            <Section title="Backups">
              <div className="settings-actions">
                <button className="secondary" onClick={exportData}><Download size={17}/> Export JSON</button>
                <label className="secondary">
                  <Upload size={17}/> Import JSON
                  <input hidden type="file" accept=".json" onChange={importData}/>
                </label>
              </div>
            </Section>

            <Section title="Reset starter data">
              <button
                className="danger-button"
                onClick={() => {
                  if (confirm("Reset the dashboard to the original Martel family starter data?")) {
                    setData(seedData);
                  }
                }}
              >
                <RefreshCcw size={17}/> Reset dashboard
              </button>
            </Section>
          </>
        )}
      </section>

      <nav className="bottom-nav">
        <NavButton active={tab === "home"} onClick={() => setTab("home")} icon={<Home/>} label="Home"/>
        <NavButton active={tab === "meals"} onClick={() => setTab("meals")} icon={<UtensilsCrossed/>} label="Meals"/>
        <NavButton active={tab === "groceries"} onClick={() => setTab("groceries")} icon={<ShoppingCart/>} label="Shop"/>
        <NavButton active={tab === "inventory"} onClick={() => setTab("inventory")} icon={<Snowflake/>} label="Inventory"/>
        <NavButton active={tab === "budget"} onClick={() => setTab("budget")} icon={<CircleDollarSign/>} label="Budget"/>
        <NavButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Save/>} label="Settings"/>
      </nav>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h3>{title}</h3>{children}</section>;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="page-title"><h2>{title}</h2><p>{subtitle}</p></div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}

function NavButton({
  active, onClick, icon, label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  );
}
