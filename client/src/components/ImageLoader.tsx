import { useState, useRef, useEffect } from "react";

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  aspectRatio?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function ImageLoader({
  src,
  alt,
  className = "",
  fallbackIcon = "fas fa-image",
  aspectRatio = "aspect-square",
  priority = false,
  width = 400,
  height = 400,
}: ImageLoaderProps) {
  const [isInView, setIsInView] = useState(priority);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadImage = async (imageSrc: string) => {
    if (!imageSrc) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          setIsLoading(false);
          setHasError(false);
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          setIsLoading(false);
          setHasError(true);
          reject(new Error('Image load failed'));
        };

        img.src = imageSrc;
      });
    } catch (error) {
      console.error('Image loading error:', error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const retryLoad = () => {
    loadImage(src);
  };

  useEffect(() => {
    if (priority) {
      loadImage(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            loadImage(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "50px",
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [src, priority]);

  const optimizedSrc = src.includes('unsplash.com') 
    ? `${src}&w=${width}&h=${height}&q=80&auto=format&fit=crop`
    : src;

  return (
    <div 
      ref={containerRef}
      className={`image-container relative overflow-hidden bg-muted ${aspectRatio} ${className}`}
      data-testid="image-container"
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="image-skeleton absolute inset-0 bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%] animate-shimmer" />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-indicator absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`lazy-image w-full h-full object-cover transition-opacity duration-300 ${
            !isLoading ? 'opacity-100 loaded' : 'opacity-0'
          }`}
          onLoad={() => {}}
          onError={() => {}}
          loading="lazy"
          data-testid="lazy-image"
        />
      )}

      {/* Fallback content */}
      {hasError && (
        <div 
          className="image-fallback flex w-full h-full bg-muted text-muted-foreground justify-center items-center flex-col gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={retryLoad}
          data-testid="image-fallback"
        >
          <i className={`${fallbackIcon} text-2xl`} />
          <span className="text-xs text-center">
            Imagen no disponible
            <br />
            <span className="text-primary text-xs">Toca para reintentar</span>
          </span>
        </div>
      )}
    </div>
  );
}
