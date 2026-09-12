"use client";

import React from "react";
import styles from "./SambutanSection.module.css";
import { getCloudinaryUrl } from "@/utils/cloudinary";

import rektorImg from "./Rektor.jpg";

interface SambutanItem {
  id: string;
  imagePosition: "left" | "right";
  sectionTitle: string;
  badgeBanner: string;
  name: string;
  title: string;
  image: string;
  isLocal?: boolean;
  paragraphs: string[];
}

const SAMBUTAN_DATA: SambutanItem[] = [
  {
    id: "rektor",
    imagePosition: "right",
    sectionTitle: "Sambutan Rektor UISI",
    badgeBanner: "REKTOR UISI",
    name: "Dr. Eka Ananta Sidharta, S.E., M.M., Ak., CA.",
    title: "Rektor Universitas Internasional Semen Indonesia (UISI)",
    image: rektorImg.src,
    isLocal: true,
    paragraphs: [
      "Assalamualaikum warahmatullahi wabarakatuh, Selamat Pagi dan Salam Sejahtera bagi Kita Semua.",
      "Selamat datang Generasi Muda Aethera di Kampus Perjuangan dan Karya, Universitas Internasional Semen Indonesia (UISI). SILO 2026 merupakan gerbang pembuka perjalanan akademis dan pembentukan karakter dalam lingkungan perguruan tinggi yang adaptif, unggul, dan berintegritas tinggi.",
      "Di UISI, kalian diajak untuk mengasah keilmuan, berinovasi, dan memberikan dampak nyata bagi masyarakat global. Manfaatkan setiap momen di SILO 2026 ini dengan semangat belajar tinggi, keterbukaan pikiran, dan nilai-nilai kebersamaan.",
      "Selamat berjuang dan mulailah perjalanan emas kalian bersama Universitas Internasional Semen Indonesia!",
    ],
  },
  {
    id: "mahasiswa",
    imagePosition: "left",
    sectionTitle: "Sambutan Ketua Pelaksana",
    badgeBanner: "KETUA PELAKSANA MAHASISWA",
    name: "Nabil Qudsi Mas'ud",
    title: "Ketua Pelaksana Panitia Mahasiswa AETHERA SILO UISI 2026",
    image: "/nabil_qudsi.webp?v=2",
    paragraphs: [
      "Salam Semangat Ksatria Aethera 2026!",
      "Selamat datang di kampus pergerakan dan karya, Universitas Internasional Semen Indonesia (UISI)! Kami atas nama seluruh jajaran Panitia Mahasiswa AETHERA SILO UISI 2026 mengucapkan selamat atas keberhasilan rekan-rekan sekalian menembus gerbang perguruan tinggi ini.",
      "Mengusung nama Aethera, AETHERA SILO UISI 2026 membawa filosofi energi membara, keberanian, dan persatuan. Orientasi ini dirancang bukan untuk membebani, melainkan untuk menempa mentalitas tangguh, mempererat tali persaudaraan antar rasi kelompok, dan memperkenalkan budaya apresiatif serta kolaboratif di lingkungan kampus.",
      "Jangan pernah ragu melangkah keluar dari zona nyaman. Manfaatkan kesempatan ini untuk mengeksplorasi potensi diri, mengasah rasa kepedulian sosial, dan menyerap nilai-nilai kebersamaan. Mari kita ukir jejak karya pertama yang membanggakan bersama di AETHERA SILO UISI 2026!",
    ],
  },
];

export default function SambutanSection() {
  return (
    <section id="sambutan" className={styles.section} data-aos="fade-up">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Sambutan <span className={styles.titleGradient}>Utama</span>
        </h2>
        <p className={styles.subtitle}>
          Pesan semangat, hangat, dan motivasi pembuka perjalanan dari Rektor
          UISI &amp; Ketua Pelaksana Mahasiswa AETHERA SILO UISI 2026.
        </p>
      </div>

      <div className={styles.container}>
        {SAMBUTAN_DATA.map((item) => (
          <div
            key={item.id}
            className={`${styles.sambutanBlock} ${
              item.imagePosition === "left" ? styles.imageLeftBlock : ""
            }`}
          >
            {item.imagePosition === "left" ? (
              <>
                {/* Photo Box on Left */}
                <div className={styles.photoBoxWrapper}>
                  <div className={styles.photoFrame}>
                    <img
                      src={item.isLocal ? item.image : getCloudinaryUrl(item.image, 1000)}
                      alt={item.name}
                      className={styles.portraitPhoto}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Ornate Ribbon Badge */}
                  <div className={styles.bannerRibbon}>
                    <span className={styles.ribbonOrnate}>✦</span>
                    <span className={styles.ribbonText}>
                      {item.badgeBanner}
                    </span>
                    <span className={styles.ribbonOrnate}>✦</span>
                  </div>
                </div>

                {/* Speech Box on Right */}
                <div className={styles.speechBox}>
                  <div className={styles.quoteMark}>&ldquo;</div>
                  <h2 className={styles.speechTitle}>{item.sectionTitle}</h2>

                  <div className={styles.paragraphList}>
                    {item.paragraphs.map((p, idx) => (
                      <p key={idx} className={styles.paragraphItem}>
                        {p}
                      </p>
                    ))}
                  </div>

                  <div className={styles.authorFooter}>
                    <h4 className={styles.authorName}>{item.name}</h4>
                    <p className={styles.authorTitle}>{item.title}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Speech Box on Left */}
                <div className={styles.speechBox}>
                  <div className={styles.quoteMark}>&ldquo;</div>
                  <h2 className={styles.speechTitle}>{item.sectionTitle}</h2>

                  <div className={styles.paragraphList}>
                    {item.paragraphs.map((p, idx) => (
                      <p key={idx} className={styles.paragraphItem}>
                        {p}
                      </p>
                    ))}
                  </div>

                  <div className={styles.authorFooter}>
                    <h4 className={styles.authorName}>{item.name}</h4>
                    <p className={styles.authorTitle}>{item.title}</p>
                  </div>
                </div>

                {/* Photo Box on Right */}
                <div className={styles.photoBoxWrapper}>
                  <div className={styles.photoFrame}>
                    <img
                      src={item.isLocal ? item.image : getCloudinaryUrl(item.image, 1000)}
                      alt={item.name}
                      className={styles.portraitPhoto}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Ornate Ribbon Badge */}
                  <div className={styles.bannerRibbon}>
                    <span className={styles.ribbonOrnate}>✦</span>
                    <span className={styles.ribbonText}>
                      {item.badgeBanner}
                    </span>
                    <span className={styles.ribbonOrnate}>✦</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
