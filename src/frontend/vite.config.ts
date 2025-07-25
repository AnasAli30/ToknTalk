/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import dotenv from "dotenv";
import { fileURLToPath, URL } from "url";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  root: __dirname,
  build: {
    outDir: "dist/",
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    include: ["buffer", "process"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
    allowedHosts: [],
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      { find: 'buffer', replacement: 'buffer/' },
      { find: 'process', replacement: 'process/browser' },
    ],
    dedupe: ["@dfinity/agent"],
  },
  define: {
    'process.env': {},
  },
  test: {
    environment: "jsdom",
    setupFiles: "frontend-test-setup.ts",
    globals: true,
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  css: {
    devSourcemap: true,
  },
});
