import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    exclude: ["e2e/**", "**/node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@video-processor": path.resolve(__dirname, "./video-processor"),
      "@metrics-engine": path.resolve(__dirname, "./metrics-engine"),
      "@coaching-system": path.resolve(__dirname, "./coaching-system"),
      "@analytics-dashboard": path.resolve(__dirname, "./analytics-dashboard"),
    },
  },
});
