import { useState, useCallback } from "react";

interface UseImageLoaderReturn {
  isLoading: boolean;
  hasError: boolean;
  loadImage: (src: string) => Promise<void>;
  retryLoad: (src: string) => Promise<void>;
}

// Global cache for loaded images
const imageCache = new Map<string, boolean>();
const retryAttempts = new Map<string, number>();
const MAX_RETRIES = 3;

export function useImageLoader(): UseImageLoaderReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadImage = useCallback(async (src: string): Promise<void> => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (imageCache.has(src)) {
      setIsLoading(false);
      setHasError(false);
      // Dispatch success event
      window.dispatchEvent(new CustomEvent('image-loaded'));
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
          imageCache.set(src, true);
          setIsLoading(false);
          setHasError(false);
          // Dispatch success event
          window.dispatchEvent(new CustomEvent('image-loaded'));
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          const currentRetries = retryAttempts.get(src) || 0;
          
          if (currentRetries < MAX_RETRIES) {
            retryAttempts.set(src, currentRetries + 1);
            setTimeout(() => {
              loadImage(src);
            }, 1000 * (currentRetries + 1));
            reject(new Error('Image load failed, retrying...'));
          } else {
            setIsLoading(false);
            setHasError(true);
            // Dispatch error event
            window.dispatchEvent(new CustomEvent('image-failed'));
            reject(new Error('Image load failed after retries'));
          }
        };

        img.src = src;
      });

    } catch (error) {
      console.error('Image loading error:', error);
      if (!retryAttempts.has(src) || (retryAttempts.get(src) || 0) >= MAX_RETRIES) {
        setIsLoading(false);
        setHasError(true);
      }
    }
  }, []);

  const retryLoad = useCallback(async (src: string): Promise<void> => {
    retryAttempts.delete(src);
    imageCache.delete(src);
    await loadImage(src);
  }, [loadImage]);

  return {
    isLoading,
    hasError,
    loadImage,
    retryLoad,
  };
}
