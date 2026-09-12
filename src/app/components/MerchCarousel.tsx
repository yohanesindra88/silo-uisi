'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './MerchCarousel.module.css';
import { Shirt, Sparkles, ShoppingBag, Award, Heart, Star, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface MerchItem {
  id: number;
  title: string;
  desc: string;
  price: string;
  badge: string;
  badgeType: 'new' | 'trending' | 'best' | 'popular';
  rating: number;
  reviews: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  gradient: string;
}

const MERCH_ITEMS: MerchItem[] = [
  {
    id: 1,
    title: "Kaos Aethera",
    desc: "Combed 30s hitam elegan dengan sablon plastisol tahan lama.",
    price: "Rp 95.000",
    badge: "BEST SELLER",
    badgeType: "best",
    rating: 4.8,
    reviews: 120,
    icon: Shirt,
    gradient: "linear-gradient(145deg, #d4eaf7 0%, #a8d8ea 50%, #e8f4f8 100%)"
  },
  {
    id: 2,
    title: "Sticker Pack",
    desc: "8 Rasi eksklusif vinyl anti air dengan die-cut presisi.",
    price: "Rp 20.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.6,
    reviews: 89,
    icon: Sparkles,
    gradient: "linear-gradient(145deg, #e0f0fa 0%, #b8dff0 50%, #eaf5fc 100%)"
  },
  {
    id: 3,
    title: "Totebag Orbit",
    desc: "Kanvas tebal putih tulang dengan kompartemen luas.",
    price: "Rp 55.000",
    badge: "TRENDING",
    badgeType: "trending",
    rating: 4.7,
    reviews: 98,
    icon: ShoppingBag,
    gradient: "linear-gradient(145deg, #dce8ee 0%, #b4ced9 50%, #e6eff4 100%)"
  },
  {
    id: 4,
    title: "Pin Enamel",
    desc: "Logam premium Aethera logo dengan finishing emas mewah.",
    price: "Rp 15.000",
    badge: "POPULAR",
    badgeType: "popular",
    rating: 4.9,
    reviews: 63,
    icon: Award,
    gradient: "linear-gradient(145deg, #cfe2ea 0%, #a3c9d9 50%, #dfedf3 100%)"
  },
  {
    id: 5,
    title: "Lanyard ID Card",
    desc: "Tali ID card premium dengan clip metal dan sablon logo Aethera.",
    price: "Rp 25.000",
    badge: "NEW",
    badgeType: "new",
    rating: 4.5,
    reviews: 75,
    icon: Award,
    gradient: "linear-gradient(145deg, #d8edf5 0%, #aed4e6 50%, #e2f1f8 100%)"
  }
];

export default function MerchCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const total = MERCH_ITEMS.length;

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
        <p className={styles.sectionDesc}>Jelajahi item paling populer dari koleksi Aethera 2026</p>
      </div>

      {/* Carousel Area */}
      <div className={styles.carouselArea}>
        {/* Left Arrow */}
        <button className={`${styles.arrowBtn} ${styles.arrowLeft}`} onClick={handlePrev} aria-label="Sebelumnya">
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
            const xOffset = offset * 250; // Spacing between cards
            const scale = isCenter ? 1.08 : 1 - absOffset * 0.1;
            const zIndex = 10 - absOffset;
            const opacity = absOffset === 2 ? 0 : 1; // Hide the outermost cards if needed, or keep them slightly visible
            
            return (
              <div
                key={item.id}
                className={`${styles.card} ${isCenter ? styles.cardCenter : ''}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${xOffset}px), -50%) scale(${scale})`,
                  zIndex: zIndex,
                  opacity: absOffset === 2 ? 0.3 : 1,
                  visibility: absOffset > 2 ? 'hidden' : 'visible'
                }}
                onClick={() => {
                  if (!isCenter) setActiveIndex(i);
                }}
              >
                {/* Card Image Area */}
                <div className={styles.cardImageArea} style={{ background: item.gradient }}>
                  {/* Badge */}
                  <span className={`${styles.badge} ${styles[`badge_${item.badgeType}`]}`}>
                    {item.badge}
                  </span>
                  {/* Heart */}
                  <button className={styles.heartBtn} aria-label="Favorit">
                    <Heart size={18} />
                  </button>
                  {/* Product Icon */}
                  <div className={styles.productIcon}>
                    <item.icon size={isCenter ? 80 : 60} color="var(--lp-ocean-blue)" strokeWidth={1} />
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
                    <span className={styles.price}>{item.price}</span>
                    {isCenter && (
                      <button className={styles.addToCartBtn}>
                        <ShoppingCart size={15} />
                        <span>Pre-Order</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button className={`${styles.arrowBtn} ${styles.arrowRight}`} onClick={handleNext} aria-label="Selanjutnya">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className={styles.dots}>
        {MERCH_ITEMS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Item ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
