import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "./web",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:3003",
      "/login": "http://127.0.0.1:3003",
      "/callback": "http://127.0.0.1:3003",
      "/logout": "http://127.0.0.1:3003",
      "/health": "http://127.0.0.1:3003"
    }
  },
  build: {
    outDir: "../dist/web",
    emptyOutDir: false
  }
});
