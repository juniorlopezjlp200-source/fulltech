import { ImageCarousel } from "./ImageCarousel";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";
import { formatPrice, formatPriceHome } from "@/utils/currency";

interface ProductCardProps {
  product: Product;
  layout: "grid" | "list";
  isHomePage?: boolean;
}

export function ProductCard({ product, layout, isHomePage = false }: ProductCardProps) {
  const [, setLocation] = useLocation();


  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i 
        key={i} 
        className={`${i < rating ? 'fas' : 'far'} fa-star text-xs text-yellow-400`}
      />
    ));
  };

  const getFallbackIcon = () => {
    switch (product.category) {
      case 'smartphones': return 'fas fa-mobile-alt';
      case 'laptops': return 'fas fa-laptop';
      case 'audio': return 'fas fa-headphones';
      case 'gaming': return 'fas fa-gamepad';
      case 'tablets': return 'fas fa-tablet-alt';
      case 'wearables': return 'fas fa-clock';
      default: return 'fas fa-box';
    }
  };

  const handleWhatsAppOrder = () => {
    const message = `Quiero más información sobre el producto: ${product.name} - ${formatPrice(product.price)}`;
    const whatsappUrl = `https://wa.me/18295319442?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareProduct = () => {
    const shareData = {
      title: `${product.name} - FULLTECH`,
      text: `¡Mira este producto! ${product.name} - ${formatPrice(product.price)}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback para navegadores que no soporten Web Share API
      const message = `¡Mira este producto! ${product.name} - ${formatPrice(product.price)} \n${window.location.href}`;
      const whatsappUrl = `https://wa.me/18295319442?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleViewProduct = () => {
    setLocation(`/product/${product.id}`);
  };

  if (layout === "grid") {
    return (
      <div className="product-card relative bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group overflow-hidden" onClick={handleViewProduct} data-product-id={product.id}>
        <ImageCarousel
          images={product.images}
          videos={product.videos || []}
          alt={product.name}
          className="rounded-t-xl h-44 sm:h-48 md:h-52 lg:h-56 xl:h-60"
          fallbackIcon={getFallbackIcon()}
          width={400}
          height={400}
          autoRotate={true}
          rotateInterval={30000}
        />

        {/* Sale Badge - Cinta diagonal fina y elegante */}
        {product.onSale && (
          <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden z-30 pointer-events-none">
            <div className="absolute top-2 -left-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-medium py-1 px-6 transform rotate-[-45deg] shadow-lg opacity-90">
              OFERTA
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Funcionalidad de favoritos
              const heart = e.currentTarget.querySelector('i');
              if (heart?.classList.contains('far')) {
                heart.classList.remove('far');
                heart.classList.add('fas');
                heart.style.color = '#ef4444'; // red-500
              } else if (heart?.classList.contains('fas')) {
                heart.classList.remove('fas');
                heart.classList.add('far');
                heart.style.color = '';
              }
            }}
            className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            data-testid={`button-favorite-${product.id}`}
            title="Agregar a favoritos"
          >
            <i className="far fa-heart text-muted-foreground text-sm transition-colors"></i>
          </button>
        </div>

        <div className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
          
          {/* ⭐ Rating y Likes juntos */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <div className="flex">
                {renderStars(product.rating || 5)}
              </div>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
            {/* ❤️ Likes del producto */}
            {product.likes && product.likes > 0 && (
              <div className="flex items-center gap-1">
                <i className="fas fa-heart text-red-500 text-xs"></i>
                <span className="text-xs font-medium text-red-600">{product.likes.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{isHomePage ? formatPriceHome(product.price) : formatPrice(product.price)}</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsAppOrder();
                }}
                className="bg-green-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-green-700 hover:scale-105 transition-all duration-200 flex items-center gap-1 animate-pulse-ring"
                data-testid={`button-whatsapp-grid-${product.id}`}
                title="Pedir por WhatsApp"
              >
                <i className="fab fa-whatsapp text-xs lg:text-sm"></i>
                <span className="hidden sm:inline">Pedir</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProduct();
                }}
                className="bg-primary text-primary-foreground w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center flex-shrink-0"
                data-testid={`button-share-grid-${product.id}`}
                title="Compartir producto"
              >
                <i className="fas fa-share-alt text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-item bg-card border border-border rounded-xl shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 overflow-hidden cursor-pointer group" onClick={handleViewProduct}>
      <div className="flex gap-4 p-4 sm:p-5">
        <ImageCarousel
          images={product.images}
          videos={product.videos || []}
          alt={product.name}
          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl flex-shrink-0"
          fallbackIcon={getFallbackIcon()}
          width={200}
          height={200}
          autoRotate={true}
          rotateInterval={30000}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg lg:text-xl text-card-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-sm lg:text-base text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {renderStars(product.rating || 5)}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            {/* ❤️ Likes del producto */}
            {product.likes && product.likes > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <i className="fas fa-heart text-red-500 text-xs"></i>
                <span className="text-xs font-medium text-muted-foreground">{product.likes}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">{isHomePage ? formatPriceHome(product.price) : formatPrice(product.price)}</span>
            <div className="flex items-center gap-2 lg:gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProduct();
                }}
                className="bg-primary text-primary-foreground w-9 h-9 rounded-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center"
                data-testid={`button-share-list-${product.id}`}
                title="Compartir"
              >
                <i className="fas fa-share-alt text-sm"></i>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsAppOrder();
                }}
                className="bg-green-600 text-white px-4 py-2 lg:px-5 lg:py-3 rounded-lg text-sm lg:text-base font-medium hover:bg-green-700 hover:scale-105 transition-all duration-200 flex items-center gap-2 animate-pulse-ring"
                data-testid={`button-whatsapp-${product.id}`}
              >
                <i className="fab fa-whatsapp text-sm lg:text-base"></i>
                Pedir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
