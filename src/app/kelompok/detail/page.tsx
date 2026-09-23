'use client';

import React, { use, useState } from "react";
import Link from "next/link";
import { CLUSTERS } from "../../components/GlobeSection";
import { KELOMPOK_DETAILS } from "../../data/kelompokData";
import { MessageCircle, Hexagon, Camera, Mail } from "lucide-react";
import Navbar from "../../components/Navbar";
import styles from "../../page.module.css";
import Footer from "../../components/Footer";

export default function KelompokDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const clusterId = resolvedParams.cluster || "01";

  const [searchTerm, setSearchTerm] = useState("");

  const selectedCluster = CLUSTERS.find((c) => c.id === clusterId) || CLUSTERS[0];
  const groupDetails = KELOMPOK_DETAILS[clusterId] || KELOMPOK_DETAILS["01"];

  const filteredAnggota = groupDetails.anggota.filter(
    (m) =>
      m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nim.includes(searchTerm) ||
      m.prodi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Navbar />

      <main
        style={{
          padding: "3rem 2rem 5rem 2rem",
          backgroundColor: "#FFFCF7",
          minHeight: "85vh",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Back to Globe button */}
          <Link
            href="/kelompok"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem",
              color: "#1f4b5d",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              background: "rgba(104, 207, 235, 0.15)",
              transition: "all 0.2s ease"
            }}
          >
            <span>←</span> Kembali
          </Link>

          {/* Header Selected Cluster */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "inline-block",
                background: "#1f4b5d",
                color: "#ffffff",
                padding: "0.3rem 0.85rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              BENUA {selectedCluster.continent.toUpperCase()}
            </div>
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "#1f4b5d",
                margin: "0 0 0.5rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span>{selectedCluster.flag}</span>
              <span>{selectedCluster.name}</span>
            </h1>
            <p style={{ color: "#4A6070", fontSize: "1.05rem", margin: 0, maxWidth: "700px" }}>
              {selectedCluster.desc}
            </p>
          </div>

          {/* ===== MENTOR KELOMPOK ===== */}
          <div style={{ marginBottom: "3rem" }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#1f4b5d",
                marginBottom: "1.25rem",
                letterSpacing: "0.02em",
              }}
            >
              🧑‍🏫 MENTOR NEGARA {selectedCluster.country.toUpperCase()}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {(groupDetails.mentors || []).map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "1.25rem",
                    padding: "1.5rem",
                    border: "1px solid rgba(104, 207, 235, 0.3)",
                    boxShadow: "0 10px 25px rgba(31, 75, 93, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1f4b5d, #68cfeb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    🧑‍🏫
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: "#1f4b5d",
                        background: "rgba(104, 207, 235, 0.2)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                      }}
                    >
                      MENTOR NEGARA
                    </span>
                    <h4
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#1f4b5d",
                        margin: "0.35rem 0 0.15rem 0",
                      }}
                    >
                      {m.nama}
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "#6c757d", margin: "0 0 0.75rem 0" }}>
                      {m.prodi} · Angkatan {m.angkatan}
                    </p>
                    <a
                      href={`https://wa.me/${m.kontak}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "#25D366",
                        color: "#ffffff",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "999px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 4px 10px rgba(37, 211, 102, 0.25)",
                      }}
                    >
                      <MessageCircle size={14} /> Hubungi Mentor
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== TABEL ANGGOTA KELOMPOK ===== */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "1.5rem",
              padding: "2rem",
              border: "1px solid rgba(104, 207, 235, 0.3)",
              boxShadow: "0 15px 35px rgba(31, 75, 93, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1f4b5d", margin: 0 }}>
                  Daftar Warga Negara {selectedCluster.country}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#6c757d", margin: "0.2rem 0 0 0" }}>
                  Total {groupDetails.anggota.length} Mahasiswa Peserta AETHERA SILO UISI 2026
                </p>
              </div>

              {/* Search Box */}
              <input
                type="text"
                placeholder="Cari nama, NIM, atau prodi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid #ced4da",
                  fontSize: "0.9rem",
                  width: "260px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e9ecef", background: "#f8f9fa" }}>
                    <th style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#1f4b5d", fontWeight: 800 }}>NO</th>
                    <th style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#1f4b5d", fontWeight: 800 }}>NIM</th>
                    <th style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#1f4b5d", fontWeight: 800 }}>Nama Mahasiswa</th>
                    <th style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#1f4b5d", fontWeight: 800 }}>Program Studi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnggota.length > 0 ? (
                    filteredAnggota.map((m, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #f1f3f5",
                          transition: "background 0.2s",
                        }}
                      >
                        <td style={{ padding: "0.85rem 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#6c757d" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontSize: "0.9rem", fontWeight: 700, color: "#1f4b5d" }}>
                          {m.nim}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontSize: "0.95rem", fontWeight: 700, color: "#212529" }}>
                          {m.nama}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontSize: "0.9rem", color: "#495057" }}>
                          {m.prodi}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "#6c757d",
                          fontSize: "0.95rem",
                        }}
                      >
                        Tidak ada anggota yang cocok dengan kata kunci &quot;{searchTerm}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
