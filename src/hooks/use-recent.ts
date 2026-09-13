import { useCallback, useEffect, useState } from "react";
import type { Platform } from "@/lib/media";

const STORAGE_KEY = "mediaflow-recent";
const MAX_ITEMS = 6;

export interface RecentItem {
  id: string;
  url: string;
  platform: Platform;
  label: string;
  at: number;
}

function read(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

/** Local-only history. Nothing here leaves the browser. */
export function useRecent() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const persist = useCallback((next: RecentItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — history is optional */
    }
  }, []);

  const add = useCallback(
    (item: Omit<RecentItem, "id" | "at">) => {
      const next = [
        { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() },
        ...read().filter((i) => i.url !== item.url),
      ].slice(0, MAX_ITEMS);
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => persist(read().filter((i) => i.id !== id)),
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, add, remove, clear };
}

export function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
