import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // See src/test/server-only-stub.ts for why this is aliased.
      "server-only": fileURLToPath(
        new URL("./src/test/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    // Node only. The units under test here are pure data transforms and maths;
    // anything needing a DOM belongs in the Playwright pass instead, which
    // exercises real rendering rather than a jsdom approximation of it.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
