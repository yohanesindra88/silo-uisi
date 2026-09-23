import SponsorSection from "./components/SponsorSection";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import CountdownSection from "./components/CountdownSection";
import LowPolyBackground from "./components/LowPolyBackground";
import DokumentasiGallery from "./components/DokumentasiGallery";
import Navbar from "./components/Navbar";
import ClickSpark from "./components/ClickSpark";
import SambutanSection from "./components/SambutanSection";
import MapsSection from "./components/MapsSection";
import VideoSection from "./components/VideoSection";
import MerchCarousel from "./components/MerchCarousel";
import Footer from "./components/Footer";
import { getDocumentationItems } from "@/utils/documentations";

export const dynamic = "force-dynamic";
import {
  Sparkles,
  Zap,
  Waves,
  Video,
  Image as ImageIcon,
  Palette,
  FileText,
  Book,
  Download,
  Folder,
  Music,
  Megaphone,
  Shirt,
  ShoppingBag,
  Award,
  Camera,
  MessageCircle,
  Mail,
  Send,
} from "lucide-react";

export default async function Home() {
  const dokumentasiItems = await getDocumentationItems();
  return (
    <ClickSpark
      sparkColor="#68CFEB"
      sparkSize={12}
      sparkRadius={25}
      sparkCount={8}
      duration={400}
    >
      <div className={styles.container}>
        <LowPolyBackground />

        {/* ===== NAVBAR ===== */}
        <Navbar />

        <main className={styles.main}>
          {/* ===== HERO ===== */}
          <section className={styles.hero}>
            <div className={styles.heroContent} data-aos="fade-right">
              <span className={styles.heroTag}>
                <Sparkles
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    marginRight: "6px",
                  }}
                  size={14}
                />{" "}
                AETHERA SILO UISI 2026
              </span>
              <h1 className={styles.heroTitle}>
                Selamat Datang <br />
                <span className={styles.heroTitleAccent}>Satya Ismaya 14</span>
              </h1>
              <p className={styles.heroDesc}>
                Portal Resmi Informasi dan Layanan Orientasi AETHERA SILO UISI
                2026 Universitas Internasional Semen Indonesia. Temukan jadwal,
                kelompok, dan penugasan lengkap di sini.
              </p>
              <div className={styles.heroButtons}>
                <Link href="#about" className={styles.ctaButton}>
                  Jelajahi Aethera
                </Link>
                <Link
                  href="/penugasan#kebutuhan-acara"
                  className={styles.ctaButtonOutline}
                >
                  Unduh Kebutuhan
                </Link>
              </div>
            </div>

            <div className={styles.heroVisual} data-aos="fade-left">
              <div className={styles.heroGeoBg}></div>
              <div className={styles.heroImageContainer}>
                <img
                  src="/hero_rocket.png"
                  alt="Aethera Rocket Illustration"
                  width={480}
                  height={480}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </section>

          {/* ===== COUNTDOWN SECTION ===== */}
          <CountdownSection />

          {/* ===== ABOUT SILO ===== */}
          <section id="about" className={styles.section} data-aos="fade-up">
            <div className={styles.aboutGrid}>
              <div>
                <h2
                  className={styles.sectionTitle}
                  style={{ textAlign: "left" }}
                >
                  Tentang{" "}
                  <span className={styles.titleGradient}>
                    AETHERA SILO UISI 2026
                  </span>
                </h2>
                <p className={styles.aboutText}>
                  <strong>AETHERA SILO UISI 2026</strong> (Student Initiation
                  and Learning Orientation) merupakan kegiatan pengenalan
                  kehidupan kampus bagi mahasiswa baru Universitas Internasional
                  Semen Indonesia. AETHERA SILO UISI 2026 hadir sebagai ruang
                  pembinaan awal yang adaptif, inovatif, dan berkarakter.
                </p>
              </div>
              <div className={styles.aboutImage}>
                <img
                  src="/logo_aethera_title.png"
                  alt="AETHERA SILO UISI 2026 Logo"
                  style={{
                    width: "80%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "1.5rem",
                  }}
                />
              </div>
            </div>
          </section>

          {/* ===== SAMBUTAN KETUA PELAKSANA ===== */}
          <SambutanSection />

          {/* ===== DOKUMENTASI TAHUN LALU ===== */}
          <section
            id="dokumentasi"
            className={styles.section}
            data-aos="fade-up"
          >
            <h2 className={styles.sectionTitle}>
              Kilasan{" "}
              <span className={styles.titleGradient}>SILO Tahun Lalu</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Kilas Balik Kemeriahan &amp; Momen Berkesan SILO UISI 2025
            </p>

            <DokumentasiGallery items={dokumentasiItems} />
          </section>

          {/* ===== VIDEO DOKUMENTASI SILO ===== */}
          <VideoSection />

          {/* ===== MERCHANDISE ===== */}
          <section
            id="merch"
            className={styles.section}
            style={{ overflow: "hidden" }}
            data-aos="fade-up"
          >
            <MerchCarousel />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "0.5rem",
              }}
            >
              <Link href="/merch" className={styles.merchButtonLink}>
                Lihat Selengkapnya &rarr;
              </Link>
            </div>
          </section>

          {/* ===== SPONSOR & MEDIA PARTNER ===== */}
          <SponsorSection />

          {/* ===== MAPS LOKASI KAMPUS B UISI GRESIK ===== */}
          <MapsSection />

          {/* ===== CONTACT ===== */}
          <section id="contact" className={styles.section}>
            <div
              style={{
                textAlign: "center",
                maxWidth: "700px",
                margin: "0 auto",
              }}
            >
              <p className={styles.aboutText}>
                <strong style={{ color: "var(--lp-text)" }}>
                  AETHERA SILO UISI 2026
                </strong>{" "}
                adalah unit yang mengelola seluruh rangkaian informasi dan
                layanan Penerimaan Mahasiswa Baru di Universitas Internasional
                Semen Indonesia. Program ini diselenggarakan sebagai pengenalan
                kampus, nilai, dan komunitas bagi mahasiswa baru angkatan 2026.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </ClickSpark>
  );
}
