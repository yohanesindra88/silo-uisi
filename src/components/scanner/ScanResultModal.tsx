"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  User,
  GraduationCap,
  Users,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export interface ScanResultData {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  mabaNama?: string;
  nim?: string;
  prodi?: string;
  kelompok?: string;
  time?: string;
  status?: string;
  sessionName?: string;
  allowedProdis?: string[];
  attendanceType?: string;
}

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ScanResultData | null;
  autoCloseSeconds?: number;
}

interface ScanResultModalContentProps {
  onClose: () => void;
  data: ScanResultData;
  autoCloseSeconds: number;
}

const ScanResultModalContent: React.FC<ScanResultModalContentProps> = ({
  onClose,
  data,
  autoCloseSeconds,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoCloseSeconds);

  // Timer hitung mundur auto-close yang aman (tidak memicu setState di dalam updater)
  useEffect(() => {
    if (secondsRemaining <= 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, onClose]);

  // Konfigurasi tema warna dan icon berdasarkan status hasil scan
  const config = (() => {
    switch (data.type) {
      case "success":
        return {
          bgColor: "#059669",
          badgeBg: "rgba(16, 185, 129, 0.15)",
          badgeColor: "#065F46",
          badgeBorder: "rgba(16, 185, 129, 0.4)",
          icon: <CheckCircle2 size={36} color="#FFFFFF" />,
          statusLabel: data.status ? `HADIR (${data.status.toUpperCase()})` : "HADIR TEPAT WAKTU",
          accentColor: "#10B981",
        };
      case "warning":
        return {
          bgColor: "#D97706",
          badgeBg: "rgba(245, 158, 11, 0.15)",
          badgeColor: "#92400E",
          badgeBorder: "rgba(245, 158, 11, 0.4)",
          icon: <Clock size={36} color="#FFFFFF" />,
          statusLabel: data.status ? `HADIR (${data.status.toUpperCase()})` : "TERLAMBAT",
          accentColor: "#F59E0B",
        };
      case "info":
        return {
          bgColor: "#0284C7",
          badgeBg: "rgba(14, 165, 233, 0.15)",
          badgeColor: "#075985",
          badgeBorder: "rgba(14, 165, 233, 0.4)",
          icon: <Info size={36} color="#FFFFFF" />,
          statusLabel: "SUDAH TERCATAT SEBELUMNYA",
          accentColor: "#0EA5E9",
        };
      case "error":
      default:
        return {
          bgColor: "#DC2626",
          badgeBg: "rgba(239, 68, 68, 0.15)",
          badgeColor: "#991B1B",
          badgeBorder: "rgba(239, 68, 68, 0.4)",
          icon: data.title.includes("Kewenangan") || data.title.includes("Kelompok") ? (
            <ShieldAlert size={36} color="#FFFFFF" />
          ) : (
            <AlertCircle size={36} color="#FFFFFF" />
          ),
          statusLabel: "PRESENSI DITOLAK / GAGAL",
          accentColor: "#EF4444",
        };
    }
  })();

  const progressPercent = Math.max(0, (secondsRemaining / autoCloseSeconds) * 100);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          animation: "scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hasil Scan */}
        <div
          style={{
            backgroundColor: config.bgColor,
            padding: "20px 20px 16px",
            color: "#FFFFFF",
            position: "relative",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(0, 0, 0, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            aria-label="Tutup Modal"
          >
            <X size={18} />
          </button>

          {/* Icon Bulat */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              boxShadow: "0 0 0 8px rgba(255, 255, 255, 0.12)",
            }}
          >
            {config.icon}
          </div>

          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              margin: "0 0 4px 0",
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            {data.title}
          </h3>

          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            {config.statusLabel}
          </span>
        </div>

        {/* Progress Bar Auto-Close Timer */}
        <div style={{ width: "100%", height: "4px", backgroundColor: "#E5E7EB" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              backgroundColor: config.accentColor,
              transition: "width 1s linear",
            }}
          />
        </div>

        {/* Body Informasi Lengkap Mahasiswa */}
        <div style={{ padding: "18px 20px" }}>
          {/* Pesan Keterangan */}
          <p
            style={{
              fontSize: "0.82rem",
              color: "#4B5563",
              lineHeight: 1.45,
              margin: "0 0 14px 0",
              textAlign: "center",
            }}
          >
            {data.message}
          </p>

          {/* Kartu Identitas Maba (Jika Ada Data Mahasiswa) */}
          {(data.mabaNama || data.nim) && (
            <div
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: "16px",
                padding: "14px",
                border: "1px solid #E5E7EB",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Nama Mahasiswa */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(31, 75, 93, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} color="#1F4B5D" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    Nama Mahasiswa Baru
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", lineHeight: 1.25 }}>
                    {data.mabaNama || "-"}
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom: NIM & Kelompok */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    NIM
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F4B5D" }}>
                    {data.nim || "-"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.66rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    <Users size={12} color="#0284C7" />
                    <span>Kelompok</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0369A1" }}>
                    {data.kelompok || "-"}
                  </div>
                </div>
              </div>

              {/* Baris Prodi & Waktu */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.66rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    <GraduationCap size={12} color="#6D28D9" />
                    <span>Program Studi</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4B5563" }}>
                    {data.prodi || "-"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.66rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                    <Clock size={12} color="#059669" />
                    <span>Waktu Catat</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#065F46" }}>
                    {data.time || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informasi Khusus jika Ditolak karena Prodi */}
          {data.allowedProdis && data.allowedProdis.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "12px",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                marginBottom: "14px",
                fontSize: "0.75rem",
                color: "#991B1B",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                Daftar Prodi yang Berhak Anda Pindai:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {data.allowedProdis.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "2px 6px",
                      borderRadius: "6px",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sesi Presensi Aktif */}
          {data.sessionName && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "#6B7280",
                textAlign: "center",
                marginBottom: "14px",
              }}
            >
              Sesi: <strong>{data.sessionName}</strong>
            </div>
          )}

          {/* Tombol Utama: Lanjut Scan Berikutnya */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "13px 18px",
              borderRadius: "14px",
              backgroundColor: config.bgColor,
              color: "#FFFFFF",
              border: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: `0 4px 16px ${config.bgColor}40`,
              transition: "transform 0.1s ease, filter 0.2s ease",
            }}
          >
            <span>Lanjut Scan Berikutnya</span>
            <ChevronRight size={18} />
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              color: "#9CA3AF",
              marginTop: "8px",
            }}
          >
            Otomatis menutup dalam <strong>{secondsRemaining}s</strong>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  isOpen,
  onClose,
  data,
  autoCloseSeconds = 5,
}) => {
  if (!isOpen || !data) return null;

  // Menggunakan component keying agar state countdown ter-reset bersih pada setiap scan baru
  const key = `${data.time || ""}-${data.nim || ""}-${data.title}`;

  return (
    <ScanResultModalContent
      key={key}
      onClose={onClose}
      data={data}
      autoCloseSeconds={autoCloseSeconds}
    />
  );
};
