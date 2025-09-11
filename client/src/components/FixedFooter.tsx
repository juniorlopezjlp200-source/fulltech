import { useState } from "react";
import { useCustomer } from "@/hooks/useCustomer";
import { Button } from "@/components/ui/button";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { useInstantFeedback } from "@/hooks/useInstantFeedback";
import { useRoutePreloader } from "@/hooks/useRoutePreloader";

export function FixedFooter() {
  const { customer, isAuthenticated } = useCustomer();
  const [isExpanded, setIsExpanded] = useState(false);
  const { navigateInstantly } = useInstantNavigation();
  const { createInstantClickHandler } = useInstantFeedback();
  const { onMouseEnterPreload } = useRoutePreloader();

  const handleWhatsAppShare = () => {
    const message = isAuthenticated && customer?.referralCode 
      ? `¡Mira estos increíbles productos tech en FULLTECH! 🚀\n\nUsa mi código ${customer.referralCode} y obtén descuentos especiales.\n\n${window.location.origin}/?ref=${customer.referralCode}`
      : `¡Descubre los mejores productos tecnológicos en FULLTECH! 🚀\n\n${window.location.origin}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAdClick = createInstantClickHandler(() => {
    if (isAuthenticated) {
      navigateInstantly('/mi/tablero');
    } else {
      navigateInstantly('/login');
    }
  });

  const handleFacebookClick = () => {
    window.open('https://facebook.com/fulltechrd', '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://instagram.com/fulltechrd', '_blank');
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <footer 
      className={`fixed left-0 right-0 bg-gradient-to-r from-blue-900/95 via-blue-800/95 to-blue-700/95 backdrop-blur-xl border-t border-blue-300/20 text-white shadow-2xl z-40 transition-all duration-100 ${isExpanded ? 'h-auto' : 'h-16 md:h-20'}`}
      style={{
        bottom: 'env(safe-area-inset-bottom)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="max-w-full mx-auto px-3 md:px-4">
        
        {/* 📱 FOOTER COMPACTO MÓVIL (Siempre visible) */}
        <div className={`${isExpanded ? 'py-2' : 'py-3 md:py-4'} transition-all duration-300`}>
          <div className="flex items-center justify-between md:grid md:grid-cols-3 md:gap-4">
            
            {/* Redes Sociales (Izquierda) - Visibles en móvil */}
            <div className="flex items-center gap-2 md:justify-start">
              <button 
                onClick={handleFacebookClick}
                className="w-8 h-8 bg-blue-600/80 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                title="Síguenos en Facebook"
              >
                <i className="fab fa-facebook-f text-white text-sm"></i>
              </button>
              <button 
                onClick={handleInstagramClick}
                className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center transition-colors"
                title="Síguenos en Instagram"
              >
                <i className="fab fa-instagram text-white text-sm"></i>
              </button>
              {/* WhatsApp solo desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fab fa-whatsapp text-sm"></i>
                </div>
                <div className="hidden lg:block">
                  <p className="font-semibold text-xs">¡Comparte!</p>
                  <p className="text-xs text-blue-100">Gana dinero</p>
                </div>
                <Button 
                  onClick={handleWhatsAppShare}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white text-xs"
                >
                  <i className="fab fa-whatsapp mr-1"></i>
                  Compartir
                </Button>
              </div>
            </div>

            {/* Publicidad Central (Centro) */}
            <div className="flex justify-center md:flex">
              <div 
                onClick={handleAdClick}
                onMouseEnter={onMouseEnterPreload(isAuthenticated ? '/mi/tablero' : '/login')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg px-3 py-2 md:px-4 md:py-2 cursor-pointer transition-all duration-100 transform hover:scale-105 shadow-lg border border-blue-400/30"
              >
                {isAuthenticated ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <i className="fas fa-gift text-white text-xs"></i>
                      <span className="font-bold text-white text-xs md:text-sm">¡5%!</span>
                    </div>
                    <p className="text-blue-100 text-xs hidden md:block">
                      {customer?.referralCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <i className="fas fa-user-plus text-white text-xs"></i>
                      <span className="font-bold text-white text-xs md:text-sm">¡Únete!</span>
                    </div>
                    <p className="text-blue-100 text-xs hidden md:block">10% descuento</p>
                  </div>
                )}
              </div>
            </div>

            {/* Flecha + Logo (Derecha) */}
            <div className="flex items-center gap-2 md:justify-end">
              {/* Logo/Usuario */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-xs"></i>
                  </div>
                  <div className="hidden md:block">
                    <p className="font-medium text-xs text-white">{customer?.name?.split(' ')[0]}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-microchip text-white text-xs"></i>
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-bold text-xs text-white">FULLTECH</p>
                  </div>
                </div>
              )}
              
              {/* Flecha Expandir */}
              <button 
                onClick={toggleExpansion}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300"
                title={isExpanded ? 'Contraer' : 'Expandir'}
              >
                <i className={`fas fa-chevron-up text-white text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* 🎯 CONTENIDO EXPANDIDO (Solo cuando está expandido) */}
        {isExpanded && (
          <div className="border-t border-white/20 py-4 animate-in slide-in-from-bottom-3 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Publicidad Expandida */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <i className="fas fa-crown text-yellow-300 text-lg"></i>
                    <h3 className="font-bold text-white text-sm">¡GANA DINERO FÁCIL!</h3>
                  </div>
                  <p className="text-white/90 text-xs mb-3">
                    {isAuthenticated 
                      ? `Comparte tu código ${customer?.referralCode} y gana 5% de cada compra de tus referidos`
                      : 'Regístrate GRATIS y obtén 10% descuento + gana dinero refiriendo amigos'
                    }
                  </p>
                  <button 
                    onClick={handleAdClick}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    {isAuthenticated ? 'Ver Dashboard' : 'Crear Cuenta'}
                  </button>
                </div>
              </div>

              {/* Redes Sociales Expandidas */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <h4 className="font-bold text-white text-sm mb-3 text-center">📱 ¡Síguenos!</h4>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleFacebookClick}
                    className="flex flex-col items-center gap-1 bg-blue-600/80 hover:bg-blue-600 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <i className="fab fa-facebook-f text-white text-lg group-hover:scale-110 transition-transform"></i>
                    <span className="text-white text-xs font-medium">Facebook</span>
                  </button>
                  <button 
                    onClick={handleInstagramClick}
                    className="flex flex-col items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <i className="fab fa-instagram text-white text-lg group-hover:scale-110 transition-transform"></i>
                    <span className="text-white text-xs font-medium">Instagram</span>
                  </button>
                  <button 
                    onClick={handleWhatsAppShare}
                    className="flex flex-col items-center gap-1 bg-green-600/80 hover:bg-green-600 rounded-xl px-4 py-3 transition-colors group md:hidden"
                  >
                    <i className="fab fa-whatsapp text-white text-lg group-hover:scale-110 transition-transform"></i>
                    <span className="text-white text-xs font-medium">Compartir</span>
                  </button>
                </div>
                <p className="text-center text-white/70 text-xs mt-2">
                  ¡Entérate de ofertas exclusivas y novedades!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}