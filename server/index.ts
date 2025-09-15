// server/index.ts
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { registerRoutes } from "./routes"; // ✅ usar "./routes"
import { setupVite, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

/* ----------------------- Paths robustos para contenedores ----------------------- */
function getProjectRoot(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "..");
  } catch {
    console.log("Falling back to process.cwd() for path resolution");
    return process.cwd();
  }
}

/* ------------------ Validación mínima de variables de entorno ------------------ */
function validateEnvironment() {
  const requiredEnvVars = ["DATABASE_URL"];
  const missing = requiredEnvVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  // ✅ Igual que el de arriba: si no viene, por defecto producción
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production"; // default hard
  }

  // (opcional) BASE_URL estilo “arriba” — silente en prod
  const baseUrl =
    process.env.BASE_URL ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `https://3d2437f9e7f2.replit.app`);
  // Puedes usar baseUrl en tu auth/OAuth si aplica.
}
validateEnvironment();

/* --------------------------------- App --------------------------------- */
const app = express();

// si estás detrás de proxy/cdn (Easypanel/Nginx), avisa a Express
app.set("trust proxy", 1);

// ✅ Parsers consistentes con router.ts
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* --------------------------- Logger simple de API --------------------------- */
const isProductionEnv = process.env.NODE_ENV === "production";
if (!isProductionEnv) {
  app.use((req, res, next) => {
    const start = Date.now();
    const p = req.path;
    let capturedJsonResponse: any;

    const originalResJson = res.json.bind(res);
    (res as any).json = (bodyJson: any) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    };

    res.on("finish", () => {
      if (!p.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
      
      if (capturedJsonResponse) {
        const short = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${short.length > 400 ? short.slice(0, 400) + "…" : short}`;
      }
      log(logLine);
    });

    next();
  });
} else {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (!req.path.startsWith("/api")) return;
      const duration = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    });
    next();
  });
}

/* --------------------------- Apagado elegante --------------------------- */
let server: any = null;

const gracefulShutdown = (signal: string) => {
  log(`Received ${signal}. Starting graceful shutdown…`);
  if (server) {
    server.close(() => {
      log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      log("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

/* --------------------------------- Boot --------------------------------- */
(async () => {
  try {
    // ✅ Crear servidor HTTP inmediatamente (Replit happy path)
    const { createServer } = await import("http");
    server = createServer(app);

    // ✅ Abrir puerto de una (probe OK)
    const port = Number.parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () =>
      log(`serving on port ${port}`),
    );

    server.on("error", (error: any) => {
      if (error?.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });

    // ✅ Healthcheck inmediato
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", timestamp: Date.now() });
    });

    // registra TODAS las rutas/API después de abrir puerto
    await registerRoutes(app);

    // middleware global de errores
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const payload = {
        error: "Internal",
        message: err?.message || "Internal Server Error",
        code: err?.code ?? "ERR",
        detail: err?.detail,
      };
      console.error("[API ERROR]", { ...payload, stack: err?.stack });
      if (res.headersSent) return;
      res.status(status).json(payload);
    });

    // ✅ Detección de producción igual de estricta que “arriba”
    const isProduction =
      process.env.NODE_ENV === "production" ||
      !process.env.REPLIT_DEV_DOMAIN ||
      process.env.EASYPANEL === "true" ||
      app.get("env") === "production";

    console.log(`Environment detection:
  NODE_ENV: ${process.env.NODE_ENV}
  app.get("env"): ${app.get("env")}
  REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN || "not set"}
  Using production mode: ${isProduction}`);

    if (!isProduction) {
      console.log("Starting Vite development server…");
      await setupVite(app, server);
    } else {
      console.log("Starting production static file server…");
      const projectRoot = getProjectRoot();
      const distPath = path.resolve(projectRoot, "dist", "public");
      console.log(`Looking for static files in: ${distPath}`);

      if (!fs.existsSync(distPath)) {
        console.error(`Build directory not found: ${distPath}`);
        try {
          const rootContents = fs.readdirSync(projectRoot);
          console.error(`Project root contents: ${rootContents.join(", ")}`);
          const distDir = path.resolve(projectRoot, "dist");
          if (fs.existsSync(distDir)) {
            const distContents = fs.readdirSync(distDir);
            console.error(
              `Dist directory contents: ${distContents.join(", ")}`,
            );
          }
        } catch {
          console.error("Could not read directory contents");
        }
        console.error("Run 'npm run build' before starting in production");
        process.exit(1);
      }

      console.log(`Successfully found static files at: ${distPath}`);
      
      // 🔥 ULTRA AGRESIVO: Headers anti-cache para forzar actualizaciones
      app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.match(/\.(js|css|html)$/)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Last-Modified', new Date().toUTCString());
            res.setHeader('ETag', Date.now().toString());
          } else {
            res.setHeader('Cache-Control', 'public, max-age=3600');
          }
        }
      }));

      // SPA fallback
      app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        console.log(`Attempting to serve index.html from: ${indexPath}`);
        if (fs.existsSync(indexPath)) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Last-Modified', new Date().toUTCString());
          res.setHeader('ETag', Date.now().toString());
          res.sendFile(indexPath);
        } else {
          console.error(`index.html not found at: ${indexPath}`);
          res
            .status(404)
            .send("index.html not found - application not built properly");
        }
      });
    }
  } catch (error: any) {
    console.error("Critical error during server startup:", error);
    console.error("Error stack:", error?.stack || "No stack trace available");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    console.error("Environment details:");
    console.error("  Working directory:", process.cwd());
    console.error("  Node version:", process.version);
    console.error("  Platform:", process.platform);
    console.error("  Architecture:", process.arch);
    process.exit(1);
  }
})();
