import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, pgEnum, foreignKey, check, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 🔧 Proper enum definitions for better type safety and database constraints
export const authProviderEnum = pgEnum("auth_provider", ["google", "phone"]);
export const partnerStatusEnum = pgEnum("partner_status", ["active", "inactive", "suspended"]);
export const affiliateOrderStatusEnum = pgEnum("affiliate_order_status", ["pending", "approved", "rejected"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "failed"]);
export const attributionSourceEnum = pgEnum("attribution_source", ["code", "cookie"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in RD$
  originalPrice: integer("original_price"), // Original price before discount
  category: text("category").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  onSale: boolean("on_sale").notNull().default(false),
  rating: integer("rating").default(5), // 1-5 stars
  reviewCount: integer("review_count").default(0),
  likes: integer("likes").default(0), // Número de "me gusta" del producto
});

export const heroSlides = pgTable("hero_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({
  id: true,
});

// Administrators table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Raffle participants table
export const raffleParticipants = pgTable("raffle_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const adminLoginSchema = createInsertSchema(admins).pick({
  email: true,
  password: true,
});

// Phone authentication schemas
export const phoneRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const phoneLoginSchema = z.object({
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password is required"),
});

// 👥 Customers table (soporta Google OAuth y autenticación con teléfono)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleId: text("google_id").unique(),
  email: text("email").unique(), // ✅ Ahora nullable para cuentas de teléfono
  name: text("name").notNull(),
  picture: text("picture"), // Google profile picture
  phone: text("phone").unique(), // ✅ Único para autenticación con teléfono
  address: text("address"),
  passwordHash: text("password_hash"), // ✅ Para autenticación con teléfono
  authProvider: authProviderEnum("auth_provider").notNull().default("google"), // ✅ Tipo de autenticación
  isPhoneVerified: boolean("is_phone_verified").default(false), // ✅ Verificación de teléfono
  referralCode: text("referral_code").unique(), // ✅ Ahora nullable (legacy será removido)
  referredBy: varchar("referred_by"), // ID of customer who referred them  
  discountEarned: integer("discount_earned").default(0), // Discount earned from referrals (in percentage)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastVisit: timestamp("last_visit"),
}, (table) => ({
  // 🔗 Foreign Key Relationships
  referredByFk: foreignKey({
    columns: [table.referredBy],
    foreignColumns: [table.id],
    name: "fk_customers_referred_by"
  }),
  // 🛡️ Authentication Constraints - Ensure proper auth fields based on provider
  authConstraint: check("chk_customers_auth_integrity", sql`
    (auth_provider = 'google' AND email IS NOT NULL) OR 
    (auth_provider = 'phone' AND phone IS NOT NULL AND password_hash IS NOT NULL)
  `),
  // 📊 Performance Indexes
  emailIdx: index("idx_customers_email").on(table.email),
  phoneIdx: index("idx_customers_phone").on(table.phone),
  authProviderIdx: index("idx_customers_auth_provider").on(table.authProvider),
  referredByIdx: index("idx_customers_referred_by").on(table.referredBy),
}));

// Customer activities table (visits, likes, shares)
export const customerActivities = pgTable("customer_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  activityType: text("activity_type").notNull(), // 'visit', 'like', 'share', 'purchase'
  productId: varchar("product_id"), // Product related to activity (if applicable)
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // Additional activity data
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer purchases table
export const customerPurchases = pgTable("customer_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Price per unit in RD$
  totalPrice: integer("total_price").notNull(), // Total price in RD$
  discountApplied: integer("discount_applied").default(0), // Discount percentage applied
  status: text("status").notNull().default("completed"), // 'completed', 'pending', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals table (tracks successful referrals)
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // Customer who made the referral
  referredId: varchar("referred_id").notNull(), // Customer who was referred
  status: text("status").notNull().default("pending"), // 'pending', 'qualified', 'rewarded'
  qualifiedAt: timestamp("qualified_at"), // When referral qualified (after first purchase)
  rewardGiven: boolean("reward_given").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly raffles table
export const monthlyRaffles = pgTable("monthly_raffles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  prize: text("prize").notNull(),
  description: text("description"),
  winnerId: varchar("winner_id"), // Customer who won
  isActive: boolean("is_active").notNull().default(true),
  drawDate: timestamp("draw_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Raffle entries table (who is participating in current month)
export const raffleEntries = pgTable("raffle_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  raffleId: varchar("raffle_id").notNull(),
  entries: integer("entries").notNull().default(1), // Number of entries (can accumulate)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRaffleParticipantSchema = createInsertSchema(raffleParticipants).omit({
  id: true,
  createdAt: true,
});

// New schemas for customer system
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  referralCode: true,
  createdAt: true,
  lastVisit: true,
});

export const insertCustomerActivitySchema = createInsertSchema(customerActivities).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerPurchaseSchema = createInsertSchema(customerPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  qualifiedAt: true,
});

