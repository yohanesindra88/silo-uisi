"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Search,
  Filter,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
  Edit3,
  X,
  Loader2,
  Info,
  ChevronDown,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AttributeItem {
  id: number;
  name: string;
  description: string | null;
  targetDate: string;
  type: "individu" | "kelompok";
}

interface MabaItem {
  id: number;
  nama: string;
  nim: string;
  groupId: number;
  groupName: string;
  checks: Record<number, {
    isBrought: boolean;
    notes: string | null;
    isSaved: boolean;
    checkId?: number;
  }>;
}

interface GroupCheckItem {
  groupId: number;
  groupName: string;
  checks: Record<number, {
    isBrought: boolean;
    notes: string | null;
    isSaved: boolean;
    checkId?: number;
  }>;
}

interface MentorCheckData {
  targetDate: string;
  groups: Array<{ id: number; name: string; description?: string | null }>;
  selectedGroupId: number | null;
  attributes: {
    all: AttributeItem[];
    individu: AttributeItem[];
    kelompok: AttributeItem[];
  };
  mabaList: MabaItem[];
  groupChecks: GroupCheckItem[];
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

export default function MentorAtributPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayInputStr());
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">("all");
  const [activeTab, setActiveTab] = useState<"individu" | "kelompok">("individu");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Raw data dari API
  const [mentorData, setMentorData] = useState<MentorCheckData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // State lokal checklist yang dapat diedit oleh mentor
  // mabaChecksState: { [mabaId]: { [attrId]: { isBrought: boolean, notes: string } } }
  const [mabaChecksState, setMabaChecksState] = useState<Record<number, Record<number, { isBrought: boolean; notes: string }>>>({});
  // groupChecksState: { [groupId]: { [attrId]: { isBrought: boolean, notes: string } } }
  const [groupChecksState, setGroupChecksState] = useState<Record<number, Record<number, { isBrought: boolean; notes: string }>>>({});

  // Modal Catatan Per Item
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteTarget, setActiveNoteTarget] = useState<{
    type: "maba" | "group";
    id: number;
    attrId: number;
    title: string;
    note: string;
  } | null>(null);

  // Fetch Data dari API
  const loadChecklistData = useCallback(async (targetDate: string, groupId?: number) => {
    try {
      setLoading(true);
      setFeedback(null);

      // 1. Ambil data sesi profil
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUserProfile(meData.user);

      // 2. Ambil data checklist
      let url = `/api/attributes/mentor-check?target_date=${targetDate}`;
      if (groupId) {
        url += `&group_id=${groupId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil data checklist atribut mentor.");
      }

      const resData = await res.json();
      const data: MentorCheckData = resData.data;
      setMentorData(data);

      // Inisialisasi state lokal checklist
      // ATURAN DEFAULT: Semua checkbox tercentang (isBrought = true)
      const initialMabaState: Record<number, Record<number, { isBrought: boolean; notes: string }>> = {};
      for (const maba of data.mabaList) {
        initialMabaState[maba.id] = {};
        for (const attr of data.attributes.individu) {
          const existing = maba.checks[attr.id];
          initialMabaState[maba.id][attr.id] = {
            isBrought: existing ? existing.isBrought : true, // DEFAULT TRUE
            notes: existing?.notes || "",
          };
        }
      }
      setMabaChecksState(initialMabaState);

      const initialGroupState: Record<number, Record<number, { isBrought: boolean; notes: string }>> = {};
      for (const grp of data.groupChecks) {
        initialGroupState[grp.groupId] = {};
        for (const attr of data.attributes.kelompok) {
          const existing = grp.checks[attr.id];
          initialGroupState[grp.groupId][attr.id] = {
            isBrought: existing ? existing.isBrought : true, // DEFAULT TRUE
            notes: existing?.notes || "",
          };
        }
      }
      setGroupChecksState(initialGroupState);

      if (data.groups.length > 0 && (selectedGroupId === "all" || !data.groups.some((g) => g.id === selectedGroupId))) {
        setSelectedGroupId(data.groups[0].id);
      }
    } catch (err: any) {
      console.error("Error load mentor check:", err);
      setFeedback({ type: "error", message: err.message || "Gagal memuat data." });
    } finally {
      setLoading(false);
    }
  }, [router, selectedGroupId]);

  useEffect(() => {
    loadChecklistData(selectedDate);
  }, [selectedDate, loadChecklistData]);

  // Toggle checklist individu per maba
  const toggleMabaItem = (mabaId: number, attrId: number) => {
    setMabaChecksState((prev) => {
      const curMaba = prev[mabaId] || {};
      const curItem = curMaba[attrId] || { isBrought: true, notes: "" };
      return {
        ...prev,
        [mabaId]: {
          ...curMaba,
          [attrId]: {
            ...curItem,
            isBrought: !curItem.isBrought, // toggle checked / unchecked
          },
        },
      };
    });
  };

  // Toggle checklist kelompok
  const toggleGroupItem = (groupId: number, attrId: number) => {
    setGroupChecksState((prev) => {
      const curGroup = prev[groupId] || {};
      const curItem = curGroup[attrId] || { isBrought: true, notes: "" };
      return {
        ...prev,
        [groupId]: {
          ...curGroup,
          [attrId]: {
            ...curItem,
            isBrought: !curItem.isBrought,
          },
        },
      };
    });
  };

  // Centang Semua untuk seluruh maba di tampilan aktif
  const handleCheckAll = (broughtState: boolean) => {
    if (!mentorData) return;
    setMabaChecksState((prev) => {
      const updated = { ...prev };
      for (const maba of mentorData.mabaList) {
        if (selectedGroupId !== "all" && maba.groupId !== selectedGroupId) continue;
        if (!updated[maba.id]) updated[maba.id] = {};
        for (const attr of mentorData.attributes.individu) {
          updated[maba.id][attr.id] = {
            isBrought: broughtState,
            notes: updated[maba.id]?.[attr.id]?.notes || "",
          };
        }
      }
      return updated;
    });
  };

  // Buka Modal Catatan
  const openNoteModal = (
    type: "maba" | "group",
    id: number,
    attrId: number,
    title: string,
    currentNote: string
  ) => {
    setActiveNoteTarget({
      type,
      id,
      attrId,
      title,
      note: currentNote,
    });
    setNoteModalOpen(true);
  };

  // Simpan Catatan dari Modal
  const saveNoteFromModal = (noteText: string) => {
    if (!activeNoteTarget) return;
    const { type, id, attrId } = activeNoteTarget;

    if (type === "maba") {
      setMabaChecksState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [attrId]: {
            ...(prev[id]?.[attrId] || { isBrought: false }),
            notes: noteText,
          },
        },
      }));
    } else {
      setGroupChecksState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [attrId]: {
            ...(prev[id]?.[attrId] || { isBrought: false }),
            notes: noteText,
          },
        },
      }));
    }
    setNoteModalOpen(false);
    setActiveNoteTarget(null);
  };

  // Kirim Batch Pengecekan ke API
  const handleSaveBatch = async () => {
    if (!mentorData) return;

    try {
      setSaving(true);
      setFeedback(null);

      const batchPayload: Array<{
        attributeId: number;
        mabaId?: number | null;
        groupId?: number | null;
        isBrought: boolean;
        notes?: string | null;
      }> = [];

      // 1. Kumpulkan seluruh checklist individu maba
      for (const maba of mentorData.mabaList) {
        const mabaChecks = mabaChecksState[maba.id] || {};
        for (const attr of mentorData.attributes.individu) {
          const item = mabaChecks[attr.id];
          const isBrought = item ? item.isBrought : true; // default true
          const notes = item?.notes ? item.notes.trim() : null;

          batchPayload.push({
            attributeId: attr.id,
            mabaId: maba.id,
            isBrought,
            notes,
          });
        }
      }

      // 2. Kumpulkan checklist kelompok
      for (const grp of mentorData.groupChecks) {
        const grpChecks = groupChecksState[grp.groupId] || {};
        for (const attr of mentorData.attributes.kelompok) {
          const item = grpChecks[attr.id];
          const isBrought = item ? item.isBrought : true;
          const notes = item?.notes ? item.notes.trim() : null;

          batchPayload.push({
            attributeId: attr.id,
            groupId: grp.groupId,
            isBrought,
            notes,
          });
        }
      }

      const res = await fetch("/api/attributes/check-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks: batchPayload }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Gagal menyimpan hasil pemeriksaan.");
      }

      setFeedback({
        type: "success",
        message: `Pemeriksaan berhasil disimpan! (${batchPayload.length} item atribut terdata).`,
      });

      // Scroll ke atas dengan halus agar mentor melihat konfirmasi
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Terjadi kesalahan saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  // Filter maba berdasarkan kelompok dan search query
  const filteredMabaList = useMemo(() => {
    if (!mentorData) return [];
    return mentorData.mabaList.filter((maba) => {
      if (selectedGroupId !== "all" && maba.groupId !== selectedGroupId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = maba.nama.toLowerCase().includes(q);
        const matchNim = maba.nim.toLowerCase().includes(q);
        if (!matchNama && !matchNim) return false;
      }
      return true;
    });
  }, [mentorData, selectedGroupId, searchQuery]);

  // Hitung jumlah item yang TIDAK dibawa (isBrought === false)
  const totalMissingIndividu = useMemo(() => {
    let count = 0;
    Object.values(mabaChecksState).forEach((mabaMap) => {
      Object.values(mabaMap).forEach((item) => {
        if (!item.isBrought) count++;
      });
    });
    return count;
  }, [mabaChecksState]);

  if (loading && !mentorData) {
    return <LoadingScreen message="Memuat Formulir Pemeriksaan Atribut..." />;
  }

  return (
    <MobileShell
      title="Pemeriksaan Atribut Maba"
      showBackButton={true}
      onBack={() => router.push("/mentor")}
      user={userProfile ? { nama: userProfile.nama, role: "mentor" } : undefined}
      role="mentor"
      wide={true}
    >
      {/* 1. Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
          borderRadius: "20px",
          padding: "20px 18px",
          color: "#FFFFFF",
          marginBottom: "18px",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.2)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.15)", fontSize: "0.72rem", fontWeight: 700, marginBottom: "8px" }}>
          <ShieldCheck size={14} /> Panel Pengecekan Mentor
        </div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
          Inspeksi Kelengkapan Atribut
        </h1>
        <p style={{ fontSize: "0.82rem", opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
          Seluruh maba diasumsikan <strong>MEMBAWA</strong> atribut (sudah tercentang default). Uncheck pada maba yang tidak membawa atau kurang lengkap.
        </p>
      </div>

      {/* 2. Alert Feedback */}
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

      {/* 3. Bar Kontrol: Pemilih Tanggal & Dropdown Kelompok Binaan */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Tanggal */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
              Tanggal Kegiatan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.82rem",
                fontWeight: 600,
                outline: "none",
                color: "#1F1E19",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Kelompok */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
              Kelompok Binaan:
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                setSelectedGroupId(val);
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.82rem",
                fontWeight: 600,
                outline: "none",
                color: "#1F1E19",
                backgroundColor: "#FFFFFF",
                boxSizing: "border-box",
              }}
            >
              <option value="all">Semua Kelompok Binaan</option>
              {mentorData?.groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ringkasan Status Pemeriksaan */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: "10px",
            backgroundColor: "rgba(31, 75, 93, 0.04)",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#1F4B5D",
          }}
        >
          <span>
            Target: <strong>{filteredMabaList.length} Maba</strong>
          </span>
          <span>
            Item Individu: <strong>{mentorData?.attributes.individu.length || 0}</strong>
          </span>
          <span>
            Item Kelompok: <strong>{mentorData?.attributes.kelompok.length || 0}</strong>
          </span>
          {totalMissingIndividu > 0 && (
            <span style={{ color: "#DC2626", fontWeight: 700 }}>
              ⚠️ {totalMissingIndividu} Catatan Kurang
            </span>
          )}
        </div>
      </div>

      {/* 4. Tab Kategori: Pengecekan Individu vs Pengecekan Kelompok */}
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
          <span>Atribut Individu ({filteredMabaList.length})</span>
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
          <span>Atribut Kelompok ({mentorData?.attributes.kelompok.length || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN TAB 1: PENGECEKAN ATRIBUT INDIVIDU                                 */}
      {/* ========================================================================= */}
      {activeTab === "individu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quick Actions & Search Bar */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "14px 16px",
              border: "1px solid rgba(31, 75, 93, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D" }}>
                Aksi Cepat Checklist:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleCheckAll(true)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckSquare size={14} /> Centang Semua (Lengkap)
                </button>

                <button
                  type="button"
                  onClick={() => handleCheckAll(false)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#DC2626",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Square size={14} /> Uncheck Semua
                </button>
              </div>
            </div>

            {/* Input Pencarian */}
            <div style={{ position: "relative" }}>
              <Search size={16} color="rgba(31, 75, 93, 0.4)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Cari nama mahasiswa baru atau NIM..."
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
          </div>

          {/* Daftar Maba & Checklist Item */}
          {filteredMabaList.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid rgba(31, 75, 93, 0.08)",
              }}
            >
              <Users size={36} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F4B5D" }}>
                Tidak ada mahasiswa baru ditemukan
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "4px" }}>
                Periksa pilihan kelompok atau kata kunci pencarian Anda.
              </div>
            </div>
          ) : mentorData?.attributes.individu.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid rgba(31, 75, 93, 0.08)",
              }}
            >
              <PackageCheck size={36} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F4B5D" }}>
                Belum ada atribut individu dijadwalkan hari ini
              </div>
            </div>
          ) : (
            filteredMabaList.map((maba) => {
              const mabaCheck = mabaChecksState[maba.id] || {};
              const individuList = mentorData?.attributes.individu || [];
              const broughtCount = individuList.filter((a: AttributeItem) => mabaCheck[a.id]?.isBrought).length;
              const totalIndividu = individuList.length;
              const isAllComplete = broughtCount === totalIndividu;

              return (
                <div
                  key={maba.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "18px",
                    border: isAllComplete ? "1px solid rgba(31, 75, 93, 0.08)" : "1.5px solid rgba(239, 68, 68, 0.4)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                  }}
                >
                  {/* Header Kartu Maba */}
                  <div
                    style={{
                      padding: "14px 16px",
                      backgroundColor: isAllComplete ? "rgba(31, 75, 93, 0.03)" : "rgba(239, 68, 68, 0.04)",
                      borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1F1E19" }}>
                        {maba.nama}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
                        NIM: {maba.nim} &bull; {maba.groupName}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: isAllComplete ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: isAllComplete ? "#059669" : "#DC2626",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                      }}
                    >
                      {broughtCount}/{totalIndividu} Lengkap
                    </span>
                  </div>

                  {/* Checklist Atribut Individu untuk Maba Ini */}
                  <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {mentorData?.attributes.individu.map((attr) => {
                      const itemState = mabaCheck[attr.id] || { isBrought: true, notes: "" };
                      const isBrought = itemState.isBrought;

                      return (
                        <div
                          key={attr.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            backgroundColor: isBrought ? "rgba(31, 75, 93, 0.02)" : "rgba(239, 68, 68, 0.06)",
                            border: `1px solid ${isBrought ? "rgba(31, 75, 93, 0.08)" : "rgba(239, 68, 68, 0.3)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                          }}
                        >
                          {/* Sisi Kiri: Checkbox Interaktif & Info */}
                          <div
                            onClick={() => toggleMabaItem(maba.id, attr.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flex: 1,
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isBrought}
                              onChange={() => {}} // dihandle oleh parent onClick
                              style={{
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                                accentColor: "#0F766E",
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                  color: isBrought ? "#1F1E19" : "#DC2626",
                                  textDecoration: isBrought ? "none" : "line-through",
                                }}
                              >
                                {attr.name}
                              </div>
                              {attr.description && (
                                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
                                  {attr.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sisi Kanan: Status & Tombol Catatan */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() =>
                                openNoteModal(
                                  "maba",
                                  maba.id,
                                  attr.id,
                                  `${maba.nama} - ${attr.name}`,
                                  itemState.notes
                                )
                              }
                              title="Tambah/ubah catatan pemeriksaan"
                              style={{
                                padding: "6px 8px",
                                borderRadius: "8px",
                                border: "1px solid rgba(31, 75, 93, 0.15)",
                                backgroundColor: itemState.notes ? "rgba(217, 119, 6, 0.12)" : "#FFFFFF",
                                color: itemState.notes ? "#D97706" : "rgba(31, 75, 93, 0.7)",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <MessageSquare size={13} />
                              {itemState.notes ? "Ada Catatan" : "Catatan"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEN TAB 2: PENGECEKAN ATRIBUT KELOMPOK                                  */}
      {/* ========================================================================= */}
      {activeTab === "kelompok" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mentorData?.attributes.kelompok.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid rgba(31, 75, 93, 0.08)",
              }}
            >
              <PackageCheck size={36} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F4B5D" }}>
                Tidak ada atribut kelompok yang dijadwalkan hari ini
              </div>
            </div>
          ) : (
            mentorData?.groupChecks
              .filter((grp) => selectedGroupId === "all" || grp.groupId === selectedGroupId)
              .map((grp) => {
                const grpCheckMap = groupChecksState[grp.groupId] || {};

                return (
                  <div
                    key={grp.groupId}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "18px",
                      border: "1px solid rgba(31, 75, 93, 0.08)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Header Kelompok */}
                    <div
                      style={{
                        padding: "14px 16px",
                        backgroundColor: "rgba(217, 119, 6, 0.06)",
                        borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={18} color="#D97706" />
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                          {grp.groupName}
                        </h4>
                      </div>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(217, 119, 6, 0.12)",
                          color: "#D97706",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                        }}
                      >
                        Barang Tim
                      </span>
                    </div>

                    {/* Checklist Atribut Kelompok */}
                    <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {mentorData.attributes.kelompok.map((attr) => {
                        const itemState = grpCheckMap[attr.id] || { isBrought: true, notes: "" };
                        const isBrought = itemState.isBrought;

                        return (
                          <div
                            key={attr.id}
                            style={{
                              padding: "12px 14px",
                              borderRadius: "12px",
                              backgroundColor: isBrought ? "rgba(31, 75, 93, 0.02)" : "rgba(239, 68, 68, 0.06)",
                              border: `1px solid ${isBrought ? "rgba(31, 75, 93, 0.08)" : "rgba(239, 68, 68, 0.3)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                            }}
                          >
                            <div
                              onClick={() => toggleGroupItem(grp.groupId, attr.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flex: 1,
                                cursor: "pointer",
                                userSelect: "none",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isBrought}
                                onChange={() => {}}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  cursor: "pointer",
                                  accentColor: "#D97706",
                                }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    color: isBrought ? "#1F1E19" : "#DC2626",
                                    textDecoration: isBrought ? "none" : "line-through",
                                  }}
                                >
                                  {attr.name}
                                </div>
                                {attr.description && (
                                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
                                    {attr.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openNoteModal(
                                  "group",
                                  grp.groupId,
                                  attr.id,
                                  `${grp.groupName} - ${attr.name}`,
                                  itemState.notes
                                )
                              }
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(31, 75, 93, 0.15)",
                                backgroundColor: itemState.notes ? "rgba(217, 119, 6, 0.12)" : "#FFFFFF",
                                color: itemState.notes ? "#D97706" : "rgba(31, 75, 93, 0.7)",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <MessageSquare size={13} />
                              {itemState.notes ? "Ada Catatan" : "Catatan"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* 5. Sticky Bottom Action Bar: Tombol Simpan Hasil Pemeriksaan */}
      <div
        style={{
          position: "sticky",
          bottom: "12px",
          zIndex: 40,
          marginTop: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "18px",
            padding: "12px 16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(31, 75, 93, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D" }}>
              Status Pemeriksaan:
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.6)" }}>
              {totalMissingIndividu > 0 ? (
                <span style={{ color: "#DC2626", fontWeight: 700 }}>
                  {totalMissingIndividu} item belum lengkap
                </span>
              ) : (
                <span style={{ color: "#059669", fontWeight: 700 }}>
                  Semua item tercentang lengkap
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBatch}
            disabled={saving}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
              transition: "transform 0.1s ease",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} /> Simpan Hasil Pemeriksaan
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. Modal Tambah/Edit Catatan */}
      {noteModalOpen && activeNoteTarget && (
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
              padding: "22px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={20} color="#0F766E" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                  Catatan Pemeriksaan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(31, 75, 93, 0.6)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.7)", marginBottom: "10px" }}>
              {activeNoteTarget.title}
            </div>

            <textarea
              rows={3}
              placeholder="Misal: Ketinggalan di kosan, atribut rusak/kurang lengkap..."
              value={activeNoteTarget.note}
              onChange={(e) =>
                setActiveNoteTarget((prev) => (prev ? { ...prev, note: e.target.value } : null))
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.85rem",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: "14px",
              }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "#FFFFFF",
                  color: "#1F4B5D",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => saveNoteFromModal(activeNoteTarget.note)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
