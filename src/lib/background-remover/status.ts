/**
 * Engine status model and the strings derived from it. Pure (no React/DOM) so
 * the announcement rules are unit-testable.
 *
 * Two kinds of text exist on purpose:
 * - `engineAnnouncement` depends only on the phase. It feeds the polite live
 *   region, so screen readers hear each phase once instead of every progress tick.
 * - `engineProgressText` carries the live percentage and byte counts. It is
 *   shown visually and exposed on demand through the progress bar's value text.
 */

export type EnginePhase = "idle" | "downloading" | "starting" | "ready" | "error";

export interface EngineState {
  phase: EnginePhase;
  loaded: number;
  total: number;
  message?: string;
}

const DEFAULT_ERROR = "The AI model couldn't be loaded.";

function megabytes(bytes: number) {
  return (bytes / 1_000_000).toFixed(1);
}

/** Model download progress, 0–100. Starting/ready count as complete. */
export function engineProgressPercent(engine: EngineState): number {
  if (engine.phase === "starting" || engine.phase === "ready") return 100;
  return engine.total ? Math.min(100, Math.round((engine.loaded / engine.total) * 100)) : 0;
}

/** Detailed, frequently changing status text (visual + progress bar value text). */
export function engineProgressText(engine: EngineState): string {
  switch (engine.phase) {
    case "downloading":
      return `Downloading AI model… ${engineProgressPercent(engine)}% (${megabytes(engine.loaded)} of ${megabytes(engine.total)} MB)`;
    case "starting":
      return "Starting the on-device engine…";
    case "ready":
      return "AI model ready.";
    case "error":
      return engine.message ?? DEFAULT_ERROR;
    default:
      return "";
  }
}

/** Phase-only text for the live region. Never includes progress numbers. */
export function engineAnnouncement(engine: EngineState): string {
  switch (engine.phase) {
    case "downloading":
      return "Downloading AI model…";
    case "starting":
      return "Starting the on-device engine…";
    case "ready":
      return "AI model ready.";
    case "error":
      return engine.message ?? DEFAULT_ERROR;
    default:
      return "";
  }
}
