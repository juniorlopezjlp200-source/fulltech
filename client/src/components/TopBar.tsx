import { useState, useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { useCustomPages } from "@/hooks/useCustomPages";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useConfigLoader, getConfigValue } from "@/lib/config";
import { Link, useLocation } from "wouter";

const logoDefault =
  "data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='20' fill='%234F46E5'/%3E%3Ctext x='20' y='28' text-anchor='middle' fill='white' font-family='sans-serif' font-size='16' font-weight='bold'%3EFT%3C/text%3E%3C/svg%3E";

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  // ---- PWA install (Android/desktop) ----
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true
    );
  });

  // ---- iOS tip ----
  const [showIosTip, setShowIosTip] = useState<boolean>(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const inStandalone = (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem("ios_install_tip_dismissed") === "1";
    return isIOS && !inStandalone && !dismissed;
  });
  const closeIosTip = () => {
    setShowIosTip(false);
    localStorage.setItem("ios_install_tip_dismissed", "1");
  };

  // ✅ Detectar si estamos en páginas admin
  const isAdminPage = location.startsWith('/admin');
  
  // Siempre ejecutar useCustomer (reglas de hooks) pero ignorar resultado en admin
  const customerHookResult = useCustomer();
  const { customer, isAuthenticated, logout } = isAdminPage ? 
    { customer: null, isAuthenticated: false, logout: () => {} } : 
    customerHookResult;
  
  const { groupedPages } = useCustomPages();
  const { goHome, goToCustomPage } = useInstantNavigation();

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
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setShowIosTip(false);
      localStorage.setItem("ios_install_tip_dismissed", "1");
    };

    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onModeChange = () => {
      if (mq?.matches) {
        setIsAppInstalled(true);
        setCanInstall(false);
        setShowIosTip(false);
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
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowIosTip(true); // sin prompt (iOS) → mostrar ayuda
      return;
    }
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setCanInstall(false);
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
      <div className="bg-white/60 backdrop-blur-lg border-b border-white/70 shadow-sm px-4 py-3 flex items-center justify-between h-16 md:h-20 md:px-8">
        <button
          onClick={goHome}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          data-testid="button-home-logo"
          aria-label="Ir al inicio"
        >
          <img
            src={logoUrl}
            alt={logoAlt}
            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full ring-2 ring-blue-500/20 animate-logo-rotate hover:scale-110 transition-transform duration-300"
          />
          <div className="text-left">
            <h1 className="text-slate-900 font-extrabold tracking-tight text-xl md:text-2xl">
              {siteName}
            </h1>
            {isAuthenticated && customer && (
              <p className="text-slate-700 text-xs md:text-sm">
                Hola, <span className="font-semibold">{customer.name.split(" ")[0]}</span> 👋
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Compartir */}
          <button
            onClick={handleShareClick}
            className="rounded-full p-2 md:p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            data-testid="button-share-app"
            title="Compartir App"
            aria-label="Compartir App"
          >
            <i className="fas fa-share-alt text-slate-900 text-sm md:text-base" />
          </button>

          {/* Instalar (Android/Desktop con prompt) */}
          {canInstall && !isAppInstalled && (
            <button
              onClick={handleInstallClick}
              className="rounded-full p-2 md:p-3 bg-emerald-200 hover:bg-emerald-300 border border-emerald-300 transition-colors"
              data-testid="button-install-app"
              title="Instalar App"
              aria-label="Instalar App"
            >
              <i className="fas fa-download text-slate-900 text-sm md:text-base" />
            </button>
          )}

          {/* Menú */}
          <button
            id="menu-toggle"
            className="rounded-full p-2 md:p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            onClick={toggleMenu}
            data-testid="button-menu-toggle"
            title="Menú"
            aria-label="Abrir menú"
          >
            <i className="fas fa-bars text-slate-900 text-sm md:text-base" />
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
                <i className="fas fa-times text-slate-800" />
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

      {/* Menú desplegable */}
      <div
        className={`absolute top-20 md:top-24 right-4 md:right-8 w-64 md:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 md:p-6 z-50 transition-all duration-200 ${
          isMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
        }`}
        data-testid="dropdown-menu"
      >
        {isAuthenticated ? (
          <>
            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-3">
              <div className="flex items-center gap-3">
                <img src={customer?.picture} alt={customer?.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium text-sm text-slate-900">{customer?.name}</p>
                  <p className="text-xs text-slate-600">{customer?.email}</p>
                  <p className="text-xs text-emerald-600 font-medium">Código: {customer?.referralCode}</p>
                </div>
              </div>
            </div>

            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-user text-slate-700" />
              <span className="text-slate-900">Mi Perfil</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-heart text-slate-700" />
              <span className="text-slate-900">Favoritos</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-shopping-cart text-slate-700" />
              <span className="text-slate-900">Carrito</span>
            </button>

            <hr className="my-2 border-slate-200" />

            {groupedPages.main?.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  closeMenu();
                  goToCustomPage(page.slug);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <i className="fas fa-file-alt text-slate-700" />
                <span className="text-slate-900">{page.title}</span>
              </button>
            ))}

            {groupedPages.support?.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  closeMenu();
                  goToCustomPage(page.slug);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <i className="fas fa-headset text-slate-700" />
                <span className="text-slate-900">{page.title}</span>
              </button>
            ))}

            <Link href="/garantia" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-shield-alt text-slate-700" />
              <span className="text-slate-900">Garantía</span>
            </Link>
            <Link href="/contacto" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-headset text-slate-700" />
              <span className="text-slate-900">Contacto</span>
            </Link>

            <hr className="my-2 border-slate-200" />

            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              onClick={() => {
                closeMenu();
                logout();
              }}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt" />
              <span className="font-semibold">Cerrar Sesión</span>
            </button>
          </>
        ) : (
          <>
            {groupedPages.main?.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  closeMenu();
                  goToCustomPage(page.slug);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <i className="fas fa-file-alt text-slate-700" />
                <span className="text-slate-900">{page.title}</span>
              </button>
            ))}

            {groupedPages.support?.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  closeMenu();
                  goToCustomPage(page.slug);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <i className="fas fa-headset text-slate-700" />
                <span className="text-slate-900">{page.title}</span>
              </button>
            ))}

            <Link href="/garantia" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-shield-alt text-slate-700" />
              <span className="text-slate-900">Garantía</span>
            </Link>
            <Link href="/contacto" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors" onClick={closeMenu}>
              <i className="fas fa-headset text-slate-700" />
              <span className="text-slate-900">Contacto</span>
            </Link>

            <hr className="my-2 border-slate-200" />

            <button
              className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-blue-700 rounded-lg transition-colors"
              onClick={() => {
                closeMenu();
                window.location.href = "/login";
              }}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt" />
              <span className="font-semibold">Iniciar Sesión</span>
            </button>
          </>
        )}
      </div>

      {isMenuOpen && <div className="fixed inset-0 z-40" onClick={closeMenu} />}
    </header>
  );
}
