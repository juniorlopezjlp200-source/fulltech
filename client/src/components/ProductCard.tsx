import { ImageCarousel } from "./ImageCarousel";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  layout: "grid" | "list";
}

export function ProductCard({ product, layout }: ProductCardProps) {
  const [, setLocation] = useLocation();

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(0)}`;
  };

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
      <div className="product-card relative bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={handleViewProduct} data-product-id={product.id}>
        <ImageCarousel
          images={product.images}
          videos={product.videos || []}
          alt={product.name}
          className="rounded-t-xl h-48 sm:h-52 lg:h-56"
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

        <div className="p-3 lg:p-4">
          <h3 className="font-semibold text-sm lg:text-base text-card-foreground mb-1">{product.name}</h3>
          <p className="text-xs lg:text-sm text-muted-foreground mb-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg lg:text-xl font-bold text-primary">{formatPrice(product.price)}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsAppOrder();
                }}
                className="bg-green-600 text-white px-3 py-1 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1 animate-pulse-ring"
                data-testid={`button-whatsapp-grid-${product.id}`}
                title="Pedir por WhatsApp"
              >
                <i className="fab fa-whatsapp text-xs"></i>
                <span className="hidden sm:inline">Pedir</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProduct();
                }}
                className="bg-primary text-primary-foreground px-3 py-1 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                data-testid={`button-share-grid-${product.id}`}
                title="Compartir producto"
              >
                <i className="fas fa-share-alt text-xs"></i>
                <span className="hidden sm:inline">Compartir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-item bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer" onClick={handleViewProduct}>
      <div className="flex gap-4 p-4">
        <ImageCarousel
          images={product.images}
          videos={product.videos || []}
          alt={product.name}
          className="w-20 h-20 rounded-xl flex-shrink-0"
          fallbackIcon={getFallbackIcon()}
          width={200}
          height={200}
          autoRotate={true}
          rotateInterval={30000}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground mb-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {renderStars(product.rating || 5)}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareProduct();
                }}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center gap-1"
                data-testid={`button-share-list-${product.id}`}
                title="Compartir"
              >
                <i className="fas fa-share-alt text-xs"></i>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleWhatsAppOrder();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 animate-pulse-ring"
                data-testid={`button-whatsapp-${product.id}`}
              >
                <i className="fab fa-whatsapp"></i>
                Pedir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
