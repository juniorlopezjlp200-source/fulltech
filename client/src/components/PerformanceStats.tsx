import { useState, useEffect } from "react";

interface ImageStats {
  loaded: number;
  failed: number;
  total: number;
}

export function PerformanceStats() {
  const [stats, setStats] = useState<ImageStats>({ loaded: 0, failed: 0, total: 0 });

  useEffect(() => {
    // Listen for custom events from image loading system
    const handleImageLoad = () => {
      setStats(prev => ({ ...prev, loaded: prev.loaded + 1 }));
    };

    const handleImageError = () => {
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    };

    const handleImageTotal = (e: CustomEvent) => {
      setStats(prev => ({ ...prev, total: e.detail.total }));
    };

    window.addEventListener('image-loaded', handleImageLoad);
    window.addEventListener('image-failed', handleImageError);
    window.addEventListener('images-total', handleImageTotal as EventListener);

    // Initialize total count
    setTimeout(() => {
      const totalImages = document.querySelectorAll('.lazy-image, .image-container').length;
      setStats(prev => ({ ...prev, total: totalImages }));
    }, 100);

    return () => {
      window.removeEventListener('image-loaded', handleImageLoad);
      window.removeEventListener('image-failed', handleImageError);
      window.removeEventListener('images-total', handleImageTotal as EventListener);
    };
  }, []);

  const progress = stats.total > 0 ? ((stats.loaded + stats.failed) / stats.total) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <i className="fas fa-chart-line text-blue-600"></i>
        Estado de Carga de Imágenes
      </h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600" data-testid="loaded-count">
            {stats.loaded}
          </div>
          <div className="text-blue-800">Cargadas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600" data-testid="failed-count">
            {stats.failed}
          </div>
          <div className="text-orange-800">Fallidas</div>
        </div>
      </div>
      <div className="mt-3 bg-blue-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          data-testid="loading-progress"
        />
      </div>
    </div>
  );
}
