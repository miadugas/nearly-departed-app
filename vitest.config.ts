import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Logic-only test runner. The functions under test are pure TS with no React
// Native imports, so a plain node env + the `@/` alias is all that's needed.
// Component tests (if ever added) would want jest-expo instead.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
