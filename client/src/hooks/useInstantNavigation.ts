import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface NavigationState {
  path: string;
  scrollY: number;
  timestamp: number;
}

// Global state for navigation history and scroll positions
const navigationHistory = new Map<string, NavigationState>();
const sessionScrollPositions = new Map<string, number>();

export function useInstantNavigation() {
  const [location, setLocation] = useLocation();
  const isNavigatingRef = useRef(false);
  const currentScrollY = useRef(0);

  // Save current scroll position periodically
  useEffect(() => {
    const saveScrollPosition = () => {
      currentScrollY.current = window.scrollY;
      sessionScrollPositions.set(location, window.scrollY);
    };

    const handleScroll = () => {
      if (!isNavigatingRef.current) {
        saveScrollPosition();
      }
    };

    // Save scroll position every few pixels of scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Save on page visibility changes
    document.addEventListener('visibilitychange', saveScrollPosition);
    
    // Save before page unload
    window.addEventListener('beforeunload', saveScrollPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', saveScrollPosition);
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location]);

  // Restore scroll position when location changes
  useEffect(() => {
    if (isNavigatingRef.current) {
      const timer = setTimeout(() => {
        const savedPosition = sessionScrollPositions.get(location) || 0;
        window.scrollTo({
          top: savedPosition,
          behavior: 'auto'
        });
        isNavigatingRef.current = false;
      }, 0); // Instant rendering

      return () => clearTimeout(timer);
    }
  }, [location]);

  // Instant navigation function
  const navigateInstantly = useCallback((path: string, hash?: string) => {
    // Save current state
    const currentState: NavigationState = {
      path: location,
      scrollY: window.scrollY,
      timestamp: Date.now()
    };
    navigationHistory.set(location, currentState);
    sessionScrollPositions.set(location, window.scrollY);
    
    // Set navigation flag
    isNavigatingRef.current = true;
    
    // Navigate based on type
    if (hash) {
      // Hash-based navigation
      window.location.hash = hash;
    } else if (path.startsWith('http') || path.startsWith('//')) {
      // External URL
      window.location.href = path;
    } else {
      // Internal navigation using wouter
      setLocation(path);
    }
  }, [location, setLocation]);

  // Go back with scroll restoration
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      isNavigatingRef.current = true;
      window.history.back();
    } else {
      navigateInstantly('/');
    }
  }, [navigateInstantly]);

  // Navigate to home and clear hash
  const goHome = useCallback(() => {
    // Clear any hash
    if (window.location.hash) {
      window.location.hash = '';
    }
    // Navigate to home
    navigateInstantly('/');
  }, [navigateInstantly]);

  // Navigate to custom page
  const goToCustomPage = useCallback((slug: string) => {
    navigateInstantly('/', `#page=${slug}`);
  }, [navigateInstantly]);

  return {
    navigateInstantly,
    goBack,
    goHome,
    goToCustomPage,
    currentPath: location,
    currentScrollY: currentScrollY.current
  };
}