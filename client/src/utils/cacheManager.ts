// Cache Manager para FULLTECH - Gestión Inteligente de Cache Local
export class CacheManager {
  private static instance: CacheManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'FulltechCache';
  private readonly DB_VERSION = 1;
  private readonly STORES = {
    PRODUCTS: 'products',
    IMAGES: 'images',
    USER_DATA: 'userData',
    ACTIVITIES: 'activities',
    OFFLINE_QUEUE: 'offlineQueue',
    FILE_UPLOADS: 'fileUploads'
  };

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Inicializar IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Crear stores
        Object.values(this.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          }
        });
      };
    });
  }

  // Guardar productos con timestamp
  async saveProducts(products: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.PRODUCTS], 'readwrite');
    const store = transaction.objectStore(this.STORES.PRODUCTS);
    
    // Limpiar productos anteriores
    await store.clear();
    
    // Guardar nuevos productos
    for (const product of products) {
      await store.put({
        ...product,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      });
    }
  }

  // Obtener productos desde cache
  async getProducts(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.PRODUCTS], 'readonly');
    const store = transaction.objectStore(this.STORES.PRODUCTS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const products = request.result || [];
        
        // Actualizar lastAccessed
        products.forEach(product => {
          product.lastAccessed = Date.now();
        });
        
        resolve(products);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cache inteligente de imágenes
  async cacheImage(url: string): Promise<string> {
    try {
      // Verificar si ya está en cache
      const cached = await this.getImageFromCache(url);
      if (cached) return cached;

      // Descargar y convertir a blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convertir a base64 para almacenamiento
      const base64 = await this.blobToBase64(blob);
      
      // Guardar en IndexedDB
      await this.saveImageToCache(url, base64);
      
      return base64;
    } catch (error) {
      console.error('Error caching image:', error);
      return url; // Fallback a URL original
    }
  }

  // Obtener cola offline
  async getOfflineQueue(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.OFFLINE_QUEUE], 'readonly');
    const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener imagen desde cache
  private async getImageFromCache(url: string): Promise<string | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.IMAGES], 'readonly');
    const store = transaction.objectStore(this.STORES.IMAGES);
    
    return new Promise((resolve) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result;
        if (result && this.isImageCacheValid(result.timestamp)) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  // Guardar imagen en cache
  private async saveImageToCache(url: string, data: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.IMAGES], 'readwrite');
    const store = transaction.objectStore(this.STORES.IMAGES);
    
    await store.put({
      id: url,
      data,
      timestamp: Date.now(),
      size: data.length
    });
  }

  // Verificar si el cache de imagen es válido (24 horas)
  private isImageCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    return cacheAge < maxAge;
  }

  // Convertir blob a base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  // Cola de acciones offline
  async addToOfflineQueue(action: {
    id?: string;
    url: string;
    method: string;
    body?: any;
    headers?: any;
    type?: string;
    retries?: number;
  }): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.OFFLINE_QUEUE], 'readwrite');
    const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
    
    await store.put({
      id: action.id || Date.now().toString(),
      ...action,
      timestamp: Date.now(),
      retries: action.retries || 0
    });
  }

  // Procesar cola offline cuando hay conexión
  async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine) return;
    
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.OFFLINE_QUEUE, this.STORES.FILE_UPLOADS], 'readwrite');
    const queueStore = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
    const fileStore = transaction.objectStore(this.STORES.FILE_UPLOADS);
    
    const request = queueStore.getAll();
    request.onsuccess = async () => {
      const actions = request.result;
      
      for (const action of actions) {
        try {
          let requestBody = action.body;
          
          // Si es una subida de archivo, obtener el blob desde file store
          if (action.type === 'file-upload' && action.body?.tempId) {
            const fileData = await this.getFileFromStore(action.body.tempId);
            if (fileData) {
              requestBody = fileData.blob;
            }
          }
          
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: requestBody
          });
          
          // Eliminar acción procesada
          await queueStore.delete(action.id);
          
          // Limpiar archivo temporal si existe
          if (action.type === 'file-upload' && action.body?.tempId) {
            await fileStore.delete(action.body.tempId);
          }
        } catch (error) {
          console.error('Error processing offline action:', error);
          // Incrementar contador de intentos
          action.retries = (action.retries || 0) + 1;
          if (action.retries < 3) {
            await queueStore.put(action);
          } else {
            // Si falla después de 3 intentos, eliminar
            await queueStore.delete(action.id);
          }
        }
      }
    };
  }

  // Limpiar cache antiguo
  async cleanOldCache(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = Object.values(this.STORES);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
    const now = Date.now();
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value;
          if (now - record.timestamp > maxAge) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }

  // Obtener estadísticas de cache
  async getCacheStats(): Promise<{
    products: number;
    images: number;
    offlineQueue: number;
    totalSize: number;
  }> {
    if (!this.db) await this.init();
    
    const stats = {
      products: 0,
      images: 0,
      offlineQueue: 0,
      totalSize: 0
    };
    
    // Contar productos
    const productsTransaction = this.db!.transaction([this.STORES.PRODUCTS], 'readonly');
    const productsStore = productsTransaction.objectStore(this.STORES.PRODUCTS);
    stats.products = await this.getStoreCount(productsStore);
    
    // Contar imágenes y calcular tamaño
    const imagesTransaction = this.db!.transaction([this.STORES.IMAGES], 'readonly');
    const imagesStore = imagesTransaction.objectStore(this.STORES.IMAGES);
    stats.images = await this.getStoreCount(imagesStore);
    
    // Contar cola offline
    const queueTransaction = this.db!.transaction([this.STORES.OFFLINE_QUEUE], 'readonly');
    const queueStore = queueTransaction.objectStore(this.STORES.OFFLINE_QUEUE);
    stats.offlineQueue = await this.getStoreCount(queueStore);
    
    return stats;
  }

  // Guardar archivo temporal para upload offline
  async saveFileForOfflineUpload(tempId: string, file: File): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.FILE_UPLOADS], 'readwrite');
    const store = transaction.objectStore(this.STORES.FILE_UPLOADS);
    
    await store.put({
      id: tempId,
      blob: file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      timestamp: Date.now()
    });
  }

  // Obtener archivo temporal
  async getFileFromStore(tempId: string): Promise<{blob: File, fileName: string, fileType: string} | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction([this.STORES.FILE_UPLOADS], 'readonly');
    const store = transaction.objectStore(this.STORES.FILE_UPLOADS);
    
    return new Promise((resolve) => {
      const request = store.get(tempId);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            blob: result.blob,
            fileName: result.fileName,
            fileType: result.fileType
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  private getStoreCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Hook para usar el cache manager
export const useCacheManager = () => {
  return CacheManager.getInstance();
};

// Utilidades para optimización de imágenes
export class ImageOptimizer {
  static async optimizeForDevice(imageUrl: string, maxWidth = 800): Promise<string> {
    try {
      // Crear canvas para redimensionar
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calcular dimensiones optimizadas
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Dibujar imagen optimizada
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convertir a WebP si es compatible
          const format = this.supportsWebP() ? 'image/webp' : 'image/jpeg';
          const optimized = canvas.toDataURL(format, 0.8);
          
          resolve(optimized);
        };
        
        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageUrl;
    }
  }

  static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  }
}