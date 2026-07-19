"use client";

import { useMemo, useState } from "react";
import type { BudgetEntry, HouseholdSnapshot } from "../../core/domain";
import { currency } from "../../core/format";
import { Empty, PageTitle, Section } from "../../shared/ui";

type Props = { data: HouseholdSnapshot; updateData: (patch: Partial<HouseholdSnapshot>) => void };

export function FinanceModule({ data, updateData }: Props) {
  const [form, setForm] = useState({ store: "Walmart", amount: "", category: "Groceries" as BudgetEntry["category"] });
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = useMemo(() => data.budgetEntries.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0), [data.budgetEntries, monthKey]);
  const remaining = data.monthlyBudget - monthSpend;
  function add() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    updateData({ budgetEntries: [...data.budgetEntries, { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), store: form.store, amount, category: form.category }] });
    setForm(current => ({ ...current, amount: "" }));
  }
  return <>
    <PageTitle title="Food & Household Budget" subtitle="Track purchases by store and category."/>
    <div className="budget-summary"><label>Monthly budget<input aria-label="Monthly budget" type="number" min="0" value={data.monthlyBudget} onChange={e => updateData({ monthlyBudget: Number(e.target.value) || 0 })}/></label>
      <div><small>Spent this month</small><strong>{currency(monthSpend)}</strong></div><div><small>Remaining</small><strong className={remaining < 0 ? "negative" : ""}>{currency(remaining)}</strong></div></div>
    <Section title="Add purchase"><div className="budget-form">
      <select aria-label="Store" value={form.store} onChange={e => setForm({ ...form, store: e.target.value })}><option>Walmart</option><option>Sam's Club</option><option>Amazon</option><option>Target</option><option>Other</option></select>
      <select aria-label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as BudgetEntry["category"] })}><option>Groceries</option><option>Household</option></select>
      <input aria-label="Purchase amount" type="number" min="0" inputMode="decimal" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}/>
      <button className="primary" onClick={add}>Add purchase</button></div></Section>
    <Section title="Recent purchases">{data.budgetEntries.length === 0 ? <Empty text="No purchases entered yet."/> : [...data.budgetEntries].reverse().map(entry =>
      <div className="row" key={entry.id}><div><strong>{entry.store}</strong><small>{entry.date} · {entry.category}</small></div><strong>{currency(entry.amount)}</strong></div>)}</Section>
  </>;
}
