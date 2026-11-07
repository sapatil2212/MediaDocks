import { defineConfig, type Plugin } from "vitest/config";
import { statSync } from "fs";
import path from "path";

const root = __dirname;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

/**
 * Mirrors tsconfig `"@/*": ["./*", "./src/*"]`: an `@/x` import resolves to the
 * repo root first, then to src/. App code relies on this, so tests that import
 * app routes or components resolve them the same way Next does.
 */
function tsconfigPathsFallback(): Plugin {
  return {
    name: "tsconfig-paths-fallback",
    enforce: "pre",
    resolveId(source) {
      if (!source.startsWith("@/")) return null;
      const rest = source.slice(2);
      for (const base of [root, path.join(root, "src")]) {
        for (const ext of EXTENSIONS) {
          const candidate = path.join(base, rest + ext);
          try {
            if (statSync(candidate).isFile()) return candidate;
          } catch {
            // try the next candidate
          }
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPathsFallback()],
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
});
