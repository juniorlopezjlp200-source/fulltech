// server/router.ts
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRaffleParticipantSchema,
  adminLoginSchema,
  phoneRegisterSchema,
  phoneLoginSchema,
  insertProductSchema,
  insertHeroSlideSchema,
  insertCustomPageSchema,
  insertCategorySchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setupGoogleAuth, requireCustomerAuth } from "./googleAuth";

// ---------------- Session types ----------------
declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
    customerId?: string;
  }
}

// ---------------- Admin authentication middleware ----------------
// Prioriza admin si ya existe; sólo bloquea cuando NO hay admin
// y hay sesión de cliente/Google o simplemente no hay admin.
const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.session.adminId) return next(); // ✅ admin activo → OK

  // ❌ no hay admin y sí hay cliente/Google
  if ((req as any).isAuthenticated?.() || req.session.customerId) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  // ❌ no hay admin
  return res.status(401).json({ error: "Admin authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------- Infra básica ----------
  app.set("trust proxy", 1);

  const PgSession = connectPgSimple(session);
  const pgSessionStore = new PgSession({
    connectionString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: pgSessionStore,
      secret:
        process.env.SESSION_SECRET ||
        "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      },
      name: "sid",
    }),
  );

  // --- Health check
  app.get("/api/health", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({
      ok: true,
      time: Date.now(),
      env: process.env.NODE_ENV || "dev",
    });
  });

  // --- Google OAuth (cliente)
  setupGoogleAuth(app);

  // ---------- Auth helper: quién soy ----------
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (req.session.adminId) {
        const admin = await storage.getAdminByEmail(req.session.adminEmail!);
        if (!admin) return res.status(404).json({ error: "Admin not found" });
        return res.json({
          role: "admin",
          id: admin.id,
          email: admin.email,
          name: admin.name,
          lastLogin: admin.lastLogin,
        });
      }
      if (req.session.customerId) {
        const customer = await storage.getCustomer(req.session.customerId);
        if (!customer)
          return res.status(404).json({ error: "Customer not found" });
        return res.json({
          role: "customer",
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        });
      }
      return res.status(401).json({ error: "Not authenticated" });
    } catch (e) {
      console.error("auth/me error:", e);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ---------- Customer API ----------
  app.get(
    "/api/customer/activities",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const activities = await storage.getCustomerActivities(req.user.id);
        res.json(activities);
      } catch (error) {
        console.error("Error fetching customer activities:", error);
        res.status(500).json({ error: "Failed to fetch activities" });
      }
    },
  );

  app.get(
    "/api/customer/purchases",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const purchases = await storage.getCustomerPurchases(req.user.id);
        res.json(purchases);
      } catch (error) {
        console.error("Error fetching customer purchases:", error);
        res.status(500).json({ error: "Failed to fetch purchases" });
      }
    },
  );

  app.get(
    "/api/customer/referrals",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const referrals = await storage.getReferralsByCustomer(req.user.id);
        res.json(referrals);
      } catch (error) {
        console.error("Error fetching customer referrals:", error);
        res.status(500).json({ error: "Failed to fetch referrals" });
      }
    },
  );

  // Customer profile
  app.get(
    "/api/customer/profile",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        let profile = await storage.getUserProfile(req.user.id);
        if (!profile) {
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            firstName: req.user.name?.split(" ")[0] || "",
            lastName: req.user.name?.split(" ").slice(1).join(" ") || "",
            phone: req.user.phone || "",
          });
        }
        res.json(profile);
      } catch (error) {
        console.error("Error fetching customer profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
      }
    },
  );

  app.put(
    "/api/customer/profile",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const profileData = req.body;
        let profile = await storage.getUserProfile(req.user.id);
        if (!profile) {
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            ...profileData,
          });
        } else {
          profile = await storage.updateUserProfile(req.user.id, profileData);
        }
        res.json(profile);
      } catch (error) {
        console.error("Error updating customer profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    },
  );

  // Preferences
  app.get(
    "/api/customer/preferences",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const profile = await storage.getUserProfile(req.user.id);
        const preferences = profile?.preferences || {
          notifications: {
            email: true,
            sms: false,
            push: true,
            marketing: false,
            referralUpdates: true,
            orderUpdates: true,
          },
          settings: {
            language: "es",
            currency: "DOP",
            theme: "light",
            autoLogin: true,
            dataSharing: false,
          },
        };
        res.json(preferences);
      } catch (error) {
        console.error("Error fetching customer preferences:", error);
        res.status(500).json({ error: "Failed to fetch preferences" });
      }
    },
  );

  app.put(
    "/api/customer/preferences",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const { notifications, settings } = req.body;
        let profile = await storage.getUserProfile(req.user.id);
        const preferences = {
          notifications: notifications || {},
          settings: settings || {},
        };
        if (!profile) {
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            preferences,
          });
        } else {
          const updatedPreferences = {
            ...profile.preferences,
            ...preferences,
          };
          profile = await storage.updateUserProfile(req.user.id, {
            preferences: updatedPreferences,
          });
        }
        res.json({ success: true, preferences: profile?.preferences });
      } catch (error) {
        console.error("Error updating customer preferences:", error);
        res.status(500).json({ error: "Failed to update preferences" });
      }
    },
  );

  // Support tickets (mock)
  app.get(
    "/api/customer/support-tickets",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const tickets = [
          {
            id: "1",
            customerId: req.user.id,
            type: "technical",
            subject: "Problema con el inicio de sesión",
            message: "No puedo acceder a mi cuenta",
            priority: "normal",
            status: "open",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        res.json(tickets);
      } catch (error) {
        console.error("Error fetching support tickets:", error);
        res.status(500).json({ error: "Failed to fetch support tickets" });
      }
    },
  );

  app.post(
    "/api/customer/support-tickets",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const { type, subject, message, priority = "normal" } = req.body;
        if (!type || !subject || !message) {
          return res
            .status(400)
            .json({ error: "Type, subject, and message are required" });
        }
        const ticket = {
          id: `ticket_${Date.now()}`,
          customerId: req.user.id,
          customerName: req.user.name,
          customerEmail: req.user.email,
          customerPhone: req.user.phone,
          type,
          subject,
          message,
          priority,
          status: "open",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log("📧 New support ticket created:", ticket);
        res.json({ success: true, ticket });
      } catch (error) {
        console.error("Error creating support ticket:", error);
        res.status(500).json({ error: "Failed to create support ticket" });
      }
    },
  );

  // Raffle
  app.get("/api/raffle/current", async (_req, res) => {
    try {
      const currentRaffle = await storage.getCurrentMonthlyRaffle();
      res.json(currentRaffle);
    } catch (error) {
      console.error("Error fetching current raffle:", error);
      res.status(500).json({ error: "Failed to fetch current raffle" });
    }
  });

  app.post(
    "/api/customer/activity",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const { activityType, productId, metadata } = req.body;
        const activity = await storage.createCustomerActivity({
          customerId: req.user.id,
          activityType,
          productId,
          metadata,
        });
        res.json(activity);
      } catch (error) {
        console.error("Error creating customer activity:", error);
        res.status(500).json({ error: "Failed to create activity" });
      }
    },
  );

  app.post(
    "/api/customer/purchase",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const { productId, quantity, discountApplied } = req.body;
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        const validUnitPrice = product.price;
        const validTotalPrice = validUnitPrice * quantity;

        const purchase = await storage.createCustomerPurchase({
          customerId: req.user.id,
          productId,
          quantity,
          unitPrice: validUnitPrice,
          totalPrice: validTotalPrice,
          discountApplied: discountApplied || 0,
        });

        const customer = await storage.getCustomer(req.user.id);
        if (customer?.referredBy) {
          const referrals = await storage.getReferralsByCustomer(
            customer.referredBy,
          );
          const myReferral = referrals.find(
            (r) => r.referredId === req.user.id && r.status === "pending",
          );
          if (myReferral) {
            await storage.updateReferralStatus(
              myReferral.id,
              "qualified",
              new Date(),
            );
            const referrer = await storage.getCustomer(customer.referredBy);
            if (referrer) {
              const commission = Math.round(validTotalPrice * 0.05);
              const newDiscountEarned =
                (referrer.discountEarned || 0) + commission;

              await storage.updateCustomer(customer.referredBy, {
                discountEarned: newDiscountEarned,
              });
              await storage.updateCustomerLastVisit(customer.referredBy);
            }
            const currentRaffle = await storage.getCurrentMonthlyRaffle();
            if (currentRaffle) {
              await storage.createRaffleEntry({
                raffleId: currentRaffle.id,
                customerId: customer.referredBy,
                entries: 1,
              });
            }
          }
        }

        res.json(purchase);
      } catch (error) {
        console.error("Error creating purchase:", error);
        res.status(500).json({ error: "Failed to create purchase" });
      }
    },
  );

  // ---------- Admin auth ----------
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);
      const admin = await storage.getAdminByEmail(email);
      if (!admin) return res.status(401).json({ error: "Invalid credentials" });
      if (!admin.active)
        return res.status(401).json({ error: "Admin account is inactive" });

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch)
        return res.status(401).json({ error: "Invalid credentials" });

      await storage.updateAdminLastLogin(admin.id);

      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Error regenerating admin session:", err);
          return res.status(500).json({ error: "Session error" });
        }

        // limpiar sesión de cliente/Google
        req.session.customerId = undefined;
        if (typeof (req as any).logout === "function") {
          try {
            (req as any).logout();
          } catch {}
        }

        req.session.adminId = admin.id;
        req.session.adminEmail = admin.email;

        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Error saving admin session:", saveErr);
            return res.status(500).json({ error: "Session save error" });
          }

          res.json({
            success: true,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
            },
          });
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.json({ success: true });
    });
  });

  app.get("/api/admin/me", requireAdmin, async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const admin = await storage.getAdminByEmail(req.session.adminEmail!);
      if (!admin) return res.status(404).json({ error: "Admin not found" });
      res.json({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
      });
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({ error: "Failed to get admin profile" });
    }
  });

  app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Current password and new password are required" });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters long" });
      }

      const admin = await storage.getAdminByEmail(req.session.adminEmail!);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const passwordMatch = await bcrypt.compare(
        currentPassword,
        admin.password,
      );
      if (!passwordMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateAdminPassword(admin.id, newPasswordHash);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Change admin password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // ---------- Phone Authentication ----------
  app.post("/api/auth/phone/register", async (req, res) => {
    try {
      const { name, phone, address, password } = phoneRegisterSchema.parse(
        req.body,
      );

      const existingCustomer = await storage.getCustomerByPhone(phone);
      if (existingCustomer) {
        return res
          .status(400)
          .json({ error: "Phone number already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const referralCode = `FT-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const customer = await storage.createCustomer({
        name,
        phone,
        address,
        passwordHash,
        authProvider: "phone",
        referralCode,
        isPhoneVerified: false,
      });

      req.session.regenerate((err: any) => {
        if (err) {
          console.error(
            "Error regenerating customer register session:",
            err,
          );
          return res.status(500).json({ error: "Session error" });
        }

        // limpiar posible sesión de admin
        req.session.adminId = undefined;
        req.session.adminEmail = undefined;

        req.session.customerId = customer.id;

        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error(
              "Error saving customer register session:",
              saveErr,
            );
            return res.status(500).json({ error: "Session save error" });
          }

          res.json({
            success: true,
            customer: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
              referralCode: customer.referralCode,
            },
          });
        });
      });
    } catch (error) {
      console.error("Phone register error:", error);
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  app.post("/api/auth/phone/login", async (req, res) => {
    try {
      const { phone, password } = phoneLoginSchema.parse(req.body);

      const customer = await storage.getCustomerByPhone(phone);
      if (!customer) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (customer.authProvider !== "phone" || !customer.passwordHash) {
        return res.status(401).json({ error: "Invalid authentication method" });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        customer.passwordHash,
      );
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      await storage.updateCustomerLastVisit(customer.id);

      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Error regenerating customer login session:", err);
          return res.status(500).json({ error: "Session error" });
        }

        // limpiar posible sesión de admin
        req.session.adminId = undefined;
        req.session.adminEmail = undefined;

        req.session.customerId = customer.id;

        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error(
              "Error saving customer login session:",
              saveErr,
            );
            return res.status(500).json({ error: "Session save error" });
          }

          res.json({
            success: true,
            customer: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              address: customer.address,
              referralCode: customer.referralCode,
              isPhoneVerified: customer.isPhoneVerified,
            },
          });
        });
      });
    } catch (error) {
      console.error("Phone login error:", error);
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  // ---------- Compat: rutas cortas que reusan phone-auth ----------
  app.post("/api/auth/login", (req, res, next) => {
    (app as any)._router.handle(
      {
        ...req,
        url: "/api/auth/phone/login",
        originalUrl: "/api/auth/phone/login",
      },
      res,
      next,
    );
  });
  app.post("/api/auth/register", (req, res, next) => {
    (app as any)._router.handle(
      {
        ...req,
        url: "/api/auth/phone/register",
        originalUrl: "/api/auth/phone/register",
      },
      res,
      next,
    );
  });

  // ---------- Raffle ----------
  app.post("/api/raffle/register", async (req, res) => {
    try {
      const participantData = insertRaffleParticipantSchema.parse(req.body);
      const participant =
        await storage.createRaffleParticipant(participantData);
      res.json({ success: true, participant });
    } catch (error) {
      console.error("Error registering participant:", error);
      res.status(400).json({ success: false, error: "Invalid data provided" });
    }
  });

  app.get("/api/admin/raffle-participants", requireAdmin, async (_req, res) => {
    try {
      const participants = await storage.getAllRaffleParticipants();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching raffle participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // ---------- Products ----------
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      const normalized = products.map((p: any) => {
        if (p?.images && Array.isArray(p.images) && p.images.length > 0) {
          p.imageUrl = p.images[0]
            .replace(/^\/+/, "")
            .replace(/^uploads\//, "");
        } else {
          p.imageUrl = "public/placeholder.png";
        }
        return p;
      });
      res.json(normalized);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        (product as any).imageUrl = product.images[0]
          .replace(/^\/+/, "")
          .replace(/^uploads\//, "");
      } else {
        (product as any).imageUrl = "public/placeholder.png";
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Admin products
  app.get("/api/admin/products", requireAdmin, async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteProduct(req.params.id);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res, next) => {
    try {
      await storage.deleteProduct(req.params.id);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  // ---------- Hero Slides ----------
  app.get("/api/hero-slides", async (_req, res) => {
    try {
      const slides = await storage.getAllHeroSlides();
      res.json(slides.filter((slide) => slide.active));
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ error: "Failed to fetch hero slides" });
    }
  });

  app.get("/api/admin/hero-slides", requireAdmin, async (_req, res) => {
    try {
      const slides = await storage.getAllHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ error: "Failed to fetch hero slides" });
    }
  });

  app.post("/api/admin/hero-slides", requireAdmin, async (req, res) => {
    try {
      const slideData = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error creating hero slide:", error);
      res.status(400).json({ error: "Invalid hero slide data" });
    }
  });

  app.put("/api/admin/hero-slides/:id", requireAdmin, async (req, res) => {
    try {
      const slideData = insertHeroSlideSchema.partial().parse(req.body);
      const slide = await storage.updateHeroSlide(req.params.id, slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(400).json({ error: "Failed to update hero slide" });
    }
  });

  app.delete("/api/admin/hero-slides/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteHeroSlide(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(500).json({ error: "Failed to delete hero slide" });
    }
  });

  // ---------- Object Storage ----------
  const objectStorageService = new ObjectStorageService();

  // Generar URL de subida (devuelve también objectPath)
  app.post("/api/objects/upload", requireAdmin, async (_req, res) => {
    try {
      const { uploadUrl, objectPath } =
        await objectStorageService.getObjectEntityUploadURL();

      // 👉 Devolvemos claves nuevas y también legacy
      res.json({
        method: "PUT",
        uploadUrl,            // nueva
        uploadURL: uploadUrl, // legacy
        url: uploadUrl,       // legacy
        objectPath,           // nueva
        object_path: objectPath, // legacy
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Compatibilidad antigua
  app.post("/api/upload-url", requireAdmin, async (_req, res) => {
    try {
      const { uploadUrl, objectPath } =
        await objectStorageService.getObjectEntityUploadURL();

      // 👉 Misma respuesta aquí también
      res.json({
        method: "PUT",
        uploadUrl,
        uploadURL: uploadUrl,
        url: uploadUrl,
        objectPath,
        object_path: objectPath,
      });
    } catch (error) {
      console.error("Error getting upload URL (compat):", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Finalizar subidas (acepta objectPath o URLs)
  app.post("/api/objects/finalize", requireAdmin, async (req, res) => {
    try {
      const { uploaded } = req.body;
      if (!Array.isArray(uploaded)) {
        return res
          .status(400)
          .json({ error: "Body must include 'uploaded' array" });
      }

      const finalizedPaths: string[] = [];

      for (const raw of uploaded) {
        try {
          let key: string | undefined;

          if (raw && typeof raw === "object" && "objectPath" in raw && (raw as any).objectPath) {
            key = String((raw as any).objectPath);
          } else if (typeof raw === "string") {
            key = objectStorageService.normalizeObjectEntityPath(raw);
          }

          if (!key) throw new Error("Could not determine object key");

          key = key.replace(/^\/+/, "");
          if (!key.startsWith("uploads/")) key = `uploads/${key}`;

          await objectStorageService.trySetObjectEntityAclPolicy(key, {
            owner: "admin",
            visibility: "public",
          });

          finalizedPaths.push(`/${key}`);
        } catch (innerErr) {
          console.error("Error finalizing uploaded item:", raw, innerErr);
          if (typeof raw === "string") {
            const tail = raw.split("?")[0].split("/").pop();
            if (tail) finalizedPaths.push(`/uploads/${tail}`);
          }
        }
      }

      return res.json({ success: true, finalizedPaths });
    } catch (error) {
      console.error("Error finalizing uploads:", error);
      return res.status(500).json({ error: "Failed to finalize uploads" });
    }
  });

  // Compatibilidad antigua
  app.post("/api/upload-finalize", requireAdmin, async (req, res, next) => {
    (app as any)._router.handle(
      {
        ...req,
        url: "/api/objects/finalize",
        originalUrl: "/api/objects/finalize",
      },
      res,
      next,
    );
  });

  // Servir objetos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectPath = req.params.objectPath;
    try {
      await objectStorageService.downloadObject(objectPath, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Servir imágenes subidas (con normalización)
  app.get("/uploads/:objectPath(*)", async (req, res) => {
    try {
      const requested = req.params.objectPath.replace(/^\/+/, "");
      const fullObjectPath = requested.startsWith("uploads/")
        ? requested
        : `uploads/${requested}`;

      console.log(`[routes] 🖼️ Buscando imagen: ${fullObjectPath}`);

      const file = await objectStorageService.searchPublicObject(
        fullObjectPath,
      );
      if (file) {
        console.log(`[routes] ✅ Imagen encontrada: ${file}`);
        return objectStorageService.downloadObject(file, res);
      } else {
        console.log(`[routes] ❌ Imagen NO encontrada: ${fullObjectPath}`);
        return res.status(404).end();
      }
    } catch (error: any) {
      console.error("Error serving uploaded file:", {
        message: error?.message,
        code: error?.code,
        requested: req.params.objectPath,
      });
      return res.status(500).json({ error: "Error serving file" });
    }
  });

  // Archivos públicos
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-images/:filePath(*)", async (req, res) => {
    try {
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public image:", error);
      return res.status(500).json({ error: "Error serving image" });
    }
  });

  // ---------- Site Config ----------
  app.get("/api/site-configs", async (_req, res) => {
    try {
      const configs = await storage.getSiteConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching site configs:", error);
      res.status(500).json({ error: "Failed to fetch site configs" });
    }
  });

  app.get("/api/site-configs/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const config = await storage.getSiteConfigByKey(key);
      if (!config) return res.status(404).json({ error: "Config not found" });
      res.json(config);
    } catch (error) {
      console.error("Error fetching site config:", error);
      res.status(500).json({ error: "Failed to fetch site config" });
    }
  });

  app.post("/api/admin/site-configs", requireAdmin, async (req, res) => {
    try {
      const config = await storage.createSiteConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error creating site config:", error);
      res.status(500).json({ error: "Failed to create site config" });
    }
  });

  app.put("/api/admin/site-configs/:key", requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const config = await storage.updateSiteConfig(key, req.body);
      if (!config) return res.status(404).json({ error: "Config not found" });
      res.json(config);
    } catch (error) {
      console.error("Error updating site config:", error);
      res.status(500).json({ error: "Failed to update site config" });
    }
  });

  app.delete("/api/admin/site-configs/:key", requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const success = await storage.deleteSiteConfig(key);
      if (!success) return res.status(404).json({ error: "Config not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting site config:", error);
      res.status(500).json({ error: "Failed to delete site config" });
    }
  });

  // ---------- Custom Pages ----------
  app.get("/api/admin/custom-pages", requireAdmin, async (_req, res) => {
    try {
      const pages = await storage.getAllCustomPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching custom pages:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/custom-pages", async (_req, res) => {
    try {
      const pages = await storage.getPublishedCustomPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching published custom pages:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/custom-pages/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getCustomPageBySlug(slug);
      if (!page) return res.status(404).json({ error: "Página no encontrada" });
      if (page.status !== "published")
        return res.status(404).json({ error: "Página no encontrada" });
      res.json(page);
    } catch (error) {
      console.error("Error fetching custom page by slug:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/custom-pages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.getCustomPage(id);
      if (!page) return res.status(404).json({ error: "Página no encontrada" });
      res.json(page);
    } catch (error) {
      console.error("Error fetching custom page:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/custom-pages", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCustomPageSchema.parse(req.body);
      const page = await storage.createCustomPage(validatedData);
      res.status(201).json(page);
    } catch (error: any) {
      console.error("Error creating custom page:", error);
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ error: "Datos inválidos", details: error.errors });
      }
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "Ya existe una página con ese slug" });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/custom-pages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomPageSchema.partial().parse(req.body);
      const page = await storage.updateCustomPage(id, validatedData);
      if (!page) return res.status(404).json({ error: "Página no encontrada" });
      res.json(page);
    } catch (error: any) {
      console.error("Error updating custom page:", error);
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ error: "Datos inválidos", details: error.errors });
      }
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "Ya existe una página con ese slug" });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/custom-pages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCustomPage(id);
      if (success)
        return res.json({ message: "Página eliminada exitosamente" });
      return res.status(404).json({ error: "Página no encontrada" });
    } catch (error) {
      console.error("Error deleting custom page:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ---------- Legal Pages ----------
  app.get("/api/legal-pages", async (req, res) => {
    try {
      const pages =
        req.query.all === "true"
          ? await storage.getAllLegalPages()
          : await storage.getLegalPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching legal pages:", error);
      res.status(500).json({ error: "Failed to fetch legal pages" });
    }
  });

  app.get("/api/legal-pages/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getLegalPageBySlug(slug);
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error) {
      console.error("Error fetching legal page:", error);
      res.status(500).json({ error: "Failed to fetch legal page" });
    }
  });

  app.get("/api/legal-pages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.getLegalPage(id);
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error) {
      console.error("Error fetching legal page:", error);
      res.status(500).json({ error: "Failed to fetch legal page" });
    }
  });

  app.post("/api/admin/legal-pages", requireAdmin, async (req, res) => {
    try {
      const page = await storage.createLegalPage(req.body);
      res.json(page);
    } catch (error) {
      console.error("Error creating legal page:", error);
      res.status(500).json({ error: "Failed to create legal page" });
    }
  });

  app.put("/api/admin/legal-pages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const page = await storage.updateLegalPage(id, req.body);
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error) {
      console.error("Error updating legal page:", error);
      res.status(500).json({ error: "Failed to update legal page" });
    }
  });

  app.delete("/api/admin/legal-pages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteLegalPage(id);
      if (!success) return res.status(404).json({ error: "Page not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting legal page:", error);
      res.status(500).json({ error: "Failed to delete legal page" });
    }
  });

  // ---------- Migración paths de imágenes ----------
  app.post("/api/admin/migrate-images", requireAdmin, async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      let updated = 0;

      for (const product of products) {
        if (product.images && Array.isArray(product.images)) {
          const needsUpdate = product.images.some((img: string) =>
            img.startsWith("/uploads/") || img.startsWith("uploads/"),
          );

          if (needsUpdate) {
            const updatedImages = product.images.map((img: string) => {
              if (img.startsWith("/uploads/") || img.startsWith("uploads/")) {
                return "public/placeholder.png";
              }
              return img;
            });

            await storage.updateProduct(product.id, { images: updatedImages });
            updated++;
          }
        }
      }

      res.json({
        success: true,
        message: `Migrated ${updated} products to use new image paths`,
        updatedProducts: updated,
      });
    } catch (error) {
      console.error("Error migrating image paths:", error);
      res.status(500).json({ error: "Failed to migrate image paths" });
    }
  });

  // ---------- Categories ----------
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Error al cargar categorías" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getCategory(id);
      if (!category)
        return res.status(404).json({ error: "Categoría no encontrada" });
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Error al cargar categoría" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ error: "Datos inválidos", details: error.errors });
      }
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "Ya existe una categoría con ese slug" });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      if (!category)
        return res.status(404).json({ error: "Categoría no encontrada" });
      res.json(category);
    } catch (error: any) {
      console.error("Error updating category:", error);
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ error: "Datos inválidos", details: error.errors });
      }
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "Ya existe una categoría con ese slug" });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      if (success)
        return res.json({ message: "Categoría eliminada exitosamente" });
      return res.status(404).json({ error: "Categoría no encontrada" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ---------- Admin Statistics & Analytics ----------
  app.get("/api/admin/stats/referrals", requireAdmin, async (_req, res) => {
    try {
      const referralStats = await storage.getReferralStatistics();
      res.json({ success: true, data: referralStats });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral statistics" });
    }
  });

  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50, search, authProvider, hasReferrals } =
        req.query;

      const customers = await storage.getCustomersWithStats({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        authProvider: authProvider as string,
        hasReferrals: hasReferrals === "true",
      });

      res.json({ success: true, data: customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/stats/activity", requireAdmin, async (req, res) => {
    try {
      const { period = "7d", customerId } = req.query;
      const activityStats = await storage.getActivityStatistics({
        period: period as string,
        customerId: customerId as string,
      });
      res.json({ success: true, data: activityStats });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      res.status(500).json({ error: "Failed to fetch activity statistics" });
    }
  });

  app.get("/api/admin/stats/overview", requireAdmin, async (_req, res) => {
    try {
      const overview = await storage.getDashboardOverview();
      res.json({ success: true, data: overview });
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ error: "Failed to fetch dashboard overview" });
    }
  });

  app.get("/api/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const customerDetails = await storage.getCustomerFullDetails(id);
      if (!customerDetails) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true, data: customerDetails });
    } catch (error) {
      console.error("Error fetching customer details:", error);
      res.status(500).json({ error: "Failed to fetch customer details" });
    }
  });

  app.put(
    "/api/admin/customers/:id/status",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { isActive } = req.body;
        const updated = await storage.updateCustomerStatus(id, isActive);
        if (!updated) {
          return res.status(404).json({ error: "Customer not found" });
        }
        res.json({
          success: true,
          message: `Customer ${isActive ? "activated" : "deactivated"} successfully`,
        });
      } catch (error) {
        console.error("Error updating customer status:", error);
        res.status(500).json({ error: "Failed to update customer status" });
      }
    },
  );

  app.get(
    "/api/admin/customers/:id/referrals",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const referrals = await storage.getCustomerReferrals(id);
        res.json({ success: true, data: referrals });
      } catch (error) {
        console.error("Error fetching customer referrals:", error);
        res.status(500).json({ error: "Failed to fetch customer referrals" });
      }
    },
  );

  app.get(
    "/api/admin/customers/:id/activity",
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const activities = await storage.getCustomerActivityHistory(id, {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        });

        res.json({ success: true, data: activities });
      } catch (error) {
        console.error("Error fetching customer activity:", error);
        res.status(500).json({ error: "Failed to fetch customer activity" });
      }
    },
  );

  // ---------- Launch HTTP server ----------
  const httpServer = createServer(app);
  return httpServer;
}
