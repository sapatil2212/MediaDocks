import JSZip from "jszip";

/**
 * Package finished cutouts into one ZIP archive, in the order given.
 *
 * This does NOT dedupe names: callers must pass names that have already been
 * through `dedupeFileNames`, otherwise later entries overwrite earlier ones.
 * PNGs are already deflated, so entries are stored without recompression.
 */
export async function buildResultsZip(
  entries: Array<{ name: string; data: Uint8Array }>
): Promise<Uint8Array> {
  if (entries.length === 0) throw new Error("No finished images to package.");
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.name, entry.data, { binary: true });
  }
  return zip.generateAsync({ type: "uint8array", compression: "STORE" });
}

export function zipArchiveName(count: number): string {
  return `mediadocks_background_removed_${count}.zip`;
}
