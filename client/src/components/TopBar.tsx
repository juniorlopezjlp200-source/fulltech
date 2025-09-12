import { useState, useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useAdmin } from "@/hooks/useAdmin";
import { useCustomPages } from "@/hooks/useCustomPages";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";
import { useRoutePreloader } from "@/hooks/useRoutePreloader";
import { useConfigLoader, getConfigValue } from "@/lib/config";
import { Link, useLocation } from "wouter";

const logoDefault = "/fulltech-logo-main.png";

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  // ---- PWA install (Android/desktop) ----
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem("pwa_installed") === "1"
    );
  });

  // Detectar iOS para ocultar botón instalar (no hay beforeinstallprompt)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // ---- iOS tip ----
  const [showIosTip, setShowIosTip] = useState<boolean>(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOSua = /iphone|ipad|ipod/.test(ua);
    const inStandalone = (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem("ios_install_tip_dismissed") === "1";
    return isIOSua && !inStandalone && !dismissed;
  });
  const closeIosTip = () => {
    setShowIosTip(false);
    localStorage.setItem("ios_install_tip_dismissed", "1");
  };

  // ✅ Detectar si estamos en páginas admin
  const isAdminPage = location.startsWith('/admin');
  
  // Hooks de autenticación
  const customerHookResult = useCustomer();
  const adminHookResult = useAdmin();
  
  // Determinar tipo de usuario y datos según la página actual
  const { customer, isAuthenticated, logout } = isAdminPage ? 
    { customer: null, isAuthenticated: false, logout: () => {} } : 
    customerHookResult;
  
  const { admin, isAuthenticated: isAdminAuthenticated } = adminHookResult;
  
  const { groupedPages } = useCustomPages();
  const { goHome, goToCustomPage, navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();
  const { onMouseEnterPreload } = useRoutePreloader();

  useConfigLoader();
  const logoUrl = getConfigValue("logo_url", logoDefault);
  const siteName = getConfigValue("site_name", "FULLTECH");
  const logoAlt = getConfigValue("logo_alt", "FULLTECH Logo");

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  // ---- PWA listeners ----
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // solo marcamos instalable si aún no está instalada
      if (!isAppInstalled) setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setShowIosTip(false);
      // recuerda que ya se instaló en este dispositivo
      localStorage.setItem("pwa_installed", "1");
      localStorage.setItem("ios_install_tip_dismissed", "1");
    };

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onModeChange = () => {
      if (mq?.matches) {
        setIsAppInstalled(true);
        setCanInstall(false);
        setShowIosTip(false);
        localStorage.setItem("pwa_installed", "1");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mq?.addEventListener?.("change", onModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mq?.removeEventListener?.("change", onModeChange);
    };
  }, [isAppInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // sin prompt (iOS / casos raros) → mostrar ayuda
      setShowIosTip(true);
      return;
    }
    setCanInstall(false);
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome !== "accepted") {
        // si canceló, podemos volver a mostrar el botón
        setCanInstall(true);
      }
    } catch {}
    setDeferredPrompt(null);
  };

  const handleShareClick = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Catálogo FULLTECH",
          text: "¡Descubre los mejores productos tech en FULLTECH!",
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 safe-area-top">
      {/* Fondo claro tipo vidrio para que el negro siempre contraste */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-blue-200/50 shadow-md px-4 py-3 flex items-center justify-between h-16 md:h-20 md:px-8">
        <button
          onClick={goHome}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          data-testid="button-home-logo"
          aria-label="Ir al inicio"
        >
          <img
            src={logoUrl}
            alt={logoAlt}
            className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-lg animate-logo-rotate hover:scale-110 transition-all duration-100 hover:drop-shadow-xl"
          />
          <div className="text-left">
            <h1 className="text-slate-900 font-extrabold tracking-tight text-xl md:text-2xl">
              {siteName}
            </h1>
            {!isAuthenticated && (
              <p className="text-slate-600 text-xs md:text-sm font-medium">
                Tecnología y herramientas
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          {/* ✅ Avatar de Usuario Autenticado - Clickeable */}
          {isAuthenticated && customer && (
            <button 
              onClick={createInstantClickHandler(() => navigateInstantly('/mi/tablero'))}
              onMouseEnter={onMouseEnterPreload('/mi/tablero')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              title="Ir a Mi Perfil"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg hover:scale-105 transition-transform">
                {customer.picture ? (
                  <img 
                    src={customer.picture} 
                    alt={customer.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <i className="fas fa-user text-white text-xs md:text-sm" />
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-slate-900 font-medium text-sm">{customer.name.split(" ")[0]}</p>
                <p className="text-slate-600 text-xs">{customer.referralCode}</p>
              </div>
            </button>
          )}

          {/* Instalar PWA (solo si es instalable, no instalada y no iOS) */}
          {canInstall && !isAppInstalled && !isIOS && (
            <button
              onClick={handleInstallClick}
              className="rounded-full p-2 md:p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              data-testid="button-install-pwa"
              title="Instalar app"
              aria-label="Instalar app"
            >
              <i className="fas fa-download text-black text-sm md:text-base" />
            </button>
          )}
          
          {/* Compartir */}
          <button
            onClick={handleShareClick}
            className="rounded-full p-2 md:p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            data-testid="button-share-app"
            title="Compartir App"
            aria-label="Compartir App"
          >
            <i className="fas fa-share-alt text-black text-sm md:text-base" />
          </button>

          {/* Menú */}
          <button
            id="menu-toggle"
            className="rounded-full p-2 md:p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            onClick={toggleMenu}
            data-testid="button-menu-toggle"
            title="Menú"
            aria-label="Abrir menú"
          >
            <i className="fas fa-bars text-black text-sm md:text-base" />
          </button>
        </div>
      </div>

      {/* TIP iOS: guía de instalación */}
      {showIosTip && !isAppInstalled && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end md:items-center md:justify-center">
          <div className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-900 font-semibold">Añadir a pantalla de inicio</h3>
              <button
                onClick={closeIosTip}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                aria-label="Cerrar"
              >
                <i className="fas fa-times text-black" />
              </button>
            </div>
            <ol className="text-slate-800 space-y-2 text-sm leading-relaxed">
              <li>1. Toca el botón <strong>Compartir</strong> (cuadro con flecha ↑) en la barra inferior.</li>
              <li>2. Elige <strong>Añadir a pantalla de inicio</strong>.</li>
              <li>3. Presiona <strong>Añadir</strong>.</li>
            </ol>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">Tip: usa Safari para mejor soporte PWA.</div>
              <button
                onClick={closeIosTip}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 MENÚ PROFESIONAL EXPANDIDO - OCUPA 50% DE PANTALLA */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-1/2 bg-gradient-to-br from-blue-900/95 via-blue-800/95 to-blue-700/95 backdrop-blur-xl border-l border-blue-300/20 shadow-2xl z-50 transition-all duration-100 overflow-y-auto ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="professional-side-menu"
      >
        {/* 🎯 Header del Menú */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={logoAlt}
                className="w-14 h-14 object-contain drop-shadow-lg"
              />
              <div>
                <h2 className="text-white font-bold text-xl">{siteName}</h2>
                <p className="text-white/70 text-sm">Menú Principal</p>
              </div>
            </div>
            <button
              onClick={closeMenu}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
              aria-label="Cerrar menú"
            >
              <i className="fas fa-times text-white text-lg" />
            </button>
          </div>
        </div>

        {/* 📱 Contenido Principal del Menú */}
        <div className="p-6 space-y-6">
          {/* 🔧 SECCIÓN DE ADMINISTRACIÓN - Solo para administradores autenticados */}
          {isAdminAuthenticated && admin && (
            <>
              <div className="space-y-2">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">
                  <i className="fas fa-crown mr-2 text-yellow-400"></i>
                  Panel de Administración
                </h4>
                
                <button
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl transition-all duration-200 border border-yellow-500/30"
                  onClick={() => {
                    closeMenu();
                    navigateInstantly("/admin/dashboard");
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                    <i className="fas fa-tachometer-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Panel de Control</p>
                    <p className="text-white/60 text-sm">Administrar sistema</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>

                <button
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl transition-all duration-200 border border-purple-500/30"
                  onClick={() => {
                    closeMenu();
                    navigateInstantly("/admin/profile");
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      {admin.picture ? (
                        <img src={admin.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <i className="fas fa-user-tie text-white text-xs" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Mi Perfil Admin</p>
                    <p className="text-white/60 text-sm">Editar información y foto</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
              </div>

              {/* Separador */}
              <div className="border-t border-white/10"></div>
            </>
          )}

          {(isAuthenticated || isAdminAuthenticated) ? (
            <>
              {/* 👤 Perfil de Usuario - Clickeable */}
              <button 
                onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/tablero'); })}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-200 w-full"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center hover:scale-105 transition-transform">
                    {customer?.picture ? (
                      <img src={customer.picture} alt={customer.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <i className="fas fa-user text-white text-xl" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-semibold text-lg">{customer?.name}</h3>
                    <p className="text-white/70 text-sm">{customer?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30">
                        <i className="fas fa-gift mr-1" />
                        {customer?.referralCode}
                      </span>
                      <i className="fas fa-chevron-right text-white/40 ml-auto" />
                    </div>
                  </div>
                </div>
              </button>

              {/* 🎯 Navegación Principal */}
              <div className="space-y-2">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Mi Cuenta</h4>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-100 border border-white/10" 
                  onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/tablero'); })}
                  onMouseEnter={onMouseEnterPreload('/mi/tablero')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-tachometer-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Mi Tablero</p>
                    <p className="text-white/60 text-sm">Dashboard personal</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-100 border border-white/10" 
                  onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/perfil'); })}
                  onMouseEnter={onMouseEnterPreload('/mi/perfil')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                    <i className="fas fa-user-edit text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Mi Perfil</p>
                    <p className="text-white/60 text-sm">Editar información</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-100 border border-white/10" 
                  onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/referir'); })}
                  onMouseEnter={onMouseEnterPreload('/mi/referir')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                    <i className="fas fa-share-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Referir Amigos</p>
                    <p className="text-white/60 text-sm">Gana descuentos</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-100 border border-white/10" 
                  onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/configuracion'); })}
                  onMouseEnter={onMouseEnterPreload('/mi/configuracion')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <i className="fas fa-cog text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Configuración</p>
                    <p className="text-white/60 text-sm">Preferencias</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-100 border border-white/10" 
                  onClick={createInstantClickHandler(() => { closeMenu(); navigateInstantly('/mi/soporte'); })}
                  onMouseEnter={onMouseEnterPreload('/mi/soporte')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <i className="fas fa-headset text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Soporte</p>
                    <p className="text-white/60 text-sm">Centro de ayuda</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>

              </div>

              {/* 📄 Páginas personalizadas */}
              {groupedPages.main && groupedPages.main.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Información</h4>
                  {groupedPages.main.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        closeMenu();
                        goToCustomPage(page.slug);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <i className="fas fa-file-alt text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{page.title}</p>
                        <p className="text-white/60 text-sm">Información importante</p>
                      </div>
                      <i className="fas fa-chevron-right text-white/40" />
                    </button>
                  ))}
                </div>
              )}

              {/* 🛡️ Enlaces importantes: Garantía y Contacto */}
              <div className="space-y-2">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Servicios</h4>
                
                <Link 
                  href="/garantia" 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10" 
                  onClick={closeMenu}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                    <i className="fas fa-shield-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Garantía</p>
                    <p className="text-white/60 text-sm">Protección total</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </Link>

                <Link 
                  href="/contacto" 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duración-200 border border-white/10" 
                  onClick={closeMenu}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                    <i className="fas fa-headset text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Contacto</p>
                    <p className="text-white/60 text-sm">Atención al cliente</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </Link>
              </div>

              {/* ⚙️ Configuraciones y Preferencias */}
              <div className="space-y-2">
                <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Configuración</h4>
                
                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10" 
                  onClick={closeMenu}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-slate-500 to-gray-600 flex items-center justify-center">
                    <i className="fas fa-cog text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Preferencias</p>
                    <p className="text-white/60 text-sm">Configurar cuenta</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>

                <button 
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10" 
                  onClick={closeMenu}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-bell text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Notificaciones</p>
                    <p className="text-white/60 text-sm">Gestionar alertas</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
              </div>

              {/* 🚪 Botón de Cerrar Sesión Profesional */}
              <div className="pt-4 border-t border-white/10">
                <button
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-600/20 hover:from-red-500/30 hover:to-pink-600/30 rounded-xl transition-all duration-200 border border-red-500/30"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  data-testid="button-logout"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
                    <i className="fas fa-sign-out-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Cerrar Sesión</p>
                    <p className="text-white/60 text-sm">Salir de mi cuenta</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 🎯 MENÚ PARA USUARIOS NO AUTENTICADOS */}
              {groupedPages.main && groupedPages.main.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Información</h4>
                  {groupedPages.main.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        closeMenu();
                        goToCustomPage(page.slug);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <i className="fas fa-file-alt text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{page.title}</p>
                        <p className="text-white/60 text-sm">Información importante</p>
                      </div>
                      <i className="fas fa-chevron-right text-white/40" />
                    </button>
                  ))}
                </div>
              )}

              {/* 🔐 Acciones de autenticación */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 rounded-xl transition-all duration-100 border border-blue-500/30"
                  onClick={createInstantClickHandler(() => {
                    closeMenu();
                    navigateInstantly("/login");
                  })}
                  onMouseEnter={onMouseEnterPreload('/login')}
                  data-testid="button-login"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <i className="fas fa-sign-in-alt text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Iniciar Sesión</p>
                    <p className="text-white/60 text-sm">Accede a tu cuenta</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>

                <button
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 rounded-xl transition-all duration-100 border border-green-500/30"
                  onClick={createInstantClickHandler(() => {
                    closeMenu();
                    navigateInstantly("/register");
                  })}
                  onMouseEnter={onMouseEnterPreload('/register')}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                    <i className="fas fa-user-plus text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Crear Cuenta</p>
                    <p className="text-white/60 text-sm">Únete y gana dinero</p>
                  </div>
                  <i className="fas fa-chevron-right text-white/40" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isMenuOpen && <div className="fixed inset-0 z-40" onClick={closeMenu} />}
    </header>
  );
}
