import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import hercules from "@usehercules/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true' ? { overlay: false } : false,
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  plugins: [react(), tailwindcss(), hercules()],
  resolve: {
    alias: {
      "convex/react": path.resolve(__dirname, "./src/lib/postgres-react.tsx"),
      "@/convex": path.resolve(__dirname, "./convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
