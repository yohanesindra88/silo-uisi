"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Fab } from "@/components/ui/fab";
import {
  Plus,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Download,
  FileSpreadsheet,
  PackageCheck,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
}

interface SessionItem {
  id: number;
  name: string;
  start_sessions?: string;
  end_sessions?: string;
  startSessions?: string;
  endSessions?: string;
  toleransi: number;
  is_active: boolean;
}

const formatSessionDate = (dateVal?: any): string => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const month = months[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

const formatSessionTime = (dateVal?: any): string => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} WIB`;
};

interface AssignmentItem {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  attachment_url?: string;
  _count?: { submissions: number };
}

interface GlobalStats {
  totalMaba: number;
  totalGroups: number;
  attendanceRate: number;
  totalAssignments: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalMaba: 0,
    totalGroups: 0,
    attendanceRate: 0,
    totalAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Bottom Sheet FAB State
  const [isFabSheetOpen, setIsFabSheetOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<"menu" | "session" | "assignment">("menu");
  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Form Input States - Sesi Baru
  const [sessionName, setSessionName] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionTolerance, setSessionTolerance] = useState("15");

  // Form Input States - Tugas Baru
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentUrl, setAssignmentUrl] = useState("");

  const loadData = useCallback(async () => {
    try {
      // 1. Profil user
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Daftar sesi kegiatan dari database
      let sessionCount = 0;
      const sessRes = await fetch("/api/sessions");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const sessList = sessData.data || [];
        setSessions(sessList);
        sessionCount = sessList.length;
      }

      // 3. Daftar penugasan dari database
      let assignmentCount = 0;
      const assignRes = await fetch("/api/assignments");
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        const assignList = assignData.data || [];
        setAssignments(assignList);
        assignmentCount = assignList.length;
      }

      // 4. Data Maba & Kelompok langsung dari database
      let mabaCount = 0;
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) {
          mabaCount = uData.data.length;
        }
      }

      let groupCount = 0;
      const groupsRes = await fetch("/api/groups").catch(() => null);
      if (groupsRes && groupsRes.ok) {
        const gData = await groupsRes.json();
        if (Array.isArray(gData.data)) {
          groupCount = gData.data.length;
        }
      }

      // 5. Ringkasan kehadiran global langsung dari database
      let rate = 0;
      const attRes = await fetch("/api/attendance");
      if (attRes.ok) {
        const attData = await attRes.json();
        const totalScan = attData.summary?.total || 0;
        const totalHadir = (attData.summary?.hadir || 0) + (attData.summary?.terlambat || 0);

        // Jika ada maba dan sesi, hitung persentase kehadiran terhadap kuota total sesi x maba
        const expectedTotal = mabaCount > 0 && sessionCount > 0 ? mabaCount * sessionCount : totalScan;
        if (expectedTotal > 0) {
          rate = Math.min(100, Math.round((totalHadir / expectedTotal) * 100));
        } else if (totalScan > 0) {
          rate = Math.round((totalHadir / totalScan) * 100);
        } else {
          rate = 0;
        }
      }

      setStats({
        totalMaba: mabaCount,
        totalGroups: groupCount,
        attendanceRate: rate,
        totalAssignments: assignmentCount,
      });
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle submit Sesi Baru
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName || !sessionStart || !sessionEnd) {
      setFormFeedback("Nama sesi, jam mulai, dan jam selesai wajib diisi.");
      return;
    }

    setSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          start_sessions: new Date(sessionStart).toISOString(),
          end_sessions: new Date(sessionEnd).toISOString(),
          toleransi: Number(sessionTolerance) || 15,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setFormFeedback(result.message || "Gagal membuat sesi baru.");
        return;
      }

      // Reset form
      setSessionName("");
      setSessionStart("");
      setSessionEnd("");
      setSessionTolerance("15");
      setFormFeedback("✅ Sesi baru berhasil ditambahkan!");
      loadData();

      setTimeout(() => {
        setIsFabSheetOpen(false);
        setActiveForm("menu");
        setFormFeedback(null);
      }, 1200);
    } catch (err) {
      console.error("Error creating session:", err);
      setFormFeedback("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit Tugas Baru
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle || !assignmentDueDate) {
      setFormFeedback("Judul tugas dan batas waktu (deadline) wajib diisi.");
      return;
    }

    setSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignmentTitle,
          description: assignmentDesc,
          due_date: new Date(assignmentDueDate).toISOString(),
          attachment_url: assignmentUrl || undefined,
          created_by: user?.id,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setFormFeedback(result.message || "Gagal membuat penugasan baru.");
        return;
      }

      // Reset form
      setAssignmentTitle("");
      setAssignmentDesc("");
      setAssignmentDueDate("");
      setAssignmentUrl("");
      setFormFeedback("✅ Tugas baru berhasil dipublikasikan!");
      loadData();

      setTimeout(() => {
        setIsFabSheetOpen(false);
        setActiveForm("menu");
        setFormFeedback(null);
      }, 1200);
    } catch (err) {
      console.error("Error creating assignment:", err);
      setFormFeedback("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title="SILO 2026"
      role="admin"
      user={user ? { nama: user.nama, role: user.role } : undefined}
    >
      {/* 1. Header Admin Overview */}
      <div
        style={{
          background: "linear-gradient(135deg, #11110E 0%, #1F4B5D 100%)",
          borderRadius: "20px",
          padding: "20px",
          color: "#FAFAFA",
          marginBottom: "18px",
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Shield size={16} color="#68CFEB" />
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#68CFEB",
              fontWeight: 700,
            }}
          >
            Pusat Data Orientasi
          </span>
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          {user?.nama}
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.85, margin: 0 }}>
          Sistem Informasi &amp; Layanan Orientasi SILO UISI 2026
        </p>
      </div>

      {/* Pusat Ekspor & Live Monitoring */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={18} color="#1F4B5D" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F4B5D" }}>
              Ekspor Data &amp; Laporan
            </span>
          </div>
          <Link
            href="/admin/monitoring"
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#0F766E",
              textDecoration: "none",
            }}
          >
            Buka Monitoring &rarr;
          </Link>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/api/export/attendance"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "10px",
              backgroundColor: "rgba(104, 207, 235, 0.2)",
              color: "#0F766E",
              fontWeight: 700,
              fontSize: "0.75rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            <Download size={14} />
            <span>Presensi (CSV)</span>
          </a>

          <a
            href="/api/export/assignments"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "10px",
              backgroundColor: "rgba(31, 75, 93, 0.08)",
              color: "#1F4B5D",
              fontWeight: 700,
              fontSize: "0.75rem",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            <FileSpreadsheet size={14} />
            <span>Nilai Tugas (CSV)</span>
          </a>
        </div>
      </div>

      {/* Pintasan Cepat: Manajemen Atribut Maba */}
      <Link
        href="/admin/atribut"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          background: "linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(31, 75, 93, 0.04) 100%)",
          borderRadius: "18px",
          padding: "16px 18px",
          marginBottom: "18px",
          border: "1.5px solid rgba(15, 118, 110, 0.2)",
          textDecoration: "none",
          boxShadow: "0 4px 16px rgba(15, 118, 110, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "#0F766E",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
            }}
          >
            <PackageCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1F4B5D" }}>
              Kelola Atribut &amp; Bawaan Maba
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", marginTop: "2px" }}>
              Atur perlengkapan harian &amp; pantau checklist mentor &rarr;
            </div>
          </div>
        </div>

        <ChevronRight size={20} color="#0F766E" />
      </Link>

      {/* 2. Statistik Global Kehadiran & Tugas */}
      <h3
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--lp-ocean-blue, #1F4B5D)",
          marginBottom: "12px",
        }}
      >
        Statistik Global Orientasi
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Card Mahasiswa Baru */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(31, 75, 93, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1F4B5D",
              }}
            >
              <Users size={18} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
              Mahasiswa Baru
            </span>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1F4B5D" }}>
            {stats.totalMaba} Maba
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
            Terdaftar di Database
          </div>
        </div>

        {/* Card Kelompok */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(104, 207, 235, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F766E",
              }}
            >
              <Layers size={18} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
              Kelompok Binaan
            </span>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F766E" }}>
            {stats.totalGroups} Kelompok
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
            Didampingi Mentor
          </div>
        </div>

        {/* Card Kehadiran Global */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
              Kehadiran Rata-rata
            </span>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669" }}>
            {stats.attendanceRate}%
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
            Total {sessions.length} Sesi Terjadwal
          </div>
        </div>

        {/* Card Tugas Aktif */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97706",
              }}
            >
              <FileText size={18} />
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
              Tugas Orientasi
            </span>
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D97706" }}>
            {stats.totalAssignments} Modul
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
            Dipantau Tim Mentor
          </div>
        </div>
      </div>

      {/* 3. Daftar Sesi Kegiatan Terbaru */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} color="#1F4B5D" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
              Sesi Kegiatan Aktif
            </h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)", fontWeight: 600 }}>
            {sessions.length} Sesi
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sessions.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", fontSize: "0.8rem", color: "rgba(31,75,93,0.6)" }}>
              Belum ada sesi kegiatan. Klik tombol (+) di bawah untuk membuat sesi baru.
            </div>
          ) : (
            sessions.slice(0, 4).map((sess) => (
              <div
                key={sess.id}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.02)",
                  border: "1px solid rgba(31, 75, 93, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1F1E19" }}>
                    {sess.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)" }}>
                    {formatSessionDate((sess as any).startSessions || sess.start_sessions)} • Mulai: {formatSessionTime((sess as any).startSessions || sess.start_sessions)} • Tol. {sess.toleransi} mnt
                  </div>
                </div>

                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    backgroundColor: sess.is_active ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.1)",
                    color: sess.is_active ? "#059669" : "#64748B",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {sess.is_active ? "Berlangsung" : "Selesai"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. FAB (+) DI POJOK KANAN BAWAH */}
      <Fab
        onClick={() => {
          setActiveForm("menu");
          setFormFeedback(null);
          setIsFabSheetOpen(true);
        }}
        icon={<Plus size={24} />}
        label="Tambah Data"
        ariaLabel="Buka Menu Tambah Sesi atau Tugas"
        variant="primary"
        bottomOffset={84}
      />

      {/* 5. Bottom Sheet: 2 Pilihan Cepat (Tambah Sesi Baru & Tambah Tugas Baru) */}
      <BottomSheet
        isOpen={isFabSheetOpen}
        onClose={() => {
          setIsFabSheetOpen(false);
          setActiveForm("menu");
          setFormFeedback(null);
        }}
        title={
          activeForm === "session"
            ? "Tambah Sesi Kegiatan Baru"
            : activeForm === "assignment"
            ? "Publikasi Tugas Baru"
            : "Tindakan Cepat Panitia"
        }
        maxHeight="88vh"
      >
        {/* Feedback Alert */}
        {formFeedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              backgroundColor: formFeedback.startsWith("✅")
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              color: formFeedback.startsWith("✅") ? "#059669" : "#DC2626",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            {formFeedback}
          </div>
        )}

        {/* Mode 1: Menu Pilihan Awal */}
        {activeForm === "menu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "6px 0 16px" }}>
            <button
              type="button"
              onClick={() => setActiveForm("session")}
              style={{
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(31, 75, 93, 0.12)",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(31, 75, 93, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1F4B5D",
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1F1E19" }}>
                    Tambah Sesi Baru
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>
                    Nama sesi, waktu mulai/selesai &amp; toleransi
                  </div>
                </div>
              </div>
              <ArrowRight size={18} color="#1F4B5D" />
            </button>

            <button
              type="button"
              onClick={() => setActiveForm("assignment")}
              style={{
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(31, 75, 93, 0.12)",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(104, 207, 235, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0F766E",
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1F1E19" }}>
                    Tambah Tugas Baru
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>
                    Judul penugasan, batas waktu &amp; template link
                  </div>
                </div>
              </div>
              <ArrowRight size={18} color="#1F4B5D" />
            </button>
          </div>
        )}

        {/* Mode 2: Form Cepat Input Sesi Baru */}
        {activeForm === "session" && (
          <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Nama Sesi Orientasi:
              </label>
              <input
                type="text"
                placeholder="Contoh: Kuliah Perdana & Etika Kampus"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Jam Mulai:
                </label>
                <input
                  type="datetime-local"
                  value={sessionStart}
                  onChange={(e) => setSessionStart(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.8rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Jam Selesai:
                </label>
                <input
                  type="datetime-local"
                  value={sessionEnd}
                  onChange={(e) => setSessionEnd(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.8rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Toleransi Keterlambatan (Menit):
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={sessionTolerance}
                onChange={(e) => setSessionTolerance(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setActiveForm("menu");
                  setFormFeedback(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "transparent",
                  color: "#1F4B5D",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#1F4B5D",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>Simpan Sesi</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode 3: Form Cepat Input Tugas Baru */}
        {activeForm === "assignment" && (
          <form onSubmit={handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Judul Penugasan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Resume Materi Nilai-Nilai UISI"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Deskripsi &amp; Panduan:
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan format pengumpulan, panjang halaman, atau instruksi tugas..."
                value={assignmentDesc}
                onChange={(e) => setAssignmentDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Batas Waktu (Due Date):
              </label>
              <input
                type="datetime-local"
                value={assignmentDueDate}
                onChange={(e) => setAssignmentDueDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Link Template / Referensi (Opsional):
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={assignmentUrl}
                onChange={(e) => setAssignmentUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setActiveForm("menu");
                  setFormFeedback(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "transparent",
                  color: "#1F4B5D",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Kembali
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>Publikasi Tugas</span>
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </MobileShell>
  );
}
