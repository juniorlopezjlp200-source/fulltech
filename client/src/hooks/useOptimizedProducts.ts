import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCacheManager } from '@/utils/cacheManager';
import { useOfflineSync, useOptimisticUI } from './useOfflineSync';

export function useOptimizedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);
  const cacheManager = useCacheManager();
  const queryClient = useQueryClient();
  const { isOnline, makeOfflineRequest } = useOfflineSync();
  const { 
    data: optimisticProducts, 
    addOptimisticUpdate, 
    confirmUpdate, 
    updateBaseData 
  } = useOptimisticUI(products);

  // Query para productos con cache inteligente
  const {
    data: networkProducts,
    isLoading: isNetworkLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isOnline
  });

  // Cargar productos desde cache al iniciar
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cachedProducts = await cacheManager.getProducts();
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          updateBaseData(cachedProducts);
          
          // Precargar imágenes de productos prioritarios
          const priorityImages = cachedProducts
            .slice(0, 10)
            .flatMap((product: any) => product.images || [])
            .slice(0, 20);
          
          // Precargar en background
          priorityImages.forEach((url: string) => {
            cacheManager.cacheImage(url);
          });
        }
      } catch (error) {
        console.error('Error loading products from cache:', error);
      } finally {
        setIsLoadingFromCache(false);
      }
    };

    loadFromCache();
  }, [cacheManager, updateBaseData]);

  // Actualizar cache cuando lleguen nuevos productos
  useEffect(() => {
    if (networkProducts && networkProducts.length > 0) {
      setProducts(networkProducts);
      updateBaseData(networkProducts);
      
      // Guardar en cache
      cacheManager.saveProducts(networkProducts);
      
      // Precargar imágenes nuevas
      const newImages = networkProducts
        .flatMap(product => product.images || [])
        .slice(0, 50);
      
      // Precargar en background sin bloquear UI
      requestIdleCallback(() => {
        newImages.forEach(url => {
          cacheManager.cacheImage(url);
        });
      });
    }
  }, [networkProducts, cacheManager, updateBaseData]);

  // Función para buscar productos con cache
  const searchProducts = useCallback(async (query: string): Promise<any[]> => {
    // Primero buscar en cache local
    const cachedProducts = await cacheManager.getProducts();
    const localResults = cachedProducts.filter((product: any) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );

    // Si hay conexión, también buscar en servidor
    if (isOnline && query.length > 2) {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const serverResults = await response.json();
          // Combinar resultados evitando duplicados
          const combinedResults = [
            ...localResults,
            ...serverResults.filter((serverProduct: any) => 
              !localResults.some((localProduct: any) => localProduct.id === serverProduct.id)
            )
          ];
          return combinedResults;
        }
      } catch (error) {
        console.error('Error searching products online:', error);
      }
    }

    return localResults;
  }, [cacheManager, isOnline]);

  // Función para filtrar productos por categoría
  const filterByCategory = useCallback((category: string): any[] => {
    const currentProducts = optimisticProducts.length > 0 ? optimisticProducts : products;
    
    if (!category || category === 'all') {
      return currentProducts;
    }
    
    return currentProducts.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    );
  }, [optimisticProducts, products]);

  // Función para obtener categorías únicas
  const getCategories = useCallback((): string[] => {
    const currentProducts = optimisticProducts.length > 0 ? optimisticProducts : products;
    const categorySet = new Set(currentProducts.map((product: any) => product.category));
    const categories = Array.from(categorySet);
    return categories.sort();
  }, [optimisticProducts, products]);

  // Función para agregar vista de producto (optimistic)
  const trackProductView = useCallback(async (productId: string) => {
    if (!isOnline) return;

    try {
      await makeOfflineRequest(`/api/customer/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'view',
          productId,
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }, [isOnline, makeOfflineRequest]);

  // Función para agregar like (optimistic)
  const toggleProductLike = useCallback(async (productId: string, isLiked: boolean) => {
    // Actualización optimista
    const productIndex = optimisticProducts.findIndex(p => p.id === productId);
    if (productIndex >= 0) {
      const updatedProduct = {
        ...optimisticProducts[productIndex],
        isLiked,
        likeCount: (optimisticProducts[productIndex].likeCount || 0) + (isLiked ? 1 : -1)
      };
      addOptimisticUpdate(productId, updatedProduct);
    }

    try {
      const result = await makeOfflineRequest(`/api/customer/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: isLiked ? 'like' : 'unlike',
          productId,
          metadata: { timestamp: new Date().toISOString() }
        })
      });

      if (result.success) {
        confirmUpdate(productId);
      }
    } catch (error) {
      console.error('Error toggling product like:', error);
      // Revertir cambio optimista si falla
      const revertedProduct = {
        ...optimisticProducts[productIndex],
        isLiked: !isLiked,
        likeCount: (optimisticProducts[productIndex].likeCount || 0) - (isLiked ? 1 : -1)
      };
      addOptimisticUpdate(productId, revertedProduct);
    }
  }, [optimisticProducts, addOptimisticUpdate, confirmUpdate, makeOfflineRequest]);

  // Función para compartir producto
  const shareProduct = useCallback(async (productId: string, platform: string) => {
    try {
      await makeOfflineRequest(`/api/customer/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'share',
          productId,
          metadata: { 
            platform, 
            timestamp: new Date().toISOString() 
          }
        })
      });

      // Actualizar contador de shares optimísticamente
      const productIndex = optimisticProducts.findIndex(p => p.id === productId);
      if (productIndex >= 0) {
        const updatedProduct = {
          ...optimisticProducts[productIndex],
          shareCount: (optimisticProducts[productIndex].shareCount || 0) + 1
        };
        addOptimisticUpdate(productId, updatedProduct);
      }
    } catch (error) {
      console.error('Error tracking product share:', error);
    }
  }, [optimisticProducts, addOptimisticUpdate, makeOfflineRequest]);

  return {
    products: optimisticProducts.length > 0 ? optimisticProducts : products,
    isLoading: isLoadingFromCache || isNetworkLoading,
    error,
    searchProducts,
    filterByCategory,
    getCategories,
    trackProductView,
    toggleProductLike,
    shareProduct,
    refetch,
    isOnline
  };
}