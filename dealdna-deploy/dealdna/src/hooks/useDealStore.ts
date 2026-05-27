"use client";
import { useCallback } from "react";
import type { DealProfile } from "@/lib/scoringEngine";

const KEY = "dealdna_current_deal";
const HIST = "dealdna_deal_history";

export interface StoredDeal {
  profile: DealProfile;
  timestamp: number;
  id: string;
}

export function saveDealToStore(profile: DealProfile): void {
  if (typeof window === "undefined") return;
  const stored: StoredDeal = {
    profile,
    timestamp: Date.now(),
    id: `deal_${Date.now()}`,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
    const hist: StoredDeal[] = getDealHistory();
    localStorage.setItem(
      HIST,
      JSON.stringify([stored, ...hist].slice(0, 10))
    );
  } catch {
    console.warn("[DealDNA] localStorage write failed");
  }
}

export function loadDealFromStore(): StoredDeal | null {
  if (typeof window === "undefined") return null;
  try {
    const r = localStorage.getItem(KEY);
    return r ? (JSON.parse(r) as StoredDeal) : null;
  } catch {
    return null;
  }
}

export function getDealHistory(): StoredDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const r = localStorage.getItem(HIST);
    return r ? (JSON.parse(r) as StoredDeal[]) : [];
  } catch {
    return [];
  }
}

export function useDealStore() {
  const save = useCallback((p: DealProfile) => saveDealToStore(p), []);
  const load = useCallback(() => loadDealFromStore(), []);
  return { save, load };
}
