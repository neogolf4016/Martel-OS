"use client";

import { useState } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import type { GroceryItem, HouseholdSnapshot } from "../../core/domain";
import { PageTitle, Section } from "../../shared/ui";

type Props = { data: HouseholdSnapshot; updateData: (patch: Partial<HouseholdSnapshot>) => void };
const STORES = ["Walmart", "Sam's Club", "Amazon", "Target", "Either"] as const;

export function GroceryModule({ data, updateData }: Props) {
  const [newGrocery, setNewGrocery] = useState("");
  const [removed, setRemoved] = useState<{ item: GroceryItem; index: number } | null>(null);
  function change(id: string, transform: (item: GroceryItem) => GroceryItem) {
    updateData({ groceries: data.groceries.map(item => item.id === id ? transform(item) : item) });
  }
  function add() {
    const name = newGrocery.trim();
    if (!name) return;
    updateData({ groceries: [...data.groceries, { id: crypto.randomUUID(), name, category: "Other", store: "Either", quantity: 1, checked: false, staple: false }] });
    setNewGrocery("");
  }
  function remove(id: string) {
    const index = data.groceries.findIndex(item => item.id === id);
    if (index < 0) return;
    setRemoved({ item: data.groceries[index], index });
    updateData({ groceries: data.groceries.filter(item => item.id !== id) });
  }
  function undoRemove() {
    if (!removed || data.groceries.some(item => item.id === removed.item.id)) return;
    const groceries = [...data.groceries];
    groceries.splice(Math.min(removed.index, groceries.length), 0, removed.item);
    updateData({ groceries });
    setRemoved(null);
  }
  return <>
    <PageTitle title="Grocery List" subtitle="Shared live between phones when Supabase is connected."/>
    <div className="add-bar"><input aria-label="New grocery item" value={newGrocery} onChange={e => setNewGrocery(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add an item"/>
      <button className="primary" onClick={add}><Plus size={18}/> Add</button></div>
    {removed && <div className="undo-bar" role="alert"><span>Removed <strong>{removed.item.name}</strong>.</span>
      <button className="secondary" onClick={undoRemove}>Undo</button></div>}
    {STORES.map(store => {
      const items = data.groceries.filter(item => item.store === store);
      if (!items.length) return null;
      return <Section key={store} title={store}>{items.map(item =>
        <div className={`grocery-row ${item.checked ? "done" : ""}`} key={item.id}>
          <button aria-label={`${item.checked ? "Uncheck" : "Check"} ${item.name}`} className="check-button" onClick={() => change(item.id, current => ({ ...current, checked: !current.checked }))}>{item.checked ? <Check size={16}/> : null}</button>
          <div className="grow"><strong>{item.name}</strong><small>{item.category}{item.staple ? " · staple" : ""}</small></div>
          <div className="stepper"><button aria-label={`Decrease ${item.name}`} onClick={() => change(item.id, current => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))}><Minus size={14}/></button>
            <span>{item.quantity}</span><button aria-label={`Increase ${item.name}`} onClick={() => change(item.id, current => ({ ...current, quantity: current.quantity + 1 }))}><Plus size={14}/></button></div>
          <button className="remove-button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={16}/></button>
        </div>)}</Section>;
    })}
  </>;
}
