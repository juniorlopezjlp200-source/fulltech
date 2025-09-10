import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  category: text("category").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  videos: jsonb("videos").$type<string[]>().notNull().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  onSale: boolean("on_sale").notNull().default(false),
  originalPrice: integer("original_price"), // Price before discount in cents
  rating: integer("rating").default(5), // 1-5 stars
  reviewCount: integer("review_count").default(0),
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

// Customers table (for Google OAuth and customer system)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  picture: text("picture"), // Google profile picture
  phone: text("phone"),
  address: text("address"),
  referralCode: text("referral_code").notNull().unique(), // Their unique referral code
  referredBy: varchar("referred_by"), // ID of customer who referred them
  discountEarned: integer("discount_earned").default(0), // Discount earned from referrals (in percentage)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastVisit: timestamp("last_visit"),
});

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
  unitPrice: integer("unit_price").notNull(), // Price per unit in cents
  totalPrice: integer("total_price").notNull(), // Total price in cents
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
