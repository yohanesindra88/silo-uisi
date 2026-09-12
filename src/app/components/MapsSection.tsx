'use client';

import React from "react";
import styles from "./MapsSection.module.css";
import { MapPin, Navigation, Clock, Building2, ExternalLink } from "lucide-react";

export default function MapsSection() {
  const googleMapsUrl =
    "https://maps.google.com/?q=Kompleks+PT.+Semen+Indonesia,+Jl.+Veteran,+Tuban+Barat,+Tlogobendung,+Kec.+Gresik,+Kabupaten+Gresik,+Jawa+Timur+61122";

  return (
    <section id="lokasi" className={styles.section} data-aos="fade-up">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Lokasi <span className={styles.titleGradient}>Kampus UISI Gresik</span>
        </h2>
        <p className={styles.subtitle}>
          Titik lokasi utama pelaksanaan kegiatan AETHERA SILO UISI 2026. Temukan petunjuk arah dan akses transportasi menuju lokasi kampus.
        </p>
      </div>

      <div className={styles.gridContainer}>
        {/* Information Panel */}
        <div className={styles.infoPanel}>
          {/* Card 1: Alamat */}
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <MapPin size={22} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>Alamat Utama Kampus</h3>
              <p className={styles.infoText}>
                Kompleks PT. Semen Indonesia, Jl. Veteran, Tuban Barat, Tlogobendung, Kec. Gresik, Kabupaten Gresik, Jawa Timur 61122
              </p>
            </div>
          </div>

          {/* Card 2: Gedung & Venue */}
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Building2 size={22} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>Pusat Kegiatan SILO 2026</h3>
              <p className={styles.infoText}>
                Lapangan Utama Kampus, Auditorium Utama, dan Hall Serbaguna UISI Gresik.
              </p>
            </div>
          </div>

          {/* Card 3: Akses Transportasi */}
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Navigation size={22} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>Aksesibilitas &amp; Rute</h3>
              <p className={styles.infoText}>
                Dapat diakses 10 menit dari Pintu Tol Kebomas/Romokalisari, dekat Stasiun Indro Gresik &amp; Terminal Bunder.
              </p>
            </div>
          </div>

          {/* Google Maps Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsBtn}
          >
            Buka Petunjuk Arah Google Maps <ExternalLink size={16} />
          </a>
        </div>

        {/* Map Frame */}
        <div className={styles.mapFrame}>
          <iframe
            title="Peta Lokasi Kampus UISI Gresik"
            className={styles.iframe}
            src="https://maps.google.com/maps?q=Universitas+Internasional+Semen+Indonesia+(Kampus+B),+Jl.+Veteran,+Gresik&t=&z=16&ie=UTF8&iwloc=&output=embed"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
