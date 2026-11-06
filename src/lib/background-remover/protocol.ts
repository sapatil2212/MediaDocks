/**
 * Message contract between the page and the background-removal Web Worker,
 * plus the pinned engine and model constants both sides rely on.
 */

/**
 * Must equal the exact `onnxruntime-web` version in package.json; the wasm
 * binary is bundled from that package (guarded by a test).
 */
export const ORT_VERSION = "1.30.0";

/** Apache-2.0 ISNet-based salient-object model, pinned to an exact revision and hash. */
export const MODEL = {
  id: "onnx-community/ormbg-ONNX",
  revision: "034e2d884afbab897e10e78fc5bb566b29533fd6",
  url: "https://huggingface.co/onnx-community/ormbg-ONNX/resolve/034e2d884afbab897e10e78fc5bb566b29533fd6/onnx/model_quantized.onnx",
  bytes: 44_315_205,
  sha256: "ffbcae62a7b675d616e64cb392ee028786c4cf74f83596590fba13733ef00171",
  license: "Apache-2.0",
} as const;

/** Cache Storage bucket for the model bytes. Never holds user images. */
export const MODEL_CACHE_NAME = "mediadocks-bg-model-v1";

export type WorkerRequest =
  | { type: "init" }
  | { type: "process"; id: string; file: Blob; maxPixels: number };

export type WorkerResponse =
  | { type: "model-progress"; loaded: number; total: number }
  | { type: "engine-starting" }
  | { type: "ready" }
  | { type: "init-error"; message: string }
  | { type: "result"; id: string; png: Blob; width: number; height: number; resized: boolean }
  | { type: "process-error"; id: string; message: string };

export type EngineEvent = Extract<
  WorkerResponse,
  { type: "model-progress" | "engine-starting" | "ready" | "init-error" }
>;
