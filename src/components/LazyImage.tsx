import React, { useState } from 'react';

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
};

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && <div className={className} style={{ backgroundColor: '#f0f0f0' }}></div>}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={() => setIsLoaded(true)}
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
    </>
  );
};

export default LazyImage;