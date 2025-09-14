// server/googleAuth.ts
import type { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Customer } from "@shared/schema";
import { storage } from "./storage";

/**
 * Configura Google OAuth para clientes.
 * Requisitos previos en tu app:
 *  - El middleware de sesión (express-session) DEBE ejecutarse antes que esto.
 *  - app.set("trust proxy", 1) en producción (EasyPanel/Caddy) para cookies secure.
 * ENV necesarias:
 *  - BASE_URL=https://fulltechchrd.com
 *  - OAUTH_CALLBACK_URL=https://fulltechchrd.com/api/auth/google/callback
 *  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *  - SESSION_SECRET (configurado donde inicias la sesión)
 */

export function setupGoogleAuth(app: Express) {
  // Importante: asume que ya corriste app.use(session(...)) antes.
  app.use(passport.initialize());
  app.use(passport.session());

  // --- Construcción de URLs seguras desde ENV ---
  const baseUrl =
    process.env.BASE_URL?.trim() ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "");

  const callbackURL =
    process.env.OAUTH_CALLBACK_URL?.trim() ||
    (baseUrl ? `${baseUrl}/api/auth/google/callback` : "/api/auth/google/callback");

  // --- Estrategia de Google OAuth2 ---
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL,
        proxy: true, // respeta X-Forwarded-* detrás de Caddy/Nginx
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let customer = await storage.getCustomerByGoogleId(profile.id);

          if (!customer) {
            const referralCode = `REF-${Math.random()
              .toString(36)
              .substring(2, 8)
              .toUpperCase()}`;

            customer = await storage.createCustomer({
              googleId: profile.id,
              email: profile.emails?.[0]?.value || "",
              name: profile.displayName || "",
              picture: profile.photos?.[0]?.value || "",
              referralCode,
            });
          } else {
            await storage.updateCustomerLastVisit(customer.id);
          }

          return done(null, customer);
        } catch (err) {
          console.error("Error in Google OAuth:", err);
          return done(err as any);
        }
      }
    )
  );

  // --- Serialización de sesión de usuario ---
  passport.serializeUser((user: any, done) => {
    done(null, (user as Customer).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const customer = await storage.getCustomer(id);
      done(null, customer);
    } catch (err) {
      done(err as any);
    }
  });

  // --- Rutas de autenticación ---
  // Inicia OAuth (forzamos selector de cuenta)
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })
  );

  // Callback de Google
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req: any, res) => {
      const customer = req.user;

      // Seguridad: regenerar la sesión después de login
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Error regenerating Google OAuth session:", err);
          return res.redirect("/login?error=session");
        }

        req.login(customer, (loginErr: any) => {
          if (loginErr) {
            console.error("Error logging in customer after session regeneration:", loginErr);
            return res.redirect("/login?error=login");
          }

          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error("Error saving Google OAuth session:", saveErr);
              return res.redirect("/login?error=save");
            }

            // A donde quieras llevarlo luego de loguear
            res.redirect("/customer/dashboard");
          });
        });
      });
    }
  );

  // Logout unificado (Google y teléfono)
  app.post("/api/auth/logout", (req: any, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.logout((err: any) => {
        if (err) console.error("Error during Google logout:", err);
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) console.error("Error destroying session:", sessionErr);
          res.json({ success: true, message: "Logged out successfully" });
        });
      });
    } else {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Error destroying session" });
        }
        res.json({ success: true, message: "Logged out successfully" });
      });
    }
  });

  // Estado de auth estándar
  app.get("/api/me", async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      let customer: Customer | null = null;

      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        customer = req.user as Customer;
      } else if (req.session && req.session.customerId) {
        customer = await storage.getCustomer(req.session.customerId);
      }

      if (customer) {
        let profile = null;
        try {
          profile = await storage.getUserProfile(customer.id);
        } catch {
          // puede no existir aún, ok
        }
        return res.json({
          authenticated: true,
          user: {
            id: customer.id,
            name: customer.name,
            email: customer.email || null,
            avatarUrl: profile?.avatar || customer.picture || null,
          },
        });
      }

      res.json({ authenticated: false });
    } catch (error) {
      console.error("Error in /api/me:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Compatibilidad legado
  app.get("/api/auth/me", async (req: any, res) => {
    try {
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return res.json(req.user);
      }

      if (req.session && req.session.customerId) {
        const customer = await storage.getCustomer(req.session.customerId);
        if (customer) return res.json(customer);
      }

      res.status(401).json({ error: "Not authenticated" });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// Middleware para proteger rutas de cliente (Google o teléfono)
export function requireCustomerAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  if (req.session && req.session.customerId) {
    storage
      .getCustomer(req.session.customerId)
      .then((customer) => {
        if (customer) {
          req.user = customer;
          return next();
        } else {
          req.session.customerId = undefined;
          res.status(401).json({ error: "Authentication required" });
        }
      })
      .catch((error) => {
        console.error("Error loading customer in requireCustomerAuth:", error);
        res.status(500).json({ error: "Authentication error" });
      });
    return;
  }

  res.status(401).json({ error: "Authentication required" });
}
