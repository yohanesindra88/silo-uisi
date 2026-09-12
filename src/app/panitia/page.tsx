import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import PanitiaCarousel from "../components/PanitiaCarousel";
import AnggotaDivisi from "../components/AnggotaDivisi";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Daftar Panitia - AETHERA SILO UISI 2026",
  description: "Daftar Lengkap BPH, Koordinator Divisi, dan 113 Anggota Panitia AETHERA SILO UISI 2026.",
};

export default function PanitiaPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== DAFTAR PANITIA ===== */}
        <section id="panitia" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Daftar <span className={styles.titleGradient}>Panitia</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            BPH, Koordinator Divisi &amp; 113 Anggota Panitia AETHERA SILO UISI 2026
          </p>

          <PanitiaCarousel />

          <AnggotaDivisi />
        </section>
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
