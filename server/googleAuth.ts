import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { Express } from 'express';
import session from 'express-session';
import type { Customer } from '@shared/schema';
import { storage } from './storage';

// Configurar Google OAuth
export function setupGoogleAuth(app: Express) {
  // Configurar sesiones
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Cambiar a true en producción con HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    }
  }));

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
    (req, res) => {
      // Redireccionar al dashboard del cliente
      res.redirect('/customer/dashboard');
    }
  );

  // Unified logout endpoint for both Google and phone users
  app.get('/api/auth/logout', (req, res) => {
    // Handle Google OAuth logout
    if (req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error('Error during Google logout:', err);
        }
        // Also destroy session to clear any phone auth data
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error('Error destroying session:', sessionErr);
          }
          res.redirect('/');
        });
      });
    } else {
      // Handle phone auth logout by destroying session
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        res.redirect('/');
      });
    }
  });

  // Middleware para verificar autenticación de cliente
  app.get('/api/auth/me', async (req, res) => {
    try {
      // Check Google OAuth first
      if (req.isAuthenticated() && req.user) {
        return res.json(req.user);
      }
      
      // Check phone authentication
      if (req.session.customerId) {
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