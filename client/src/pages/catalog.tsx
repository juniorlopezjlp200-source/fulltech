import { useState, useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { TopBar } from "@/components/TopBar";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { useCacheManager } from "@/utils/cacheManager";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { UserActivityTracker } from "@/components/UserActivityTracker";

// Lazy loading de componentes no críticos
const HeroSlider = lazy(() => import("@/components/HeroSlider").then(m => ({ default: m.HeroSlider })));
const CategoryFilters = lazy(() => import("@/components/CategoryFilters").then(m => ({ default: m.CategoryFilters })));
const ProductCard = lazy(() => import("@/components/ProductCard").then(m => ({ default: m.ProductCard })));
import type { Product, Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

// Sample products data with multiple images and videos
const sampleProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    description: "Último modelo con chip A17 Pro",
    price: 99900, // $999.00 in cents
    category: "moviles",
    images: [
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"],
    inStock: true,
    featured: true,
    onSale: true,
    originalPrice: 119900,
    rating: 5,
    reviewCount: 128,
  },
  {
    id: "2",
    name: "MacBook Pro M3",
    description: "Chip M3 Pro, 18GB RAM",
    price: 249900, // $2499.00 in cents
    category: "hogar", // Computers can be categorized under home technology
    images: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"],
    inStock: true,
    featured: true,
    onSale: false,
    originalPrice: null,
    rating: 5,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "AirPods Pro (2ª gen)",
    description: "Cancelación activa de ruido",
    price: 24900, // $249.00 in cents
    category: "audio",
    images: [
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"],
    inStock: true,
    featured: true,
    onSale: true,
    originalPrice: 29900,
    rating: 5,
    reviewCount: 445,
  },
  {
    id: "4",
    name: "Teclado Mecánico RGB",
    description: "Switches Cherry MX Blue",
    price: 8900, // $89.00 in cents
    category: "gaming",
    images: [
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1572721546624-05bf65ad7679?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"],
    inStock: true,
    featured: true,
    onSale: false,
    originalPrice: null,
    rating: 4,
    reviewCount: 89,
  },
  {
    id: "5",
    name: "Mouse Gaming Pro",
    description: "12000 DPI, RGB personalizable",
    price: 6500, // $65.00 in cents
    category: "gaming",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"],
    inStock: true,
    featured: true,
    onSale: true,
    originalPrice: 7900,
    rating: 5,
    reviewCount: 234,
  },
  {
    id: "6",
    name: "Tablet Android 12\"",
    description: "8GB RAM, 256GB almacenamiento",
    price: 39900, // $399.00 in cents
    category: "tablets",
    images: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"],
    inStock: true,
    featured: true,
    onSale: false,
    originalPrice: null,
    rating: 4,
    reviewCount: 56,
  },
  {
    id: "7",
    name: "Audífonos Inalámbricos",
    description: "Cancelación de ruido, 30h batería",
    price: 17900, // $179.00 in cents
    category: "audio",
    images: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"],
    inStock: true,
    featured: true,
    onSale: true,
    originalPrice: 21900,
    rating: 5,
    reviewCount: 445,
  },
  {
    id: "8",
    name: "Apple Watch Series 9",
    description: "GPS + Cellular, 45mm",
    price: 42900, // $429.00 in cents
    category: "wearables",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1585682738429-c2b20c8e2de5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"],
    inStock: true,
    featured: true,
    onSale: false,
    originalPrice: null,
    rating: 5,
    reviewCount: 892,
  },
];

const categoryIcons: Record<string, string> = {
  "moviles": "fas fa-mobile-alt",
  "accesorios": "fas fa-charging-station",
  "audio": "fas fa-headphones",
  "gaming": "fas fa-gamepad",
  "tablets": "fas fa-tablet-alt",
  "wearables": "fas fa-clock",
  "hogar": "fas fa-home",
  "reacondicionados": "fas fa-recycle",
};


export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showOnlyOffers, setShowOnlyOffers] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [isRaffleImageExpanded, setIsRaffleImageExpanded] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({ name: '', phone: '', address: '' });
  // 🎯 Estados para publicidad estratégica
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [productsViewed, setProductsViewed] = useState(0);
  const [showStickyBanner, setShowStickyBanner] = useState(true);
  
  // Referencias y estado para el slider automático de categorías
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const wheelResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Fetch categories from API
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Transform categories to include icons
  const categories = categoriesData.map(category => ({
    id: category.slug,
    name: category.name,
    icon: categoryIcons[category.slug] || "fas fa-tag"
  }));

  // Fetch real products from API
  const { data: realProducts = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter products based on search, category, offers, and stock
  const filteredProducts = realProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Handle category matching - product.category can be either slug, ID, or name
    const matchesCategory = selectedCategory === "all" || (() => {
      // Find the category that matches the product.category (could be ID, slug, or name)
      const productCategoryData = categoriesData.find(cat => 
        cat.id === product.category || 
        cat.slug === product.category ||
        cat.name.toLowerCase() === product.category.toLowerCase()
      );

      // Match if product category matches selected category (by slug)
      return productCategoryData && productCategoryData.slug === selectedCategory;
    })();

    const matchesOffers = showOnlyOffers ? product.onSale : true;
    const isInStock = product.inStock; // Solo mostrar productos disponibles

    return matchesSearch && matchesCategory && matchesOffers && isInStock;
  });

  // Show all filtered products in featured style
  const allProducts = filteredProducts;

  useEffect(() => {
    // Set loading based on actual data loading
    setIsLoading(isProductsLoading || isCategoriesLoading);
  }, [isProductsLoading, isCategoriesLoading]);

  // Auto-scroll ultra suave y continuo para categorías
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    const scrollSpeed = 30; // píxeles por segundo
    
    const animate = (currentTime: number) => {
      if (!categoryScrollRef.current || !isAutoScrolling) return;
      
      const container = categoryScrollRef.current;
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Calcular el desplazamiento basado en tiempo para movimiento consistente
      const scrollAmount = (scrollSpeed * deltaTime) / 1000;
      
      // Obtener el ancho de una sección de categorías (la mitad del contenido)
      const originalWidth = container.scrollWidth / 2;
      
      // Mover el scroll de forma robusta con módulo para evitar overshoot
      container.scrollLeft = (container.scrollLeft + scrollAmount) % originalWidth;
      
      animationId = requestAnimationFrame(animate);
    };

    if (isAutoScrolling) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      // Limpiar timeout si existe
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
        wheelResumeTimeoutRef.current = null;
      }
    };
  }, [isAutoScrolling]);

  // Funciones mejoradas para pausar/reanudar scroll
  const pauseAutoScroll = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setIsAutoScrolling(false);
      // Limpiar timer existente si hay uno
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
        wheelResumeTimeoutRef.current = null;
      }
    }
  };
  
  const resumeAutoScroll = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Limpiar timer existente
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
      }
      wheelResumeTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), 300);
    }
  };

  // Función especial para wheel que reanuda automáticamente
  const pauseAutoScrollOnWheel = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      setIsAutoScrolling(false);
      // Limpiar timer existente
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
      }
      // Reanudar después de 600ms de inactividad del wheel
      wheelResumeTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), 600);
    }
  };

  // Verificar preferencias de movimiento reducido al cargar
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsAutoScrolling(false);
    }
  }, []);

  // 🎯 Tracking inteligente de productos vistos
  useEffect(() => {
    const handleProductView = () => {
      setProductsViewed(prev => {
        const newCount = prev + 1;
        // Mostrar modal después de ver 4 productos
        if (newCount === 4 && !showRegisterModal) {
          setTimeout(() => setShowRegisterModal(true), 2000);
        }
        return newCount;
      });
    };

    // Escuchar clicks en las cards de productos
    const productCards = document.querySelectorAll('[data-testid^="card-product-"]');
    productCards.forEach(card => {
      card.addEventListener('click', handleProductView);
    });

    return () => {
      productCards.forEach(card => {
        card.removeEventListener('click', handleProductView);
      });
    };
  }, [allProducts, showRegisterModal]);

  if (isLoading) {
    return (
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm font-medium text-foreground">Cargando catálogo...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full min-h-screen">

        <div className="w-full min-h-screen">
          <TopBar />
          <WelcomeMessage />
          <UserActivityTracker />


          <div id="hero-container" className="relative h-[420px] sm:h-[480px] lg:h-[580px] xl:h-[680px] bg-gray-300 w-full">
            <HeroSlider />


            {/* Título del slider con botones centrados debajo */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-5 z-10 bg-black/10 pointer-events-none">
              <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold drop-shadow-lg mb-6">Tecnología de Vanguardia</h2>
              
              {/* Botón de búsqueda y filtros All/Ofertas */}
              <div className="flex gap-2 bg-black/25 backdrop-blur-md rounded-lg px-2 py-2 border border-white/15 pointer-events-auto z-30 relative mt-4">
                {/* Botón de búsqueda - primero */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`px-3 py-2 rounded-md font-medium text-sm transition-all duration-300 flex items-center gap-1.5 ${
                    isSearchOpen 
                      ? 'bg-primary text-white shadow-md scale-105' 
                      : 'bg-white/15 text-white/70 hover:bg-white/25 hover:text-white'
                  }`}
                  title={isSearchOpen ? 'Cerrar búsqueda' : 'Buscar productos'}
                  aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
                  aria-expanded={isSearchOpen}
                  data-testid="search-toggle-button"
                >
                  <i className={`fas text-xs transition-transform duration-200 ${
                    isSearchOpen ? 'fa-times' : 'fa-search'
                  }`}></i>
                </button>

                <button
                  onClick={() => { 
                    setSelectedCategory('all'); 
                    setShowOnlyOffers(false); 
                  }}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-300 flex items-center gap-1.5 ${!showOnlyOffers && selectedCategory === 'all'
                    ? 'bg-white text-blue-600 shadow-md scale-105' 
                    : 'bg-white/15 text-white/70 hover:bg-white/25 hover:text-white'
                  }`}
                  data-testid="button-filter-all"
                  title="Todos los productos"
                  aria-pressed={!showOnlyOffers && selectedCategory === 'all'}
                  aria-label="Mostrar todos los productos"
                >
                  <i className="fas fa-th-large text-xs"></i>
                  <span>All</span>
                </button>

                <button
                  onClick={() => setShowOnlyOffers(true)}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-300 flex items-center gap-1.5 ${showOnlyOffers 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md scale-105' 
                    : 'bg-white/15 text-red-300 hover:bg-red-500/25 hover:text-red-200'
                  }`}
                  data-testid="button-filter-offers"
                  title="Solo ofertas"
                  aria-pressed={showOnlyOffers}
                  aria-label="Mostrar solo ofertas"
                >
                  <i className="fas fa-fire text-xs animate-shake"></i>
                  <span>Ofertas</span>
                </button>
              </div>

              {/* Barra de búsqueda expandible */}
              {isSearchOpen && (
                <div className="bg-black/25 backdrop-blur-md rounded-lg px-3 py-3 border border-white/15 pointer-events-auto z-30 relative mt-2 max-w-sm mx-auto">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <i className="fas fa-search text-white/60 text-sm"></i>
                    </div>
                    <input 
                      type="search" 
                      placeholder="Buscar productos..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200"
                      data-testid="input-search"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Categorías flotantes - slider horizontal elegante */}
              <div className="pointer-events-auto z-40 relative mt-3">
                {/* Gradientes laterales para indicar scroll */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none"></div>
                
                <div 
                  ref={categoryScrollRef}
                  className="flex gap-4 overflow-x-auto pb-3 pt-1 px-4 scrollbar-hide" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    scrollSnapType: 'none', // Deshabilitado para scroll suave continuo
                    WebkitOverflowScrolling: 'touch'
                  }}
                  onMouseEnter={pauseAutoScroll}
                  onMouseLeave={resumeAutoScroll}
                  onTouchStart={pauseAutoScroll}
                  onTouchEnd={resumeAutoScroll}
                  onWheel={pauseAutoScrollOnWheel}
                  onPointerEnter={pauseAutoScroll}
                  onPointerLeave={resumeAutoScroll}
                >
                  {/* Duplicamos las categorías para loop infinito */}
                  {[...categories, ...categories].map((category, index) => {
                    const isDuplicate = index >= categories.length;
                    return (
                      <button
                        key={`${category.id}-${index}`}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-500 ease-out hover:scale-110 hover:-translate-y-1 flex-shrink-0 shadow-lg backdrop-blur-md border transform-gpu ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-white/20 scale-105'
                            : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-xl hover:shadow-black/10 border-white/30'
                        }`}
                        style={{ 
                          minWidth: 'fit-content'
                        }}
                        data-testid={`filter-${category.id}-${index}`}
                        // Hacer elementos duplicados no focusables para accesibilidad
                        tabIndex={isDuplicate ? -1 : 0}
                        aria-hidden={isDuplicate}
                        role={isDuplicate ? "presentation" : "button"}
                      >
                        <span className="relative z-10">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Indicador de deslizamiento */}
                <div className="flex justify-center mt-1">
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <i className="fas fa-chevron-left animate-pulse"></i>
                    <span>Desliza para ver más</span>
                    <i className="fas fa-chevron-right animate-pulse"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <main className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-6 pb-20 md:pb-6 space-y-6">
            <div className="max-w-[1600px] mx-auto">
              {/* All Products in Featured Style */}
              <section>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                  {allProducts.map((product, index) => (
                    <ProductCard 
                    key={product.id} 
                    product={product} 
                    layout="grid"
                    isHomePage={true}
                    data-testid={`card-product-${product.id}`}
                  />
                ))}
              </div>

              {/* Final profesional del catálogo */}
              <div className="mt-12 text-center py-8 bg-gradient-to-t from-white via-gray-50 to-transparent rounded-t-3xl">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <i className="fas fa-check text-white text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">¡Has visto todo nuestro catálogo!</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Estos son todos nuestros productos disponibles. Si no encontraste lo que buscas, contáctanos por WhatsApp.
                  </p>
                  <button 
                    onClick={() => {
                      const message = `Quiero más información sobre productos específicos.`;
                      const whatsappUrl = `https://wa.me/18295344286?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto shadow-md"
                  >
                    <i className="fab fa-whatsapp"></i>
                    Consultar más productos
                  </button>
                </div>
              </div>
            </section>
            </div>
          </main>

          {/* Floating WhatsApp Button */}
          <button 
            onClick={() => {
              const message = `Quiero más información`;
              const whatsappUrl = `https://wa.me/18295344286?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="fixed bottom-16 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-pulse-ring"
            data-testid="floating-whatsapp-button"
            title="Contactar por WhatsApp"
          >
            <i className="fab fa-whatsapp text-2xl"></i>
          </button>

          {/* Expandable Footer */}
          <footer className={`fixed bottom-0 left-0 w-full bg-card border-t border-border z-40 transition-all duration-500 ${
            isFooterExpanded ? 'h-96' : 'h-14'
          }`}>
            {/* Expanded Content */}
            {isFooterExpanded && (
              <div className="p-4 h-full overflow-y-auto">
                {/* Customer Registration Modal */}
                {showRegistrationForm && (
                  <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">¡Únete a FULLTECH!</h3>
                        <button 
                          onClick={() => setShowRegistrationForm(false)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <i className="fas fa-times text-gray-600"></i>
                        </button>
                      </div>

                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                          <i className="fab fa-google text-white text-2xl"></i>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            Registro Rápido y Seguro
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Con tu cuenta de Google obtienes automáticamente:
                          </p>

                          <div className="text-left space-y-2 mb-6">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-500"></i>
                              <span className="text-sm">Tu enlace de referencia personal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-500"></i>
                              <span className="text-sm">5% descuento por cada referido que compre</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-500"></i>
                              <span className="text-sm">Participación automática en rifas mensuales</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-500"></i>
                              <span className="text-sm">Dashboard personal con todas tus estadísticas</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button 
                            onClick={() => {
                              setShowRegistrationForm(false);
                              window.location.href = '/login';
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <i className="fab fa-google"></i>
                            Continuar con Google
                          </button>

                          <button 
                            onClick={() => setShowRegistrationForm(false)}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          >
                            Tal vez más tarde
                          </button>
                        </div>

                        <p className="text-xs text-gray-500">
                          Registro 100% seguro • No spam • Política de privacidad respetada
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
                  <div className="flex items-start gap-4">
                    {/* Raffle Image */}
                    <div className="flex-shrink-0">
                      <img 
                        src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                        alt="Rifa FULLTECH"
                        className={`rounded-lg cursor-pointer transition-all duration-300 ${
                          isRaffleImageExpanded ? 'fixed inset-4 z-[100] w-auto h-auto object-contain' : 'w-20 h-16 object-cover'
                        }`}
                        onClick={() => setIsRaffleImageExpanded(!isRaffleImageExpanded)}
                        data-testid="raffle-image"
                      />
                      {isRaffleImageExpanded && (
                        <div 
                          className="fixed inset-0 bg-black/80 z-[99]"
                          onClick={() => setIsRaffleImageExpanded(false)}
                        />
                      )}
                    </div>

                    {/* Raffle Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-gift text-yellow-500"></i>
                        ¡Únete al Sistema de Referidos!
                      </h3>
                      <p className="text-sm text-orange-700 mb-3">
                        Crea tu cuenta, comparte tu enlace de referencia y gana 5% de descuento por cada amigo que compre. Además, participas automáticamente en rifas mensuales.
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowRegistrationForm(true)}
                          className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-600 transition-colors flex items-center gap-2"
                        >
                          <i className="fab fa-google"></i>
                          Registrarme Ahora
                        </button>
                        <button 
                          onClick={() => window.location.href = '/login'}
                          className="bg-white/50 text-orange-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/70 transition-colors"
                        >
                          Ya tengo cuenta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Location & Social Media Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Store Location */}
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-red-500"></i>
                      Nuestra Tienda
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">Visítanos en nuestra ubicación física</p>
                    <a 
                      href="https://maps.app.goo.gl/SN1tkW5RHHJ4ikRw6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      <i className="fas fa-directions"></i>
                      Cómo Llegar
                    </a>
                  </div>

                  {/* Embedded Map */}
                  <div className="bg-white/50 rounded-lg p-2">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019284298956!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ2JzI5LjYiTiAxMjLCsDI1JzA5LjgiVw!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                      width="100%"
                      height="100"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                      title="Ubicación FULLTECH"
                    ></iframe>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="text-center mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Síguenos en redes sociales</p>
                  <div className="flex justify-center gap-4">
                    <a 
                      href="https://instagram.com/fulltech" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      data-testid="footer-instagram-expanded"
                    >
                      <i className="fab fa-instagram text-white"></i>
                    </a>
                    <a 
                      href="https://facebook.com/fulltech" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      data-testid="footer-facebook-expanded"
                    >
                      <i className="fab fa-facebook-f text-white"></i>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsed Footer - Only show when NOT expanded */}
            {!isFooterExpanded && (
              <div 
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsFooterExpanded(true)}
                data-testid="footer-toggle"
              >
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/fulltech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  data-testid="footer-instagram"
                  title="Síguenos en Instagram"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="fab fa-instagram text-white text-sm"></i>
                </a>
                <a 
                  href="https://facebook.com/fulltech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  data-testid="footer-facebook"
                  title="Síguenos en Facebook"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="fab fa-facebook-f text-white text-sm"></i>
                </a>
              </div>

              {/* Center - Rifa */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse-subtle">
                  <i className="fas fa-gift text-white text-xs"></i>
                </div>
                <span className="text-xs font-medium text-foreground">Rifa Participa</span>
                <i className={`fas text-xs text-muted-foreground transition-transform ${
                  isFooterExpanded ? 'fa-chevron-down' : 'fa-chevron-up'
                }`}></i>
              </div>

              {/* Right - Copyright */}
              <div className="text-right">
                <div className="text-xs font-semibold text-foreground">FULLTECH</div>
                <div className="text-[10px] text-muted-foreground">SRL © 2024</div>
              </div>
              </div>
            )}

            {/* Collapse Button - Only show when expanded */}
            {isFooterExpanded && (
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => setIsFooterExpanded(false)}
                  className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  data-testid="footer-collapse"
                  title="Contraer footer"
                >
                  <i className="fas fa-times text-gray-600"></i>
                </button>
              </div>
            )}
          </footer>

          {/* 🎯 MODAL INTELIGENTE DE REGISTRO */}
          {showRegisterModal && (
            <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-4 border-gradient-to-r from-blue-500 to-purple-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-crown text-white text-2xl"></i>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ¡Te gustan nuestros productos! 😍
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Registrándote ahora obtienes beneficios exclusivos:
                  </p>
                  
                  <div className="text-left space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-percentage text-green-500"></i>
                      <span className="text-sm font-medium">10% descuento en tu primera compra</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-money-bill-wave text-green-500"></i>
                      <span className="text-sm font-medium">Gana 5% por cada persona que refieran</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-gift text-green-500"></i>
                      <span className="text-sm font-medium">Participación automática en rifas</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => window.location.href = '/phone-auth'}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                      ¡Registrarme Ahora!
                    </button>
                    
                    <button 
                      onClick={() => setShowRegisterModal(false)}
                      className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
                    >
                      Continuar viendo productos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
