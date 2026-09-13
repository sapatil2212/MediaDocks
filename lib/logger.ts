import crypto from "crypto";

export interface RequestLogEntry {
  requestId: string;
  endpoint: string;
  platform?: string;
  durationMs: number;
  success: boolean;
  errorCode?: string;
}

export function newRequestId(): string {
  return crypto.randomBytes(6).toString("hex");
}

/**
 * Structured request log. Deliberately contains no URLs, IP addresses,
 * headers, cookies or tokens.
 */
export function logRequest(entry: RequestLogEntry): void {
  console.log(JSON.stringify({ at: new Date().toISOString(), ...entry }));
}
