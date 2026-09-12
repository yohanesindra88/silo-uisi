import React from "react";
import styles from "../page.module.css";
import { getCloudinaryUrl } from "@/utils/cloudinary";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import SambutanSection from "../components/SambutanSection";
import SponsorSection from "../components/SponsorSection";
import { Hexagon, Zap, Waves, Camera, MessageCircle, Mail } from "lucide-react";

export const metadata = {
  title: "Tentang & Sambutan - AETHERA SILO UISI 2026",
  description: "Tentang AETHERA SILO UISI 2026, Sambutan Ketua Pelaksana, dan Filosofi Logo Aethera.",
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== ABOUT SILO ===== */}
        <section id="about" className={styles.section}>
          <div className={styles.aboutGrid}>
            <div>
              <h2 className={styles.sectionTitle} style={{ textAlign: "left" }}>
                Tentang <span className={styles.titleGradient}>AETHERA SILO UISI 2026</span>
              </h2>
              <p className={styles.aboutText}>
                <strong>AETHERA SILO UISI 2026</strong>{" "}
                (Student Initiation and Learning Orientation) merupakan kegiatan
                pengenalan kehidupan kampus bagi mahasiswa baru Universitas
                Internasional Semen Indonesia. AETHERA SILO UISI 2026 hadir sebagai
                ruang pembinaan awal yang adaptif, inovatif, dan berkarakter.
              </p>
            </div>
            <div className={styles.aboutImage}>
              <img
                src={getCloudinaryUrl("/portfolio_phones.webp")}
                alt="AETHERA SILO UISI 2026 Preview"
                style={{ width: "100%", height: "auto", borderRadius: "1.5rem" }}
              />
            </div>
          </div>
        </section>

        {/* ===== SAMBUTAN KETUA PELAKSANA ===== */}
        <SambutanSection />

        {/* ===== LOGO PHILOSOPHY ===== */}
        <section id="logo" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Filosofi <span className={styles.titleGradient}>Logo Aethera</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Simbol keberanian, inovasi, dan persatuan Satya Ismaya 14 UISI 2026.
          </p>

          <div className={styles.servicesGrid}>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,75,93,0.1)", color: "var(--lp-ocean-blue)" }}>
                <Hexagon size={24} />
              </div>
              <h3 className={styles.cardTitle}>Heksagon Presisi</h3>
              <p className={styles.cardDesc}>
                Melambangkan struktur yang kokoh, efisiensi, dan integrasi antar
                disiplin ilmu di UISI.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(104,207,235,0.1)", color: "var(--lp-aqua)" }}>
                <Zap size={24} />
              </div>
              <h3 className={styles.cardTitle}>Inti Aether</h3>
              <p className={styles.cardDesc}>
                Energi tak terbatas dan semangat membara yang mendorong mahasiswa
                mencapai puncak prestasi.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,30,25,0.1)", color: "var(--lp-charcoal)" }}>
                <Waves size={24} />
              </div>
              <h3 className={styles.cardTitle}>Gelombang Adaptif</h3>
              <p className={styles.cardDesc}>
                Fleksibilitas dan ketahanan mahasiswa baru dalam menghadapi tantangan
                dunia industri global.
              </p>
            </div>
          </div>
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
