"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Center } from "@react-three/drei";
import { getCoordinatesFromLatLng } from "@/utils/coordinates";
import * as THREE from "three";
import styles from "../page.module.css";

export interface ClusterData {
  id: string;
  no: number;
  name: string;
  country: string;
  continent: "Asia" | "Afrika" | "Eropa" | "Amerika" | "Oceania";
  flag: string;
  flagUrl: string;
  desc: string;
  location: [number, number];
}

export const CLUSTERS: ClusterData[] = [
  // --- ASIA ---
  {
    id: "01",
    no: 1,
    name: "Kelompok 1 - Jepang",
    country: "Jepang",
    continent: "Asia",
    flag: "🇯🇵",
    flagUrl: "https://flagcdn.com/jp.svg",
    desc: "Negara Sakura dengan filosofi Kaizen dan teknologi canggih. Melambangkan disiplin, inovasi, dan dedikasi tinggi.",
    location: [49.9400, 148.6400],
  },
  {
    id: "02",
    no: 2,
    name: "Kelompok 2 - Korea Selatan",
    country: "Korea Selatan",
    continent: "Asia",
    flag: "🇰🇷",
    flagUrl: "https://flagcdn.com/kr.svg",
    desc: "Pusat gelombang budaya global dan inovasi teknologi digital. Mewakili kreativitas, kerja keras, dan jaringan global.",
    location: [42.0000, 115.0000],
  },
  {
    id: "03",
    no: 3,
    name: "Kelompok 3 - Tiongkok",
    country: "Tiongkok",
    continent: "Asia",
    flag: "🇨🇳",
    flagUrl: "https://flagcdn.com/cn.svg",
    desc: "Negara dengan peradaban tertua dan pertumbuhan ekonomi cepat. Simbol ketahanan, strategi, dan visi masa depan.",
    location: [38.0000, 100.0000],
  },
  {
    id: "04",
    no: 4,
    name: "Kelompok 4 - India",
    country: "India",
    continent: "Asia",
    flag: "🇮🇳",
    flagUrl: "https://flagcdn.com/in.svg",
    desc: "Pusat keberagaman budaya dan talenta teknologi dunia. Melambangkan adaptabilitas, kecerdasan, dan kebersamaan.",
    location: [20.0000, 75.0000],
  },

  // --- AFRIKA ---
  {
    id: "05",
    no: 5,
    name: "Kelompok 5 - Mesir",
    country: "Mesir",
    continent: "Afrika",
    flag: "🇪🇬",
    flagUrl: "https://flagcdn.com/eg.svg",
    desc: "Negara warisan Piramida dan Sungai Nil. Melambangkan fondasi pengetahuan sejarah, pondasi kuat, dan kejayaan.",
    location: [25.0000, 28.0000],
  },
  {
    id: "06",
    no: 6,
    name: "Kelompok 6 - Afrika Selatan",
    country: "Afrika Selatan",
    continent: "Afrika",
    flag: "🇿🇦",
    flagUrl: "https://flagcdn.com/za.svg",
    desc: "Negara pelangi dengan semangat Ubuntu. Mewakili toleransi, persatuan dalam perbedaan, dan keberanian.",
    location: [-25.7100, 11.7600],
  },
  {
    id: "07",
    no: 7,
    name: "Kelompok 7 - Kenya",
    country: "Kenya",
    continent: "Afrika",
    flag: "🇰🇪",
    flagUrl: "https://flagcdn.com/ke.svg",
    desc: "Pusat keanekaragaman hayati dan inovasi fintech Afrika. Melambangkan kebebasan, daya tahan, dan ketangguhan.",
    location: [4.2200, 29.4900],
  },

  // --- EROPA ---
  {
    id: "08",
    no: 8,
    name: "Kelompok 8 - Prancis",
    country: "Prancis",
    continent: "Eropa",
    flag: "🇫🇷",
    flagUrl: "https://flagcdn.com/fr.svg",
    desc: "Pusat seni, filsafat, dan diplomasi dunia. Melambangkan kebebasan berpikir, kesetaraan, dan estetika karya tinggi.",
    location: [51.3200, 16.1900],
  },
  {
    id: "09",
    no: 9,
    name: "Kelompok 9 - Belanda",
    country: "Belanda",
    continent: "Eropa",
    flag: "🇳🇱",
    flagUrl: "https://flagcdn.com/nl.svg",
    desc: "Pelopor sistem manajemen air dan pemikiran terbuka. Melambangkan solusi kreatif dan inovasi ramah lingkungan.",
    location: [57.9700, 33.9300],
  },
  {
    id: "10",
    no: 10,
    name: "Kelompok 10 - Jerman",
    country: "Jerman",
    continent: "Eropa",
    flag: "🇩🇪",
    flagUrl: "https://flagcdn.com/de.svg",
    desc: "Pusat rekayasa presisi dan riset keilmuan tinggi. Melambangkan ketelitian, logika terstruktur, dan kualitas tinggi.",
    location: [59.6300, 52.7700],
  },

  // --- AMERIKA ---
  {
    id: "11",
    no: 11,
    name: "Kelompok 11 - Amerika Serikat",
    country: "Amerika Serikat",
    continent: "Amerika",
    flag: "🇺🇸",
    flagUrl: "https://flagcdn.com/us.svg",
    desc: "Pusat kewirausahaan global dan ekosistem startup. Mewakili keberanian mengambil risiko, eksplorasi, dan kepemimpinan.",
    location: [43.0100, -111.2700],
  },
  {
    id: "12",
    no: 12,
    name: "Kelompok 12 - Meksiko",
    country: "Meksiko",
    continent: "Amerika",
    flag: "🇲🇽",
    flagUrl: "https://flagcdn.com/mx.svg",
    desc: "Warisan budaya Maya & Aztek dengan kehangatan solidaritas. Melambangkan semangat pantang menyerah dan kekayaan tradisi.",
    location: [27.4900, -120.1300],
  },
  {
    id: "13",
    no: 13,
    name: "Kelompok 13 - Kanada",
    country: "Kanada",
    continent: "Amerika",
    flag: "🇨🇦",
    flagUrl: "https://flagcdn.com/ca.svg",
    desc: "Negara dengan bentang alam megah dan keberagaman harmonis. Melambangkan keramahan, kedamaian, dan keberlanjutan.",
    location: [46.8900, -121.2400],
  },
  {
    id: "14",
    no: 14,
    name: "Kelompok 14 - Brasil",
    country: "Brasil",
    continent: "Amerika",
    flag: "🇧🇷",
    flagUrl: "https://flagcdn.com/br.svg",
    desc: "Rumah bagi Amazon dan semangat kebersamaan meriah. Melambangkan energi positif, vitalitas, dan daya juang tinggi.",
    location: [-14.0700, -71.3700],
  },

  // --- OCEANIA ---
  {
    id: "15",
    no: 15,
    name: "Kelompok 15 - Australia",
    country: "Australia",
    continent: "Oceania",
    flag: "🇦🇺",
    flagUrl: "https://flagcdn.com/au.svg",
    desc: "Benua unik dengan ekosistem khas dan gaya hidup progresif. Mewakili ketahanan alami, eksplorasi bahari, dan kemandirian.",
    location: [-25.2744, 124.8100],
  },
  {
    id: "16",
    no: 16,
    name: "Kelompok 16 - Papua Nugini",
    country: "Papua Nugini",
    continent: "Oceania",
    flag: "🇵🇬",
    flagUrl: "https://flagcdn.com/pg.svg",
    desc: "Negara tetangga dengan kekayaan ratusan tradisi adat luhur. Melambangkan kearifan lokal dan persaudaraan Pasifik.",
    location: [-8.5300, 133.6800],
  },
];

