import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para motivar a los usuarios a compartir productos
 * Aplica una animación de temblor cada 15 segundos a los botones de compartir
 */
export const useShareMotivation = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Función para aplicar la animación a todos los botones de compartir
    const motivateShare = () => {
      // Verificar si el usuario prefiere movimiento reducido o si la página no está visible
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || document.visibilityState !== 'visible') return;

      // Selectores para diferentes tipos de botones de compartir
      const shareSelectors = [
        '[data-testid^="button-share"]',  // Botones de compartir en ProductCard
        '[title="Compartir"]',            // Botones con título "Compartir"
        '[aria-label="Compartir"]',       // Botones con aria-label "Compartir"
        '.fab-share-button',              // FAB de compartir en ProductDetail
        '[data-testid="button-share-app"]' // Botón de compartir app en TopBar
      ];

      // Buscar todos los botones de compartir visibles
      const shareButtons = document.querySelectorAll(shareSelectors.join(', '));
      
      // Filtrar solo elementos que están realmente visibles en el viewport
      const visibleButtons: HTMLElement[] = [];
      
      shareButtons.forEach((button) => {
        if (button instanceof HTMLElement) {
          // Verificar si el elemento es visible en CSS
          const style = getComputedStyle(button);
          if (style.visibility === 'hidden' || style.display === 'none') return;
          
          // Verificar si el elemento tiene dimensiones
          const rect = button.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          
          // Verificar si el elemento está en el viewport
          const inViewport = rect.bottom > 0 && 
                            rect.top < window.innerHeight && 
                            rect.right > 0 && 
                            rect.left < window.innerWidth;
          
          if (inViewport) {
            visibleButtons.push(button);
          }
        }
      });

      // Aplicar animación solo a botones visibles
      visibleButtons.forEach((button, index) => {
        // Aplicar la animación con un pequeño delay entre botones para efecto cascada
        setTimeout(() => {
          // Remover clases de animación previas
          button.classList.remove('animate-share-motivation');
          
          // Forzar reflow para reiniciar la animación
          void button.offsetHeight;
          
          // Aplicar la animación de motivación
          button.classList.add('animate-share-motivation');
          
          // Remover la clase después de que termine la animación
          setTimeout(() => {
            button.classList.remove('animate-share-motivation');
          }, 1200); // Duración de la animación
          
        }, index * 100); // Delay escalonado de 100ms entre botones
      });

      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Animación de motivación aplicada a ${visibleButtons.length} de ${shareButtons.length} botones de compartir`);
      }
    };

    // Ejecutar inmediatamente para mostrar el comportamiento
    initialTimeoutRef.current = setTimeout(motivateShare, 2000); // Esperar 2 segundos después del mount

    // Configurar el intervalo de 15 segundos
    intervalRef.current = setInterval(motivateShare, 15000);

    // Cleanup al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }
    };
  }, []);

  return {};
};