import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" path alias from tsconfig.json natively (Vite 7+).
    tsconfigPaths: true,
    alias: [
      // next-intl's navigation helpers import "next/navigation", which Next
      // resolves through its own bundler but Vite cannot: the package ships the
      // file with an extension. Without this, any test rendering a component
      // that imports `Link` from @/i18n/navigation fails to load at all.
      { find: /^next\/navigation$/, replacement: "next/navigation.js" },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // next-intl has to go through Vite's transform rather than being treated as
    // an external dependency, otherwise the alias above never applies to the
    // "next/navigation" import buried inside it.
    server: { deps: { inline: ["next-intl"] } },
  },
});
