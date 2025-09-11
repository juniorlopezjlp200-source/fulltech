import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import './index.css';
import { PerformanceOptimizer } from '@/utils/performanceOptimizer';
import { CacheManager } from '@/utils/cacheManager';
import { queryClient } from '@/lib/queryClient';

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
