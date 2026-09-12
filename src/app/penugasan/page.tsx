import React from "react";
import styles from "../page.module.css";
import Link from "next/link";
import Navbar from "../components/Navbar";
import LowPolyBackground from "../components/LowPolyBackground";
import GuidebookSection from "../components/GuidebookSection";
import { 
  Hexagon, 
  Video, 
  Image as ImageIcon, 
  Palette, 
  FileText, 
  Music, 
  Megaphone,
  Camera, 
  MessageCircle, 
  Mail,
  Book,
  Download,
  Folder,
  Award
} from "lucide-react";

export const metadata = {
  title: "Guidebook & Penugasan - AETHERA SILO UISI 2026",
  description: "Buku Panduan PDF Flipbook & Daftar Penugasan Harian AETHERA SILO UISI 2026.",
};

export default function PenugasanPage() {
  return (
    <div className={styles.container}>
      <LowPolyBackground />

      <Navbar />

      <main style={{ minHeight: "80vh", padding: "2rem 0" }}>
        {/* ===== GUIDEBOOK PDF FLIPBOOK ===== */}
        <GuidebookSection />

        {/* ===== DAFTAR PENUGASAN ===== */}
        <section id="penugasan" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Daftar <span className={styles.titleGradient}>Penugasan</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Selesaikan penugasan harian dan kelompok sesuai ketentuan &amp; tenggat waktu AETHERA SILO UISI 2026.
          </p>

          <div className={styles.servicesGrid}>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,75,93,0.1)", color: "var(--lp-ocean-blue)" }}>
                <Video size={24} />
              </div>
              <h3 className={styles.cardTitle}>Video Perkenalan</h3>
              <p className={styles.cardDesc}>
                Video perkenalan kelompok berdurasi minimal 5 menit berisi filosofi nama dan anggota rasi.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(104,207,235,0.1)", color: "var(--lp-aqua)" }}>
                <ImageIcon size={24} />
              </div>
              <h3 className={styles.cardTitle}>Twibbon &amp; Video Bio</h3>
              <p className={styles.cardDesc}>
                Unggah foto Twibbon resmi &amp; video perkenalan individu dengan nada lagu daerah di Instagram.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,30,25,0.1)", color: "var(--lp-charcoal)" }}>
                <Palette size={24} />
              </div>
              <h3 className={styles.cardTitle}>Persiapan Tampah Show</h3>
              <p className={styles.cardDesc}>
                Mengecat tampah kayu diameter 50cm dengan kombinasi warna Orange Crush &amp; Blue Brooch.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(104,207,235,0.1)", color: "var(--lp-aqua)" }}>
                <FileText size={24} />
              </div>
              <h3 className={styles.cardTitle}>Resume Materi</h3>
              <p className={styles.cardDesc}>
                Merangkum materi Pra-SILO dan Core-SILO tulis tangan di kertas A5 bolak-balik dalam format PDF.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,75,93,0.1)", color: "var(--lp-ocean-blue)" }}>
                <Music size={24} />
              </div>
              <h3 className={styles.cardTitle}>Hafalan Lagu Mars</h3>
              <p className={styles.cardDesc}>
                Menghafalkan dan memposting video lagu Mars UISI, Jingle Branara, Buruh Tani, &amp; Darah Juang.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon} style={{ background: "rgba(31,30,25,0.1)", color: "var(--lp-charcoal)" }}>
                <Megaphone size={24} />
              </div>
              <h3 className={styles.cardTitle}>Kampanye Edukatif</h3>
              <p className={styles.cardDesc}>
                Membuat video kampanye edukasi isu sosial secara berkelompok sesuai arahan panitia.
              </p>
            </div>
          </div>
        </section>

        {/* ===== KEBUTUHAN ACARA ===== */}
        <section id="kebutuhan-acara" className={styles.section} data-aos="fade-up">
          <h2 className={styles.sectionTitle}>Kebutuhan Acara</h2>
          <p className={styles.sectionSubtitle}>
            Unduh seluruh dokumen, template, dan atribut penting untuk persiapan 
            mengikuti rangkaian acara SILO UISI 2026.
          </p>

          <div className={styles.servicesGrid}>
            {/* Guidebook */}
            <div className={styles.card}>
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
                Buku panduan lengkap berisi tata tertib, jadwal, dan informasi umum SILO UISI 2026.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh Guidebook
              </Link>
            </div>

            {/* Twibbon */}
            <div className={styles.card}>
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
                Frame Twibbon resmi untuk diunggah di Instagram sebagai tanda keikutsertaan.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh Twibbon
              </Link>
            </div>

            {/* Frame Penugasan */}
            <div className={styles.card}>
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
                Template frame standar untuk pengumpulan tugas harian dan tugas kelompok.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh Frame
              </Link>
            </div>

            {/* Handbook */}
            <div className={styles.card}>
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
                Modul materi dan lembar kerja untuk sesi pemaparan selama rangkaian acara.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh Handbook
              </Link>
            </div>

            {/* ID Card */}
            <div className={styles.card}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(31,75,93,0.1)",
                  color: "var(--lp-ocean-blue)",
                }}
              >
                <Award size={24} />
              </div>
              <h3 className={styles.cardTitle}>Template ID Card</h3>
              <p className={styles.cardDesc}>
                Format standar tanda pengenal (Co-Card) untuk dicetak dan digunakan saat offline.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh ID Card
              </Link>
            </div>

            {/* Virtual Background */}
            <div className={styles.card}>
              <div
                className={styles.cardIcon}
                style={{
                  background: "rgba(31,30,25,0.1)",
                  color: "var(--lp-charcoal)",
                }}
              >
                <Camera size={24} />
              </div>
              <h3 className={styles.cardTitle}>Virtual Background</h3>
              <p className={styles.cardDesc}>
                Latar belakang virtual resmi yang wajib digunakan saat sesi pertemuan online.
              </p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                <Download size={16} /> Unduh Background
              </Link>
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
