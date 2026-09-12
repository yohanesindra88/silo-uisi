import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import DokumentasiGallery from "../components/DokumentasiGallery";
import VideoSection from "../components/VideoSection";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";
import { getDocumentationItems } from "@/utils/documentations";

// Galeri diambil dari database saat request, bukan saat build. Dua alasan:
// admin ingin perubahannya langsung terlihat, dan build Docker berjalan dengan
// DATABASE_URL placeholder sehingga prerender build-time hanya akan menunggu
// koneksi yang memang tidak ada.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galeri & Video - AETHERA SILO UISI 2026",
  description: "Kilasan Dokumentasi Foto SILO 2025 & Video Highlights Official AETHERA SILO UISI 2026.",
};

export default async function GaleriPage() {
  // Galeri kini dikelola admin lewat database; array hardcoded di
  // DokumentasiGallery hanya dipakai sebagai cadangan.
  const dokumentasiItems = await getDocumentationItems();

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

          <DokumentasiGallery items={dokumentasiItems} />
        </section>

        {/* ===== VIDEO DOKUMENTASI SILO ===== */}
        <VideoSection />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div>
          <div className={styles.footerLogo}>
            <Hexagon style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} size={18} color="var(--lp-aqua)" /> AETHERA SILO UISI 2026
          </div>
          <p className={styles.footerDesc}>
            Sistem Informasi &amp; Layanan Orientasi — Portal resmi AETHERA SILO UISI 2026
            Universitas Internasional Semen Indonesia.
          </p>
          <div style={{ display: "flex", gap: "0.85rem", marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}>
            <span style={{ cursor: "pointer" }}><Camera size={18} /></span>
            <span style={{ cursor: "pointer" }}><MessageCircle size={18} /></span>
            <span style={{ cursor: "pointer" }}><Mail size={18} /></span>
          </div>
        </div>

        <div>
          <div className={styles.footerColTitle}>Menu</div>
          <div className={styles.footerLinks}>
            <Link href="/">Beranda</Link>
            <Link href="/about">Tentang</Link>
            <Link href="/panitia">Panitia</Link>
            <Link href="/penugasan">Penugasan</Link>
            <Link href="/galeri">Galeri</Link>
            <Link href="/kelompok">Kelompok</Link>
            <Link href="/lokasi">Lokasi</Link>
          </div>
        </div>

        <div>
          <div className={styles.footerColTitle}>Kontak</div>
          <div className={styles.footerLinks}>
            <a href="https://www.instagram.com/silouisi2026?igsh=MThqZ2Z1YXAzcng1ZA==" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@branarasilouisi2025?_r=1&_t=ZS-98iD5zNgHEi" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href="https://wa.me/6289667151265" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="mailto:pkkmb@uisi.ac.id">Email</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
