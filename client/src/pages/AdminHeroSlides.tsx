export class ImageUtils {
  private static imageCache = new Map<string, boolean>();
  private static retryAttempts = new Map<string, number>();
  private static readonly MAX_RETRIES = 3;

  // Generate optimized image URL with proper dimensions
  static optimizeImageUrl(url: string, width = 400, height = 400, quality = 80): string {
    if (url.includes('unsplash.com')) {
      return `${url}&w=${width}&h=${height}&q=${quality}&auto=format&fit=crop`;
    }
    return url;
  }

  // Create responsive image srcset
  static createSrcSet(baseUrl: string, sizes: number[] = [200, 400, 800]): string {
    return sizes.map(size => {
      const optimizedUrl = this.optimizeImageUrl(baseUrl, size, size);
      return `${optimizedUrl} ${size}w`;
    }).join(', ');
  }

  // Check if image URL is accessible
  static async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Preload critical images
  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.imageCache.set(url, true);
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to preload ${url}`));
        img.src = this.optimizeImageUrl(url);
      }))
    );
  }

  // Get cached image status
  static isImageCached(url: string): boolean {
    return this.imageCache.has(url);
  }

  // Clear image cache
  static clearCache(): void {
    this.imageCache.clear();
    this.retryAttempts.clear();
  }

  // Get retry count for URL
  static getRetryCount(url: string): number {
    return this.retryAttempts.get(url) || 0;
  }

  // Increment retry count
  static incrementRetryCount(url: string): number {
    const current = this.retryAttempts.get(url) || 0;
    const newCount = current + 1;
    this.retryAttempts.set(url, newCount);
    return newCount;
  }

  // Check if should retry loading
  static shouldRetry(url: string): boolean {
    return this.getRetryCount(url) < this.MAX_RETRIES;
  }

  // Generate placeholder data URL
  static generatePlaceholder(width: number, height: number, color = '#f3f4f6'): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      // Add loading pattern
      ctx.fillStyle = '#e5e7eb';
      for (let i = 0; i < width; i += 20) {
        ctx.fillRect(i, 0, 10, height);
      }
    }
    
    return canvas.toDataURL();
  }
}
