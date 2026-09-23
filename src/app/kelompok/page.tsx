import React from "react";
import Navbar from "../components/Navbar";
import GlobeSection from "../components/GlobeSection";
import styles from "../page.module.css";
import Link from "next/link";
import { Hexagon, Camera, MessageCircle, Mail } from "lucide-react";
import Footer from "../components/Footer";

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

      <Footer />
    </div>
  );
}
