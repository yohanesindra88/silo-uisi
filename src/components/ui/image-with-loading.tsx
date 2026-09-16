"use client";

import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, ImageOff } from "lucide-react";
import styles from "./image-with-loading.module.css";

export interface ImageWithLoadingProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
  showIndicator?: boolean;
  fallbackSrc?: string;
  customSkeleton?: React.ReactNode;
}

export const ImageWithLoading: React.FC<ImageWithLoadingProps> = ({
  src,
  alt = "",
  className = "",
  style,
  wrapperClassName = "",
  wrapperStyle,
  showIndicator = false,
  fallbackSrc,
  customSkeleton,
  onLoad,
  onError,
  ...restProps
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Update image source when prop changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Check if image is already cached/complete on mount
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [imgSrc]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) {
      onLoad(e as any);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
      setIsLoaded(true); // Stop loading animation on error
    }
    if (onError) {
      onError(e as any);
    }
  };

  return (
    <div
      className={`${styles.wrapper} ${wrapperClassName}`}
      style={{
        ...wrapperStyle,
      }}
    >
      {/* Loading Skeleton Animation */}
      {!isLoaded && (
        <div className={styles.skeleton}>
          {customSkeleton ? (
            customSkeleton
          ) : (
            showIndicator && (
              <div className={styles.pulseIndicator}>
                <ImageIcon size={18} strokeWidth={2.2} />
              </div>
            )
          )}
        </div>
      )}

      {/* Error State */}
      {hasError ? (
        <div className={styles.errorContainer}>
          <ImageOff size={22} className={styles.errorIcon} />
          <span className={styles.errorText}>Gambar gagal dimuat</span>
        </div>
      ) : (
        /* Actual Image with smooth fade-in */
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${styles.image} ${isLoaded ? styles.imageLoaded : styles.imageLoading} ${className}`}
          style={{
            ...style,
          }}
          {...restProps}
        />
      )}
    </div>
  );
};

export default ImageWithLoading;
