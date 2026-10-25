/**
 * Main-thread wrapper around the background-removal worker. The worker (and
 * with it onnxruntime-web, its WASM binary and the model) is only created on
 * the first `init()` call, never at import time.
 */
import type { EngineEvent, WorkerRequest, WorkerResponse } from "./protocol";
import { MAX_OUTPUT_PIXELS } from "./rules";

export type { EngineEvent } from "./protocol";

export interface RemovalResult {
  png: Blob;
  width: number;
  height: number;
  resized: boolean;
}

/** True when the browser has everything the on-device engine needs. */
export function isEngineSupported(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    "Worker" in globalThis &&
    "WebAssembly" in globalThis &&
    "OffscreenCanvas" in globalThis &&
    "createImageBitmap" in globalThis
  );
}

const WORKER_FAILED = "The on-device engine couldn't start in this browser.";

export class BackgroundRemovalClient {
  private worker: Worker | null = null;
  private pending = new Map<
    string,
    { resolve: (r: RemovalResult) => void; reject: (e: Error) => void }
  >();
  private initPromise: Promise<void> | null = null;
  private initHandlers: { resolve: () => void; reject: (e: Error) => void } | null = null;
  private onEvent: ((e: EngineEvent) => void) | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      const worker = new Worker(new URL("./worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handle(e.data);
      worker.onerror = (e) => {
        e.preventDefault();
        this.fail(WORKER_FAILED);
      };
      this.worker = worker;
    }
    return this.worker;
  }

  private post(message: WorkerRequest) {
    this.getWorker().postMessage(message);
  }

  /** The worker script itself failed: reset everything so a retry starts clean. */
  private fail(message: string) {
    this.worker?.terminate();
    this.worker = null;
    this.onEvent?.({ type: "init-error", message });
    this.initHandlers?.reject(new Error(message));
    this.initHandlers = null;
    this.initPromise = null;
    for (const job of this.pending.values()) job.reject(new Error(message));
    this.pending.clear();
  }

  private handle(message: WorkerResponse) {
    switch (message.type) {
      case "model-progress":
      case "engine-starting":
        this.onEvent?.(message);
        break;
      case "ready":
        this.onEvent?.(message);
        this.initHandlers?.resolve();
        this.initHandlers = null;
        break;
      case "init-error":
        this.onEvent?.(message);
        this.initHandlers?.reject(new Error(message.message));
        this.initHandlers = null;
        this.initPromise = null;
        break;
      case "result": {
        const job = this.pending.get(message.id);
        this.pending.delete(message.id);
        job?.resolve({
          png: message.png,
          width: message.width,
          height: message.height,
          resized: message.resized,
        });
        break;
      }
      case "process-error": {
        const job = this.pending.get(message.id);
        this.pending.delete(message.id);
        job?.reject(new Error(message.message));
        break;
      }
    }
  }

  /** Download/verify the model and start the engine. Memoised until it fails. */
  init(onEvent: (e: EngineEvent) => void): Promise<void> {
    this.onEvent = onEvent;
    if (!this.initPromise) {
      this.initPromise = new Promise<void>((resolve, reject) => {
        this.initHandlers = { resolve, reject };
      });
      this.post({ type: "init" });
    }
    return this.initPromise;
  }

  process(id: string, file: Blob): Promise<RemovalResult> {
    return new Promise<RemovalResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.post({ type: "process", id, file, maxPixels: MAX_OUTPUT_PIXELS });
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.initHandlers?.reject(new Error("Engine stopped."));
    this.initHandlers = null;
    this.initPromise = null;
    for (const job of this.pending.values()) job.reject(new Error("Engine stopped."));
    this.pending.clear();
    this.onEvent = null;
  }
}
