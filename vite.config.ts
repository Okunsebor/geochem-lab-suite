import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tsConfigPaths(),
    tailwindcss(),
  ],
  build: {
    target: "es2022",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@tanstack/react-router") || id.includes("@tanstack/react-start")) {
              return "vendor-router";
            }
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("recharts") || id.includes("jspdf")) return "vendor-charts-pdf";
            if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-router"],
  },
});
