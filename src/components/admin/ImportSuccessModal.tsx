"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, KeyRound, Loader2 } from "lucide-react";
import { CreatedUserCredential } from "@/controllers/import.controller";

interface ImportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "groups" | "users";
  result: {
    total: number;
    createdCount: number;
    updatedCount: number;
    newGroupsCreated?: number;
    credentials?: CreatedUserCredential[];
  } | null;
}

export const ImportSuccessModal: React.FC<ImportSuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  result,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !result) return null;

  const handleDownloadCredentials = async () => {
    if (!result.credentials || result.credentials.length === 0) return;

    try {
      setDownloading(true);
      const res = await fetch("/api/admin/import/export-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users: result.credentials }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengunduh file rekap akun.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap_akun_silo_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Gagal mendownload rekap akun:", err);
      alert("Terjadi kesalahan saat mengunduh file rekap akun Excel.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          padding: "28px 24px",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Top Gradient Accent Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #0F766E 0%, #68CFEB 50%, #1F4B5D 100%)",
          }}
        />

        {/* Icon Sukses */}
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 16px auto",
            borderRadius: "20px",
            backgroundColor: "#ECFDF5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(5, 150, 105, 0.15)",
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F4B5D", margin: "0 0 6px 0" }}>
          Import Data Berhasil!
        </h3>
        <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.75)", margin: "0 0 20px 0" }}>
          Seluruh data valid telah berhasil disimpan ke database PostgreSQL secara aman.
        </p>

        {/* Ringkasan Hasil */}
        <div
          style={{
            backgroundColor: "#F8FAFC",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            marginBottom: "20px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.82rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span style={{ color: "#64748B" }}>Total Baris Diproses:</span>
            <span style={{ color: "#0F172A", fontWeight: 800 }}>{result.total}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#059669" }}>
            <span>Data Baru Ditambahkan:</span>
            <span style={{ fontWeight: 800 }}>+{result.createdCount}</span>
          </div>
          {result.updatedCount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#D97706" }}>
              <span>Data Diperbarui (Update):</span>
              <span style={{ fontWeight: 800 }}>{result.updatedCount}</span>
            </div>
          )}
          {result.newGroupsCreated !== undefined && result.newGroupsCreated > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "#0F766E" }}>
              <span>Kelompok Baru Dibuat Otomatis:</span>
              <span style={{ fontWeight: 800 }}>+{result.newGroupsCreated}</span>
            </div>
          )}
        </div>

        {/* Bagian Rekap Kredensial (Khusus Pengguna) */}
        {type === "users" && result.credentials && result.credentials.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 100%)",
              padding: "16px",
              borderRadius: "18px",
              border: "1.5px solid #A7F3D0",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <KeyRound size={17} color="#059669" />
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#065F46" }}>
                Password Unik 6 Digit Telah Dibuat
              </span>
            </div>
            <p style={{ fontSize: "0.76rem", color: "#047857", lineHeight: 1.45, margin: "0 0 14px 0" }}>
              Sebanyak <strong>{result.credentials.length} akun</strong> telah diberikan password unik (3 angka + 3 huruf). Unduh file rekap Excel sekarang untuk dibagikan ke pengguna.
            </p>

            <button
              type="button"
              onClick={handleDownloadCredentials}
              disabled={downloading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #059669 0%, #0F766E 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.82rem",
                border: "none",
                cursor: downloading ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Membuat Berkas Excel...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Rekap Akun &amp; Password (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "14px",
            backgroundColor: "#F1F5F9",
            color: "#475569",
            fontWeight: 700,
            fontSize: "0.82rem",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          Selesai &amp; Tutup
        </button>
      </div>
    </div>
  );
};
