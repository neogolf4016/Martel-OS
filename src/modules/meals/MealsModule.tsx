"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { HouseholdSnapshot } from "../../core/domain";
import { DAYS } from "../../core/seed";
import { PageTitle, Section } from "../../shared/ui";

type Props = { data: HouseholdSnapshot; updateData: (patch: Partial<HouseholdSnapshot>) => void };

export function MealsModule({ data, updateData }: Props) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  return <>
    <PageTitle title="Meal Planner" subtitle="Your core family dinner rotation."/>
    <Section title="This week's plan"><div className="planner">{DAYS.map(day =>
      <label className="planner-row" key={day}><span>{day}</span><select value={data.weeklyPlan[day] || ""}
        onChange={event => updateData({ weeklyPlan: { ...data.weeklyPlan, [day]: event.target.value } })}>
        <option value="">Open night</option>{data.meals.map(meal => <option key={meal.id} value={meal.id}>{meal.name}</option>)}</select></label>)}</div></Section>
    <Section title="Core meals"><div className="meal-grid">{data.meals.map(meal =>
      <article className="meal-card" key={meal.id}>
        <button className="meal-heading" onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}>
          <div><strong>{meal.name}</strong><small>{meal.protein}</small></div>{expandedMeal === meal.id ? <ChevronUp/> : <ChevronDown/>}</button>
        {expandedMeal === meal.id && <div className="meal-body"><p><b>Sides:</b> {meal.sides.join(", ")}</p>{meal.notes && <p>{meal.notes}</p>}</div>}
      </article>)}</div></Section>
  </>;
}
