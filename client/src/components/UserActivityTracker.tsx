import { useEffect } from "react";
import { useCustomer } from "@/hooks/useCustomer";

export function UserActivityTracker() {
  const { customer, isAuthenticated } = useCustomer();

  useEffect(() => {
    if (!isAuthenticated || !customer) return;

    // Función para enviar actividad al servidor
    const trackActivity = async (activityType: string, metadata?: any) => {
      try {
        await fetch('/api/customer/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activityType,
            metadata: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              ...metadata
            }
          })
        });
      } catch (error) {
        console.log('Error tracking activity:', error);
      }
    };

    // Trackear visita a la página
    trackActivity('page_visit', {
      page: window.location.pathname,
      referrer: document.referrer
    });

    // Trackear tiempo en la página
    const startTime = Date.now();
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackActivity('page_time', {
        page: window.location.pathname,
        timeSpent: timeSpent
      });
    };

    // Trackear clics en productos
    const handleProductClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const productCard = target.closest('.product-card');
      if (productCard) {
        const productId = productCard.getAttribute('data-product-id');
        if (productId) {
          trackActivity('product_view', {
            productId,
            page: window.location.pathname
          });
        }
      }
    };

    // Trackear búsquedas
    const handleSearch = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'search' || target.placeholder?.includes('Buscar')) {
        const searchTerm = target.value;
        if (searchTerm.length > 2) {
          trackActivity('search', {
            query: searchTerm,
            page: window.location.pathname
          });
        }
      }
    };

    // Agregar event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleProductClick);
    document.addEventListener('input', handleSearch);

    // Cleanup
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleProductClick);
      document.removeEventListener('input', handleSearch);
    };
  }, [customer, isAuthenticated]);

  return null; // Este componente no renderiza nada
}