const EARTH_RADIUS = 1.0;

function EarthModel() {
  const { scene } = useGLTF("/Earth.glb");
  return (
    <Center>
      <primitive object={scene} scale={0.97} rotation={[0, -0.21, 0]} />
    </Center>
  );
}

function Marker({
  location,
  isActive,
  label,
  flag,
  flagUrl,
  onClick,
}: {
  location: number[];
  isActive: boolean;
  label: string;
  flag: string;
  flagUrl: string;
  onClick: () => void;
}) {
  const { x, y, z } = getCoordinatesFromLatLng(
    location[0],
    location[1],
    EARTH_RADIUS
  );
  const markerPos = new THREE.Vector3(x, y, z).multiplyScalar(1.05);

  const { camera } = useThree();
  const [isVisible, setIsVisible] = useState(true);

  useFrame(() => {
    const directionToMarker = markerPos.clone().normalize();
    const directionToCamera = camera.position.clone().normalize();
    setIsVisible(directionToMarker.dot(directionToCamera) > 0.08);
  });

  return (
    <Html
      position={[markerPos.x, markerPos.y, markerPos.z]}
      center
      zIndexRange={[100, 0]}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.25s ease",
        pointerEvents: isVisible ? "auto" : "none",
        cursor: "pointer",
      }}
    >
      <div
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            backgroundColor: isActive ? "#1f4b5d" : "#ffffff",
            border: isActive
              ? "3px solid #68cfeb"
              : "2px solid rgba(31,75,93,0.3)",
            borderRadius: "50%",
            width: isActive ? "32px" : "20px",
            height: isActive ? "32px" : "20px",
            boxShadow: isActive
              ? "0 0 20px #68cfeb, 0 4px 12px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img src={flagUrl} alt={`${label} flag`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {isActive && (
          <div
            style={{
              marginTop: "6px",
              background: "rgba(15, 23, 42, 0.9)",
              color: "#ffffff",
              padding: "4px 10px",
              fontWeight: 700,
              borderRadius: "999px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              border: "1px solid rgba(104, 207, 235, 0.4)",
            }}
          >
            {flag} {label}
          </div>
        )}
      </div>
    </Html>
  );
}

