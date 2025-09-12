import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Mostrar contenido después de un pequeño delay
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // Ocultar splash después de 3 segundos
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Delay para animación de salida
    }, 3000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-white to-black z-[9999] flex items-center justify-center animate-splash-fade-out">
        <div className="text-center animate-splash-zoom-out">
          <img
            src="/fulltech-logo-transparent.png"
            alt="FULLTECH"
            className="w-24 h-24 mx-auto opacity-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-white to-black z-[9999] flex items-center justify-center">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-white/95 to-black/90"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/10 to-transparent animate-pulse"></div>

      <div
        className={`text-center relative z-10 transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Logo FULLTECH con animaciones profesionales */}
        <div className="relative mb-8">
          {/* Círculo de fondo animado */}
          <div className="absolute inset-0 w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-blue-600/20 via-white/30 to-gray-900/20 animate-spin-slow"></div>
          <div className="absolute inset-0 w-36 h-36 mx-auto mt-2 ml-2 rounded-full bg-gradient-to-l from-white/40 via-blue-400/20 to-black/10 animate-pulse"></div>

          {/* Logo principal */}
          <div className="relative">
            <img
              src="/fulltech-logo-transparent.png"
              alt="FULLTECH"
              className="w-32 h-32 mx-auto relative z-10 animate-logo-float drop-shadow-2xl"
            />

            {/* Efecto de brillo dinámico */}
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-400/30 via-white/50 to-blue-600/30 animate-ping opacity-75"></div>
            <div className="absolute inset-0 w-28 h-28 mx-auto mt-2 ml-2 rounded-full bg-gradient-to-r from-white/60 via-blue-300/40 to-black/20 animate-pulse"></div>
          </div>
        </div>

        {/* Mensaje de bienvenida profesional */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-gray-900 to-black animate-title-shine">
            Bienvenido a FULLTECH
          </h1>

          <p className="text-lg md:text-xl font-semibold text-gray-700 animate-subtitle-fade">
            Herramientas y tecnología a tu alcance
          </p>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-700 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-black rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>

        {/* Barra de progreso elegante */}
        <div className="mt-12 w-64 mx-auto">
          <div className="w-full bg-gray-200/50 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-gray-900 rounded-full animate-loading-progress shadow-lg"></div>
          </div>
          <p className="text-xs text-gray-500 mt-3 animate-fade-in font-medium tracking-wide">
            Preparando tu experiencia tecnológica...
          </p>
        </div>
      </div>
    </div>
  );
}
