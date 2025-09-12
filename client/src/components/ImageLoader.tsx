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
  const mountedRef = useRef(true);
  const [retryKey, setRetryKey] = useState(0); // cache-bust en reintentos

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Normalización segura del src ---
  const normalizeSrc = (raw: string): string => {
    if (!raw) return raw;

    // Decodificar entidades comunes
    let cleaned = raw.replace(/&amp;/g, "&").trim();

    // Si es preview local, NO tocar
    if (cleaned.startsWith("blob:") || cleaned.startsWith("data:")) {
      return cleaned;
    }

    // Forzar prefijo / para rutas de uploads relativas
    if (/^uploads\//.test(cleaned)) {
      cleaned = "/" + cleaned.replace(/^\/+/, "");
    }

    // Evitar // duplicadas internas (pero respetar esquema http(s)://)
    cleaned = cleaned.replace(/([^:])\/{2,}/g, "$1/");

    return cleaned;
  };

  const addUnsplashParams = (url: string): string => {
    if (!url.includes("unsplash.com")) return url;

    try {
      const u = new URL(url);
      // Solo si no están seteados ya
      if (!u.searchParams.has("w")) u.searchParams.set("w", String(width));
      if (!u.searchParams.has("h")) u.searchParams.set("h", String(height));
      if (!u.searchParams.has("q")) u.searchParams.set("q", "80");
      if (!u.searchParams.has("auto")) u.searchParams.set("auto", "format");
      if (!u.searchParams.has("fit")) u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      // Si no es absoluta o falla URL, devolvemos tal cual
      return url;
    }
  };

  const baseSrc = normalizeSrc(src);
  const optimizedSrc = addUnsplashParams(baseSrc);

  const loadImage = async (imageSrc: string) => {
    if (!imageSrc) {
      if (mountedRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
      setIsLoading(true);
      setHasError(false);
    }

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Image load timeout")), 10000);

        img.onload = () => {
          clearTimeout(timeout);
          if (!mountedRef.current) return;
          setIsLoading(false);
          setHasError(false);
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          if (!mountedRef.current) return;
          setIsLoading(false);
          setHasError(true);
          reject(new Error("Image load failed"));
        };

        // Cache-bust para reintentos (solo cuando sea el mismo src)
        if (retryKey > 0) {
          try {
            const u = new URL(imageSrc, window.location.origin);
            u.searchParams.set("_retry", String(retryKey));
            img.src = u.toString();
          } catch {
            // Si es relativa simple, agregamos ?_retry
            const join = imageSrc.includes("?") ? "&" : "?";
            img.src = imageSrc + join + `_retry=${retryKey}`;
          }
        } else {
          img.src = imageSrc;
        }
      });
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("Image loading error:", error);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const retryLoad = () => {
    // Aumentamos retryKey para cache-bust y reintentamos
    setRetryKey((k) => k + 1);
    loadImage(optimizedSrc);
  };

  useEffect(() => {
    // En prioridad, cargamos ya
    if (priority) {
      loadImage(optimizedSrc);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            loadImage(optimizedSrc);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "50px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimizedSrc, priority]); // dependemos del src ya normalizado

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
        <div className="loading-indicator absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`lazy-image w-full h-full object-cover transition-opacity duration-300 ${
            !isLoading ? "opacity-100 loaded" : "opacity-0"
          }`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" as any : "auto" as any}
          data-testid="lazy-image"
        />
      )}

      {/* Fallback content */}
      {hasError && (
        <div
          className="image-fallback flex w-full h-full bg-muted text-muted-foreground justify-center items-center flex-col gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={retryLoad}
          data-testid="image-fallback"
          title="Toca para reintentar"
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
