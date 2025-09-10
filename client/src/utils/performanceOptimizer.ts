// Optimizador de Performance para FULLTECH PWA
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observers: Map<string, IntersectionObserver> = new Map();
  private preloadedResources: Set<string> = new Set();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Precargar recursos críticos
  async preloadCriticalResources(): Promise<void> {
    const criticalUrls = [
      '/api/products',
      '/api/hero-slides',
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ];

    const preloadPromises = criticalUrls.map(url => this.preloadResource(url));
    await Promise.allSettled(preloadPromises);
  }

  // Precargar recurso individual
  private async preloadResource(url: string): Promise<void> {
    if (this.preloadedResources.has(url)) return;

    try {
      if (url.startsWith('/api/')) {
        // Precargar datos de API
        await fetch(url);
      } else if (url.includes('.css')) {
        // Precargar CSS
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = url;
        document.head.appendChild(link);
      } else if (url.includes('.js')) {
        // Precargar JavaScript
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = url;
        document.head.appendChild(link);
      }

      this.preloadedResources.add(url);
    } catch (error) {
      console.warn('Failed to preload resource:', url, error);
    }
  }

  // Lazy loading con Intersection Observer
  setupLazyLoading(
    selector: string, 
    callback: (element: Element) => void,
    options: IntersectionObserverInit = {}
  ): void {
    const defaultOptions = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    this.observers.set(selector, observer);

    // Observar elementos existentes
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
  }

  // Observar nuevos elementos
  observeElement(selector: string, element: Element): void {
    const observer = this.observers.get(selector);
    if (observer) {
      observer.observe(element);
    }
  }

  // Optimizar imágenes para WebP
  async optimizeImageFormat(imageUrl: string): Promise<string> {
    if (!this.supportsWebP()) {
      return imageUrl;
    }

    try {
      // Si es Unsplash, agregar formato WebP
      if (imageUrl.includes('images.unsplash.com')) {
        const url = new URL(imageUrl);
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('q', '80'); // Calidad optimizada
        return url.toString();
      }

      return imageUrl;
    } catch (error) {
      console.warn('Failed to optimize image format:', error);
      return imageUrl;
    }
  }

  // Detectar soporte WebP
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }

  // Optimizar tamaño de imagen según viewport
  optimizeImageSize(imageUrl: string, maxWidth?: number): string {
    if (!imageUrl.includes('images.unsplash.com')) {
      return imageUrl;
    }

    try {
      const url = new URL(imageUrl);
      const deviceWidth = window.innerWidth;
      const dpr = window.devicePixelRatio || 1;
      
      // Calcular ancho óptimo
      const optimalWidth = Math.min(
        maxWidth || deviceWidth,
        deviceWidth * dpr,
        1200 // Máximo para evitar imágenes demasiado grandes
      );

      url.searchParams.set('w', optimalWidth.toString());
      url.searchParams.set('dpr', Math.min(dpr, 2).toString());
      
      return url.toString();
    } catch (error) {
      console.warn('Failed to optimize image size:', error);
      return imageUrl;
    }
  }

  // Medir performance
  measurePerformance(name: string, fn: () => void): void {
    if ('performance' in window) {
      performance.mark(`${name}-start`);
      fn();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    } else {
      fn();
    }
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Optimizar scroll performance
  optimizeScrollPerformance(container: HTMLElement): void {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Lógica de scroll optimizada
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Resource hints para navegación predictiva
  addResourceHints(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Obtener métricas de performance
  getPerformanceMetrics(): any {
    if (!('performance' in window)) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      // Tiempo de carga
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      // Tiempo hasta primer byte
      ttfb: navigation.responseStart - navigation.requestStart,
      // Tiempo hasta primer contenido
      fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      // Tiempo hasta contenido más grande
      lcp: paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0,
      // Tiempo total
      totalTime: navigation.loadEventEnd - navigation.navigationStart
    };
  }
}

// Hook para usar el optimizador
export const usePerformanceOptimizer = () => {
  return PerformanceOptimizer.getInstance();
};

// Utilidades de performance
export const PerformanceUtils = {
  // Debounce para optimizar eventos
  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle para optimizar scroll/resize
  throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Verificar si está en viewport
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Ejecutar cuando esté idle
  runWhenIdle(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 5000 });
    } else {
      setTimeout(callback, 1);
    }
  }
};