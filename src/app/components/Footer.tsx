"use client";

import React from "react";
import Link from "next/link";
import styles from "../page.module.css";
import { Camera, MessageCircle, Mail, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <div
          className={styles.footerLogo}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <img
            src="/logo_aethera.png?v=4"
            alt="Aethera Logo"
            width={26}
            height={26}
            style={{ height: "26px", width: "auto" }}
          />
          <span>AETHERA SILO UISI 2026</span>
        </div>
        <p className={styles.footerDesc}>
          Sistem Informasi & Layanan Orientasi — Portal resmi AETHERA SILO
          UISI 2026 Universitas Internasional Semen Indonesia.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.85rem",
            marginTop: "1rem",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <span style={{ cursor: "pointer", transition: "color 0.2s" }}>
            <Camera size={18} />
          </span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }}>
            <MessageCircle size={18} />
          </span>
          <span style={{ cursor: "pointer", transition: "color 0.2s" }}>
            <Mail size={18} />
          </span>
        </div>
      </div>

      <div>
        <div className={styles.footerColTitle}>Tautan Cepat</div>
        <div className={styles.footerLinks}>
          <Link href="/#about">Tentang Kami</Link>
          <Link href="/panitia">Daftar Panitia</Link>
          <Link href="/penugasan">Guidebook</Link>
          <Link href="/kelompok">Cluster</Link>
        </div>
      </div>

      <div>
        <div className={styles.footerColTitle}>Kontak</div>
        <div className={styles.footerLinks}>
          <a href="mailto:pkkmb@uisi.ac.id">Email</a>
          <a href="https://www.instagram.com/silouisi2026?igsh=MThqZ2Z1YXAzcng1ZA==" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://wa.me/6289667151265" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href="https://www.tiktok.com/@branarasilouisi2025?_r=1&_t=ZS-98iD5zNgHEi" target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>
      </div>

      <div className={styles.footerNewsletter}>
        <div className={styles.footerColTitle}>Info Terbaru</div>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
          Dapatkan update terbaru seputar AETHERA SILO UISI 2026.
        </p>
        <input
          type="email"
          placeholder="Email kamu..."
          className={styles.footerInput}
        />
        <button className={styles.footerButton}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            Subscribe <Send size={15} />
          </span>
        </button>
      </div>
    </footer>
  );
}
