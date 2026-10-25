/**
 * Typed-array helpers that convert between canvas pixels and the segmentation
 * model's tensors. No DOM access, so they run under vitest's node environment.
 */

/** The model expects a square 1024×1024 RGB input. */
export const MODEL_INPUT_SIZE = 1024;

/**
 * RGBA bytes (HWC) → float32 CHW planes (R, then G, then B), each value
 * rescaled to 0–1. Alpha is ignored; no mean/std normalisation is applied.
 */
export function toModelInput(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): Float32Array {
  const pixels = width * height;
  if (rgba.length !== pixels * 4) {
    throw new Error(`Expected ${pixels * 4} RGBA bytes, got ${rgba.length}.`);
  }
  const out = new Float32Array(pixels * 3);
  for (let i = 0; i < pixels; i++) {
    const p = i * 4;
    out[i] = rgba[p] / 255;
    out[pixels + i] = rgba[p + 1] / 255;
    out[2 * pixels + i] = rgba[p + 2] / 255;
  }
  return out;
}

const EPSILON = 1e-5;

/**
 * Model output → 8-bit alpha mask. Values outside 0–1 (beyond a small epsilon)
 * mean the model emitted logits, so a sigmoid is applied to every value first.
 */
export function maskToUint8(values: Float32Array | ArrayLike<number>): Uint8ClampedArray<ArrayBuffer> {
  const n = values.length;
  let logits = false;
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v < -EPSILON || v > 1 + EPSILON) {
      logits = true;
      break;
    }
  }
  const out = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i++) {
    let v = values[i];
    if (logits) v = 1 / (1 + Math.exp(-v));
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    out[i] = Math.round(v * 255);
  }
  return out;
}

/** Alpha mask → RGBA pixels (RGB = 0, A = mask) for `destination-in` compositing. */
export function maskToRgba(mask: Uint8ClampedArray): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(mask.length * 4);
  for (let i = 0; i < mask.length; i++) {
    out[i * 4 + 3] = mask[i];
  }
  return out;
}
