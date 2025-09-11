import { useEffect, useCallback } from 'react';

// Preload routes that are likely to be visited
const routesToPreload = [
  '/login',
  '/phone-auth', 
  '/customer/dashboard',
  '/garantia',
  '/contacto'
];

export function useRoutePreloader() {
  const preloadRoute = useCallback(async (path: string) => {
    try {
      // For SPA routes, we preload by triggering a fetch to warm the cache
      const response = await fetch(path, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Preloaded route: ${path}`);
      }
    } catch (error) {
      // Silently fail for preloading
      console.log(`❌ Failed to preload route: ${path}`);
    }
  }, []);

  const preloadCommonRoutes = useCallback(() => {
    // Preload common routes with a small delay to not block initial load
    setTimeout(() => {
      routesToPreload.forEach(route => {
        preloadRoute(route);
      });
    }, 1000);
  }, [preloadRoute]);

  // Preload route on hover (predictive loading)
  const onMouseEnterPreload = useCallback((path: string) => {
    return () => {
      preloadRoute(path);
    };
  }, [preloadRoute]);

  useEffect(() => {
    preloadCommonRoutes();
  }, [preloadCommonRoutes]);

  return {
    preloadRoute,
    onMouseEnterPreload,
    preloadCommonRoutes
  };
}