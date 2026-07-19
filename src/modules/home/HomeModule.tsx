import { CircleDollarSign, ShoppingCart, Snowflake, UtensilsCrossed } from "lucide-react";
import type { HouseholdSnapshot } from "../../core/domain";
import { currency } from "../../core/format";
import { DAYS } from "../../core/seed";
import { Empty, Section, Stat } from "../../shared/ui";

export function HomeModule({ data }: { data: HouseholdSnapshot }) {
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = data.budgetEntries.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0);
  const remaining = data.monthlyBudget - monthSpend;
  const activeGroceries = data.groceries.filter(item => !item.checked);
  const lowInventory = data.inventory.filter(item => item.quantity <= item.lowAt);

  return <>
    <div className="hero-card">
      <div><p className="eyebrow">THIS WEEK</p><h2>Meals, shopping and home inventory in one place.</h2>
        <p>{activeGroceries.length} items to buy · {lowInventory.length} inventory items running low</p></div>
      <div className="budget-ring"><span>{currency(Math.max(0, remaining))}</span><small>remaining</small></div>
    </div>
    <div className="stats-grid">
      <Stat icon={<UtensilsCrossed/>} label="Meals planned" value={String(Object.values(data.weeklyPlan).filter(Boolean).length)}/>
      <Stat icon={<ShoppingCart/>} label="Items to buy" value={String(activeGroceries.length)}/>
      <Stat icon={<Snowflake/>} label="Low inventory" value={String(lowInventory.length)}/>
      <Stat icon={<CircleDollarSign/>} label="Spent this month" value={currency(monthSpend)}/>
    </div>
    <Section title="Weekly dinner plan"><div className="week-grid">{DAYS.map(day => {
      const meal = data.meals.find(item => item.id === data.weeklyPlan[day]);
      return <div className="day-card" key={day}><span>{day.slice(0, 3)}</span><strong>{meal?.name || "Open night"}</strong></div>;
    })}</div></Section>
    <div className="two-col">
      <Section title="Running low">{lowInventory.length === 0 ? <Empty text="Everything is stocked."/> : lowInventory.map(item =>
        <div className="row" key={item.id}><div><strong>{item.name}</strong><small>{item.category}</small></div><span className="pill warning">{item.quantity} {item.unit}</span></div>)}</Section>
      <Section title="Next shopping trip">{activeGroceries.length === 0 ? <Empty text="Your list is complete."/> : activeGroceries.slice(0, 7).map(item =>
        <div className="row" key={item.id}><div><strong>{item.name}</strong><small>{item.store}</small></div><span className="pill">x{item.quantity}</span></div>)}</Section>
    </div>
  </>;
}
