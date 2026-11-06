import fs from "fs";
import path from "path";

/** Reads a saved Pinterest response from tests/fixtures/pinterest. */
export function readFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "../fixtures/pinterest", name), "utf8");
}

export function readJsonFixture<T = unknown>(name: string): T {
  return JSON.parse(readFixture(name)) as T;
}
