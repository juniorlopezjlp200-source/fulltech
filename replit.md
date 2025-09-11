# Overview

This is a modern full-stack e-commerce catalog application called "FULLTECH" built with React, TypeScript, Express.js, and PostgreSQL. The application serves as a product catalog with a mobile-first design, featuring a Progressive Web App (PWA) interface for browsing technology products. The system includes components for product display, category filtering, search functionality, WhatsApp integration for order inquiries, and a comprehensive administrative interface for managing the platform.

## Recent Changes (September 11, 2025)

### Administrative Interface Modernization ✅ COMPLETED
- **AdminDashboard Updated**: Completely removed all raffle/lottery references and modernized with FULLTECH e-commerce theming
- **New Admin Components**: Created AdminCustomers.tsx, AdminReferrals.tsx, and AdminAnalytics.tsx for comprehensive admin management
- **Footer Management**: Fixed footer hiding on all admin routes (/admin, /admin/*, including root /admin route)
- **Navigation Enhancement**: Added admin-specific menu section in TopBar with crown icon, showing Panel de Control and Mi Perfil Admin options
- **AdminProfile Created**: Complete admin profile management page with photo upload capability using ObjectUploader
- **Theme Consistency**: All admin interfaces now use consistent FULLTECH branding and color scheme

### Production Deployment Preparation ✅ COMPLETED
- **Critical Security Vulnerabilities Fixed**: Eliminated hardcoded admin password 'admin123', now requires ADMIN_DEFAULT_PASSWORD environment variable with fail-fast validation
- **Production Logging Secured**: Disabled API response body logging in production to prevent sensitive data exposure in logs
- **TypeScript Errors Resolved**: Fixed all LSP diagnostics and type errors for clean production build
- **Code Cleanup**: Removed debug code, temporary files, and optimized .gitignore for production
- **EasyPanel Configuration**: Set up autoscale deployment configuration with proper build and start commands
- **Build Verification**: Confirmed successful production build (1.076MB frontend, 124.4kb server) with no critical errors
- **Security Audit Passed**: Architect verification confirmed no severe security risks for GitHub/EasyPanel deployment

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using React 18 with TypeScript and Vite for build tooling. The application follows a component-based architecture with:

- **UI Components**: Built with Radix UI primitives and styled with Tailwind CSS using the shadcn/ui design system
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom CSS variables for theming, including dark mode support
- **Mobile-First Design**: Responsive design optimized for mobile devices with touch interactions

## Backend Architecture
The server-side uses Express.js with TypeScript in ESM module format:

- **API Layer**: RESTful API with Express.js middleware for request handling
- **Database Layer**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development
- **Development Setup**: Vite integration for hot module replacement during development

## Data Storage Solutions
The application uses PostgreSQL as the primary database with:

- **Schema Management**: Drizzle ORM with schema definitions in TypeScript
- **Tables**: Users, products, and hero slides with proper relationships and constraints
- **Migration System**: Drizzle Kit for database migrations and schema updates
- **Development Storage**: In-memory storage implementation for rapid development

## Authentication and Authorization
Currently implements a basic user system with:

- **User Model**: Simple username/password authentication structure
- **Session Management**: Prepared for session-based authentication
- **Security**: Basic password handling with room for bcrypt integration

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe ORM for database operations (drizzle-orm, drizzle-zod)

### UI and Styling Libraries
- **Radix UI**: Complete set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Class Variance Authority**: Component variant management
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds

### Image and Media Handling
- **Unsplash**: External image service for product and hero images
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography

### Third-Party Integrations
- **WhatsApp Business**: Direct messaging integration for customer inquiries
- **PWA Capabilities**: Service worker support and app manifest for offline functionality

The application architecture emphasizes type safety, developer experience, and mobile performance while maintaining flexibility for future feature additions.