import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type HeroSlide } from "@shared/schema";

const fallbackImages = [
  {
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=75",
    alt: "Hero 1"
  },
  {
    src: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=75",
    alt: "Hero 2"
  },
  {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=75",
    alt: "Hero 3"
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const { data: heroSlides = [] } = useQuery({
    queryKey: ["/api/hero-slides"],
    retry: false,
  });

  const activeSlides = (heroSlides as HeroSlide[])
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order);

  const slides = activeSlides.length > 0 ? activeSlides : fallbackImages;

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      setCurrentSlide((p) => (dx > 0 ? (p + 1) % slides.length : (p === 0 ? slides.length - 1 : p - 1)));
    }
  };

  return (
    <div
      id="hero-slider"
      className="absolute inset-0 w-full h-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="hero-slider"
    >
      {slides.map((slide: any, i) => {
        const url = activeSlides.length ? slide.imageUrl : slide.src;
        const alt = activeSlides.length ? "Hero slide" : slide.alt || "Hero slide";

        return (
          <img
            key={i}
            src={url}
            alt={alt}                            
            className={`absolute w-full h-full object-cover object-[center_40%] transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            sizes="100vw"
            srcSet={`
              ${url} 640w,
              ${url} 1024w,
              ${url} 1920w
            `}
            data-testid={`slide-${i}`}
          />
        );
      })}

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow ${
              i === currentSlide ? "bg-white scale-110" : "bg-white/60"
            }`}
            aria-label={`Ir al slide ${i + 1}`}
            data-testid={`dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
