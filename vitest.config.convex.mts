import { defineConfig } from "vitest/config";

/**
 * Root test configuration for the headless Convex backend.
 *
 * Workspace packages run their own tests via Turborepo. This config covers the
 * Convex schema, functions, and HTTP actions that live at the repository root.
 */
export default defineConfig({
  test: {
    include: ["convex/**/*.test.ts"],
  },
});
