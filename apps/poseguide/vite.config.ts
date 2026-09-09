import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Only MoveNet is used; see src/lib/mediapipe-stub.ts.
      "@mediapipe/pose": path.resolve(import.meta.dirname, "./src/lib/mediapipe-stub.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