function CameraController({ activeIdx }: { activeIdx: number }) {
  const { camera } = useThree();

  useFrame(() => {
    const activeCluster = CLUSTERS[activeIdx];
    const { x, y, z } = getCoordinatesFromLatLng(
      activeCluster.location[0],
      activeCluster.location[1],
      EARTH_RADIUS
    );

    const targetPos = new THREE.Vector3(x, y, z)
      .normalize()
      .multiplyScalar(3.0);

    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function GlobeSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeCluster = CLUSTERS[activeIdx];

  const handleNext = () => setActiveIdx((i) => (i + 1) % CLUSTERS.length);
  const handlePrev = () =>
    setActiveIdx((i) => (i - 1 + CLUSTERS.length) % CLUSTERS.length);

  return (
    <section id="kelompok" className={styles.section} data-aos="fade-up">
      <h2
        style={{
          fontSize: "2.25rem",
          marginBottom: "0.5rem",
          textAlign: "center",
          color: "#1B2838",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        Cluster Negara <span style={{ background: "linear-gradient(135deg, var(--lp-ocean-blue), var(--lp-aqua))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AETHERA SILO UISI 2026</span>
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "var(--lp-text-muted)",
          fontSize: "0.95rem",
          marginBottom: "2rem",
          maxWidth: "550px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        16 Kelompok Berdasarkan Negara dari 5 Benua di Seluruh Dunia
      </p>

      <div className={styles.globeGrid}>
        {/* Globe 3D Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              aspectRatio: "1/1",
              position: "relative",
              margin: "0 auto",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 4.2], fov: 45 }}
              style={{ background: "transparent" }}
              gl={{ alpha: true }}
            >
              <ambientLight intensity={1.6} />
              <pointLight position={[10, 10, 10]} intensity={2} />
              <directionalLight position={[-5, 5, 5]} intensity={1} />

              <EarthModel />

              {CLUSTERS.map((cluster, index) => (
                <Marker
                  key={cluster.id}
                  location={cluster.location}
                  isActive={index === activeIdx}
                  label={cluster.country}
                  flag={cluster.flag}
                  flagUrl={cluster.flagUrl}
                  onClick={() => setActiveIdx(index)}
                />
              ))}

              <OrbitControls
                makeDefault
                enableZoom={true}
                enablePan={false}
                autoRotate={false}
              />

              <CameraController activeIdx={activeIdx} />
            </Canvas>
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", justifyContent: "center", width: "100%" }}
          >
            <button
              onClick={handlePrev}
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                padding: "0.55rem 1.4rem",
                background: "var(--lp-ocean-blue)",
                color: "#ffffff",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 15px rgba(31,75,93,0.3)",
              }}
            >
              ‹ Kelompok Sebelum
            </button>
            <button
              onClick={handleNext}
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                padding: "0.55rem 1.4rem",
                background: "var(--lp-ocean-blue)",
                color: "#ffffff",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 15px rgba(31,75,93,0.3)",
              }}
            >
              Kelompok Berikut ›
            </button>
          </div>
        </div>

        {/* Info & Country Selection Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Active Card Details */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "var(--lp-ocean-blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                BENUA {activeCluster.continent.toUpperCase()} · KELOMPOK {activeCluster.no}
              </span>
              <span
                style={{
                  background: "#000",
                  color: "#fff",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                }}
              >
                #{activeCluster.id}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.85rem",
                marginBottom: "0.5rem",
                lineHeight: 1.2,
                fontWeight: 800,
                color: "var(--lp-text)",
              }}
            >
              {activeCluster.flag} {activeCluster.name}
            </h3>

            <div
              style={{
                display: "inline-block",
                background: "rgba(31,75,93,0.12)",
                padding: "0.35rem 0.9rem",
                borderRadius: "999px",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "var(--lp-ocean-blue)",
                fontSize: "0.82rem",
                border: "1px solid rgba(31,75,93,0.2)",
              }}
            >
              Negara: {activeCluster.country} ({activeCluster.continent})
            </div>

            <p
              style={{
                fontSize: "0.92rem",
                lineHeight: 1.6,
                color: "var(--lp-text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              {activeCluster.desc}
            </p>

            <div>
              <Link
                href={`/kelompok/detail?cluster=${activeCluster.id}`}
                style={{
                  display: "inline-block",
                  background: "var(--lp-ocean-blue)",
                  color: "#ffffff",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 15px rgba(31,75,93,0.3)",
                }}
              >
                Lihat Kelompok ›
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
