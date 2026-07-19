"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { HouseholdSnapshot, InventoryItem } from "../../core/domain";
import { Empty, PageTitle, Section } from "../../shared/ui";

type Props = { data: HouseholdSnapshot; updateData: (patch: Partial<HouseholdSnapshot>) => void };
const CATEGORIES = ["Freezer", "Pantry", "Refrigerator", "Household"] as const;

export function InventoryModule({ data, updateData }: Props) {
  const [newInventory, setNewInventory] = useState("");
  function add() {
    const name = newInventory.trim();
    if (!name) return;
    updateData({ inventory: [...data.inventory, { id: crypto.randomUUID(), name, category: "Freezer", quantity: 1, unit: "item", lowAt: 1 }] });
    setNewInventory("");
  }
  function adjust(id: string, delta: number) {
    updateData({ inventory: data.inventory.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item) });
  }
  return <>
    <PageTitle title="Home Inventory" subtitle="Freezer, pantry, refrigerator, and household supplies."/>
    <div className="add-bar"><input aria-label="New inventory item" value={newInventory} onChange={e => setNewInventory(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add inventory item"/>
      <button className="primary" onClick={add}><Plus size={18}/> Add</button></div>
    {CATEGORIES.map(category => {
      const items: InventoryItem[] = data.inventory.filter(item => item.category === category);
      return <Section key={category} title={category}>{items.length === 0 ? <Empty text="No items yet."/> : items.map(item =>
        <div className="inventory-row" key={item.id}><div className="grow"><strong>{item.name}</strong><small>{item.quantity <= item.lowAt ? "Running low" : "Stocked"}</small></div>
          <div className="stepper"><button aria-label={`Decrease ${item.name}`} onClick={() => adjust(item.id, -1)}><Minus size={14}/></button><span>{item.quantity} {item.unit}</span>
            <button aria-label={`Increase ${item.name}`} onClick={() => adjust(item.id, 1)}><Plus size={14}/></button></div></div>)}</Section>;
    })}
  </>;
}
