import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import GuidebookSection from "../components/GuidebookSection";
import Footer from "../components/Footer";
import {
  Hexagon,
  Image as ImageIcon,
  FileText,
  Camera,
  MessageCircle,
  Mail,
  Book,
  Download,
  Folder,
  Award,
} from "lucide-react";

export const metadata = {
  title: "Guidebook - AETHERA SILO UISI 2026",
  description:
    "Buku Panduan PDF Flipbook AETHERA SILO UISI 2026.",
};

export default function PenugasanPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== GUIDEBOOK PDF FLIPBOOK ===== */}
        <GuidebookSection />

        {/* ===== KEBUTUHAN ACARA ===== */}
        <section
          id="kebutuhan-acara"
          className={styles.section}
          data-aos="fade-up"
          suppressHydrationWarning
        >
          <h2 className={styles.sectionTitle}>Kebutuhan SILO UISI 2026</h2>
          <p className={styles.sectionSubtitle}>
            Unduh seluruh dokumen, template, dan atribut penting untuk persiapan
            mengikuti rangkaian acara SILO UISI 2026.
          </p>

          <div className={styles.servicesGridCentered}>
            {/* Guidebook */}
            <div className={`${styles.card} ${styles.cardCentered}`}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(31,75,93,0.1)",
                  color: "var(--lp-ocean-blue)",
                }}
              >
                <Book size={24} />
              </div>
              <h3 className={styles.cardTitle}>Guidebook SILO</h3>
              <p className={styles.cardDesc}>
                Buku panduan lengkap berisi tata tertib, jadwal, dan informasi
                umum SILO UISI 2026.
              </p>
              <Link
                href="https://drive.google.com/drive/folders/1btpo7hne9yhTdnpBKHs5KNvLcUui-ju_?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <Download size={16} /> Unduh Guidebook
              </Link>
            </div>

            {/* Twibbon */}
            <div className={`${styles.card} ${styles.cardCentered}`}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(104,207,235,0.1)",
                  color: "var(--lp-aqua)",
                }}
              >
                <ImageIcon size={24} />
              </div>
              <h3 className={styles.cardTitle}>Twibbon Peserta</h3>
              <p className={styles.cardDesc}>
                Frame Twibbon resmi untuk diunggah di Instagram sebagai tanda
                keikutsertaan.
              </p>
              <Link
                href="https://drive.google.com/drive/folders/1IsF1cmEFSCZnVtcv-BE6QDQzV2jGGkqu?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <Download size={16} /> Unduh Twibbon
              </Link>
            </div>

            {/* Frame Penugasan */}
            <div className={`${styles.card} ${styles.cardCentered}`}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(31,30,25,0.1)",
                  color: "var(--lp-charcoal)",
                }}
              >
                <Folder size={24} />
              </div>
              <h3 className={styles.cardTitle}>Frame Penugasan</h3>
              <p className={styles.cardDesc}>
                Template frame standar untuk pengumpulan tugas harian dan tugas
                kelompok.
              </p>
              <Link
                href="https://drive.google.com/drive/folders/1vJcjksbsRCojRxGTEol4SXz_qZEbMlne?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <Download size={16} /> Unduh Frame
              </Link>
            </div>

            {/* Handbook */}
            <div className={`${styles.card} ${styles.cardCentered}`}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(104,207,235,0.1)",
                  color: "var(--lp-aqua)",
                }}
              >
                <FileText size={24} />
              </div>
              <h3 className={styles.cardTitle}>Handbook Materi</h3>
              <p className={styles.cardDesc}>
                Modul materi dan lembar kerja untuk sesi pemaparan selama
                rangkaian acara.
              </p>
              <Link
                href="https://drive.google.com/drive/folders/1tPKxXblk8jLVDqOVXdVuC791TosTm4he?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <Download size={16} /> Unduh Handbook
              </Link>
            </div>

            {/* ID Card */}
            <div className={`${styles.card} ${styles.cardCentered}`}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(31,75,93,0.1)",
                  color: "var(--lp-ocean-blue)",
                }}
              >
                <Award size={24} />
              </div>
              <h3 className={styles.cardTitle}>Template Name Tag</h3>
              <p className={styles.cardDesc}>
                Format standar tanda pengenal (Co-Card) untuk dicetak dan
                digunakan saat offline.
              </p>
              <Link
                href="https://drive.google.com/drive/folders/14VvFloUDEYsLIgUso6xJgCxB0fPLlT6h?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadBtn}
              >
                <Download size={16} /> Unduh Name Tag
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
