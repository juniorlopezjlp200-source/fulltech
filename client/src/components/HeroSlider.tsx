import { useState, useEffect } from "react";

const heroImages = [
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
      } else {
        setCurrentSlide((prev) => prev === 0 ? heroImages.length - 1 : prev - 1);
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
      {heroImages.map((image, index) => (
        <img
          key={index}
          src={image.src}
          alt={image.alt}
          className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          data-testid={`slide-${index}`}
        />
      ))}
      
      {/* Slider Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white/80' : 'bg-white/50'
            } hover:bg-white/80`}
            data-testid={`dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
