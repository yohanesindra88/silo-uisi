'use client';

import React, { useState, useEffect } from "react";
import styles from "./PanitiaCarousel.module.css";
import { getCloudinaryUrl } from "@/utils/cloudinary";

interface PanitiaPerson {
  id: string;
  name: string;
  role: string;
  badge: string;
  image: string;
}

const PANITIA_PERSONS: PanitiaPerson[] = [
  {
    id: "kp",
    name: "Nabil Qudsi Mas'ud",
    role: "Ketua Pelaksana",
    badge: "BPH",
    image: "/nabil_qudsi.webp",
  },
  {
    id: "sek1",
    name: "M. Rosyid Ridlo",
    role: "Sekretaris 1",
    badge: "BPH",
    image: "/rosyid_ridlo.webp",
  },
  {
    id: "sek2",
    name: "Hillyatut Taqiya",
    role: "Sekretaris 2",
    badge: "BPH",
    image: "/hillyatut_taqiya.webp",
  },
  {
    id: "bend1",
    name: "Zahra Naila Supriyono Putri",
    role: "Bendahara 1",
    badge: "BPH",
    image: "/zahra_naila.webp",
  },
  {
    id: "bend2",
    name: "Putri Fara Diba",
    role: "Bendahara 2",
    badge: "BPH",
    image: "/putri_fara.webp",
  },
  {
    id: "ko-acara",
    name: "Jefranda Dinata",
    role: "Koordinator SC & Acara",
    badge: "Acara",
    image: "/jefranda_dinata.webp",
  },
  {
    id: "wko-acara",
    name: "Khairun Niza",
    role: "Wakil Koordinator SC & Acara",
    badge: "Acara",
    image: "/khairun_niza.webp",
  },
  {
    id: "ko-pdd",
    name: "Alfian Khusnul Fatoni",
    role: "Koordinator PDD",
    badge: "PDD",
    image: "/alfian_fatoni.webp",
  },
  {
    id: "ko-logtrans",
    name: "Muhammad Faidza Airlangga",
    role: "Koordinator Logtrans",
    badge: "Logtrans",
    image: "/faidza_airlangga.webp",
  },
  {
    id: "ko-medis",
    name: "Callysta Goesti Annayla S.",
    role: "Koordinator Medis",
    badge: "Medis",
    image: "/callysta_goesti.webp",
  },
  {
    id: "ko-mk",
    name: "M Arya Ivandy Rohman",
    role: "Koordinator MK",
    badge: "MK",
    image: "/ivandy_rohman.webp",
  },
  {
    id: "wko-mk",
    name: "Dealova Fransisca Ferlianti",
    role: "Wakil Koordinator MK",
    badge: "MK",
    image: "/dealova_fransisca.webp",
  },
];

export default function PanitiaCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = PANITIA_PERSONS.length;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // Auto-play animasi pergeseran 3D coverflow otomatis setiap 2.5 detik
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 2500);

    return () => clearInterval(timer);
  }, [isPaused, total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={styles.container}>
      <div
        className={styles.cardStack}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {PANITIA_PERSONS.map((person, i) => {
          let offset = i - activeIndex;

          // Circular offset calculation
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isCenter = offset === 0;
          const absOffset = Math.abs(offset);

          // 3D Coverflow positioning math
          const xOffset = offset * 185;
          const yOffset = absOffset * 6;
          const scale = 1 - absOffset * 0.12;
          const rotateY = offset * -12;
          const zIndex = 30 - absOffset;
          const opacity = Math.max(0.35, 1 - absOffset * 0.22);
          const blur = isCenter ? 0 : absOffset === 1 ? 1.5 : 4;

          const shadow = isCenter
            ? "0 22px 45px rgba(0, 0, 0, 0.45), 0 0 30px rgba(31, 75, 93, 0.4)"
            : "0 10px 25px rgba(0, 0, 0, 0.25)";

          const border = isCenter
            ? "1px solid rgba(104, 207, 235, 0.8)"
            : "1px solid rgba(255, 255, 255, 0.15)";

          return (
            <div
              key={person.id}
              className={styles.card}
              onClick={() => setActiveIndex(i)}
              style={{
                transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex: zIndex,
                opacity: opacity,
                filter: `blur(${blur}px)`,
                boxShadow: shadow,
                border: border,
                transition:
                  "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s ease",
                willChange: "transform, opacity, filter",
              }}
            >
              {/* Background Photo */}
              <img
                src={getCloudinaryUrl(person.image, 0)}
                alt={person.name}
                className={styles.cardPhoto}
                loading="lazy"
                decoding="async"
              />

              {/* Gradient Overlay */}
              <div className={styles.cardGradient} />

              {/* Footer Information */}
              <div className={styles.cardFooter}>
                <span className={styles.badgePill}>{person.badge}</span>
                <h4 className={styles.personName}>{person.name}</h4>
                <p className={styles.personRole}>{person.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsWrapper}>
        <div className={styles.btnGroup}>
          <button
            className={styles.navBtn}
            onClick={handlePrev}
            aria-label="Panitia sebelumnya"
          >
            ‹
          </button>

          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#1f4b5d",
              padding: "0.3rem 0.85rem",
              background: "rgba(31,75,93,0.08)",
              borderRadius: "999px",
            }}
          >
            {activeIndex + 1} / {total}
          </span>

          <button
            className={styles.navBtn}
            onClick={handleNext}
            aria-label="Panitia selanjutnya"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
