"use client";

import React from "react";
import dynamic from "next/dynamic";
import styles from "./GuidebookSection.module.css";

// Dynamic import with SSR disabled for canvas/pdfjs-dist/react-pageflip
const GuidebookFlipbook = dynamic(
  () => import("./GuidebookFlipbook"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <div className={styles.loadingText}>Inisialisasi Flipbook Guidebook...</div>
      </div>
    ),
  }
);

export default function GuidebookSection() {
  return (
    <section id="guidebook" className={styles.section} data-aos="fade-up">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            The Guidebook of <span className={styles.highlightText}>BRANARA SILO 2025</span>
          </h2>
          <p className={styles.subtitle}>
            Buku panduan resmi kegiatan Student Initiation and Learning Orientation (SILO) UISI.
            Pelajari informasi rangkaian acara, tata tertib, serta atribut penugasan mahasiswa baru.
          </p>
        </div>

        <GuidebookFlipbook pdfUrl="/guidebook.pdf" />
      </div>
    </section>
  );
}
