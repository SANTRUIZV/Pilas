import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
// Multipágina: index.html = landing · ciudadano.html = app ciudadana ·
// gobierno.html = dashboard gobierno · creadores.html = equipo y finalidad
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        ciudadano: resolve(__dirname, "ciudadano.html"),
        gobierno: resolve(__dirname, "gobierno.html"),
        creadores: resolve(__dirname, "creadores.html"),
      },
    },
  },
});
