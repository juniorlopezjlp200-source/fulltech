import { useState, useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { Button } from "@/components/ui/button";

export function TemporaryAd() {
  const [showAd, setShowAd] = useState(false);
  const { customer, isAuthenticated } = useCustomer();

  useEffect(() => {
    // Mostrar publicidad al cargar la página
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 500); // Pequeño delay para suavizar

    // Ocultar después de 3 segundos
    const hideTimer = setTimeout(() => {
      setShowAd(false);
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleAdClick = () => {
    if (isAuthenticated) {
      window.location.href = '/customer/dashboard';
    } else {
      window.location.href = '/login';
    }
    setShowAd(false);
  };

  if (!showAd) return null;

  return (
    <div className="fixed top-16 md:top-20 left-0 right-0 z-40 mx-4 animate-in slide-in-from-top-3 duration-500">
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 rounded-xl p-4 shadow-lg border border-white/20 max-w-lg mx-auto">
        {/* Botón de cerrar */}
        <button
          onClick={() => setShowAd(false)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <i className="fas fa-times text-white text-xs" />
        </button>

        {/* Contenido compacto de la publicidad */}
        <div className="text-center text-white pr-8">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-gift text-xl" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-sm">¡Hola {customer?.name?.split(' ')[0]}! 👋</h3>
                <p className="text-green-100 text-xs">
                  Gana <span className="font-bold text-white">RD$25</span> por referido
                </p>
                <p className="text-xs font-mono text-white mt-1">Código: {customer?.referralCode}</p>
              </div>
              <Button 
                onClick={handleAdClick}
                size="sm"
                className="bg-white text-green-600 hover:bg-green-50 font-semibold text-xs px-3 py-2"
              >
                Ver Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user-plus text-xl" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-sm">¡Únete a FULLTECH! 🚀</h3>
                <p className="text-green-100 text-xs">
                  Regístrate GRATIS y obtén <span className="font-bold text-white">10% descuento</span>
                </p>
              </div>
              <Button 
                onClick={handleAdClick}
                size="sm"
                className="bg-white text-green-600 hover:bg-green-50 font-semibold text-xs px-3 py-2"
              >
                Crear Cuenta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}