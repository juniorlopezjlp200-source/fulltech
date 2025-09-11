import { useCustomer } from "@/hooks/useCustomer";
import { Button } from "@/components/ui/button";

export function FixedFooter() {
  const { customer, isAuthenticated } = useCustomer();

  const handleWhatsAppShare = () => {
    const message = isAuthenticated && customer?.referralCode 
      ? `¡Mira estos increíbles productos tech en FULLTECH! 🚀\n\nUsa mi código ${customer.referralCode} y obtén descuentos especiales.\n\n${window.location.origin}/?ref=${customer.referralCode}`
      : `¡Descubre los mejores productos tecnológicos en FULLTECH! 🚀\n\n${window.location.origin}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAdClick = () => {
    if (isAuthenticated) {
      window.location.href = '/customer/dashboard';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl border-t border-white/10 text-white shadow-2xl z-40">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Compartir WhatsApp (Izquierda) */}
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fab fa-whatsapp text-lg"></i>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-sm">¡Comparte FULLTECH!</p>
              <p className="text-xs text-blue-100">
                {isAuthenticated ? 'Gana dinero compartiendo' : 'Comparte con tus amigos'}
              </p>
            </div>
            <Button 
              onClick={handleWhatsAppShare}
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white ml-3"
            >
              <i className="fab fa-whatsapp mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Compartir</span>
            </Button>
          </div>

          {/* 🎯 PUBLICIDAD CENTRAL (Centro) */}
          <div className="flex justify-center">
            <div 
              onClick={handleAdClick}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl px-6 py-3 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg border border-green-400/30"
            >
              {isAuthenticated ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <i className="fas fa-gift text-white text-sm"></i>
                    <span className="font-bold text-white text-sm">¡Gana RD$25!</span>
                  </div>
                  <p className="text-green-100 text-xs">
                    Código: <span className="font-mono font-bold text-white">{customer?.referralCode}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <i className="fas fa-user-plus text-white text-sm"></i>
                    <span className="font-bold text-white text-sm">¡Únete GRATIS!</span>
                  </div>
                  <p className="text-green-100 text-xs">10% descuento al registrarte</p>
                </div>
              )}
            </div>
          </div>

          {/* Info del Usuario/Logo (Derecha) */}
          <div className="flex items-center justify-center md:justify-end space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-xs"></i>
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-xs text-white">{customer?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-blue-100">Miembro FULLTECH</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-microchip text-white text-xs"></i>
                </div>
                <div className="hidden sm:block">
                  <p className="font-bold text-xs text-white">FULLTECH</p>
                  <p className="text-xs text-blue-100">Tecnología al mejor precio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}