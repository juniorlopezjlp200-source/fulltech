import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Pequeño delay para la animación de salida
    }, 2000); // Mostrar splash por 2 segundos

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center animate-fade-out">
        <div className="text-center animate-fade-out">
          <img 
            src="/fulltech-logo.png" 
            alt="FULLTECH" 
            className="w-32 h-32 mx-auto mb-4 animate-fade-out"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <div className="text-center">
        {/* 🎨 Logo FULLTECH */}
        <div className="relative mb-8">
          <img 
            src="/fulltech-logo.png" 
            alt="FULLTECH" 
            className="w-32 h-32 mx-auto animate-pulse"
          />
          
          {/* Efecto de brillo alrededor del logo */}
          <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 animate-ping"></div>
        </div>

        {/* Texto de bienvenida */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2 animate-fade-in">
          FULLTECH
        </h1>
        <p className="text-gray-600 text-sm animate-fade-in">
          Catálogo de Tecnología
        </p>

        {/* Barra de carga animada */}
        <div className="mt-8 w-48 mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-loading-bar"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 animate-fade-in">
            Cargando experiencia...
          </p>
        </div>
      </div>
    </div>
  );
}