/**
 * Sorting for the admin dashboard tables and breakdown lists.
 *
 * Kept pure and dependency-free so it runs in the browser (the dashboard sorts
 * already-fetched server data without a round trip) and can be unit tested
 * without a database.
 *
 * Every comparator is total and stable: ties fall back to the original index so
 * re-sorting never shuffles equal rows, and missing values always sort last
 * regardless of direction, because "unknown" is not a meaningful extreme.
 */

export type SortDirection = "asc" | "desc";
export type BreakdownSortKey = "count" | "label";
export type FailureSortKey = "at" | "type" | "platform" | "quality" | "errorCode";

export interface SortableBreakdown {
  label: string;
  count: number;
}

export interface SortableFailure {
  at: Date | string;
  type: string;
  platform: string | null;
  quality: string | null;
  errorCode: string | null;
}

/** Coerces anything into a finite number so NaN/Infinity cannot break ordering. */
function finite(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Epoch milliseconds from a Date or serialized date string; 0 when unusable. */
export function timestampOf(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
}

function applyDirection(result: number, direction: SortDirection): number {
  return direction === "asc" ? result : -result;
}

/**
 * Orders a breakdown list by frequency or label.
 *
 * Returns a new array; the caller's server-provided data is never mutated.
 */
export function sortBreakdown<T extends SortableBreakdown>(
  rows: readonly T[],
  key: BreakdownSortKey,
  direction: SortDirection,
): T[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const primary =
        key === "count"
          ? finite(left.row.count) - finite(right.row.count)
          : compareText(String(left.row.label ?? ""), String(right.row.label ?? ""));

      if (primary !== 0) return applyDirection(primary, direction);
      return left.index - right.index;
    })
    .map((entry) => entry.row);
}

/**
 * Orders recent failures by any displayed column.
 *
 * Rows missing the sorted value keep their relative order at the end of the
 * list, so an unattributed failure never pretends to be the newest or oldest.
 */
export function sortFailures<T extends SortableFailure>(
  rows: readonly T[],
  key: FailureSortKey,
  direction: SortDirection,
): T[] {
  if (!Array.isArray(rows)) return [];

  const missing = (row: T): boolean => {
    if (key === "at") return timestampOf(row.at) === 0;
    const value = row[key as keyof T];
    return value === null || value === undefined || value === "";
  };

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftMissing = missing(left.row);
      const rightMissing = missing(right.row);
      if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
      if (leftMissing && rightMissing) return left.index - right.index;

      const primary =
        key === "at"
          ? timestampOf(left.row.at) - timestampOf(right.row.at)
          : compareText(String(left.row[key as keyof T] ?? ""), String(right.row[key as keyof T] ?? ""));

      if (primary !== 0) return applyDirection(primary, direction);
      return left.index - right.index;
    })
    .map((entry) => entry.row);
}

/** ARIA sort state for a sortable column header. */
export function ariaSortFor(
  isActive: boolean,
  direction: SortDirection,
): "ascending" | "descending" | "none" {
  if (!isActive) return "none";
  return direction === "asc" ? "ascending" : "descending";
}

/** Clicking the active column flips direction; a new column starts descending. */
export function nextSortState<K extends string>(
  current: { key: K; direction: SortDirection },
  requested: K,
): { key: K; direction: SortDirection } {
  if (current.key !== requested) return { key: requested, direction: "desc" };
  return { key: requested, direction: current.direction === "desc" ? "asc" : "desc" };
}
