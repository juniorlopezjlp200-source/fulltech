import { 
  type User, type InsertUser, 
  type RaffleParticipant, type InsertRaffleParticipant, 
  type Admin, type InsertAdmin, 
  type Product, type InsertProduct, 
  type HeroSlide, type InsertHeroSlide,
  type Customer, type InsertCustomer,
  type CustomerActivity, type InsertCustomerActivity,
  type CustomerPurchase, type InsertCustomerPurchase,
  type Referral, type InsertReferral,
  type MonthlyRaffle, type InsertMonthlyRaffle,
  type RaffleEntry, type InsertRaffleEntry,
  type SiteConfig, type InsertSiteConfig,
  type LegalPage, type InsertLegalPage,
  type CustomPage, type InsertCustomPage,
  type Category, type InsertCategory,
  type FeatureFlag, type InsertFeatureFlag,
  users, admins, products, heroSlides, raffleParticipants,
  customers, customerActivities, customerPurchases,
  referrals, monthlyRaffles, raffleEntries,
  siteConfigs, legalPages, customPages, categories, featureFlags
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Admin operations
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminLastLogin(id: string): Promise<void>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Hero slide operations
  getAllHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: string): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide>;
  deleteHeroSlide(id: string): Promise<void>;

  // Raffle participant operations
  createRaffleParticipant(participant: InsertRaffleParticipant): Promise<RaffleParticipant>;
  getAllRaffleParticipants(): Promise<RaffleParticipant[]>;

  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByGoogleId(googleId: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerByReferralCode(referralCode: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer & { referralCode: string }): Promise<Customer>;
  updateCustomerLastVisit(id: string): Promise<void>;
  getAllCustomers(): Promise<Customer[]>;

  // Customer activity operations
  createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getCustomerActivities(customerId: string): Promise<CustomerActivity[]>;

  // Customer purchase operations
  createCustomerPurchase(purchase: InsertCustomerPurchase): Promise<CustomerPurchase>;
  getCustomerPurchases(customerId: string): Promise<CustomerPurchase[]>;

  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByCustomer(customerId: string): Promise<Referral[]>;
  updateReferralStatus(id: string, status: string, qualifiedAt?: Date): Promise<void>;

  // Monthly raffle operations
  getCurrentMonthlyRaffle(): Promise<MonthlyRaffle | undefined>;
  createMonthlyRaffle(raffle: InsertMonthlyRaffle): Promise<MonthlyRaffle>;
  getAllMonthlyRaffles(): Promise<MonthlyRaffle[]>;

  // Raffle entry operations
  createRaffleEntry(entry: InsertRaffleEntry): Promise<RaffleEntry>;
  getRaffleEntries(raffleId: string): Promise<RaffleEntry[]>;
  getCustomerRaffleEntries(customerId: string, raffleId: string): Promise<RaffleEntry[]>;

  // Site configuration operations
  getSiteConfigs(): Promise<SiteConfig[]>;
  getSiteConfigByKey(key: string): Promise<SiteConfig | undefined>;
  createSiteConfig(config: InsertSiteConfig): Promise<SiteConfig>;
  updateSiteConfig(key: string, config: Partial<InsertSiteConfig>): Promise<SiteConfig | undefined>;
  deleteSiteConfig(key: string): Promise<boolean>;

  // 🔧 Feature Flags operations para rollout seguro
  getFeatureFlags(): Promise<FeatureFlag[]>;
  getFeatureFlagByKey(key: string): Promise<FeatureFlag | undefined>;
  isFeatureEnabled(key: string): Promise<boolean>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(key: string, enabled: boolean): Promise<void>;

  // Legal pages operations
  getLegalPages(): Promise<LegalPage[]>;
  getAllLegalPages(): Promise<LegalPage[]>;
  getLegalPageBySlug(slug: string): Promise<LegalPage | undefined>;
  getLegalPage(id: string): Promise<LegalPage | undefined>;
  createLegalPage(page: InsertLegalPage): Promise<LegalPage>;
  updateLegalPage(id: string, page: Partial<InsertLegalPage>): Promise<LegalPage | undefined>;
  deleteLegalPage(id: string): Promise<boolean>;

  // Custom pages operations
  getAllCustomPages(): Promise<CustomPage[]>;
  getPublishedCustomPages(): Promise<CustomPage[]>;
  getCustomPageBySlug(slug: string): Promise<CustomPage | undefined>;
  getCustomPage(id: string): Promise<CustomPage | undefined>;
  createCustomPage(page: InsertCustomPage): Promise<CustomPage>;
  updateCustomPage(id: string, page: Partial<InsertCustomPage>): Promise<CustomPage | undefined>;
  deleteCustomPage(id: string): Promise<boolean>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed default data on startup
    this.seedDefaultData();
  }

  private async seedDefaultData() {
    try {
      const existingAdmin = await this.getAdminByEmail('admin@fulltech.com');
      if (!existingAdmin) {
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.insert(admins).values({
          email: 'admin@fulltech.com',
          password: hashedPassword,
          name: 'Administrador FULLTECH',
          role: 'super_admin',
          active: true
        }).onConflictDoNothing();
      }

      const existingConfigs = await this.getSiteConfigs();
      if (existingConfigs.length === 0) {
        await this.seedDefaultConfigs();
      }

      const existingPages = await this.getAllLegalPages();
      if (existingPages.length === 0) {
        await this.seedDefaultLegalPages();
      }

      const existingCategories = await this.getAllCategories();
      if (existingCategories.length === 0) {
        await this.seedDefaultCategories();
      }
    } catch (error) {
      console.error('Error seeding default data:', error);
    }
  }

  private async seedDefaultConfigs() {
    const defaultConfigs = [
      { key: 'site_name', value: 'FULLTECH', description: 'Nombre principal de la empresa', category: 'general' },
      { key: 'site_description', value: 'Tu destino tecnológico de confianza', description: 'Descripción breve de la empresa', category: 'general' },
      { key: 'site_keywords', value: 'tecnología, móviles, accesorios, iphone, samsung, xiaomi', description: 'Palabras clave para SEO', category: 'general' },
      { key: 'logo_url', value: '', description: 'URL de la imagen del logo principal (usa logo por defecto si está vacío)', category: 'branding' },
      { key: 'logo_alt', value: 'FULLTECH Logo', description: 'Descripción del logo para accesibilidad', category: 'branding' },
      { key: 'brand_color', value: '#3B82F6', description: 'Color principal de la marca', category: 'branding' },
      { key: 'header_show_search', value: 'true', description: 'Mostrar buscador en header', category: 'header' },
      { key: 'header_show_menu', value: 'true', description: 'Mostrar menú en header', category: 'header' },
      { key: 'hero_url1', value: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop', description: 'URL de la primera imagen del hero/slider', category: 'hero' },
      { key: 'hero_url2', value: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&h=600&fit=crop', description: 'URL de la segunda imagen del hero/slider', category: 'hero' },
      { key: 'hero_url3', value: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1200&h=600&fit=crop', description: 'URL de la tercera imagen del hero/slider', category: 'hero' },
      { key: 'hero_title', value: 'Bienvenidos a FULLTECH', description: 'Título principal del hero/slider', category: 'hero' },
      { key: 'hero_subtitle', value: 'Descubre la última tecnología con garantía y calidad', description: 'Subtítulo del hero/slider', category: 'hero' },
      { key: 'raffle_img', value: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=300&fit=crop', description: 'Imagen de la rifa mensual', category: 'raffle' },
      { key: 'raffle_title', value: 'Rifa Mensual FULLTECH', description: 'Título de la rifa mensual', category: 'raffle' },
      { key: 'raffle_desc', value: 'Participa cada mes y gana increíbles premios tecnológicos', description: 'Descripción de la rifa mensual', category: 'raffle' },
      { key: 'contact_phone', value: '+1 (555) 123-4567', description: 'Número de teléfono principal', category: 'contact' },
      { key: 'contact_email', value: 'contacto@fulltech.com', description: 'Email de contacto principal', category: 'contact' },
      { key: 'contact_whatsapp', value: '18295344286', description: 'Número de WhatsApp', category: 'contact' },
      { key: 'contact_hours', value: 'Lun-Vie 9:00-18:00, Sáb 9:00-14:00', description: 'Horario de atención al cliente', category: 'contact' },
      { key: 'footer_company_description', value: 'FULLTECH es tu destino tecnológico de confianza, ofreciendo los últimos dispositivos móviles y accesorios con garantía y atención personalizada.', description: 'Texto descriptivo en el footer', category: 'footer' },
      { key: 'footer_copyright', value: `© ${new Date().getFullYear()} FULLTECH. Todos los derechos reservados.`, description: 'Texto de derechos de autor', category: 'footer' },
      { key: 'footer_address', value: '123 Tech Street, Ciudad Digital, CD 12345', description: 'Dirección física de la empresa', category: 'footer' },
      { key: 'social_facebook', value: 'https://www.facebook.com/share/1AjTxuFyNH/', description: 'URL de Facebook', category: 'social' },
      { key: 'social_instagram', value: 'https://www.instagram.com/fulltech_srl?igsh=Z2V5NWY2MDJzNmdh', description: 'URL de Instagram', category: 'social' },
      { key: 'social_tiktok', value: 'https://tiktok.com/@fulltech', description: 'URL de TikTok', category: 'social' },
      { key: 'seo_title', value: 'FULLTECH - Tu Destino Tecnológico de Confianza', description: 'Título principal para motores de búsqueda', category: 'seo' },
      { key: 'seo_description', value: 'Descubre los últimos dispositivos móviles, accesorios tecnológicos y más en FULLTECH. Garantía extendida, envío gratis y atención personalizada.', description: 'Descripción meta para SEO', category: 'seo' },
    ];

    for (const config of defaultConfigs) {
      await db.insert(siteConfigs).values(config).onConflictDoNothing();
    }
  }

  private async seedDefaultLegalPages() {
    const defaultPages = [
      {
        slug: 'garantia',
        title: 'Política de Garantía',
        content: `<h2>Política de Garantía FULLTECH</h2>
        ...
        `,
        isActive: true
      },
      {
        slug: 'reembolsos',
        title: 'Política de Reembolsos',
        content: `<h2>Política de Reembolsos FULLTECH</h2>
        ...
        `,
        isActive: true
      },
      {
        slug: 'privacidad',
        title: 'Política de Privacidad',
        content: `<h2>Política de Privacidad FULLTECH</h2>
        ...
        `,
        isActive: true
      },
      {
        slug: 'terminos',
        title: 'Términos y Condiciones',
        content: `<h2>Términos y Condiciones FULLTECH</h2>
        ...
        `,
        isActive: true
      },
      {
        slug: 'sobre-nosotros',
        title: 'Sobre Nosotros',
        content: `<h2>Sobre FULLTECH</h2>
        ...
        `,
        isActive: true
      },
      {
        slug: 'contacto',
        title: 'Contacto',
        content: `<h2>Contáctanos - FULLTECH</h2>
        ...
        `,
        isActive: true
      }
    ];

    for (const page of defaultPages) {
      await db.insert(legalPages).values(page).onConflictDoNothing();
    }
  }

  private async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'Móviles y Smartphones', slug: 'moviles', order: 1, active: true },
      { name: 'Accesorios', slug: 'accesorios', order: 2, active: true },
      { name: 'Audio', slug: 'audio', order: 3, active: true },
      { name: 'Gaming', slug: 'gaming', order: 4, active: true },
      { name: 'Tablets', slug: 'tablets', order: 5, active: true },
      { name: 'Wearables', slug: 'wearables', order: 6, active: true },
      { name: 'Tecnología del Hogar', slug: 'hogar', order: 7, active: true },
      { name: 'Reacondicionados', slug: 'reacondicionados', order: 8, active: true }
    ];

    for (const category of defaultCategories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Admin operations
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await db.update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id));
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      images: Array.isArray(product.images) ? product.images : [],
      videos: Array.isArray(product.videos) ? product.videos : [],
      inStock: product.inStock ?? true,
      featured: product.featured ?? false,
      onSale: product.onSale ?? false,
      rating: product.rating || 5,
      reviewCount: product.reviewCount || 0,
    };
    const [newProduct] = await db.insert(products).values(productData as any).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const updateData: any = {};

    if (product.name !== undefined) updateData.name = product.name;
    if (product.description !== undefined) updateData.description = product.description;
    if (product.price !== undefined) updateData.price = product.price;
    if (product.category !== undefined) updateData.category = product.category;
    if (product.images !== undefined) updateData.images = Array.isArray(product.images) ? product.images : [];
    if (product.videos !== undefined) updateData.videos = Array.isArray(product.videos) ? product.videos : [];
    if (product.inStock !== undefined) updateData.inStock = product.inStock;
    if (product.featured !== undefined) updateData.featured = product.featured;
    if (product.onSale !== undefined) updateData.onSale = product.onSale;
    if (product.rating !== undefined) updateData.rating = product.rating;
    if (product.reviewCount !== undefined) updateData.reviewCount = product.reviewCount;

    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    // 1) comprobar existencia
    const [existing] = await db.select().from(products).where(eq(products.id, id));
    if (!existing) return;

    // 2) revisar referencias (compras/actividades)
    const [{ count: purchasesCount }] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(customerPurchases)
      .where(eq(customerPurchases.productId, id));

    const [{ count: activitiesCount }] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(customerActivities)
      .where(eq(customerActivities.productId, id));

    if ((purchasesCount ?? 0) > 0 || (activitiesCount ?? 0) > 0) {
      const err: any = new Error("No se puede eliminar: el producto está referenciado");
      err.status = 409;
      err.code = "FK_CONFLICT";
      err.detail = {
        productId: id,
        references: {
          purchases: purchasesCount ?? 0,
          activities: activitiesCount ?? 0,
        },
        hint: "Debes borrar o reasignar esas referencias antes de eliminar el producto.",
      };
      throw err;
    }

    // 3) sin referencias -> eliminar
    await db.delete(products).where(eq(products.id, id));
  }

  // Hero slide operations
  async getAllHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(heroSlides).orderBy(heroSlides.order);
  }

  async getHeroSlide(id: string): Promise<HeroSlide | undefined> {
    const [slide] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    return slide || undefined;
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const [newSlide] = await db.insert(heroSlides).values(slide).returning();
    return newSlide;
  }

  async updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide> {
    const [updatedSlide] = await db.update(heroSlides)
      .set(slide)
      .where(eq(heroSlides.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteHeroSlide(id: string): Promise<void> {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  // Raffle participant operations
  async createRaffleParticipant(participant: InsertRaffleParticipant): Promise<RaffleParticipant> {
    const [newParticipant] = await db.insert(raffleParticipants).values(participant).returning();
    return newParticipant;
  }

  async getAllRaffleParticipants(): Promise<RaffleParticipant[]> {
    return await db.select().from(raffleParticipants).orderBy(desc(raffleParticipants.createdAt));
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByGoogleId(googleId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.googleId, googleId));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer || undefined;
  }

  async getCustomerByReferralCode(referralCode: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.referralCode, referralCode));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer & { referralCode: string }): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomerLastVisit(id: string): Promise<void> {
    await db.update(customers)
      .set({ lastVisit: new Date() })
      .where(eq(customers.id, id));
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  // Customer activity operations
  async createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const [newActivity] = await db.insert(customerActivities).values(activity).returning();
    return newActivity;
  }

  async getCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
    return await db.select().from(customerActivities)
      .where(eq(customerActivities.customerId, customerId))
      .orderBy(desc(customerActivities.createdAt));
  }

  // Customer purchase operations
  async createCustomerPurchase(purchase: InsertCustomerPurchase): Promise<CustomerPurchase> {
    const [newPurchase] = await db.insert(customerPurchases).values(purchase).returning();
    return newPurchase;
  }

  async getCustomerPurchases(customerId: string): Promise<CustomerPurchase[]> {
    return await db.select().from(customerPurchases)
      .where(eq(customerPurchases.customerId, customerId))
      .orderBy(desc(customerPurchases.createdAt));
  }

  // Referral operations
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async getReferralsByCustomer(customerId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, customerId))
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferralStatus(id: string, status: string, qualifiedAt?: Date): Promise<void> {
    await db.update(referrals)
      .set({ status, qualifiedAt })
      .where(eq(referrals.id, id));
  }

  // Monthly raffle operations
  async getCurrentMonthlyRaffle(): Promise<MonthlyRaffle | undefined> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const [raffle] = await db.select().from(monthlyRaffles)
      .where(and(
        eq(monthlyRaffles.month, currentMonth),
        eq(monthlyRaffles.year, currentYear),
        eq(monthlyRaffles.isActive, true)
      ));

    return raffle || undefined;
  }

  async createMonthlyRaffle(raffle: InsertMonthlyRaffle): Promise<MonthlyRaffle> {
    const [newRaffle] = await db.insert(monthlyRaffles).values(raffle).returning();
    return newRaffle;
  }

  async getAllMonthlyRaffles(): Promise<MonthlyRaffle[]> {
    return await db.select().from(monthlyRaffles).orderBy(desc(monthlyRaffles.createdAt));
  }

  // Raffle entry operations
  async createRaffleEntry(entry: InsertRaffleEntry): Promise<RaffleEntry> {
    const [newEntry] = await db.insert(raffleEntries).values(entry).returning();
    return newEntry;
  }

  async getRaffleEntries(raffleId: string): Promise<RaffleEntry[]> {
    return await db.select().from(raffleEntries)
      .where(eq(raffleEntries.raffleId, raffleId))
      .orderBy(desc(raffleEntries.createdAt));
  }

  async getCustomerRaffleEntries(customerId: string, raffleId: string): Promise<RaffleEntry[]> {
    return await db.select().from(raffleEntries)
      .where(and(
        eq(raffleEntries.customerId, customerId),
        eq(raffleEntries.raffleId, raffleId)
      ));
  }

  // Site configuration operations
  async getSiteConfigs(): Promise<SiteConfig[]> {
    return await db.select().from(siteConfigs).orderBy(siteConfigs.category, siteConfigs.key);
  }

  async getSiteConfigByKey(key: string): Promise<SiteConfig | undefined> {
    const [config] = await db.select().from(siteConfigs).where(eq(siteConfigs.key, key));
    return config || undefined;
  }

  async createSiteConfig(config: InsertSiteConfig): Promise<SiteConfig> {
    const [newConfig] = await db.insert(siteConfigs).values(config).returning();
    return newConfig;
  }

  async updateSiteConfig(key: string, config: Partial<InsertSiteConfig>): Promise<SiteConfig | undefined> {
    const [updatedConfig] = await db.update(siteConfigs)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(siteConfigs.key, key))
      .returning();
    return updatedConfig || undefined;
  }

  async deleteSiteConfig(key: string): Promise<boolean> {
    const result = await db.delete(siteConfigs).where(eq(siteConfigs.key, key));
    return (result.rowCount ?? 0) > 0;
  }

  // 🔧 Feature Flags operations para rollout seguro
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags).orderBy(featureFlags.category, featureFlags.key);
  }

  async getFeatureFlagByKey(key: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
    return flag || undefined;
  }

  async isFeatureEnabled(key: string): Promise<boolean> {
    const flag = await this.getFeatureFlagByKey(key);
    return flag?.enabled || false;
  }

  async createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const [newFlag] = await db.insert(featureFlags).values(flag).returning();
    return newFlag;
  }

  async updateFeatureFlag(key: string, enabled: boolean): Promise<void> {
    await db
      .update(featureFlags)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(featureFlags.key, key));
  }

  // Legal pages operations
  async getLegalPages(): Promise<LegalPage[]> {
    return await db.select().from(legalPages)
      .where(eq(legalPages.isActive, true))
      .orderBy(legalPages.title);
  }

  async getAllLegalPages(): Promise<LegalPage[]> {
    return await db.select().from(legalPages).orderBy(legalPages.title);
  }

  async getLegalPageBySlug(slug: string): Promise<LegalPage | undefined> {
    const [page] = await db.select().from(legalPages)
      .where(and(eq(legalPages.slug, slug), eq(legalPages.isActive, true)));
    return page || undefined;
  }

  async getLegalPage(id: string): Promise<LegalPage | undefined> {
    const [page] = await db.select().from(legalPages).where(eq(legalPages.id, id));
    return page || undefined;
  }

  async createLegalPage(page: InsertLegalPage): Promise<LegalPage> {
    const [newPage] = await db.insert(legalPages).values(page).returning();
    return newPage;
  }

  async updateLegalPage(id: string, page: Partial<InsertLegalPage>): Promise<LegalPage | undefined> {
    const [updatedPage] = await db.update(legalPages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(legalPages.id, id))
      .returning();
    return updatedPage || undefined;
  }

  async deleteLegalPage(id: string): Promise<boolean> {
    const result = await db.delete(legalPages).where(eq(legalPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Custom pages operations
  async getAllCustomPages(): Promise<CustomPage[]> {
    return await db.select().from(customPages).orderBy(customPages.menuSection, customPages.order, customPages.title);
  }

  async getPublishedCustomPages(): Promise<CustomPage[]> {
    return await db.select().from(customPages)
      .where(eq(customPages.status, "published"))
      .orderBy(customPages.menuSection, customPages.order, customPages.title);
  }

  async getCustomPageBySlug(slug: string): Promise<CustomPage | undefined> {
    const [page] = await db.select().from(customPages)
      .where(eq(customPages.slug, slug));
    return page || undefined;
  }

  async getCustomPage(id: string): Promise<CustomPage | undefined> {
    const [page] = await db.select().from(customPages).where(eq(customPages.id, id));
    return page || undefined;
  }

  async createCustomPage(page: InsertCustomPage): Promise<CustomPage> {
    const [newPage] = await db.insert(customPages).values(page).returning();
    return newPage;
  }

  async updateCustomPage(id: string, page: Partial<InsertCustomPage>): Promise<CustomPage | undefined> {
    const [updatedPage] = await db.update(customPages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(customPages.id, id))
      .returning();
    return updatedPage || undefined;
  }

  async deleteCustomPage(id: string): Promise<boolean> {
    const result = await db.delete(customPages).where(eq(customPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories)
      .where(eq(categories.active, true))
      .orderBy(categories.order, categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // validar referencias de productos a la categoría
    const [{ count: productRefs }] = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(products)
      .where(eq(products.category, id));

    if ((productRefs ?? 0) > 0) {
      const err: any = new Error("No se puede eliminar: hay productos en esta categoría");
      err.status = 409;
      err.code = "FK_CONFLICT";
      err.detail = {
        categoryId: id,
        references: { products: productRefs ?? 0 },
        hint: "Mueve o elimina esos productos antes de borrar la categoría.",
      };
      throw err;
    }

    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