export const insertMonthlyRaffleSchema = createInsertSchema(monthlyRaffles).omit({
  id: true,
  createdAt: true,
});

export const insertRaffleEntrySchema = createInsertSchema(raffleEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
export type PhoneRegister = z.infer<typeof phoneRegisterSchema>;
export type PhoneLogin = z.infer<typeof phoneLoginSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type RaffleParticipant = typeof raffleParticipants.$inferSelect;
export type InsertRaffleParticipant = z.infer<typeof insertRaffleParticipantSchema>;

// New types for customer system
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerActivity = typeof customerActivities.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;
export type CustomerPurchase = typeof customerPurchases.$inferSelect;
export type InsertCustomerPurchase = z.infer<typeof insertCustomerPurchaseSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type MonthlyRaffle = typeof monthlyRaffles.$inferSelect;
export type InsertMonthlyRaffle = z.infer<typeof insertMonthlyRaffleSchema>;
export type RaffleEntry = typeof raffleEntries.$inferSelect;
export type InsertRaffleEntry = z.infer<typeof insertRaffleEntrySchema>;

// Site Configuration
export const siteConfigs = pgTable("site_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description"),
  category: varchar("category").default("general"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteConfigSchema = createInsertSchema(siteConfigs).omit({
  id: true,
  updatedAt: true,
});

export type SiteConfig = typeof siteConfigs.$inferSelect;
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;

// 🔧 Feature Flags para rollout seguro del nuevo sistema
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  description: varchar("description"),
  category: varchar("category").default("system"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

// 🤝 SISTEMA DE AFILIADOS FULLTECH - Según especificación del usuario
// Partners/Socios table
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id"), // Enlace al customer existente (nullable para socios externos)
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  code: text("code").notNull().unique(), // Código único como FT-7G3X1P
  status: partnerStatusEnum("status").notNull().default("active"),
  commissionRate: integer("commission_rate").notNull().default(5), // 5% comisión por defecto
  balanceActual: integer("balance_actual").notNull().default(0), // Saldo actual en RD$ (centavos)
  gananciasTotal: integer("ganancias_total").notNull().default(0), // Ganancias totales en RD$ (centavos)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // 🔗 Foreign Key Relationships
  customerFk: foreignKey({
    columns: [table.customerId],
    foreignColumns: [customers.id],
    name: "fk_partners_customer_id"
  }),
  // 📊 Performance Indexes
  codeIdx: index("idx_partners_code").on(table.code),
  statusIdx: index("idx_partners_status").on(table.status),
  customerIdx: index("idx_partners_customer_id").on(table.customerId),
}));

// Clicks de afiliados (tracking)
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  clickId: text("click_id").notNull().unique(), // ID único para el click
  ip: text("ip"),
  userAgent: text("user_agent"),
  landingUrl: text("landing_url").notNull(), // URL donde llegó el referido
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // 🔗 Foreign Key Relationships
  partnerFk: foreignKey({
    columns: [table.partnerId],
    foreignColumns: [partners.id],
    name: "fk_affiliate_clicks_partner_id"
  }),
  // 📊 Performance Indexes
  partnerIdx: index("idx_affiliate_clicks_partner_id").on(table.partnerId),
  clickIdx: index("idx_affiliate_clicks_click_id").on(table.clickId),
}));

