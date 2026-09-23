import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import PanitiaCarousel from "../components/PanitiaCarousel";
import AnggotaDivisi from "../components/AnggotaDivisi";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";
import Footer from "../components/Footer";

export const metadata = {
  title: "Daftar Panitia - AETHERA SILO UISI 2026",
  description: "Daftar Lengkap BPH, Koordinator Divisi, dan 112 Anggota Panitia AETHERA SILO UISI 2026.",
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
            BPH, Koordinator Divisi &amp; 112 Anggota Panitia AETHERA SILO UISI 2026
          </p>

          <PanitiaCarousel />

          <AnggotaDivisi />
        </section>
      </main>

      <Footer />
    </div>
  );
}
