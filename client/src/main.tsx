import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import './index.css';
import { PerformanceOptimizer } from '@/utils/performanceOptimizer';
import { CacheManager } from '@/utils/cacheManager';

// Configurar QueryClient optimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Configurar fetcher global para react-query
queryClient.setQueryDefaults(['*'], {
  queryFn: async ({ queryKey }) => {
    const url = Array.isArray(queryKey) ? queryKey.join('') : queryKey;
    const response = await fetch(url as string);
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
});

// Inicializar optimizaciones de performance
const performanceOptimizer = PerformanceOptimizer.getInstance();
const cacheManager = CacheManager.getInstance();

// Precargar recursos críticos
performanceOptimizer.preloadCriticalResources();

// Inicializar cache
cacheManager.init().then(() => {
  console.log('🚀 Cache manager initialized');
  cacheManager.cleanOldCache();
});

// Configurar lazy loading para imágenes
performanceOptimizer.setupLazyLoading('img[data-lazy]', (img) => {
  const element = img as HTMLImageElement;
  if (element.dataset.src) {
    element.src = element.dataset.src;
    element.removeAttribute('data-lazy');
  }
});

// Renderizar app
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>
);