// Atribuciones de afiliados (conexión click -> customer)
export const affiliateAttributions = pgTable("affiliate_attributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  customerId: varchar("customer_id"), // Cliente referido (nullable hasta que se registre)
  clickId: text("click_id").notNull(), // Enlace al click original
  source: attributionSourceEnum("source").notNull().default("cookie"), // Origen de la atribución
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 30 días de expiración
}, (table) => ({
  // 🔗 Foreign Key Relationships
  partnerFk: foreignKey({
    columns: [table.partnerId],
    foreignColumns: [partners.id],
    name: "fk_affiliate_attributions_partner_id"
  }),
  customerFk: foreignKey({
    columns: [table.customerId],
    foreignColumns: [customers.id],
    name: "fk_affiliate_attributions_customer_id"
  }),
  // 🔗 Missing Foreign Key to affiliate_clicks.click_id
  clickIdFk: foreignKey({
    columns: [table.clickId],
    foreignColumns: [affiliateClicks.clickId],
    name: "fk_affiliate_attributions_click_id"
  }),
  // 🚫 Business Rule Constraints - True UNIQUE constraint
  uniqueClickId: uniqueIndex("uniq_affiliate_attributions_click_id").on(table.clickId),
  // 📊 Performance Indexes
  partnerIdx: index("idx_affiliate_attributions_partner_id").on(table.partnerId),
  customerIdx: index("idx_affiliate_attributions_customer_id").on(table.customerId),
  expiresIdx: index("idx_affiliate_attributions_expires_at").on(table.expiresAt),
}));

// Órdenes de afiliados (ventas confirmadas)
export const affiliateOrders = pgTable("affiliate_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  purchaseId: varchar("purchase_id"), // Enlace a customer_purchases (nullable)
  customerName: text("customer_name").notNull(), // Nombre del cliente que compró
  amount: integer("amount").notNull(), // Monto total de la venta en RD$ (centavos)
  commission: integer("commission").notNull(), // Comisión ganada en RD$ (centavos)
  status: affiliateOrderStatusEnum("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // ID del admin que aprobó
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // 🔗 Foreign Key Relationships
  partnerFk: foreignKey({
    columns: [table.partnerId],
    foreignColumns: [partners.id],
    name: "fk_affiliate_orders_partner_id"
  }),
  purchaseFk: foreignKey({
    columns: [table.purchaseId],
    foreignColumns: [customerPurchases.id],
    name: "fk_affiliate_orders_purchase_id"
  }),
  approvedByFk: foreignKey({
    columns: [table.approvedBy],
    foreignColumns: [admins.id],
    name: "fk_affiliate_orders_approved_by"
  }),
  // 🚫 Business Rule Constraints - Prevent double commissions (True UNIQUE constraint)
  uniquePurchaseId: uniqueIndex("uniq_affiliate_orders_purchase_id").on(table.purchaseId),
  // 📊 Performance Indexes
  partnerIdx: index("idx_affiliate_orders_partner_id").on(table.partnerId),
  statusIdx: index("idx_affiliate_orders_status").on(table.status),
  approvedAtIdx: index("idx_affiliate_orders_approved_at").on(table.approvedAt),
}));

// Pagos a socios
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  amount: integer("amount").notNull(), // Monto pagado en RD$ (centavos)
  periodStart: timestamp("period_start"), // Inicio del período del pago
  periodEnd: timestamp("period_end"), // Fin del período del pago
  status: payoutStatusEnum("status").notNull().default("pending"),
  method: text("method"), // Método de pago (transferencia, etc.)
  reference: text("reference"), // Referencia del pago
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // 🔗 Foreign Key Relationships
  partnerFk: foreignKey({
    columns: [table.partnerId],
    foreignColumns: [partners.id],
    name: "fk_payouts_partner_id"
  }),
  // 📊 Performance Indexes
  partnerIdx: index("idx_payouts_partner_id").on(table.partnerId),
  statusIdx: index("idx_payouts_status").on(table.status),
  paidAtIdx: index("idx_payouts_paid_at").on(table.paidAt),
  periodIdx: index("idx_payouts_period").on(table.periodStart, table.periodEnd),
}));

