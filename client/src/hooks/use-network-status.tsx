import { useState, useEffect } from "react";

type NetworkStatus = 'fast' | 'slow' | 'offline';

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('fast');

  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
        return;
      }

      // Check connection quality if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g' || effectiveType === '3g') {
          setNetworkStatus('fast');
        } else {
          setNetworkStatus('slow');
        }
      } else {
        // Fallback: assume good connection if online
        setNetworkStatus('fast');
      }
    };

    // Initial check
    updateNetworkStatus();

    // Listen for network changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}
