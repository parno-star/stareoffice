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
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), tailwindcss(), hercules()],
  resolve: {
    alias: [
      { find: /^@\/pages\/.*\/_lib\/(.*)$/, replacement: path.resolve(__dirname, "./src/lib/$1") },
      { find: /^@\/pages\/.*\/_components\/(.*)$/, replacement: path.resolve(__dirname, "./src/components/$1") },
      { find: "@/convex", replacement: path.resolve(__dirname, "./src/lib") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
