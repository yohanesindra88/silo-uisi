"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  PackageCheck,
  Calendar,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AttributeStatusItem {
  id: number;
  name: string;
  description: string | null;
  targetDate: string;
  type: "individu" | "kelompok";
  isChecked: boolean;
  isBrought: boolean | null;
  notes: string | null;
  checkedAt: string | null;
  checkedBy: string | null;
}

interface MabaStatusResponse {
  targetDate: string;
  maba: {
    id: number;
    nama: string;
    nim: string | null;
    group: { id: number; name: string } | null;
  };
  individu: AttributeStatusItem[];
  kelompok: AttributeStatusItem[];
  summary: {
    totalIndividu: number;
    totalKelompok: number;
  };
}

const formatDateId = (dateStr: string) => {
  if (!dateStr) return "-";
  const normalized = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00.000Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getTodayInputStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function MabaAtributPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayInputStr());
  const [activeTab, setActiveTab] = useState<"individu" | "kelompok">("individu");
  const [statusData, setStatusData] = useState<MabaStatusResponse | null>(null);

  const loadData = useCallback(async (dateStr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attributes/maba-status?target_date=${dateStr}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Gagal mengambil data atribut.");
      }
      const data = await res.json();
      setStatusData(data.data);
    } catch (err) {
      console.error("Error load maba attributes:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData(selectedDate);
  }, [loadData, selectedDate]);

  const currentItems = activeTab === "individu"
    ? (statusData?.individu || [])
    : (statusData?.kelompok || []);

  const totalCurrent = currentItems.length;
  const verifiedCount = currentItems.filter((item) => item.isChecked && item.isBrought === true).length;
  const missingCount = currentItems.filter((item) => item.isChecked && item.isBrought === false).length;

  if (loading && !statusData) {
    return <LoadingScreen message="Memuat Daftar Atribut & Perlengkapan..." />;
  }

  return (
    <MobileShell
      title="Atribut Mahasiswa Baru"
      showBackButton={true}
      onBack={() => router.push("/maba")}
      user={statusData?.maba ? { nama: statusData.maba.nama, role: "maba", nim: statusData.maba.nim } : undefined}
      role="maba"
    >
      {/* 1. Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
          borderRadius: "20px",
          padding: "20px 18px",
          color: "#FFFFFF",
          marginBottom: "18px",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.15)", fontSize: "0.72rem", fontWeight: 700, marginBottom: "8px" }}>
          <PackageCheck size={14} /> Kelengkapan Bawaan
        </div>

        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
          Daftar Atribut Wajib
        </h1>

        <p style={{ fontSize: "0.82rem", opacity: 0.9, margin: "0 0 12px 0", lineHeight: 1.4 }}>
          Pastikan seluruh barang bawaan di bawah ini lengkap dibawa sebelum sesi apel pagi dimulai.
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.12)", fontSize: "0.78rem", fontWeight: 600 }}>
          <span>Gugus Kelompok:</span>
          <strong style={{ color: "#68CFEB" }}>{statusData?.maba.group?.name || "Belum Terdaftar"}</strong>
        </div>
      </div>

      {/* 2. Selector Tanggal */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "14px 16px",
          marginBottom: "16px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={18} color="#0F766E" />
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.6)", fontWeight: 600 }}>Pilih Tanggal:</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F4B5D" }}>
              {formatDateId(selectedDate)}
            </div>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              setSelectedDate(e.target.value);
            }
          }}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(31, 75, 93, 0.2)",
            fontSize: "0.82rem",
            fontWeight: 600,
            outline: "none",
            color: "#1F1E19",
          }}
        />
      </div>

      {/* 3. Kategori Tabs: Barang Individu vs Barang Kelompok */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
          backgroundColor: "rgba(31, 75, 93, 0.06)",
          padding: "4px",
          borderRadius: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("individu")}
          style={{
            padding: "10px 14px",
            borderRadius: "11px",
            border: "none",
            backgroundColor: activeTab === "individu" ? "#FFFFFF" : "transparent",
            color: activeTab === "individu" ? "#0F766E" : "rgba(31, 75, 93, 0.7)",
            fontWeight: 800,
            fontSize: "0.82rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: activeTab === "individu" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <User size={16} />
          <span>Barang Individu</span>
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "999px",
              backgroundColor: activeTab === "individu" ? "rgba(15, 118, 110, 0.12)" : "rgba(31, 75, 93, 0.1)",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            {statusData?.summary.totalIndividu || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("kelompok")}
          style={{
            padding: "10px 14px",
            borderRadius: "11px",
            border: "none",
            backgroundColor: activeTab === "kelompok" ? "#FFFFFF" : "transparent",
            color: activeTab === "kelompok" ? "#D97706" : "rgba(31, 75, 93, 0.7)",
            fontWeight: 800,
            fontSize: "0.82rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: activeTab === "kelompok" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Users size={16} />
          <span>Barang Kelompok</span>
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "999px",
              backgroundColor: activeTab === "kelompok" ? "rgba(217, 119, 6, 0.12)" : "rgba(31, 75, 93, 0.1)",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            {statusData?.summary.totalKelompok || 0}
          </span>
        </button>
      </div>

      {/* 4. Petunjuk Aturan */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          backgroundColor: activeTab === "individu" ? "rgba(15, 118, 110, 0.08)" : "rgba(217, 119, 6, 0.08)",
          border: `1px solid ${activeTab === "individu" ? "rgba(15, 118, 110, 0.15)" : "rgba(217, 119, 6, 0.15)"}`,
          marginBottom: "16px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <Info size={18} color={activeTab === "individu" ? "#0F766E" : "#D97706"} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.78rem", color: "#1F1E19", lineHeight: 1.4 }}>
          {activeTab === "individu" ? (
            <span>
              <strong>Wajib Dibawa Masing-Masing Maba:</strong> Setiap mahasiswa baru bertanggung jawab atas kelengkapan atribut pribadinya.
            </span>
          ) : (
            <span>
              <strong>Cukup 1 Item Per Kelompok:</strong> Diskusikan dan bagi tugas antar sesama anggota kelompok binaan Anda.
            </span>
          )}
        </div>
      </div>

      {/* 5. Daftar Kartu Atribut */}
      {currentItems.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            padding: "36px 20px",
            textAlign: "center",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
          }}
        >
          <PackageCheck size={40} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 10px" }} />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px 0", color: "#1F4B5D" }}>
            Tidak Ada Atribut yang Dijadwalkan
          </h3>
          <p style={{ fontSize: "0.8rem", color: "rgba(31, 75, 93, 0.6)", margin: 0 }}>
            Tidak ada {activeTab === "individu" ? "barang individu" : "barang kelompok"} yang wajib dibawa pada tanggal {formatDateId(selectedDate)}.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentItems.map((item, index) => {
            // Status pemeriksaan oleh mentor
            const isInspected = item.isChecked;
            const isBrought = item.isBrought;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "16px",
                  border: isInspected
                    ? (isBrought ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)")
                    : "1px solid rgba(31, 75, 93, 0.08)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Accent line on left */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "4px",
                    backgroundColor: isInspected
                      ? (isBrought ? "#10B981" : "#EF4444")
                      : (item.type === "kelompok" ? "#D97706" : "#0F766E"),
                  }}
                />

                <div style={{ marginLeft: "6px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(31, 75, 93, 0.08)",
                          color: "#1F4B5D",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {index + 1}
                      </span>
                      <h4 style={{ fontSize: "0.92rem", fontWeight: 700, margin: 0, color: "#1F1E19" }}>
                        {item.name}
                      </h4>
                    </div>

                    {/* Status Badge */}
                    {isInspected ? (
                      isBrought ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "999px",
                            backgroundColor: "rgba(16, 185, 129, 0.12)",
                            color: "#059669",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <CheckCircle2 size={12} /> Lengkap
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "999px",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "#DC2626",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <AlertCircle size={12} /> Tidak Lengkap
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(31, 75, 93, 0.08)",
                          color: "rgba(31, 75, 93, 0.8)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Clock size={12} /> Wajib Dibawa
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.75)", margin: "4px 0 8px 0", lineHeight: 1.45 }}>
                      {item.description}
                    </p>
                  )}

                  {/* Catatan Khusus dari Mentor jika ada */}
                  {isInspected && !isBrought && item.notes && (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        color: "#991B1B",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertCircle size={14} color="#DC2626" />
                      <span>Catatan Mentor: &quot;{item.notes}&quot;</span>
                    </div>
                  )}

                  {/* Status Verifikasi Info */}
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(31, 75, 93, 0.5)",
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isInspected ? (
                      <span>
                        Diperiksa oleh <strong>{item.checkedBy || "Mentor"}</strong>
                      </span>
                    ) : (
                      <span>Status pemeriksaan: Menunggu inspeksi visual mentor di lokasi.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
