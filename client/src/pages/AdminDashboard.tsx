import { useAdmin } from "@/hooks/useAdmin";
import { useEffect, useState } from "react";
import AdminProducts from "./AdminProducts";
import AdminHeroSlides from "./AdminHeroSlides";
import { SiteConfigForm } from "@/components/admin/SiteConfigForm";
import { LegalPagesManager } from "@/components/admin/LegalPagesManager";
import { CustomPagesManager } from "@/components/admin/CustomPagesManager";
import { CategoriesManager } from "../components/admin/CategoriesManager";
import { AdminCustomers } from "@/components/admin/AdminCustomers";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { useConfigLoader, getConfigValue } from "@/lib/config";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";

const logoDefault = "/fulltech-logo-main.png";

export default function AdminDashboard() {
  const { admin, isLoading, isAuthenticated, logout } = useAdmin();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Configuración del logo
  const configs = useConfigLoader();
  const logoUrl = getConfigValue(configs, 'logo_url') || logoDefault;
  const logoAlt = getConfigValue(configs, 'logo_alt') || 'FULLTECH Logo';
  
  // Navegación instantánea
  const { navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();
  
  // Función para ir al catálogo principal instantáneamente
  const goToCatalog = createInstantClickHandler(() => navigateInstantly('/'));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/admin/login";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { id: 'products', label: 'Productos', icon: 'fa-box' },
    { id: 'categories', label: 'Categorías', icon: 'fa-tags' },
    { id: 'hero-slides', label: 'Hero Slides', icon: 'fa-images' },
    { id: 'customers', label: 'Clientes', icon: 'fa-users' },
    { id: 'referrals', label: 'Sistema de Referidos', icon: 'fa-share-alt' },
    { id: 'analytics', label: 'Analíticas', icon: 'fa-chart-bar' },
    { id: 'site-config', label: 'Configuración del Sitio', icon: 'fa-cog' },
    { id: 'custom-pages', label: 'Páginas Personalizadas', icon: 'fa-edit' },
    { id: 'legal-pages', label: 'Páginas Legales', icon: 'fa-file-alt' }
  ];

  const renderDashboard = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard Principal</h2>
        <p className="text-gray-600">Resumen general del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-box text-blue-600 text-sm lg:text-base"></i>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Productos</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">24</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-green-600 text-sm lg:text-base"></i>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">156</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-images text-yellow-600 text-sm lg:text-base"></i>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Hero Slides</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-share-alt text-purple-600 text-sm lg:text-base"></i>
            </div>
            <div className="ml-3 lg:ml-4">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Referidos</p>
              <p className="text-lg lg:text-2xl font-semibold text-gray-900">43</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveSection('products')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-products"
          >
            <i className="fas fa-plus-circle text-xl mb-2"></i>
            <div className="font-medium">Gestionar Productos</div>
            <div className="text-sm opacity-90">Crear y editar productos</div>
          </button>
          
          <button 
            onClick={() => setActiveSection('hero-slides')}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-slides"
          >
            <i className="fas fa-image text-xl mb-2"></i>
            <div className="font-medium">Hero Slides</div>
            <div className="text-sm opacity-90">Gestionar imágenes principales</div>
          </button>
          
          <button 
            onClick={() => setActiveSection('customers')}
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-customers"
          >
            <i className="fas fa-users text-xl mb-2"></i>
            <div className="font-medium">Gestionar Clientes</div>
            <div className="text-sm opacity-90">Usuarios y perfiles</div>
          </button>
        </div>

        {/* Additional Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <button 
            onClick={() => setActiveSection('site-config')}
            className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-config"
          >
            <i className="fas fa-cog text-xl mb-2"></i>
            <div className="font-medium">Configuración del Sitio</div>
            <div className="text-sm opacity-90">Logo, colores, contacto</div>
          </button>
          
          <button 
            onClick={() => setActiveSection('custom-pages')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-custom-pages"
          >
            <i className="fas fa-edit text-xl mb-2"></i>
            <div className="font-medium">Páginas Personalizadas</div>
            <div className="text-sm opacity-90">CMS para contenido custom</div>
          </button>
          
          <button 
            onClick={() => setActiveSection('legal-pages')}
            className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-lg text-left transition-colors"
            data-testid="quick-action-legal"
          >
            <i className="fas fa-file-alt text-xl mb-2"></i>
            <div className="font-medium">Páginas Legales</div>
            <div className="text-sm opacity-90">Términos, privacidad, garantía</div>
          </button>
        </div>
      </div>

      {/* Back to Catalog */}
      <div className="mt-6 pt-6 border-t">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          data-testid="link-back-to-catalog"
        >
          <i className="fas fa-arrow-left"></i>
          Volver al Catálogo Principal
        </a>
      </div>
    </div>
  );

  const renderProducts = () => <AdminProducts />;

  const renderCategories = () => <CategoriesManager />;

  const renderHeroSlides = () => <AdminHeroSlides />;

  const renderCustomers = () => <AdminCustomers />;
  
  const renderReferrals = () => <AdminReferrals />;
  
  const renderAnalytics = () => <AdminAnalytics />;

  const renderSiteConfig = () => <SiteConfigForm />;

  const renderLegalPages = () => <LegalPagesManager />;

  const renderCustomPages = () => <CustomPagesManager />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
                data-testid="button-mobile-menu"
              >
                <i className="fas fa-bars text-gray-600"></i>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">FULLTECH</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs transition-colors"
              data-testid="button-admin-logout-mobile"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b hidden lg:block">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToCatalog}
                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm hover:shadow-md"
                title="Ir al Catálogo Principal"
                aria-label="Ir al Catálogo Principal"
              >
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className="w-8 h-8 object-contain hover:scale-110 transition-transform"
                />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">FULLTECH Catalog Admin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                data-testid="button-admin-logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="fixed top-0 left-0 bottom-0 flex flex-col w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Navegación</h2>
            </div>
            <div className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  data-testid={`nav-${item.id}-mobile`}
                >
                  <i className={`fas ${item.icon} mr-3`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white shadow-sm min-h-screen border-r">
          <nav className="p-6 w-full">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <i className={`fas ${item.icon} mr-3`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'products' && renderProducts()}
          {activeSection === 'categories' && renderCategories()}
          {activeSection === 'hero-slides' && renderHeroSlides()}
          {activeSection === 'customers' && renderCustomers()}
          {activeSection === 'referrals' && renderReferrals()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'site-config' && renderSiteConfig()}
          {activeSection === 'custom-pages' && renderCustomPages()}
          {activeSection === 'legal-pages' && renderLegalPages()}
        </main>
      </div>
    </div>
  );
}