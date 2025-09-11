import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { OptimizedImage } from './OptimizedImage';
import { formatPrice } from '@/utils/currency';

interface VirtualizedProductListProps {
  products: any[];
  onProductClick?: (product: any) => void;
  onProductLike?: (productId: string, isLiked: boolean) => void;
  onProductShare?: (productId: string, platform: string) => void;
  itemHeight?: number;
  containerHeight?: number;
}

// Componente de producto optimizado para virtual scrolling
const ProductListItem = memo(({ 
  product, 
  onProductClick, 
  onProductLike, 
  onProductShare,
  isVisible = true 
}: {
  product: any;
  onProductClick?: (product: any) => void;
  onProductLike?: (productId: string, isLiked: boolean) => void;
  onProductShare?: (productId: string, platform: string) => void;
  isVisible?: boolean;
}) => {
  if (!isVisible) {
    return <div className="h-80" />; // Placeholder para mantener altura
  }


  const handleShare = async (platform: string) => {
    if (navigator.share && platform === 'native') {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        });
        onProductShare?.(product.id, 'native');
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback a métodos tradicionales
      let shareUrl = '';
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`${product.name} - ${product.description}`);
      
      switch (platform) {
        case 'whatsapp':
          shareUrl = `https://wa.me/18295344286?text=${text} ${url}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        onProductShare?.(product.id, platform);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Imagen del producto */}
      <div className="relative aspect-square" onClick={() => onProductClick?.(product)}>
        <OptimizedImage
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'}
          alt={product.name}
          className="w-full h-full object-cover cursor-pointer"
          width={400}
          height={400}
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              ⭐ Destacado
            </span>
          )}
          {product.onSale && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              🔥 Oferta
            </span>
          )}
        </div>

        {/* Botón de like */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProductLike?.(product.id, !product.isLiked);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <i className={`fas fa-heart ${product.isLiked ? 'text-red-500' : 'text-gray-400'}`}></i>
        </button>
      </div>

      {/* Información del producto */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.inStock ? (
            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full ml-2">
              Disponible
            </span>
          ) : (
            <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full ml-2">
              Agotado
            </span>
          )}
        </div>

        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Precio */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>
          
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <i 
                    key={i} 
                    className={`fas fa-star ${i < product.rating ? '' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onProductClick?.(product)}
            className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ver Detalles
          </button>
          
          {/* Botón de compartir */}
          <div className="relative group">
            <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
              <i className="fas fa-share-alt text-gray-600 text-xs"></i>
            </button>
            
            {/* Menú de compartir */}
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <i className="fab fa-whatsapp text-green-500"></i>
                WhatsApp
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <i className="fab fa-facebook text-blue-600"></i>
                Facebook
              </button>
              <button
                onClick={() => handleShare('native')}
                className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <i className="fas fa-share text-gray-600"></i>
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductListItem.displayName = 'ProductListItem';

// Lista virtualizada para mejor performance
export const VirtualizedProductList = memo(({
  products,
  onProductClick,
  onProductLike,
  onProductShare,
  itemHeight = 320,
  containerHeight = 600
}: VirtualizedProductListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calcular qué elementos son visibles
  const visibleItems = useMemo(() => {
    const containerStart = scrollTop;
    const containerEnd = scrollTop + containerHeight;
    const itemsPerRow = window.innerWidth >= 768 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    const totalRows = Math.ceil(products.length / itemsPerRow);
    
    const startRow = Math.floor(containerStart / itemHeight);
    const endRow = Math.min(totalRows - 1, Math.ceil(containerEnd / itemHeight));
    
    const visibleIndices = new Set<number>();
    for (let row = Math.max(0, startRow - 1); row <= endRow + 1; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < products.length) {
          visibleIndices.add(index);
        }
      }
    }
    
    return visibleIndices;
  }, [scrollTop, containerHeight, itemHeight, products.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {products.map((product, index) => (
          <ProductListItem
            key={product.id}
            product={product}
            onProductClick={onProductClick}
            onProductLike={onProductLike}
            onProductShare={onProductShare}
            isVisible={visibleItems.has(index)}
          />
        ))}
      </div>
    </div>
  );
});

VirtualizedProductList.displayName = 'VirtualizedProductList';