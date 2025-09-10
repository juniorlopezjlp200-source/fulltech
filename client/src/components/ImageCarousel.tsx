import { useState, useEffect } from "react";
import { ImageLoader } from "./ImageLoader";

interface ImageCarouselProps {
  images: string[];
  videos?: string[];
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackIcon?: string;
  autoRotate?: boolean;
  rotateInterval?: number; // in milliseconds
}

export function ImageCarousel({
  images,
  videos = [],
  alt,
  className = "",
  width = 400,
  height = 400,
  fallbackIcon = "fas fa-image",
  autoRotate = true,
  rotateInterval = 30000, // 30 seconds
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allMedia = [...images, ...videos];

  useEffect(() => {
    if (!autoRotate || allMedia.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % allMedia.length);
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [autoRotate, allMedia.length, rotateInterval]);

  const isVideo = (url: string) => videos.includes(url);

  const nextMedia = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % allMedia.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? allMedia.length - 1 : prevIndex - 1
    );
  };

  const goToMedia = (index: number) => {
    setCurrentIndex(index);
  };

  if (allMedia.length === 0) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <i className={`${fallbackIcon} text-muted-foreground text-2xl`}></i>
      </div>
    );
  }

  const currentMedia = allMedia[currentIndex];

  return (
    <div className={`relative ${className}`}>
      {/* Main Media Display */}
      <div className="relative w-full h-full overflow-hidden">
        {isVideo(currentMedia) ? (
          <video 
            src={currentMedia}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <ImageLoader
            src={currentMedia}
            alt={alt}
            className="w-full h-full"
            fallbackIcon={fallbackIcon}
            width={width}
            height={height}
          />
        )}
        
        {/* Navigation Arrows - Only show if more than one media */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
              data-testid="carousel-prev"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <button
              onClick={nextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
              data-testid="carousel-next"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </>
        )}

        {/* Media Type Indicator */}
        {isVideo(currentMedia) && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <i className="fas fa-play text-xs"></i>
            <span>Video</span>
          </div>
        )}
      </div>

      {/* Dot Indicators - Only show if more than one media */}
      {allMedia.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {allMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => goToMedia(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}