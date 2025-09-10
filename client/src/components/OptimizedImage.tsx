import { useState, useRef, useEffect, memo } from 'react';
import { useCacheManager, ImageOptimizer } from '@/utils/cacheManager';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Componente de imagen optimizada con cache inteligente
export const OptimizedImage = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  placeholder,
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const cacheManager = useCacheManager();

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px' // Cargar 50px antes de que sea visible
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [loading]);

  // Cargar imagen cuando sea visible
  useEffect(() => {
    if (!isVisible || !src) return;

    let isMounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Intentar obtener desde cache primero
        const cachedImage = await cacheManager.cacheImage(src);
        
        if (isMounted) {
          // Optimizar imagen para el dispositivo
          const optimizedSrc = await ImageOptimizer.optimizeForDevice(cachedImage, width);
          
          // Precargar imagen antes de mostrarla
          const img = new Image();
          img.onload = () => {
            if (isMounted) {
              setImageSrc(optimizedSrc);
              setIsLoading(false);
              onLoad?.();
            }
          };
          img.onerror = () => {
            if (isMounted) {
              setHasError(true);
              setIsLoading(false);
              onError?.();
            }
          };
          img.src = optimizedSrc;
        }
      } catch (error) {
        console.error('Error loading optimized image:', error);
        if (isMounted) {
          // Fallback a imagen original
          setImageSrc(src);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [isVisible, src, width, cacheManager, onLoad, onError]);

  // Placeholder mientras carga
  const renderPlaceholder = () => (
    <div 
      className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-400 text-sm">
        <i className="fas fa-image text-2xl mb-2"></i>
        <div>Cargando...</div>
      </div>
    </div>
  );

  // Error placeholder
  const renderError = () => (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-500 text-center text-sm">
        <i className="fas fa-exclamation-triangle text-xl mb-2"></i>
        <div>Error al cargar</div>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className="relative">
      {isLoading && renderPlaceholder()}
      {hasError && !isLoading && renderError()}
      {!isLoading && !hasError && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${className}`}
          width={width}
          height={height}
          style={{ opacity: isLoading ? 0 : 1 }}
          loading={loading}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Hook para precargar imágenes
export function useImagePreloader(urls: string[]) {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const cacheManager = useCacheManager();

  useEffect(() => {
    const preloadImages = async () => {
      const promises = urls.map(async (url) => {
        try {
          await cacheManager.cacheImage(url);
          return url;
        } catch (error) {
          console.error('Error preloading image:', url, error);
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const loaded = results
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => (result as PromiseFulfilledResult<string>).value);

      setPreloadedImages(new Set(loaded));
    };

    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls, cacheManager]);

  return preloadedImages;
}

// Componente de galería optimizada
interface OptimizedGalleryProps {
  images: string[];
  className?: string;
  itemClassName?: string;
  columns?: number;
}

export const OptimizedGallery = memo(({
  images,
  className = '',
  itemClassName = '',
  columns = 3
}: OptimizedGalleryProps) => {
  // Precargar las primeras imágenes
  const priorityImages = images.slice(0, 6);
  useImagePreloader(priorityImages);

  return (
    <div 
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={`${image}-${index}`}
          src={image}
          alt={`Imagen ${index + 1}`}
          className={`w-full h-full object-cover rounded-lg ${itemClassName}`}
          loading={index < 6 ? 'eager' : 'lazy'}
          width={300}
          height={200}
        />
      ))}
    </div>
  );
});

OptimizedGallery.displayName = 'OptimizedGallery';