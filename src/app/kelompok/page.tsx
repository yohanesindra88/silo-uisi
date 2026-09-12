import React from "react";
import Navbar from "../components/Navbar";
import GlobeSection from "../components/GlobeSection";
import styles from "../page.module.css";
import Link from "next/link";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Cluster Kelompok - AETHERA SILO UISI 2026",
  description: "Daftar 16 Cluster Negara Rasi AETHERA SILO UISI 2026 dalam peta Globe 3D interaktif.",
};

export default function KelompokPage() {
  return (
    <div className={styles.container}>
      <Navbar />

      <main style={{ minHeight: "85vh", padding: "1rem 0" }}>
        {/* ===== 3D GLOBE INTERACTIVE SECTION ===== */}
        <GlobeSection />
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
            <Link href="/logo">Filosofi Logo</Link>
            <Link href="/panitia">Panitia</Link>
            <Link href="/penugasan">Penugasan</Link>
            <Link href="/kelompok">Kelompok</Link>
            <Link href="/merch">Merchandise</Link>
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
