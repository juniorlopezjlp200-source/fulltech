import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type HeroSlide } from "@shared/schema";

const fallbackImages = [
  {
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Electronics store showcase"
  },
  {
    src: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Modern tech workspace"
  },
  {
    src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    alt: "Mobile devices collection"
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
    .filter(slide => slide.active)
    .sort((a, b) => a.order - b.order);

  const slides = activeSlides.length > 0 ? activeSlides : fallbackImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const deltaX = touchStart - touchEnd;

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1);
      }
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
      {slides.map((slide, index) => (
        <img
          key={index}
          src={activeSlides.length > 0 ? slide.imageUrl : slide.src}
          alt={activeSlides.length > 0 ? slide.title : slide.alt}
          className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid={`slide-${index}`}
        />
      ))}
      
      {/* Slider Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-lg ${
              index === currentSlide ? 'bg-white scale-125' : 'bg-white/60'
            } hover:bg-white hover:scale-110`}
            data-testid={`dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
