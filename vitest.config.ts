import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Tests exercise the real validation/resolution path, never mock mode,
    // unless a test opts in with vi.stubEnv.
    // Pinned so the suite never depends on ambient shell configuration.
    env: {
      MOCK_RESOLVER: "false",
      DEBUG_RESOLVER: "false",
      RESOLVE_LIMIT: "10",
      RESOLVE_WINDOW_SECONDS: "60",
      DOWNLOAD_LIMIT: "5",
      DOWNLOAD_WINDOW_SECONDS: "60",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/src": path.resolve(__dirname, "./src"),
    },
  },
});
