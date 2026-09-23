import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import DokumentasiGallery from "../components/DokumentasiGallery";
import VideoSection from "../components/VideoSection";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";
import Footer from "../components/Footer";

export const metadata = {
  title: "Galeri & Video - AETHERA SILO UISI 2026",
  description: "Kilasan Dokumentasi Foto SILO 2025 & Video Highlights Official AETHERA SILO UISI 2026.",
};

export default function GaleriPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== DOKUMENTASI TAHUN LALU ===== */}
        <section id="dokumentasi" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Kilasan <span className={styles.titleGradient}>SILO Tahun Lalu</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Kilas Balik Kemeriahan &amp; Momen Berkesan SILO UISI 2025
          </p>

          <DokumentasiGallery />
        </section>

        {/* ===== VIDEO DOKUMENTASI SILO ===== */}
        <VideoSection />
      </main>

      <Footer />
    </div>
  );
}
