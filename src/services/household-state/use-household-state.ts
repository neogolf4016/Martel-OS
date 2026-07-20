"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HouseholdSnapshot, SyncState } from "../../core/domain";
import { mergeSnapshot, seedData } from "../../core/seed";
import { getSupabaseBrowserClient, householdKey, isSupabaseConfigured } from "../supabase/browser";

const LOCAL_STORAGE_KEY = "martel-family-dashboard";

export function useHouseholdState() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? getSupabaseBrowserClient() : null;
  const [data, setData] = useState<HouseholdSnapshot>(seedData);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!configured || !supabase) {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!cancelled) {
          try {
            setData(saved ? mergeSnapshot(JSON.parse(saved)) : seedData);
          } catch {
            setData(seedData);
          }
          setSyncState("offline");
          setReady(true);
        }
        return;
      }
      const { data: row, error } = await supabase
        .from("app_state").select("data").eq("household_key", householdKey).maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadError("We couldn't securely load the family dashboard. Your saved information was not changed.");
        setSyncState("error");
        setReady(true);
        return;
      }
      if (row?.data) {
        setData(mergeSnapshot(row.data));
      } else {
        const { error: createError } = await supabase.from("app_state").upsert({
          household_key: householdKey,
          data: seedData,
          updated_at: new Date().toISOString()
        });
        if (createError) setSyncState("error");
      }
      setSyncState(current => current === "error" ? current : "synced");
      setReady(true);
    }
    void load();
    return () => { cancelled = true; };
  }, [configured, supabase]);

  useEffect(() => {
    if (!ready) return;
    if (!configured || !supabase) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
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
      const { error } = await supabase.from("app_state").upsert({
        household_key: householdKey,
        data: next,
        updated_at: new Date().toISOString()
      });
      setSyncState(error ? "error" : "synced");
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [configured, data, ready, supabase]);

  useEffect(() => {
    if (!configured || !supabase) return;
    const channel = supabase.channel(`app-state-${householdKey}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_state", filter: `household_key=eq.${householdKey}` },
      payload => {
        const row = payload.new as { data?: HouseholdSnapshot };
        if (row?.data) {
          skipNextSave.current = true;
          setData(mergeSnapshot(row.data));
          setSyncState("synced");
        }
      }
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [configured, supabase]);

  const updateData = useCallback((patch: Partial<HouseholdSnapshot>) => {
    setData(previous => ({ ...previous, ...patch }));
  }, []);

  return { configured, data, loadError, ready, setData, syncState, updateData };
}
