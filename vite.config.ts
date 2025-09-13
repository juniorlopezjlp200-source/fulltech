// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";
  const isReplit = !!process.env.REPL_ID;

  const plugins = [react()];

  if (!isProd) {
    // Plugins SOLO en dev - con manejo de errores para plugins faltantes
    try {
      const runtimeErrorOverlayMod = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      plugins.push(runtimeErrorOverlayMod.default());
    } catch (error) {
      console.warn("⚠️ @replit/vite-plugin-runtime-error-modal no disponible:", (error as Error).message);
    }

    if (isReplit) {
      try {
        const { cartographer } = await import(
          "@replit/vite-plugin-cartographer"
        );
        plugins.push(cartographer());
      } catch (error) {
        console.warn("⚠️ @replit/vite-plugin-cartographer no disponible:", (error as Error).message);
      }
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
