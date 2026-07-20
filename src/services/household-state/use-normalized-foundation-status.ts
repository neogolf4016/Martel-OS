"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../supabase/browser";

export type NormalizedFoundationStatus = {
  state: "loading" | "ready" | "unavailable";
  householdName?: string;
  groceries?: number;
  inventory?: number;
  meals?: number;
};

export function useNormalizedFoundationStatus(enabled: boolean) {
  const [status, setStatus] = useState<NormalizedFoundationStatus>({
    state: enabled ? "loading" : "unavailable"
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const { data: household, error: householdError } = await supabase
        .from("households")
        .select("id,name")
        .maybeSingle();

      if (cancelled) return;
      if (householdError || !household) {
        setStatus({ state: "unavailable" });
        return;
      }

      const [groceries, inventory, meals] = await Promise.all([
        supabase.from("grocery_items").select("id", { count: "exact", head: true }).eq("household_id", household.id),
        supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("household_id", household.id),
        supabase.from("meals").select("id", { count: "exact", head: true }).eq("household_id", household.id)
      ]);

      if (cancelled) return;
      if (groceries.error || inventory.error || meals.error) {
        setStatus({ state: "unavailable" });
        return;
      }

      setStatus({
        state: "ready",
        householdName: household.name,
        groceries: groceries.count || 0,
        inventory: inventory.count || 0,
        meals: meals.count || 0
      });
    }

    void load();
    return () => { cancelled = true; };
  }, [enabled]);

  return status;
}
