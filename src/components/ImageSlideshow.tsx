import React, { useState, useEffect } from 'react';

interface ImageSlideshowProps {
  images: string[];
  duration?: number;
  className?: string;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ 
  images, 
  duration = 8000,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 500); // Half second for transition
      
    }, duration);

    return () => clearInterval(interval);
  }, [images.length, duration]);

  if (images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            index === currentIndex && !isTransitioning 
              ? 'opacity-100 z-10' 
              : 'opacity-0 z-0'
          }`}
        >
          <img
            src={image}
            alt={`Foundation model ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageSlideshow;