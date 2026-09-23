"use client";

import React, { useState, useEffect } from "react";
import { Award, ShieldCheck, Gem, Radio } from "lucide-react";

interface SponsorItem {
  name: string;
  category: string;
  logoSrc?: string;
  type: "PLATINUM" | "GOLD" | "SILVER" | "MEDIA";
}

const SPONSORS: SponsorItem[] = [
  {
    name: "Petrokimia Gresik",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Petro Kimia Gresik.png",
    type: "PLATINUM",
  },
  {
    name: "BLU BCA",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/BLU BCA.jpg",
    type: "SILVER",
  },
  {
    name: "Apotek Budi Farma",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Apotek Budi Farma.jpeg",
    type: "GOLD",
  },
  {
    name: "Sukses Jaya Abadi",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Sukses Jaya Abadi.jpeg",
    type: "GOLD",
  },
  {
    name: "Swabina Gatra",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Swabina Gatra.png",
    type: "GOLD",
  },
  {
    name: "Sinergi Hotel",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Sinergi Hotel.jpg",
    type: "GOLD",
  },
  {
    name: "batik Gajah Mungkur",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Gajahmungkur.jpeg",
    type: "GOLD",
  },
  {
    name: "Custom Craft",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Custom Craft.jpeg",
    type: "SILVER",
  },
  {
    name: "Decoratic",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Decoratic.jpg",
    type: "PLATINUM",
  },
  {
    name: "Almee Studio",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Almee Studio Silver.png",
    type: "SILVER",
  },
  {
    name: "Firnawa Abadi",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Firnawa Abadi.jpeg",
    type: "GOLD",
  },
  {
    name: "Natamata Eyewear",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Natamata.jpeg",
    type: "SILVER",
  },
  {
    name: "NJMSnack",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/NJMSnack.jpg",
    type: "SILVER",
  },
  {
    name: "Raja HT",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Raja HT.png",
    type: "SILVER",
  },
  {
    name: "Rise Up",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/Rise Up.png",
    type: "GOLD",
  },
  {
    name: "SID",
    category: "Official Sponsor",
    logoSrc: "/Sponsor/SID.png",
    type: "SILVER",
  },
  {
    name: "Samid Outdoor",
    category: "Official Sponsor",
    logoSrc: "/Medpart/Samid Out Dor.jpg",
    type: "SILVER",
  },
];

const MEDIA_PARTNERS: SponsorItem[] = [
  {
    name: "Faith Studio",
    category: "Media Partner",
    logoSrc: "/Medpart/Faith Stuido.png",
    type: "MEDIA",
  },
  {
    name: "Info Gresik",
    category: "Media Partner",
    logoSrc: "/Medpart/Info Greik.jpg",
    type: "MEDIA",
  },
];

const SponsorCard = ({
  item,
  isCenter,
}: {
  item: SponsorItem;
  isCenter: boolean;
}) => {
  const isPlatinum = item.type === "PLATINUM";
  const isGold = item.type === "GOLD";
  const isSilver = item.type === "SILVER";
  const isMedia = item.type === "MEDIA";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "center",
        padding: "1.5rem",
        background: isCenter ? "#fff" : "transparent",
        borderRadius: "20px",
        boxShadow: isCenter ? "0 10px 40px rgba(31,75,93,0.1)" : "none",
        transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
        width: "240px",
        height: "260px",
      }}
    >
      {/* Badge based on type */}
      {isPlatinum && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "linear-gradient(135deg, #1f4b5d 0%, #0F172A 100%)",
            color: "#E2E8F0",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          <Gem size={12} /> PLATINUM
        </div>
      )}
      {isGold && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(217, 119, 6, 0.12)",
            color: "#B45309",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          <Award size={12} /> GOLD
        </div>
      )}
      {isSilver && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(100, 116, 139, 0.12)",
            color: "#475569",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          <ShieldCheck size={12} /> SILVER
        </div>
      )}
      {isMedia && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(31, 75, 93, 0.08)",
            color: "#1f4b5d",
            padding: "0.3rem 0.8rem",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          <Radio size={12} /> MEDIA
        </div>
      )}

      {/* Logo or Icon */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "0.5rem 0",
        }}
      >
        {item.logoSrc ? (
          <img
            src={item.logoSrc}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "110px",
              objectFit: "contain",
              filter: isPlatinum
                ? "drop-shadow(0 4px 12px rgba(0,0,0,0.06))"
                : "none",
            }}
          />
        ) : (
          <Radio size={40} color="#1f4b5d" />
        )}
      </div>

      {/* Text */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "#1E293B",
            lineHeight: "1.2",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#64748B",
          }}
        >
          {item.category}
        </div>
      </div>
    </div>
  );
};

const Carousel = ({
  items,
  windowWidth,
}: {
  items: SponsorItem[];
  windowWidth: number;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = items.length;

  // Swipe / drag state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const diff = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        setActiveIndex((prev) => (prev + 1) % total);
      } else {
        setActiveIndex((prev) => (prev - 1 + total) % total);
      }
    }
    setDragStartX(null);
    setIsPaused(false);
  };

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
    setIsPaused(true);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        setActiveIndex((prev) => (prev + 1) % total);
      } else {
        setActiveIndex((prev) => (prev - 1 + total) % total);
      }
    }
    setDragStartX(null);
    setIsDragging(false);
    setIsPaused(false);
  };
  const onMouseLeave = () => {
    if (isDragging) {
      setDragStartX(null);
      setIsDragging(false);
    }
    setIsPaused(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "2rem",
        userSelect: "none",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
        }}
      >
        {/* Track */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          {items.map((item, i) => {
            let offset = i - activeIndex;

            const half = Math.floor(total / 2);
            if (offset < -half) offset += total;
            if (offset > half) offset -= total;

            const isCenter = offset === 0;
            const absOffset = Math.abs(offset);

            // Distance configured to fit 2-columns (50vw width each)
            const offsetDistance =
              windowWidth <= 768 ? 160 : windowWidth <= 1024 ? 150 : 180;
            const xOffset = offset * offsetDistance;
            const scale = isCenter ? 1.05 : 1 - absOffset * 0.15;
            const zIndex = 50 - absOffset;
            const opacity = absOffset > 1 ? 0 : isCenter ? 1 : 0.4;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${xOffset}px), -50%) scale(${scale})`,
                  zIndex: zIndex,
                  opacity: opacity,
                  visibility: opacity === 0 ? "hidden" : "visible",
                  transition: "all 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                  cursor: isCenter ? "default" : "pointer",
                  pointerEvents: isDragging ? "none" : "auto",
                }}
                onClick={() => {
                  if (!isCenter && !isDragging) setActiveIndex(i);
                }}
              >
                <SponsorCard item={item} isCenter={isCenter} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginTop: "1rem",
        }}
      >
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            style={{
              width: i === activeIndex ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background:
                i === activeIndex
                  ? "var(--lp-ocean-blue)"
                  : "rgba(31, 75, 93, 0.2)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function SponsorSection() {
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section
      id="sponsor"
      style={{
        padding: "clamp(4rem, 7vw, 7rem) 0",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "0 clamp(1rem, 5vw, 2rem)",
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              fontWeight: 800,
              color: "#1A1A1A",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Mitra &amp;{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--lp-ocean-blue), var(--lp-aqua))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Sponsor AETHERA SILO UISI 2026
            </span>
          </h2>

          <p
            style={{
              color: "var(--lp-text-muted)",
              fontSize: "1rem",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Terima kasih kepada para mitra dan perusahaan terkemuka yang
            mendukung kesuksesan seluruh rangkaian kegiatan AETHERA SILO UISI
            2026.
          </p>
        </div>

        {/* 2 Columns Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: windowWidth <= 900 ? "1fr" : "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Column 1: Sponsors */}
          <div style={{ position: "relative" }}>
            <h3
              style={{
                textAlign: "center",
                color: "#1A1A1A",
                fontSize: "1.2rem",
                fontWeight: 800,
                marginBottom: "2rem",
              }}
            >
              Official Sponsors
            </h3>
            <Carousel items={SPONSORS} windowWidth={windowWidth} />
          </div>

          {/* Column 2: Media Partners */}
          <div style={{ position: "relative" }}>
            <h3
              style={{
                textAlign: "center",
                color: "#1A1A1A",
                fontSize: "1.2rem",
                fontWeight: 800,
                marginBottom: "2rem",
              }}
            >
              Media Partners
            </h3>
            <Carousel items={MEDIA_PARTNERS} windowWidth={windowWidth} />
          </div>
        </div>
      </div>
    </section>
  );
}