// Schemas para inserción
export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateAttributionSchema = createInsertSchema(affiliateAttributions).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateOrderSchema = createInsertSchema(affiliateOrders).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type AffiliateAttribution = typeof affiliateAttributions.$inferSelect;
export type InsertAffiliateAttribution = z.infer<typeof insertAffiliateAttributionSchema>;
export type AffiliateOrder = typeof affiliateOrders.$inferSelect;
export type InsertAffiliateOrder = z.infer<typeof insertAffiliateOrderSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

// Legal Pages
export const legalPages = pgTable("legal_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalPageSchema = createInsertSchema(legalPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LegalPage = typeof legalPages.$inferSelect;
export type InsertLegalPage = z.infer<typeof insertLegalPageSchema>;

// Custom Pages for CMS
export const customPages = pgTable("custom_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  content: text("content").notNull(),
  showInMenu: boolean("show_in_menu").default(false),
  menuSection: varchar("menu_section").default("main"), // "main" or "support"
  order: integer("order").default(0),
  status: varchar("status").default("draft"), // "draft" or "published"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomPageSchema = createInsertSchema(customPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomPage = typeof customPages.$inferSelect;
export type InsertCustomPage = z.infer<typeof insertCustomPageSchema>;

// Sessions table for express-session store
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User profiles table - extends customers with additional profile data
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().unique(),
  avatar: text("avatar"), // URL to uploaded avatar image
  cedula: text("cedula"), // Encrypted ID number
  fechaNacimiento: timestamp("fecha_nacimiento"),
  genero: varchar("genero"), // "masculino", "femenino", "otro", "prefiero-no-decir"
  provincia: text("provincia"),
  municipio: text("municipio"),
  sector: text("sector"),
  calle: text("calle"),
  referencia: text("referencia"), // Reference point for address
  profileCompleted: boolean("profile_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Foreign Key to customers table
  customerFk: foreignKey({
    columns: [table.customerId],
    foreignColumns: [customers.id],
    name: "fk_user_profiles_customer_id"
  }),
  // Performance Indexes
  customerIdx: index("idx_user_profiles_customer_id").on(table.customerId),
}));

// Categories table for CRUD management
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"), // FontAwesome icon class
  order: integer("order").default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Insert schemas for new tables
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Profile update schema for PUT requests
export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional(),
  email: z.string().email("Invalid email format").optional(),
  address: z.string().min(5, "Address is required").optional(),
  cedula: z.string().min(11, "Cédula must be at least 11 digits").optional(),
  fechaNacimiento: z.string().optional(), // ISO date string
  genero: z.enum(["masculino", "femenino", "otro", "prefiero-no-decir"]).optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  sector: z.string().optional(),
  calle: z.string().optional(),
  referencia: z.string().optional(),
});

// Complete profile wizard schema
export const completeProfileSchema = z.object({
  // Step 1: Basic data
  name: z.string().min(1, "Name is required"),
  cedula: z.string().min(11, "Cédula must be at least 11 digits"),
  fechaNacimiento: z.string(), // ISO date string
  genero: z.enum(["masculino", "femenino", "otro", "prefiero-no-decir"]),
  // Step 2: Address
  provincia: z.string().min(1, "Province is required"),
  municipio: z.string().min(1, "Municipality is required"),
  sector: z.string().min(1, "Sector is required"),
  calle: z.string().min(1, "Street is required"),
  referencia: z.string().optional(),
  address: z.string().min(5, "Complete address is required"),
  // Step 3: Avatar is handled separately in multipart upload
});

// Types for new tables
export type Session = typeof sessions.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type CompleteProfile = z.infer<typeof completeProfileSchema>;
