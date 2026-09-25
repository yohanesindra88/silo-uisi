"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./MerchCarousel.module.css";
import {
  Shirt,
  Sparkles,
  ShoppingBag,
  Award,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import { MerchItem, MERCH_ITEMS } from "../../data/merchData";

export default function MerchCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const total = MERCH_ITEMS.length;

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  // Get visible items (5 cards: -2, -1, center, +1, +2)
  const getVisibleItems = () => {
    const items = [];
    for (let offset = -2; offset <= 2; offset++) {
      const index = (activeIndex + offset + total) % total;
      items.push({ ...MERCH_ITEMS[index], offset });
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <span className={styles.collectionLabel}>KOLEKSI KAMI</span>
        <h2 className={styles.sectionTitle}>Produk Unggulan</h2>
        <p className={styles.sectionDesc}>
          Jelajahi item paling populer dari koleksi Aethera 2026
        </p>
      </div>

      {/* Carousel Area */}
      <div className={styles.carouselArea}>
        {/* Left Arrow */}
        <button
          className={`${styles.arrowBtn} ${styles.arrowLeft}`}
          onClick={handlePrev}
          aria-label="Sebelumnya"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Cards Track */}
        <div className={styles.track}>
          {MERCH_ITEMS.map((item, i) => {
            let offset = i - activeIndex;

            // Circular wrap-around for 5 items
            if (offset < -2) offset += total;
            if (offset > 2) offset -= total;

            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);

            // Calculate positions
            const offsetDistance =
              windowWidth <= 480
                ? 130
                : windowWidth <= 768
                  ? 160
                  : windowWidth <= 1024
                    ? 200
                    : 250;
            const xOffset = offset * offsetDistance; // Spacing between cards
            const scale = isCenter ? 1.08 : 1 - absOffset * 0.1;
            const zIndex = 10 - absOffset;
            const opacity = absOffset === 2 ? 0 : 1; // Hide the outermost cards if needed, or keep them slightly visible

            return (
              <div
                key={item.id}
                className={`${styles.card} ${isCenter ? styles.cardCenter : ""}`}
                suppressHydrationWarning
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${xOffset}px), -50%) scale(${scale})`,
                  zIndex: zIndex,
                  opacity: absOffset === 2 ? 0.3 : 1,
                  visibility: absOffset > 2 ? "hidden" : "visible",
                }}
                onClick={() => {
                  if (!isCenter) setActiveIndex(i);
                }}
              >
                {/* Card Image Area */}
                <div
                  className={styles.cardImageArea}
                  style={{ background: item.gradient }}
                >
                  {/* Badge */}
                  <span
                    className={`${styles.badge} ${styles[`badge_${item.badgeType}`]}`}
                  >
                    {item.badge}
                  </span>
                  {/* Heart */}
                  <button className={styles.heartBtn} aria-label="Favorit">
                    <Heart size={18} />
                  </button>
                  {/* Product Icon / Image */}
                  <div className={styles.productIcon}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <item.icon
                        size={isCenter ? 80 : 60}
                        color="var(--lp-ocean-blue)"
                        strokeWidth={1}
                      />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
                  {/* Rating */}
                  <div className={styles.ratingRow}>
                    <Star size={14} fill="#f5a623" color="#f5a623" />
                    <span className={styles.ratingValue}>{item.rating}</span>
                    <span className={styles.ratingCount}>({item.reviews})</span>
                  </div>
                  {/* Price & Cart */}
                  <div className={styles.priceRow}>
                    <div className={styles.priceCol}>
                      <span className={styles.priceCurrency}>
                        {item.price.split(" ")[0]}
                      </span>
                      <span className={styles.priceValue}>
                        {item.price.split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                    {isCenter && (
                      <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSdEwUkcCb-dL2PYjVbKn6E95NEmCbOHrbrX9d06GZJY572hkQ/viewform?usp=publish-editor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.addToCartBtn}
                      >
                        <ShoppingCart size={15} />
                        <span>Pre-Order</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          className={`${styles.arrowBtn} ${styles.arrowRight}`}
          onClick={handleNext}
          aria-label="Selanjutnya"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className={styles.dots}>
        {MERCH_ITEMS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Item ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
