/**
 * Background-removal Web Worker. Downloads (or reads from Cache Storage) the
 * pinned segmentation model, verifies its integrity, runs inference with
 * onnxruntime-web on the WASM backend and composites a transparent PNG.
 * Images never leave this worker except as the finished PNG posted back.
 */
import * as ort from "onnxruntime-web/wasm";
import { MODEL, MODEL_CACHE_NAME, ORT_WASM_BASE } from "./protocol";
import type { WorkerRequest, WorkerResponse } from "./protocol";
import { fitWithinPixelBudget } from "./rules";
import { MODEL_INPUT_SIZE, maskToRgba, maskToUint8, toModelInput } from "./tensor";

ort.env.wasm.wasmPaths = ORT_WASM_BASE;
// Single-threaded: multi-threading needs cross-origin isolation, which would
// break AdSense. We are already off the main thread.
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

class InitError extends Error {}

const NETWORK_MESSAGE = "Couldn't download the AI model. Check your connection and try again.";
const INTEGRITY_MESSAGE = "The downloaded AI model failed its integrity check. Please try again.";
const ENGINE_MESSAGE = "The on-device engine couldn't start in this browser.";

let initPromise: Promise<ort.InferenceSession> | null = null;
let queue: Promise<void> = Promise.resolve();

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function isValidModel(bytes: Uint8Array<ArrayBuffer>): Promise<boolean> {
  return bytes.byteLength === MODEL.bytes && (await sha256Hex(bytes)) === MODEL.sha256;
}

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === "undefined" ? null : await caches.open(MODEL_CACHE_NAME);
  } catch {
    return null;
  }
}

async function readCachedModel(cache: Cache | null): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!cache) return null;
  try {
    const hit = await cache.match(MODEL.url);
    if (!hit) return null;
    const bytes = new Uint8Array(await hit.arrayBuffer());
    if (await isValidModel(bytes)) return bytes;
    await cache.delete(MODEL.url);
  } catch {
    // Cache Storage can throw (e.g. private browsing); fall back to the network.
  }
  return null;
}

async function downloadModel(): Promise<Uint8Array<ArrayBuffer>> {
  let response: Response;
  try {
    response = await fetch(MODEL.url);
  } catch {
    throw new InitError(NETWORK_MESSAGE);
  }
  if (!response.ok || !response.body) throw new InitError(NETWORK_MESSAGE);

  const total = Number(response.headers.get("content-length")) || MODEL.bytes;
  const buffer = new Uint8Array(MODEL.bytes);
  const reader = response.body.getReader();
  let loaded = 0;
  let lastPost = 0;
  scope.postMessage({ type: "model-progress", loaded: 0, total });

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (loaded + value.byteLength > buffer.byteLength) {
        await reader.cancel();
        throw new InitError(INTEGRITY_MESSAGE);
      }
      buffer.set(value, loaded);
      loaded += value.byteLength;
      const now = Date.now();
      if (now - lastPost >= 100) {
        lastPost = now;
        scope.postMessage({ type: "model-progress", loaded, total });
      }
    }
  } catch (err) {
    if (err instanceof InitError) throw err;
    throw new InitError(NETWORK_MESSAGE);
  }
  scope.postMessage({ type: "model-progress", loaded, total });

  if (loaded !== MODEL.bytes || !(await isValidModel(buffer))) {
    throw new InitError(INTEGRITY_MESSAGE);
  }
  return buffer;
}

async function createSession(): Promise<ort.InferenceSession> {
  const cache = await openCache();
  let bytes = await readCachedModel(cache);
  if (bytes) {
    scope.postMessage({ type: "model-progress", loaded: MODEL.bytes, total: MODEL.bytes });
  } else {
    bytes = await downloadModel();
    try {
      await cache?.put(
        MODEL.url,
        new Response(bytes, { headers: { "content-type": "application/octet-stream" } })
      );
    } catch {
      // Best effort: the next visit simply downloads again.
    }
  }

  scope.postMessage({ type: "engine-starting" });
  try {
    return await ort.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
  } catch {
    throw new InitError(ENGINE_MESSAGE);
  }
}

function init(): Promise<ort.InferenceSession> {
  if (!initPromise) {
    initPromise = createSession().then(
      (session) => {
        scope.postMessage({ type: "ready" });
        return session;
      },
      (err: unknown) => {
        initPromise = null;
        const message = err instanceof InitError ? err.message : ENGINE_MESSAGE;
        scope.postMessage({ type: "init-error", message });
        throw new InitError(message);
      }
    );
  }
  return initPromise;
}

function context2d(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

async function removeBackground(
  session: ort.InferenceSession,
  file: Blob,
  maxPixels: number
): Promise<{ png: Blob; width: number; height: number; resized: boolean }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image could not be decoded.");
  }

  let input: ort.Tensor | null = null;
  let results: ort.InferenceSession.OnnxValueMapType | null = null;
  try {
    const { width, height, resized } = fitWithinPixelBudget(bitmap.width, bitmap.height, maxPixels);
    const size = MODEL_INPUT_SIZE;

    const inputCanvas = new OffscreenCanvas(size, size);
    const inputCtx = context2d(inputCanvas);
    inputCtx.drawImage(bitmap, 0, 0, size, size);
    const pixels = inputCtx.getImageData(0, 0, size, size).data;
    input = new ort.Tensor("float32", toModelInput(pixels, size, size), [1, 3, size, size]);

    results = await session.run({ [session.inputNames[0]]: input });
    const output = results[session.outputNames[0]].data as Float32Array;

    const maskCanvas = new OffscreenCanvas(size, size);
    context2d(maskCanvas).putImageData(
      new ImageData(maskToRgba(maskToUint8(output)), size, size),
      0,
      0
    );

    const outCanvas = new OffscreenCanvas(width, height);
    const outCtx = context2d(outCanvas);
    outCtx.drawImage(bitmap, 0, 0, width, height);
    outCtx.globalCompositeOperation = "destination-in";
    outCtx.drawImage(maskCanvas, 0, 0, width, height);
    const png = await outCanvas.convertToBlob({ type: "image/png" });
    return { png, width, height, resized };
  } finally {
    bitmap.close();
    input?.dispose();
    if (results) for (const value of Object.values(results)) value.dispose?.();
  }
}

scope.onmessage = (event) => {
  const message = event.data;
  if (message.type === "init") {
    init().catch(() => {
      // Already reported as init-error.
    });
    return;
  }

  if (message.type === "process") {
    const { id, file, maxPixels } = message;
    queue = queue.then(async () => {
      let session: ort.InferenceSession;
      try {
        session = await init();
      } catch (err) {
        scope.postMessage({
          type: "process-error",
          id,
          message: err instanceof Error ? err.message : ENGINE_MESSAGE,
        });
        return;
      }
      try {
        const result = await removeBackground(session, file, maxPixels);
        scope.postMessage({ type: "result", id, ...result });
      } catch (err) {
        scope.postMessage({
          type: "process-error",
          id,
          message: err instanceof Error ? err.message : "Background removal failed.",
        });
      }
    });
  }
};
