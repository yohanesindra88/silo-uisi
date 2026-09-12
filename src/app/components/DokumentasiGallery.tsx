"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DokumentasiGallery.module.css";
import { getCloudinaryUrl } from "@/utils/cloudinary";

export interface DocItem {
  id: string;
  src: string;
  title: string;
  tag: string;
}

/**
 * Data cadangan bila database belum di-seed atau fetch gagal.
 * Sumber kebenaran sekarang ada di tabel m_documentations; lihat
 * prisma/seeders/documentations.seeder.ts.
 */
const FALLBACK_DOC_ITEMS: DocItem[] = [
  {
    id: "doc-1",
    src: "/dokumentasi/doc_1.webp",
    title: "Keseruan & Antusiasme Mahasiswa Baru SILO UISI 2025",
    tag: "Euforia Maba",
  },
  {
    id: "doc-3",
    src: "/dokumentasi/doc_3.webp",
    title: "Upacara Pembukaan Opening Ceremony SILO 2025",
    tag: "Upacara Utama",
  },
  {
    id: "doc-4",
    src: "/dokumentasi/doc_4.webp",
    title: "Penampilan Seni Budaya Reog Ponorogo",
    tag: "Seni Budaya",
  },
  {
    id: "doc-5",
    src: "/dokumentasi/doc_5.webp",
    title: "Partisipasi Aktif & Pembekalan Mahasiswa Baru",
    tag: "Materi Utama",
  },
  {
    id: "doc-6",
    src: "/dokumentasi/doc_6.webp",
    title: "Atraksi Pencak Silat & Banner Selamat Datang Maba",
    tag: "Atraksi & Seremonial",
  },
  {
    id: "doc-7",
    src: "/dokumentasi/doc_7.webp",
    title: "Sesi Pembagian Merchandise & Briefing Mahasiswa",
    tag: "Sesi Materi",
  },
  {
    id: "doc-8",
    src: "/dokumentasi/doc_8.webp",
    title: "Kebersamaan & Kekompakan Rasi Mahasiswa Baru",
    tag: "Kebersamaan Maba",
  },
  {
    id: "doc-9",
    src: "/dokumentasi/doc_9.webp",
    title: "Fun Games & Lempar Bola Outbound SILO 2025",
    tag: "Outbound Games",
  },
  {
    id: "doc-10",
    src: "/dokumentasi/doc_10.webp",
    title: "Sesi Kepemimpinan & Pengarahan Instruktur Outbound",
    tag: "Team Building",
  },
  {
    id: "doc-11",
    src: "/dokumentasi/doc_11.webp",
    title: "Sambutan Rektor UISI di Panggung Inagurasi Malam",
    tag: "Sambutan Rektor",
  },
  {
    id: "doc-12",
    src: "/dokumentasi/doc_12.webp",
    title: "Orasi & Arahan Kebangsaan Rektor UISI",
    tag: "Orasi Rektor",
  },
  {
    id: "doc-13",
    src: "/dokumentasi/doc_13.webp",
    title: "Simulasi & Pelatihan Lapangan Mahasiswa Baru",
    tag: "Simulasi Lapangan",
  },
];

export interface DokumentasiGalleryProps {
  /** Diisi server component dari database; kosong -> pakai data cadangan. */
  items?: DocItem[];
}

export default function DokumentasiGallery({ items }: DokumentasiGalleryProps) {
  const docItems = items && items.length > 0 ? items : FALLBACK_DOC_ITEMS;
  // Duplikasi data agar slider menyambung tanpa henti (infinite seamless loop)
  const extendedItems = [...docItems, ...docItems];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<DocItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const totalOriginal = docItems.length;

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev <= 0 ? totalOriginal - 1 : prev - 1));
  }, [totalOriginal]);

  // Auto-play interval (2.5 detik per slide)
  useEffect(() => {
    if (isPaused || selectedImage) return;

    const timer = setInterval(() => {
      handleNext();
    }, 2800);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, selectedImage, handleNext]);

  // Reset seamless loop saat mencapai bagian duplikat
  const handleTransitionEnd = () => {
    if (currentIndex >= totalOriginal) {
      setIsTransitioning(false);
      setCurrentIndex(currentIndex % totalOriginal);
    }
  };

  // Keyboard navigation when in view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const cardStep = 400; // 380px card + 20px gap

  const displayIndex = (currentIndex % totalOriginal) + 1;

  return (
    <div className={styles.container}>
      <div
        className={styles.carouselTrackWrapper}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={styles.carouselTrack}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${currentIndex * cardStep}px)`,
            transition: isTransitioning
              ? "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
          }}
        >
          {extendedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className={styles.slideCard}
              onClick={() => setSelectedImage(item)}
            >
              <img
                src={getCloudinaryUrl(item.src, 600)}
                alt={item.title}
                className={styles.slideImage}
                loading="lazy"
                decoding="async"
              />
              <div className={styles.overlay}>
                <span className={styles.itemTag}>{item.tag}</span>
                <h3 className={styles.itemTitle}>{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsWrapper}>
        <div className={styles.progressInfo}>
          Foto <strong>{displayIndex}</strong> dari {totalOriginal}
        </div>

        <div className={styles.btnGroup}>
          <button
            className={styles.navBtn}
            onClick={handlePrev}
            aria-label="Previous documentation slide"
          >
            ‹
          </button>
          <button
            className={styles.navBtn}
            onClick={handleNext}
            aria-label="Next documentation slide"
          >
            ›
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className={styles.modal} onClick={() => setSelectedImage(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedImage(null)}
              aria-label="Close image modal"
            >
              ×
            </button>
            <img
              src={getCloudinaryUrl(selectedImage.src)}
              alt={selectedImage.title}
              className={styles.modalImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
