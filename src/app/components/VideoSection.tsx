'use client';

import React from "react";
import styles from "./VideoSection.module.css";
import { Film, Flame } from "lucide-react";

interface VideoRow {
  id: string;
  youtubeId: string;
  title: string;
  hashtag: string;
  badge: string;
  videoPosition: "left" | "right";
}

const VIDEO_ROWS: VideoRow[] = [
  {
    id: "v1",
    youtubeId: "xtugHXaFhLY",
    title: "Aftermovie & Highlight Keseruan SILO UISI",
    hashtag: "#SalamAethera",
    badge: "Official Aftermovie",
    videoPosition: "right"
  },
  {
    id: "v2",
    youtubeId: "03zyuX-I3yo",
    title: "Dokumentasi Momen Spektakuler SILO UISI",
    hashtag: "#KsatriaAethera",
    badge: "Opening Ceremony",
    videoPosition: "left"
  },
  {
    id: "v3",
    youtubeId: "bN5Opq9PO9k",
    title: "Kilas Balik Euforia & Kemeriahan Ksatria SILO",
    hashtag: "#BranaraAethera",
    badge: "Euforia SILO",
    videoPosition: "right"
  }
];

export default function VideoSection() {
  return (
    <section id="video" className={styles.section} data-aos="fade-up">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Video <span className={styles.titleGradient}>Dokumentasi SILO</span>
        </h2>
        <p className={styles.subtitle}>
          Tonton rekaman video keseruan, aftermovie, dan momen spektakuler berkesan perjalanan SILO Universitas Internasional Semen Indonesia.
        </p>
      </div>

      {/* Rows */}
      <div className={styles.rowsContainer}>
        {VIDEO_ROWS.map((row) => (
          <div
            key={row.id}
            className={`${styles.row} ${
              row.videoPosition === "left" ? styles.rowImageLeft : ""
            }`}
          >
            {/* Video Column */}
            <div className={styles.videoCol}>
              <div className={styles.videoCard}>
                <div className={styles.iframeWrapper}>
                  <iframe
                    className={styles.iframe}
                    src={`https://www.youtube.com/embed/${row.youtubeId}`}
                    title={row.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen={true}
                  />
                </div>
              </div>
            </div>

            {/* Info & Hashtag Column */}
            <div className={styles.infoCol}>
              <div className={styles.infoCard}>
                <span className={styles.badgePill}>
                  <Film size={14} /> {row.badge}
                </span>
                <h3 className={styles.videoTitle}>{row.title}</h3>
                <div className={styles.hashtagBox}>
                  <Flame size={20} className={styles.flameIcon} />
                  <span className={styles.hashtagText}>{row.hashtag}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
