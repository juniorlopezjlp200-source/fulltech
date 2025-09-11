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

// Session configuration
declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
    customerId?: string;
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
  // ✅ Configure trust proxy for proper cookie handling behind proxies
  app.set('trust proxy', 1);
  
  // ✅ Configure persistent session store with Postgres
  const PgSession = connectPgSimple(session);
  const pgSessionStore = new PgSession({
    connectionString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: true, // Auto-create table if missing
  });

  // Configure session middleware with persistent store
  app.use(
    session({
      store: pgSessionStore,
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production
        httpOnly: true, // ✅ Prevent XSS
        sameSite: 'lax', // ✅ CSRF protection + compatibility
        maxAge: 90 * 24 * 60 * 60 * 1000, // ✅ 90 days as specified
      },
      name: 'sid', // ✅ Custom session ID name
    }),
  );

  // Setup Google OAuth for customers
  setupGoogleAuth(app);
  
  // ✅ requireCustomerAuth middleware is imported from googleAuth.ts and supports:
  // - Google OAuth authentication (req.isAuthenticated() && req.user)
  // - Phone authentication (req.session.customerId)
  // - Automatically loads customer data into req.user
  // - Returns 401 for unauthenticated API requests
  // Example usage: app.get('/api/protected-route', requireCustomerAuth, handler)

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

  // Customer profile endpoints
  app.get(
    "/api/customer/profile",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        let profile = await storage.getUserProfile(req.user.id);
        
        // Create profile if it doesn't exist
        if (!profile) {
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            firstName: req.user.name?.split(' ')[0] || '',
            lastName: req.user.name?.split(' ').slice(1).join(' ') || '',
            phone: req.user.phone || '',
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
        
        // Check if profile exists
        let profile = await storage.getUserProfile(req.user.id);
        
        if (!profile) {
          // Create new profile
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            ...profileData,
          });
        } else {
          // Update existing profile
          profile = await storage.updateUserProfile(req.user.id, profileData);
        }
        
        res.json(profile);
      } catch (error) {
        console.error("Error updating customer profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
      }
    },
  );

  // Customer preferences endpoints
  app.get(
    "/api/customer/preferences",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        const profile = await storage.getUserProfile(req.user.id);
        
        // Extract preferences from profile or return defaults
        const preferences = profile?.preferences || {
          notifications: {
            email: true,
            sms: false,
            push: true,
            marketing: false,
            referralUpdates: true,
            orderUpdates: true
          },
          settings: {
            language: 'es',
            currency: 'DOP',
            theme: 'light',
            autoLogin: true,
            dataSharing: false
          }
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
        
        // Get or create profile
        let profile = await storage.getUserProfile(req.user.id);
        
        const preferences = {
          notifications: notifications || {},
          settings: settings || {}
        };

        if (!profile) {
          // Create new profile with preferences
          profile = await storage.createUserProfile({
            customerId: req.user.id,
            preferences,
          });
        } else {
          // Update existing profile preferences
          const updatedPreferences = {
            ...profile.preferences,
            ...preferences
          };
          profile = await storage.updateUserProfile(req.user.id, { 
            preferences: updatedPreferences 
          });
        }
        
        res.json({ success: true, preferences: profile?.preferences });
      } catch (error) {
        console.error("Error updating customer preferences:", error);
        res.status(500).json({ error: "Failed to update preferences" });
      }
    },
  );

  // Support tickets endpoints
  app.get(
    "/api/customer/support-tickets",
    requireCustomerAuth,
    async (req: any, res) => {
      try {
        // For now, return mock support tickets
        // In a real implementation, you'd query from a support_tickets table
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
          }
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
        const { type, subject, message, priority = 'normal' } = req.body;
        
        if (!type || !subject || !message) {
          return res.status(400).json({ error: "Type, subject, and message are required" });
        }

        // For now, create a mock ticket response
        // In a real implementation, you'd insert into a support_tickets table
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

        // In a real implementation, you could also:
        // - Send email notification to support team
        // - Create a Slack notification
        // - Add to a ticketing system like Zendesk
        
        console.log("📧 New support ticket created:", ticket);
        
        res.json({ success: true, ticket });
      } catch (error) {
        console.error("Error creating support ticket:", error);
        res.status(500).json({ error: "Failed to create support ticket" });
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

  // ---------- Phone Authentication ----------
  app.post("/api/auth/phone/register", async (req, res) => {
    try {
      const { name, phone, address, password } = phoneRegisterSchema.parse(req.body);
      
      // Check if phone already exists
      const existingCustomer = await storage.getCustomerByPhone(phone);
      if (existingCustomer) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate referral code
      const referralCode = `FT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create customer
      const customer = await storage.createCustomer({
        name,
        phone,
        address,
        passwordHash,
        authProvider: 'phone',
        referralCode,
        isPhoneVerified: false,
      });

      // Set session (same pattern as admin login)
      req.session.customerId = customer.id;
      
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

      if (customer.authProvider !== 'phone' || !customer.passwordHash) {
        return res.status(401).json({ error: "Invalid authentication method" });
      }

      const passwordMatch = await bcrypt.compare(password, customer.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last visit
      await storage.updateCustomerLastVisit(customer.id);
      
      // Set session (same pattern as admin login)
      req.session.customerId = customer.id;

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
    } catch (error) {
      console.error("Phone login error:", error);
      res.status(400).json({ error: "Invalid data provided" });
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
        // Use first image from images array for backward compatibility
        if (p?.images && Array.isArray(p.images) && p.images.length > 0) {
          p.imageUrl = p.images[0].replace(/^\/+/, "").replace(/^uploads\//, "");
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

      // Use first image from images array for backward compatibility
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        (product as any).imageUrl = product.images[0].replace(/^\/+/, "").replace(/^uploads\//, "");
      } else {
        (product as any).imageUrl = "public/placeholder.png";
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

  // Endpoint para obtener URL de subida para múltiples archivos (soporta carpetas)
  app.post("/api/objects/upload", requireAdmin, async (_req, res) => {
    try {
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ 
        method: 'PUT',
        url: uploadUrl
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint para finalizar archivos subidos (convertir URLs temporales a paths permanentes)
  app.post("/api/objects/finalize", requireAdmin, async (req, res) => {
    try {
      const { uploadedUrls } = req.body;
      if (!uploadedUrls || !Array.isArray(uploadedUrls)) {
        return res.status(400).json({ error: "uploadedUrls array is required" });
      }
      
      const finalizedPaths = [];
      
      for (const uploadUrl of uploadedUrls) {
        try {
          // Normalizar el path para S3 propio
          const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadUrl);
          
          // Para S3 propio, configurar como público
          await objectStorageService.trySetObjectEntityAclPolicy(uploadUrl, {
            owner: 'admin',
            visibility: 'public'
          });
          
          // 🔧 FIX: Añadir prefijo /uploads/ solo si no existe ya
          const finalPath = normalizedPath.startsWith('uploads/') ? 
            `/${normalizedPath}` : 
            `/uploads/${normalizedPath}`;
            
          finalizedPaths.push(finalPath);
        } catch (error) {
          console.error('Error finalizing upload URL:', uploadUrl, error);
          // Fallback: usar el path base del upload
          const fallbackPath = `/uploads/${uploadUrl.split('/').pop()}`;
          finalizedPaths.push(fallbackPath);
        }
      }
      
      res.json({ 
        success: true,
        finalizedPaths
      });
    } catch (error) {
      console.error("Error finalizing uploads:", error);
      res.status(500).json({ error: "Failed to finalize uploads" });
    }
  });

  // Endpoint legacy para compatibilidad
  app.post("/api/upload-url", requireAdmin, async (_req, res) => {
    try {
      const uploadResult = await objectStorageService.getObjectEntityUploadURL();
      res.json({ 
        uploadUrl: uploadResult.uploadUrl, 
        objectPath: uploadResult.objectPath 
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Servir archivos desde S3 propio
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

  // Serve uploaded images con fallback (sin stacktrace 500) - legacy
  app.get("/uploads/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      
      // 🔧 FIX: Normalizar para evitar duplicación uploads/uploads/
      const requested = req.params.objectPath.replace(/^\/+/, "");
      const fullObjectPath = requested.startsWith("uploads/") ? requested : `uploads/${requested}`;
      
      console.log(`[routes] 🖼️ Buscando imagen: ${fullObjectPath}`);
      
      const file = await objectStorageService.searchPublicObject(fullObjectPath);
      if (file) {
        console.log(`[routes] ✅ Imagen encontrada: ${file}`);
        await objectStorageService.downloadObject(file, res);
      } else {
        console.log(`[routes] ❌ Imagen NO encontrada: ${fullObjectPath}`);
        return res.status(404).end();
      }
    } catch (error: any) {
      console.error("Error serving uploaded file:", {
        message: error?.message,
        code: error?.code,
        requested: req.params.objectPath
      });
      return res.status(500).json({ error: "Error serving file" });
    }
  });

  // Servir archivos públicos desde object storage
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

  // Legacy endpoint for public images
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

  // Endpoint de migración para actualizar paths de imágenes existentes
  app.post("/api/admin/migrate-images", requireAdmin, async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      let updated = 0;
      
      for (const product of products) {
        if (product.images && Array.isArray(product.images)) {
          const needsUpdate = product.images.some((img: string) => 
            img.startsWith('/uploads/') || img.startsWith('uploads/')
          );
          
          if (needsUpdate) {
            // Por ahora usar placeholder, luego el usuario puede subir imágenes nuevas
            const updatedImages = product.images.map((img: string) => {
              if (img.startsWith('/uploads/') || img.startsWith('uploads/')) {
                return 'public/placeholder.png';
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
        updatedProducts: updated 
      });
    } catch (error) {
      console.error('Error migrating image paths:', error);
      res.status(500).json({ error: 'Failed to migrate image paths' });
    }
  });

  // ---------- Categories ----------
  app.post("/api/objects/upload", requireAdmin, async (_req, res) => {
    try {
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ 
        method: 'PUT',
        url: uploadUrl 
      });
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
