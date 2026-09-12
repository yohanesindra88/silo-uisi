"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  PackageCheck,
  Calendar,
  Plus,
  Trash2,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Layers,
  ArrowLeft,
  X,
  Loader2,
  Tag,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AttributeItem {
  id: number;
  name: string;
  description: string | null;
  targetDate: string;
  type: "individu" | "kelompok";
  createdAt: string;
  creator?: {
    id: number;
    nama: string;
    role: string;
  } | null;
}

interface UserProfile {
  id: number;
  nama: string;
  role: string;
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

export default function AdminAtributPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // State Form Modal Tambah Atribut
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(getTodayInputStr());
  const [formType, setFormType] = useState<"individu" | "kelompok">("individu");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load data profil user & daftar atribut
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      if (meData.user.role !== "admin" && meData.user.role !== "panitia") {
        router.push("/login");
        return;
      }

      const attrRes = await fetch("/api/attributes");
      if (attrRes.ok) {
        const attrData = await attrRes.json();
        setAttributes(attrData.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data atribut:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Tambah Atribut Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate) {
      setFeedback({ type: "error", message: "Nama atribut dan tanggal target wajib diisi." });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim() || null,
          target_date: formDate,
          type: formType,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Gagal membuat atribut baru.");
      }

      setFeedback({ type: "success", message: `Atribut "${formName}" berhasil ditambahkan!` });
      setFormName("");
      setFormDesc("");
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Terjadi kesalahan sistem." });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Hapus Atribut
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus atribut "${name}"?`)) return;

    try {
      const res = await fetch(`/api/attributes/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.message || "Gagal menghapus atribut.");
        return;
      }
      setFeedback({ type: "success", message: `Atribut "${name}" berhasil dihapus.` });
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus atribut: " + err.message);
    }
  };

  // Filter Atribut
  const filteredAttributes = attributes.filter((attr) => {
    if (filterType !== "all" && attr.type !== filterType) return false;
    if (filterDate) {
      const datePart = attr.targetDate.split("T")[0];
      if (datePart !== filterDate) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = attr.name.toLowerCase().includes(q);
      const matchDesc = attr.description?.toLowerCase().includes(q) || false;
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  // Pengelompokan berdasarkan Tanggal Target
  const groupedByDate: Record<string, AttributeItem[]> = {};
  for (const item of filteredAttributes) {
    const dStr = item.targetDate.split("T")[0];
    if (!groupedByDate[dStr]) {
      groupedByDate[dStr] = [];
    }
    groupedByDate[dStr].push(item);
  }

  // Statistik Ringkas
  const totalIndividu = attributes.filter((a: AttributeItem) => a.type === "individu").length;
  const totalKelompok = attributes.filter((a: AttributeItem) => a.type === "kelompok").length;

  if (loading) {
    return <LoadingScreen message="Memuat Manajemen Atribut Maba..." />;
  }

  return (
    <MobileShell
      title="Manajemen Atribut Maba"
      showBackButton={true}
      onBack={() => router.push("/admin")}
      user={user || undefined}
      role="admin"
      wide={true}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
          borderRadius: "20px",
          padding: "22px 20px",
          color: "#FFFFFF",
          marginBottom: "20px",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.15)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "8px" }}>
            <ShieldCheck size={14} /> Panel Kontrol Admin
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
            Atribut Dinamis Mahasiswa Baru
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
            Atur perlengkapan bawaan maba per hari. Mentor akan melakukan checklist visual berdasarkan daftar ini.
          </p>
        </div>
      </div>

      {/* Alert Feedback jika ada aksi */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${feedback.type === "success" ? "#10B981" : "#EF4444"}`,
            color: feedback.type === "success" ? "#065F46" : "#991B1B",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {feedback.type === "success" ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "2px" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Ringkasan Statistik Kartu */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "14px 12px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>Total Atribut</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F4B5D", marginTop: "2px" }}>
            {attributes.length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "14px 12px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#0F766E", fontWeight: 600 }}>Individu</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F766E", marginTop: "2px" }}>
            {totalIndividu}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "14px 12px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 600 }}>Kelompok</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#D97706", marginTop: "2px" }}>
            {totalKelompok}
          </div>
        </div>
      </div>

      {/* Baris Aksi & Filter */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "20px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setFeedback(null);
            }}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
            }}
          >
            <Plus size={18} /> Tambah Atribut Baru
          </button>

          {/* Filter Tipe Tabs */}
          <div style={{ display: "flex", gap: "6px", backgroundColor: "rgba(31, 75, 93, 0.06)", padding: "4px", borderRadius: "10px" }}>
            {[
              { id: "all", label: "Semua" },
              { id: "individu", label: "Individu" },
              { id: "kelompok", label: "Kelompok" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: filterType === t.id ? "#1F4B5D" : "transparent",
                  color: filterType === t.id ? "#FFFFFF" : "#1F4B5D",
                  fontSize: "0.78rem",
                  fontWeight: filterType === t.id ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Pencarian & Filter Tanggal */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="rgba(31, 75, 93, 0.4)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Cari nama atribut atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                fontSize: "0.82rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                fontSize: "0.82rem",
                outline: "none",
                color: "#1F1E19",
              }}
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate("")}
                title="Hapus filter tanggal"
                style={{
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.15)",
                  backgroundColor: "rgba(31, 75, 93, 0.05)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#1F4B5D",
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Atribut Dikelompokkan Per Tanggal */}
      {Object.keys(groupedByDate).length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            padding: "40px 20px",
            textAlign: "center",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
          }}
        >
          <PackageCheck size={44} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0", color: "#1F4B5D" }}>
            Belum Ada Atribut Terdaftar
          </h3>
          <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.7)", margin: "0 0 16px 0" }}>
            {searchQuery || filterDate || filterType !== "all"
              ? "Tidak ada atribut yang sesuai dengan kriteria filter."
              : "Klik tombol 'Tambah Atribut Baru' untuk mengatur perlengkapan bawaan maba."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.entries(groupedByDate).map(([dateKey, items]) => (
            <div
              key={dateKey}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              {/* Header Tanggal */}
              <div
                style={{
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={18} color="#0F766E" />
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F4B5D" }}>
                    {formatDateId(dateKey)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(15, 118, 110, 0.1)",
                    color: "#0F766E",
                  }}
                >
                  {items.length} Item
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {items.map((attr, idx) => (
                  <div
                    key={attr.id}
                    style={{
                      padding: "16px 18px",
                      borderBottom: idx < items.length - 1 ? "1px solid rgba(31, 75, 93, 0.06)" : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: attr.type === "kelompok" ? "rgba(217, 119, 6, 0.12)" : "rgba(15, 118, 110, 0.12)",
                            color: attr.type === "kelompok" ? "#D97706" : "#0F766E",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {attr.type === "kelompok" ? <Users size={12} /> : <User size={12} />}
                          {attr.type}
                        </span>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F1E19" }}>
                          {attr.name}
                        </h4>
                      </div>

                      {attr.description && (
                        <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.75)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                          {attr.description}
                        </p>
                      )}

                      <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.5)", marginTop: "6px" }}>
                        Dibuat oleh: {attr.creator?.nama || "Admin"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(attr.id, attr.name)}
                      title="Hapus atribut"
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        color: "#DC2626",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah Atribut */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PackageCheck size={22} color="#0F766E" />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                  Tambah Master Atribut
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(31, 75, 93, 0.6)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Nama Atribut */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Nama Atribut / Barang Bawaan *
                </label>
                <input
                  type="text"
                  placeholder="Misal: Name Tag Resmi Ukuran B2"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Deskripsi & Instruksi Kelengkapan
                </label>
                <textarea
                  rows={3}
                  placeholder="Misal: Wajib dikalungkan di leher dengan tali warna penanda gugus..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tanggal Target */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Tanggal Kegiatan / Target Date *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tipe Atribut */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Tipe Atribut *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setFormType("individu")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formType === "individu" ? "#0F766E" : "rgba(31, 75, 93, 0.15)"}`,
                      backgroundColor: formType === "individu" ? "rgba(15, 118, 110, 0.08)" : "#FFFFFF",
                      color: formType === "individu" ? "#0F766E" : "#1F4B5D",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <User size={16} /> Individu (Per Maba)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("kelompok")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formType === "kelompok" ? "#D97706" : "rgba(31, 75, 93, 0.15)"}`,
                      backgroundColor: formType === "kelompok" ? "rgba(217, 119, 6, 0.08)" : "#FFFFFF",
                      color: formType === "kelompok" ? "#D97706" : "#1F4B5D",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Users size={16} /> Kelompok (1 Per Tim)
                  </button>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    backgroundColor: "#FFFFFF",
                    color: "#1F4B5D",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#0F766E",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Atribut"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
