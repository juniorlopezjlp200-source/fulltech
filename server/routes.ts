import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertRaffleParticipantSchema,
  adminLoginSchema,
  insertProductSchema,
  insertHeroSlideSchema,
  insertCustomPageSchema,
  insertCategorySchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setupGoogleAuth, requireCustomerAuth } from "./googleAuth";

// Session configuration
declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
  }
}

// Admin authentication middleware
const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  const admin = await storage.getAdminByEmail(req.session.adminEmail!);
  if (!admin || !admin.active) {
    req.session.destroy(() => {});
    return res
      .status(401)
      .json({ error: "Admin account not found or inactive" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  // Setup Google OAuth for customers
  setupGoogleAuth(app);

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
        const { productId, quantity, totalPrice, discountApplied } = req.body;
        const purchase = await storage.createCustomerPurchase({
          customerId: req.user.id,
          productId,
          quantity,
          unitPrice: totalPrice / quantity,
          totalPrice,
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
              const newDiscount = (referrer.discountEarned || 0) + 5;
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
      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;

      res.json({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
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

  // ---------- Products (public) ----------
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      const normalized = products.map((p: any) => {
        if (p?.imageUrl && typeof p.imageUrl === "string") {
          p.imageUrl = p.imageUrl.replace(/^\/+/, "").replace(/^uploads\//, "");
        }
        if (!p?.imageUrl || /^unknown-/.test(p.imageUrl)) {
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

      if (product.imageUrl && typeof product.imageUrl === "string") {
        product.imageUrl = product.imageUrl
          .replace(/^\/+/, "")
          .replace(/^uploads\//, "");
      }
      if (!product.imageUrl || /^unknown-/.test(product.imageUrl)) {
        product.imageUrl = "public/placeholder.png";
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // ---------- Products (admin) ----------
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

  // ✅ Devuelve 204 No Content (y pasa errores al middleware global)
  app.delete(
    "/api/admin/products/:id",
    requireAdmin,
    async (req, res, next) => {
      try {
        await storage.deleteProduct(req.params.id);
        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  );

  // ✅ Ruta espejo por si el front llama a /api/products/:id
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

  app.post("/api/upload-url", requireAdmin, async (_req, res) => {
    try {
      const { uploadUrl, objectPath } =
        await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl, objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded images con fallback (sin stacktrace 500)
  app.get("/uploads/:objectPath(*)", async (req, res) => {
    const objectPath = req.params.objectPath;
    try {
      await objectStorageService.downloadObject(objectPath, res);
    } catch (error: any) {
      // 404 → devolvemos placeholder o 404 limpio
      if (
        error instanceof ObjectNotFoundError ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        try {
          await objectStorageService.downloadObject(
            "public/placeholder.png",
            res,
          );
        } catch {
          return res.status(404).end();
        }
        return;
      }
      console.error("Error serving uploaded file:", {
        message: error?.message,
        code: error?.code,
        httpStatus: error?.$metadata?.httpStatusCode,
      });
      return res.status(500).json({ error: "Error serving file" });
    }
  });

  // Serve public assets from object storage
  app.get("/public-images/:filePath(*)", async (req, res) => {
    try {
      const filePath = `public/${req.params.filePath}`;
      await objectStorageService.downloadObject(filePath, res);
    } catch (error) {
      console.error("Error serving public image:", error);
      return res.status(500).json({ error: "Error serving image" });
    }
  });

  const httpServer = createServer(app);

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

  // ---------- Categories ----------
  app.post("/api/objects/upload", requireAdmin, async (_req, res) => {
    try {
      const { uploadUrl, objectPath } =
        await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl, objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

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

  return createServer(app);
}
