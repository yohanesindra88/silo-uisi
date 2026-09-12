"use client";

import React, { useState, useEffect, useRef } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Fab } from "@/components/ui/fab";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  FileCheck2,
  AlertCircle,
  Award,
  ChevronRight,
  XCircle,
  PackageCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
  qr_token?: string | null;
  group?: { id: number; name: string } | null;
}

interface AssignmentItem {
  id: number;
  title: string;
  due_date: string;
  submission?: {
    id: number;
    status: string;
    score: number | null;
    feedback: string | null;
  } | null;
}

const formatDateSafe = (d: any) => {
  if (!d) return "-";
  const normalized = typeof d === "string" ? d.replace(" ", "T") : d;
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) return String(d);
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

interface AttendanceSummary {
  totalSessions: number;
  attended: number;
  late: number;
  absent: number;
  percentage: number;
}

export default function MabaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQrSheetOpen, setIsQrSheetOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Data ringkasan kehadiran
  const [attendanceStats, setAttendanceStats] = useState<AttendanceSummary>({
    totalSessions: 0,
    attended: 0,
    late: 0,
    absent: 0,
    percentage: 0,
  });

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Ambil data sesi user
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        const currentUser = meData.user;
        setUser(currentUser);

        // 2. Ambil seluruh sesi kegiatan terjadwal dari DB
        let totalSessionsCount = 0;
        let sessList: any[] = [];
        const sessRes = await fetch("/api/sessions");
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          sessList = Array.isArray(sessData.data) ? sessData.data : [];
          totalSessionsCount = sessList.length;
        }

        // 3. Ambil riwayat presensi mahasiswa aktif dari DB
        if (currentUser?.id) {
          const attRes = await fetch(`/api/attendance?mabaId=${currentUser.id}`);
          if (attRes.ok) {
            const attData = await attRes.json();
            const hadir = attData.summary?.hadir || 0;
            const terlambat = attData.summary?.terlambat || 0;
            const totalAttended = hadir + terlambat;
            const denom = Math.max(totalSessionsCount, 1);

            // Hitung sesi yang sudah berakhir tapi maba belum scan (Tidak Hadir)
            let absentCount = 0;
            const now = new Date();
            const attendedSessionIds = new Set(
              (attData.data || []).map((a: any) => a.sessionsId || a.sessionId || a.session?.id)
            );
            sessList.forEach((s: any) => {
              const endVal = s.endSessions || s.end_sessions;
              const isEnded = endVal ? now > new Date(endVal) : false;
              if (isEnded && !attendedSessionIds.has(s.id)) {
                absentCount++;
              }
            });

            setAttendanceStats({
              totalSessions: totalSessionsCount,
              attended: hadir,
              late: terlambat,
              absent: absentCount,
              percentage: totalSessionsCount > 0 ? Math.min(100, Math.round((totalAttended / denom) * 100)) : 0,
            });
          }
        }

        // 4. Ambil data penugasan dan pengumpulan tugas mahasiswa aktif dari DB
        const [assignRes, subRes] = await Promise.all([
          fetch("/api/assignments"),
          currentUser?.id ? fetch(`/api/submissions?mabaId=${currentUser.id}`) : Promise.resolve(null),
        ]);

        let rawAssignments: any[] = [];
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          rawAssignments = assignData.data || [];
        }

        let mabaSubmissions: any[] = [];
        if (subRes && subRes.ok) {
          const subData = await subRes.json();
          mabaSubmissions = subData.data || [];
        }

        // Gabungkan status pengumpulan mahasiswa untuk setiap tugas
        const mergedAssignments: AssignmentItem[] = rawAssignments.map((a: any) => {
          const userSub = mabaSubmissions.find(
            (s: any) => (s.assignmentId === a.id || s.assignment_id === a.id)
          );
          return {
            id: a.id,
            title: a.title,
            due_date: a.dueDate || a.due_date,
            submission: userSub
              ? {
                  id: userSub.id,
                  status: userSub.status,
                  score: userSub.score !== null && userSub.score !== undefined ? Number(userSub.score) : null,
                  feedback: userSub.feedback || null,
                }
              : null,
          };
        });

        setAssignments(mergedAssignments);
      } catch (err) {
        console.error("Gagal memuat data dashboard maba:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Fungsi mengunduh QR Code sebagai file PNG
  const handleDownloadQr = () => {
    if (!qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `QR_SILO_${user?.nim || "MABA"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title="SILO 2026"
      role="maba"
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* 1. Sambutan & Profil Maba */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #2A6880 100%)",
          borderRadius: "20px",
          padding: "20px",
          color: "#FAFAFA",
          marginBottom: "18px",
          boxShadow: "0 10px 28px rgba(31, 75, 93, 0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(104, 207, 235, 0.35) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Sparkles size={16} color="#68CFEB" />
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#68CFEB",
              fontWeight: 700,
            }}
          >
            Mahasiswa Baru SILO 2026
          </span>
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          {user?.nama}
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: "0 0 14px 0" }}>
          NIM: <strong>{user?.nim || "-"}</strong> • {user?.prodi || "Universitas Internasional Semen Indonesia"}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(4px)",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          <span>Cluster Kelompok:</span>
          <span style={{ color: "#68CFEB", fontWeight: 700 }}>
            {user?.group?.name || "Belum Ada Kelompok"}
          </span>
        </div>
      </div>

      {/* 2. Ringkasan Persentase Kehadiran */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} color="#1F4B5D" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
              Kehadiran Orientasi
            </h3>
          </div>
          <span
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: attendanceStats.percentage >= 80 ? "#059669" : "#D97706",
            }}
          >
            {attendanceStats.percentage}%
          </span>
        </div>

        {/* Progress Bar Visual */}
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "rgba(31, 75, 93, 0.08)",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              width: `${Math.min(attendanceStats.percentage, 100)}%`,
              height: "100%",
              backgroundColor: attendanceStats.percentage >= 80 ? "#10B981" : "#F59E0B",
              borderRadius: "999px",
              transition: "width 500ms ease",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div
            style={{
              padding: "10px 8px",
              borderRadius: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", color: "#065F46" }}>Tepat Waktu</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#059669" }}>
                {attendanceStats.attended} Sesi
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 8px",
              borderRadius: "12px",
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Clock size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", color: "#92400E" }}>Terlambat</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#D97706" }}>
                {attendanceStats.late} Sesi
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 8px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <XCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.7rem", color: "#991B1B" }}>Tidak Hadir</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#DC2626" }}>
                {attendanceStats.absent} Sesi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. Card Pintasan Cepat Atribut & Perlengkapan Maba */}
      <div
        onClick={() => router.push("/maba/atribut")}
        style={{
          background: "linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(31, 75, 93, 0.04) 100%)",
          borderRadius: "18px",
          padding: "16px 18px",
          marginBottom: "18px",
          border: "1.5px solid rgba(15, 118, 110, 0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          boxShadow: "0 4px 16px rgba(15, 118, 110, 0.05)",
          transition: "transform 0.15s ease",
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
              Atribut & Barang Bawaan
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", marginTop: "2px" }}>
              Cek daftar perlengkapan wajib hari ini &rarr;
            </div>
          </div>
        </div>

        <ChevronRight size={20} color="#0F766E" />
      </div>

      {/* 3. Ringkasan Status Penugasan */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "20px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileCheck2 size={18} color="#1F4B5D" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
              Daftar Penugasan
            </h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
            {assignments.length} Tugas
          </span>
        </div>

        {assignments.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              backgroundColor: "rgba(31, 75, 93, 0.03)",
              borderRadius: "12px",
              color: "rgba(31, 75, 93, 0.6)",
              fontSize: "0.85rem",
            }}
          >
            Belum ada penugasan aktif dari panitia.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {assignments.map((item) => {
              const hasSubmitted = !!item.submission;
              const isGraded = item.submission?.status === "graded";
              const isLate = item.submission?.status === "late";

              return (
                <div
                  key={item.id}
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
                  <div style={{ flex: 1, paddingRight: "10px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1F1E19", marginBottom: "3px" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)" }}>
                      Deadline: {formatDateSafe(item.due_date)}
                    </div>
                  </div>

                  <div>
                    {isGraded ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          color: "#059669",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        <Award size={12} />
                        Nilai: {item.submission?.score}
                      </span>
                    ) : hasSubmitted ? (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          backgroundColor: isLate ? "rgba(245, 158, 11, 0.12)" : "rgba(104, 207, 235, 0.2)",
                          color: isLate ? "#D97706" : "#0F766E",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {isLate ? "Terlambat" : "Terkumpul"}
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          color: "#DC2626",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        Belum Kirim
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FAB QR CODE di Pojok Kanan Bawah */}
      <Fab
        onClick={() => setIsQrSheetOpen(true)}
        icon={<QrCode size={22} />}
        label="Kartu QR"
        ariaLabel="Buka Kartu QR Presensi Maba"
        variant="accent"
        bottomOffset={84}
      />

      {/* 5. Bottom Sheet: Kartu Identitas Digital & QR Code Statis */}
      <BottomSheet
        isOpen={isQrSheetOpen}
        onClose={() => {
          setIsQrSheetOpen(false);
          setIsZoomed(false);
        }}
        title="Kartu Presensi Digital"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 16px" }}>
          {/* Card Digital Frame */}
          <div
            style={{
              width: "100%",
              maxWidth: "340px",
              background: "linear-gradient(145deg, #1F4B5D 0%, #15323E 100%)",
              borderRadius: "20px",
              padding: "20px",
              color: "#FFFFFF",
              boxShadow: "0 12px 36px rgba(31, 75, 93, 0.35)",
              border: "1px solid rgba(104, 207, 235, 0.3)",
              marginBottom: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Header Card */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", color: "#68CFEB" }}>
                AETHERA SILO UISI 2026
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(104, 207, 235, 0.2)",
                  color: "#68CFEB",
                  fontWeight: 700,
                }}
              >
                MAHASISWA BARU
              </div>
            </div>

            {/* QR Code Container */}
            <div
              ref={qrCanvasRef}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: isZoomed ? "20px" : "14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
                width: isZoomed ? "260px" : "180px",
                transition: "width 250ms ease, padding 250ms ease",
              }}
            >
              <QRCodeCanvas
                value={user?.qr_token || "QR-SILO-MABA-2026"}
                size={isZoomed ? 220 : 150}
                level="M"
                includeMargin={true}
              />
              <span
                style={{
                  marginTop: "8px",
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "#1F4B5D",
                }}
              >
                {user?.qr_token || "QR_CODE_ACTIVE"}
              </span>
            </div>

            {/* Detail Maba */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "2px" }}>
                {user?.nama}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#68CFEB", fontWeight: 600, marginBottom: "4px" }}>
                NIM: {user?.nim || "-"}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                {user?.group?.name || "SILO 2026"} • {user?.prodi || "Universitas Internasional Semen Indonesia"}
              </div>
            </div>
          </div>

          {/* Tombol Aksi: Download & Perbesar */}
          <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "340px", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={handleDownloadQr}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "12px",
                backgroundColor: "#1F4B5D",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(31, 75, 93, 0.2)",
              }}
            >
              <Download size={16} />
              Unduh QR
            </button>

            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "12px",
                backgroundColor: "rgba(31, 75, 93, 0.1)",
                color: "#1F4B5D",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {isZoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isZoomed ? "Kecilkan" : "Perbesar"}
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)", textAlign: "center", margin: 0 }}>
            Tunjukkan QR Code ini ke layar kamera scanner mentor saat sesi presensi berlangsung.
          </p>
        </div>
      </BottomSheet>
    </MobileShell>
  );
}
