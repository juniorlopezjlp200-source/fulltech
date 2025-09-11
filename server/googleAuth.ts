import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { Express } from 'express';
import type { Customer } from '@shared/schema';
import { storage } from './storage';

// ✅ Configure Google OAuth - assumes session middleware already configured in routes.ts
export function setupGoogleAuth(app: Express) {
  // ✅ Initialize passport after session middleware (configured in routes.ts)
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar estrategia de Google
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://3d2437f9e7f2.replit.app';
  const callbackURL = `${baseUrl}/api/auth/google/callback`;
    
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: callbackURL,
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Buscar o crear cliente
      let customer = await storage.getCustomerByGoogleId(profile.id);
      
      if (!customer) {
        // Generar código de referencia único
        const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Crear nuevo cliente
        customer = await storage.createCustomer({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          picture: profile.photos?.[0]?.value || '',
          referralCode: referralCode
        });
      } else {
        // Actualizar última visita
        await storage.updateCustomerLastVisit(customer.id);
      }

      return done(null, customer);
    } catch (error) {
      console.error('Error in Google OAuth:', error);
      return done(error);
    }
  }));

  // Serialización de usuario
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const customer = await storage.getCustomer(id);
      done(null, customer);
    } catch (error) {
      done(error);
    }
  });

  // Rutas de autenticación
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req: any, res) => {
      // 🔒 SEGURIDAD COMPLETA: Regenerar sesión para Google OAuth
      const customer = req.user;
      req.session.regenerate((err: any) => {
        if (err) {
          console.error('Error regenerating Google OAuth session:', err);
          return res.redirect('/login?error=session');
        }
        
        req.login(customer, (loginErr: any) => {
          if (loginErr) {
            console.error('Error logging in customer after session regeneration:', loginErr);
            return res.redirect('/login?error=login');
          }
          
          req.session.save((saveErr: any) => {
            if (saveErr) {
              console.error('Error saving Google OAuth session:', saveErr);
              return res.redirect('/login?error=save');
            }
            
            // Redireccionar al dashboard del cliente
            res.redirect('/customer/dashboard');
          });
        });
      });
    }
  );

  // Unified logout endpoint for both Google and phone users
  app.post('/api/auth/logout', (req: any, res) => {
    // Handle Google OAuth logout
    if (req.isAuthenticated()) {
      req.logout((err: any) => {
        if (err) {
          console.error('Error during Google logout:', err);
        }
        // Also destroy session to clear any phone auth data
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error('Error destroying session:', sessionErr);
          }
          res.json({ success: true, message: 'Logged out successfully' });
        });
      });
    } else {
      // Handle phone auth logout by destroying session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Error destroying session' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
      });
    }
  });

  // ✅ GET /api/me endpoint - returns standardized auth status (new format)
  app.get('/api/me', async (req: any, res) => {
    try {
      // 🔒 SEGURIDAD: Deshabilitar caché para evitar datos de auth obsoletos
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      let customer = null;
      
      // Check Google OAuth first
      if (req.isAuthenticated() && req.user) {
        customer = req.user;
      }
      // Check phone authentication
      else if (req.session && req.session.customerId) {
        customer = await storage.getCustomer(req.session.customerId);
      }
      
      if (customer) {
        // Load profile data for avatar
        let profile = null;
        try {
          profile = await storage.getUserProfile(customer.id);
        } catch (err) {
          // Profile might not exist yet, that's ok
        }
        
        return res.json({
          authenticated: true,
          user: {
            id: customer.id,
            name: customer.name,
            email: customer.email || null,
            avatarUrl: profile?.avatar || customer.picture || null
          }
        });
      }
      
      res.json({ authenticated: false });
    } catch (error) {
      console.error('Error in /api/me:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // ✅ Keep legacy endpoint for backward compatibility
  app.get('/api/auth/me', async (req: any, res) => {
    try {
      // 🔒 SEGURIDAD: Deshabilitar caché para evitar datos de auth obsoletos
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Check Google OAuth first
      if (req.isAuthenticated() && req.user) {
        return res.json(req.user);
      }
      
      // Check phone authentication
      if (req.session && req.session.customerId) {
        const customer = await storage.getCustomer(req.session.customerId);
        if (customer) {
          return res.json(customer);
        }
      }
      
      res.status(401).json({ error: 'Not authenticated' });
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Middleware para proteger rutas de cliente - soporta tanto Google OAuth como autenticación por teléfono
export function requireCustomerAuth(req: any, res: any, next: any) {
  // Check Google OAuth first
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  // Check phone authentication
  if (req.session && req.session.customerId) {
    // Load customer data and set it in req.user for consistency
    storage.getCustomer(req.session.customerId)
      .then(customer => {
        if (customer) {
          req.user = customer;
          return next();
        } else {
          // Customer not found, clear invalid session
          req.session.customerId = undefined;
          res.status(401).json({ error: 'Authentication required' });
        }
      })
      .catch(error => {
        console.error('Error loading customer in requireCustomerAuth:', error);
        res.status(500).json({ error: 'Authentication error' });
      });
    return;
  }
  
  res.status(401).json({ error: 'Authentication required' });
}