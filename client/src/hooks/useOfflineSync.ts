import { useState, useEffect, useCallback } from 'react';
import { useCacheManager } from '@/utils/cacheManager';

interface OfflineAction {
  id: string;
  type: string;
  url: string;
  method: string;
  body?: any;
  headers?: any;
  timestamp: number;
  retries: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const cacheManager = useCacheManager();

  // Detectar cambios en conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar acciones pendientes al iniciar
  useEffect(() => {
    loadPendingActions();
  }, []);

  const loadPendingActions = async () => {
    try {
      const actions = await cacheManager.getOfflineQueue();
      setPendingActions(actions || []);
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  };

  // Agregar acción a la cola offline
  const addOfflineAction = useCallback(async (
    type: string,
    url: string,
    method: string = 'POST',
    body?: any,
    headers?: any
  ) => {
    const action: OfflineAction = {
      id: Date.now().toString(),
      type,
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0
    };

    try {
      await cacheManager.addToOfflineQueue(action);
      setPendingActions(prev => [...prev, action]);
      
      // Si hay conexión, intentar sincronizar inmediatamente
      if (isOnline) {
        await syncPendingActions();
      }
    } catch (error) {
      console.error('Error adding offline action:', error);
    }
  }, [isOnline, cacheManager]);

  // Sincronizar acciones pendientes
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || syncInProgress || pendingActions.length === 0) {
      return;
    }

    setSyncInProgress(true);

    try {
      await cacheManager.processOfflineQueue();
      
      // Recargar acciones pendientes
      await loadPendingActions();
      
      // Notificar éxito
      if ('serviceWorker' in navigator && 'Notification' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('FULLTECH', {
            body: 'Datos sincronizados correctamente',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'sync-success'
          });
        });
      }
    } catch (error) {
      console.error('Error syncing actions:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress, pendingActions.length, cacheManager]);

  // Hook para hacer requests con soporte offline
  const makeOfflineRequest = useCallback(async (
    url: string,
    options: RequestInit = {},
    fallbackAction?: () => void
  ) => {
    try {
      if (!isOnline) {
        // Si no hay conexión, agregar a cola offline
        await addOfflineAction('api-request', url, options.method || 'GET', options.body, options.headers);
        
        // Ejecutar acción fallback si existe
        if (fallbackAction) {
          fallbackAction();
        }
        
        return { success: false, offline: true };
      }

      // Si hay conexión, hacer request normal
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Request failed:', error);
      
      // Si falla el request y hay conexión, agregar a cola offline
      if (isOnline) {
        await addOfflineAction('failed-request', url, options.method || 'GET', options.body, options.headers);
      }
      
      if (fallbackAction) {
        fallbackAction();
      }
      
      return { success: false, error };
    }
  }, [isOnline, addOfflineAction]);

  return {
    isOnline,
    pendingActions,
    syncInProgress,
    addOfflineAction,
    syncPendingActions,
    makeOfflineRequest
  };
}

// Hook para optimistic UI updates
export function useOptimisticUI<T>(initialData: T[]) {
  const [optimisticData, setOptimisticData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, T>>(new Map());

  // Agregar actualización optimista
  const addOptimisticUpdate = useCallback((id: string, update: T) => {
    setPendingUpdates(prev => new Map(prev).set(id, update));
    setOptimisticData(prev => {
      const index = prev.findIndex((item: any) => item.id === id);
      if (index >= 0) {
        const newData = [...prev];
        newData[index] = { ...newData[index], ...update };
        return newData;
      } else {
        return [...prev, update];
      }
    });
  }, []);

  // Confirmar actualización (cuando se sincroniza)
  const confirmUpdate = useCallback((id: string, confirmedData?: T) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    if (confirmedData) {
      setOptimisticData(prev => {
        const index = prev.findIndex((item: any) => item.id === id);
        if (index >= 0) {
          const newData = [...prev];
          newData[index] = confirmedData;
          return newData;
        }
        return prev;
      });
    }
  }, []);

  // Revertir actualización (si falla)
  const revertUpdate = useCallback((id: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    setOptimisticData(prev => {
      return prev.filter((item: any) => item.id !== id);
    });
  }, []);

  // Actualizar datos base
  const updateBaseData = useCallback((newData: T[]) => {
    setOptimisticData(newData);
  }, []);

  return {
    data: optimisticData,
    pendingUpdates,
    addOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    updateBaseData
  };
}