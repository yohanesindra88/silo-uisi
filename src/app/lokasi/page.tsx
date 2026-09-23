import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import MapsSection from "../components/MapsSection";
import SponsorSection from "../components/SponsorSection";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";
import Footer from "../components/Footer";

export const metadata = {
  title: "Lokasi Kampus - AETHERA SILO UISI 2026",
  description: "Lokasi Resmi Kampus UISI Gresik, Alamat Lengkap, dan Petunjuk Navigasi Google Maps.",
};

export default function LokasiPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== MAPS LOKASI KAMPUS UISI GRESIK ===== */}
        <MapsSection />

        {/* ===== SPONSOR & MEDIA PARTNER ===== */}
        <SponsorSection />
      </main>

      <Footer />
    </div>
  );
}
