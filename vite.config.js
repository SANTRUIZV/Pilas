import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
// Multipágina: index.html = app ciudadana · gobierno.html = dashboard gobierno
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        gobierno: resolve(__dirname, "gobierno.html"),
      },
    },
  },
});
