"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ImportDropzone } from "@/components/admin/ImportDropzone";
import { ImportSummaryCard } from "@/components/admin/ImportSummaryCard";
import { ImportPreviewTable } from "@/components/admin/ImportPreviewTable";
import { ImportSuccessModal } from "@/components/admin/ImportSuccessModal";
import {
  Users,
  Layers,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  RowValidationResult,
  GroupImportRow,
  UserImportRow,
  CreatedUserCredential,
} from "@/controllers/import.controller";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
}

interface PreviewData {
  type: "groups" | "users";
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
  };
  rows: RowValidationResult<GroupImportRow | UserImportRow>[];
}

interface ImportResultData {
  total: number;
  createdCount: number;
  updatedCount: number;
  newGroupsCreated?: number;
  credentials?: CreatedUserCredential[];
}

export default function AdminMasterDataPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab State: "users" | "groups"
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");

  // File & Parsing State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Option: Lewati baris error
  const [skipErrors, setSkipErrors] = useState(true);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Sukses
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // 1. Validasi Autentikasi Pengguna
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.user.role !== "admin" && data.user.role !== "panitia") {
          router.push("/login?error=unauthorized");
          return;
        }
        setUser(data.user);
      } catch (err) {
        console.error("Gagal memeriksa sesi:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Reset state saat berganti tab
  const handleTabChange = (tab: "users" | "groups") => {
    setActiveTab(tab);
    setSelectedFile(null);
    setPreviewData(null);
    setFeedback(null);
  };

  // 2. Handler saat file diunggah -> Eksekusi Preview Dry-Run
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setPreviewData(null);
    setFeedback(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memproses preview file Excel.");
      }

      setPreviewData(json.data);
      if (json.data.summary.errorCount > 0) {
        setFeedback({
          type: "error",
          message: `Ditemukan ${json.data.summary.errorCount} baris bermasalah. Periksa rincian pada tabel preview di bawah.`,
        });
      } else {
        setFeedback({
          type: "success",
          message: `File berhasil diproses: ${json.data.summary.validCount} baris valid siap diimpor ke database.`,
        });
      }
    } catch (err: unknown) {
      console.error("Error preview:", err);
      const errMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat membaca file Excel.";
      setFeedback({
        type: "error",
        message: errMessage,
      });
      setSelectedFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setFeedback(null);
  };

  // 3. Handler Eksekusi Commit Import ke Database
  const handleExecuteImport = async () => {
    if (!previewData || !previewData.rows) return;

    // Filter baris data valid
    const validRows = previewData.rows.filter((r) => r.isValid);

    if (validRows.length === 0) {
      setFeedback({
        type: "error",
        message: "Tidak ada baris data valid untuk diimpor. Perbaiki file terlebih dahulu.",
      });
      return;
    }

    if (previewData.summary.errorCount > 0 && !skipErrors) {
      setFeedback({
        type: "error",
        message: "Centang opsi 'Lewati baris bermasalah' untuk melanjutkan import baris yang valid.",
      });
      return;
    }

    setImporting(true);
    setFeedback(null);

    try {
      const endpoint = activeTab === "groups" ? "/api/admin/import/groups" : "/api/admin/import/users";
      const payloadKey = activeTab === "groups" ? "groups" : "users";
      const payloadData = validRows.map((r) => r.data);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [payloadKey]: payloadData }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengeksekusi import data.");
      }

      // Sukses -> Buka modal sukses
      setImportResult(json.data);
      setIsSuccessModalOpen(true);

      // Bersihkan state file setelah import selesai
      setSelectedFile(null);
      setPreviewData(null);
    } catch (err: unknown) {
      console.error("Error eksekusi import:", err);
      const errMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data ke database.";
      setFeedback({
        type: "error",
        message: errMessage,
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat panel Master Data..." />;
  }

  const validCount = previewData?.summary?.validCount || 0;
  const errorCount = previewData?.summary?.errorCount || 0;
  const warningCount = previewData?.summary?.warningCount || 0;
  const totalRows = previewData?.summary?.totalRows || 0;

  return (
    <MobileShell
      title="Master Data &amp; Import"
      wide={true}
      role={user?.role}
      showBackButton={true}
      onBack={() => router.push("/admin")}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "8px 12px 32px 12px" }}>
        {/* Header Hero Banner (Konsisten dengan tema SILO UISI) */}
        <div
          style={{
            background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
            borderRadius: "22px",
            padding: "24px 22px",
            color: "#FFFFFF",
            marginBottom: "22px",
            boxShadow: "0 8px 26px rgba(15, 118, 110, 0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Accent Circles */}
          <div
            style={{
              position: "absolute",
              right: "-20px",
              top: "-20px",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(104, 207, 235, 0.25) 0%, rgba(255, 255, 255, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.16)",
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "10px",
                letterSpacing: "0.02em",
              }}
            >
              <ShieldCheck size={14} /> Panel Administrasi SILO 2026
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              Import Data User &amp; Kelompok
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.92, margin: 0, lineHeight: 1.5, maxWidth: "700px" }}>
              Unggah file Excel untuk mendaftarkan akun mahasiswa baru, mentor, admin, dan kelompok secara massal dengan generator password unik otomatis.
            </p>
          </div>
        </div>

        {/* Tab Switcher (Desain Pill Modern) */}
        <div
          style={{
            display: "inline-flex",
            padding: "5px",
            backgroundColor: "rgba(31, 75, 93, 0.08)",
            borderRadius: "18px",
            marginBottom: "20px",
            width: "100%",
            maxWidth: "460px",
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange("users")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px 16px",
              borderRadius: "14px",
              fontSize: "0.82rem",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "users" ? "#FFFFFF" : "transparent",
              color: activeTab === "users" ? "#0F766E" : "#1F4B5D",
              boxShadow: activeTab === "users" ? "0 3px 10px rgba(0, 0, 0, 0.08)" : "none",
            }}
          >
            <Users size={17} />
            <span>Master Pengguna (Akun)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("groups")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px 16px",
              borderRadius: "14px",
              fontSize: "0.82rem",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: activeTab === "groups" ? "#FFFFFF" : "transparent",
              color: activeTab === "groups" ? "#0F766E" : "#1F4B5D",
              boxShadow: activeTab === "groups" ? "0 3px 10px rgba(0, 0, 0, 0.08)" : "none",
            }}
          >
            <Layers size={17} />
            <span>Master Kelompok</span>
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "16px",
              marginBottom: "20px",
              fontSize: "0.82rem",
              fontWeight: 600,
              backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
              border: `1.5px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              color: feedback.type === "success" ? "#065F46" : "#991B1B",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            }}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <div style={{ flex: 1, lineHeight: 1.45 }}>{feedback.message}</div>
          </div>
        )}

        {/* Dropzone Upload Component */}
        <ImportDropzone
          type={activeTab}
          onFileSelected={handleFileSelected}
          onClearFile={handleClearFile}
          selectedFile={selectedFile}
          loading={parsing || importing}
          templateDownloadUrl={
            activeTab === "groups" ? "/api/admin/templates/groups" : "/api/admin/templates/users"
          }
        />

        {/* Parsing Loading State */}
        {parsing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(12px)",
              borderRadius: "20px",
              border: "1.5px solid rgba(31, 75, 93, 0.12)",
              marginBottom: "22px",
            }}
          >
            <Loader2 size={36} color="#0F766E" className="animate-spin" style={{ marginBottom: "12px" }} />
            <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F4B5D", margin: "0 0 4px 0" }}>
              Menganalisis dan Memvalidasi Berkas Excel...
            </p>
            <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0 }}>
              Mengecek duplikasi NIM, username, dan relasi kelompok di database
            </p>
          </div>
        )}

        {/* Tampilan Preview Setelah File Berhasil Dibaca */}
        {!parsing && previewData && (
          <div>
            {/* Kartu Ringkasan Statistik */}
            <ImportSummaryCard
              totalRows={totalRows}
              validCount={validCount}
              warningCount={warningCount}
              errorCount={errorCount}
            />

            {/* Tabel Preview */}
            <ImportPreviewTable type={activeTab} rows={previewData.rows} />

            {/* Action Bar / Panel Konfirmasi Commit */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(14px)",
                padding: "20px 24px",
                borderRadius: "20px",
                border: "1.5px solid rgba(31, 75, 93, 0.12)",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F4B5D", margin: 0 }}>
                  Konfirmasi Penyimpanan ({validCount} baris valid siap diimpor)
                </p>
                {activeTab === "users" && (
                  <p
                    style={{
                      fontSize: "0.76rem",
                      color: "#047857",
                      fontWeight: 700,
                      margin: "4px 0 0 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Password 6 digit (3 angka + 3 huruf) akan otomatis digenerate &amp; siap diunduh.</span>
                  </p>
                )}
                {errorCount > 0 && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#0F766E" }}
                    />
                    <span style={{ fontSize: "0.76rem", color: "#64748B", fontWeight: 600 }}>
                      Lewati {errorCount} baris yang memiliki error dan tetap simpan baris valid
                    </span>
                  </label>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={importing}
                  style={{
                    padding: "11px 18px",
                    borderRadius: "12px",
                    border: "1.5px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Ganti File
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || validCount === 0 || (errorCount > 0 && !skipErrors)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "11px 24px",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    border: "none",
                    cursor:
                      importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                        ? "not-allowed"
                        : "pointer",
                    backgroundColor:
                      importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                        ? "#CBD5E1"
                        : "#0F766E",
                    color:
                      importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                        ? "#94A3B8"
                        : "#FFFFFF",
                    boxShadow:
                      importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                        ? "none"
                        : "0 4px 14px rgba(15, 118, 110, 0.28)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Eksekusi Import ({validCount} Data)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Sukses & Download Rekap Kredensial */}
      <ImportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        type={activeTab}
        result={importResult}
      />
    </MobileShell>
  );
}
