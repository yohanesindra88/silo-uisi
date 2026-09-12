"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Fab } from "@/components/ui/fab";
import { LiveQrScanner, scanImageFileWithJsQR } from "@/utils/qr-scanner";
import {
  QrCode,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Shield,
  ClipboardList,
  ShieldCheck,
  Camera,
  RefreshCw,
  Sparkles,
  Search,
  X,
  User,
  ExternalLink,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
  mentored_groups?: Array<{ group_id: number; group_name: string }>;
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

interface SubmissionItem {
  id: number;
  score: number | null;
  status: string;
  submitted_at: string;
  maba: {
    nama: string;
    nim?: string;
    group?: { name: string };
  };
  assignment: {
    title: string;
  };
}

interface ScanResultBanner {
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  mabaNama?: string;
  time?: string;
}

export default function MentorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [groupMaba, setGroupMaba] = useState<any[]>([]);
  const [mentoredGroupIds, setMentoredGroupIds] = useState<number[]>([]);
  const [groupHadirCount, setGroupHadirCount] = useState<number>(0);
  const [groupBelumCount, setGroupBelumCount] = useState<number>(0);
  const [attendedMabas, setAttendedMabas] = useState<any[]>([]);
  const [unattendedMabas, setUnattendedMabas] = useState<any[]>([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceModalTab, setAttendanceModalTab] = useState<"hadir" | "belum">("hadir");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // State scanner & Bottom Sheet
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultBanner | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  const liveScannerRef = useRef<LiveQrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");

  // Helper untuk memuat data kehadiran maba kelompok binaan dari DB
  const refreshAttendanceCounts = useCallback(
    async (sessionId: number, mabaList: any[], gIds: number[]) => {
      if (!sessionId) return;
      try {
        const attRes = await fetch(`/api/attendance?sessionId=${sessionId}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const rawAttendances: any[] = attData.data || [];

          const mabaIds = new Set(mabaList.map((m: any) => m.id));
          const mabaNims = new Set(mabaList.map((m: any) => m.nim || m.username));

          // Filter data kehadiran yang sesuai dengan maba binaan
          const matched = rawAttendances.filter((a: any) => {
            const mId = a.mabaId || a.maba?.id;
            const mNim = a.maba?.nim || a.maba?.username;
            const grId = a.groupsId || a.maba?.mGroupsId || a.maba?.group?.id;
            return (
              mabaIds.has(mId) ||
              mabaNims.has(mNim) ||
              (gIds.length > 0 && gIds.includes(grId))
            );
          });

          const attendedIds = new Set(matched.map((a: any) => a.mabaId || a.maba?.id));
          const attendedNims = new Set(matched.map((a: any) => a.maba?.nim || a.maba?.username));

          const hadirList = matched.filter(
            (a: any) => a.status === "Hadir" || a.status === "Terlambat"
          );
          const belumList = mabaList.filter(
            (m: any) => !attendedIds.has(m.id) && !attendedNims.has(m.nim || m.username)
          );

          setGroupHadirCount(hadirList.length);
          setGroupBelumCount(belumList.length);
          setAttendedMabas(hadirList);
          setUnattendedMabas(belumList);
        }
      } catch (err) {
        console.error("Gagal memperbarui hitungan presensi:", err);
      }
    },
    []
  );

  // 1. Load profile, sessions & submissions
  const loadData = useCallback(async () => {
    try {
      // Data profil user
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      const currentUser = meData.user;
      setUser(currentUser);

      // Kumpulkan ID kelompok yang dibimbing mentor ini
      const groupIds: number[] = [];
      if (Array.isArray(currentUser?.mentored_groups)) {
        currentUser.mentored_groups.forEach((g: any) => {
          if (g.group_id && !groupIds.includes(g.group_id)) {
            groupIds.push(g.group_id);
          }
        });
      }
      if (currentUser?.m_groups_id && !groupIds.includes(currentUser.m_groups_id)) {
        groupIds.push(currentUser.m_groups_id);
      }
      setMentoredGroupIds(groupIds);

      // Data mahasiswa binaan resmi dari database
      let mabas: any[] = [];
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) {
          if (groupIds.length > 0) {
            mabas = uData.data.filter((m: any) =>
              groupIds.includes(m.mGroupsId || m.group?.id)
            );
          } else {
            mabas = [];
          }
        }
      }
      setGroupMaba(mabas);

      // Data sesi kegiatan dari database
      let activeSessId: number | null = null;
      const sessRes = await fetch("/api/sessions");
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const list: SessionItem[] = sessData.data || [];
        setSessions(list);
        const active = list.find((s) => s.is_active);
        const latest = [...list].sort(
          (a: any, b: any) =>
            new Date(b.startSessions || b.start_sessions || 0).getTime() -
            new Date(a.startSessions || a.start_sessions || 0).getTime()
        )[0];
        const selected = active || latest || list[0];
        if (selected) {
          activeSessId = selected.id;
          setSelectedSessionId(selected.id);
        }
      }

      // Hitung kehadiran awal berdasarkan sesi aktif
      if (activeSessId) {
        await refreshAttendanceCounts(activeSessId, mabas, groupIds);
      }

      // Data tugas masuk untuk mentor
      if (currentUser?.id) {
        const subRes = await fetch(`/api/submissions?mentorId=${currentUser.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissions(subData.data || []);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data mentor:", err);
    } finally {
      setLoading(false);
    }
  }, [router, refreshAttendanceCounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Audio feedback helper (Web Audio API)
  const playBeep = useCallback((success: boolean) => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        osc.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  }, []);

  // 2. Fungsi proses hasil scan QR
  const processQrCode = async (decodedText: string) => {
    const cleanToken = String(decodedText || "").trim();
    if (!cleanToken) return;

    const now = Date.now();
    // Debounce: jika token sama terdeteksi kurang dari 3 detik, abaikan
    if (
      cleanToken === lastScannedCodeRef.current &&
      now - lastScanTimestampRef.current < 3000
    ) {
      return;
    }

    lastScanTimestampRef.current = now;
    lastScannedCodeRef.current = cleanToken;

    if (!selectedSessionId) {
      playBeep(false);
      setScanResult({
        type: "warning",
        title: "Pilih Sesi Terlebih Dahulu",
        message: "Silakan tentukan sesi kegiatan aktif pada dropdown di atas.",
      });
      return;
    }

    setIsProcessingScan(true);

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(120);
      }

      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: cleanToken,
          qr_token: cleanToken,
          sessionId: Number(selectedSessionId),
          allowOutsideSchedule: true,
        }),
      });

      const result = await res.json();
      const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      if (res.ok && result.success) {
        playBeep(true);
        const status = result.data?.status;
        const isLate = status === "Terlambat";
        setScanResult({
          type: isLate ? "warning" : "success",
          title: isLate ? "Presensi Dicatat: Terlambat" : "Presensi Berhasil: Hadir",
          message: isLate
            ? `Tercatat melewati batas toleransi (${result.data?.session?.toleransi || 15} mnt).`
            : "Tepat waktu sesuai jadwal sesi.",
          mabaNama: result.data?.maba?.nama || "Mahasiswa",
          time: timeStr,
        });
        // Perbarui data ringkasan kehadiran secara instan
        refreshAttendanceCounts(selectedSessionId, groupMaba, mentoredGroupIds);
      } else if (result.code === "ALREADY_ATTENDED") {
        playBeep(false);
        const mabaNama = result.data?.maba?.nama || result.mabaName || "Mahasiswa";
        setScanResult({
          type: "info",
          title: "Sudah Presensi Sebelumnya",
          message: result.message || "Mahasiswa ini telah tercatat hadir pada sesi ini.",
          mabaNama,
          time: timeStr,
        });
        refreshAttendanceCounts(selectedSessionId, groupMaba, mentoredGroupIds);
      } else if (result.code === "SESSION_NOT_STARTED" || result.code === "SESSION_ENDED") {
        playBeep(false);
        setScanResult({
          type: "warning",
          title: result.code === "SESSION_NOT_STARTED" ? "Sesi Belum Dimulai" : "Sesi Telah Berakhir",
          message: result.message,
          time: timeStr,
        });
      } else if (result.code === "USER_NOT_FOUND") {
        playBeep(false);
        setScanResult({
          type: "error",
          title: "Mahasiswa Tidak Ditemukan",
          message: result.message || `Data QR/NIM "${cleanToken}" tidak ditemukan dalam database.`,
          time: timeStr,
        });
      } else {
        playBeep(false);
        setScanResult({
          type: "error",
          title: "Scan Gagal",
          message: result.message || "QR Code tidak valid atau terjadi kesalahan.",
          time: timeStr,
        });
      }
    } catch (err) {
      console.error("Scan error:", err);
      playBeep(false);
      setScanResult({
        type: "error",
        title: "Koneksi Bermasalah",
        message: "Tidak dapat menghubungi server presensi.",
      });
    } finally {
      setIsProcessingScan(false);
    }
  };

  // 3. Memulai Kamera Scanner & Meminta Izin Akses ke HP (LiveQrScanner - jsQR)
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Cek Secure Context (Kamera live stream butuh HTTPS atau localhost di HP)
    if (typeof window !== "undefined") {
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isSecure) {
        setCameraError(
          "Browser HP membatasi kamera live stream di jaringan HTTP lokal (bukan HTTPS). Gunakan tombol 'Ambil Foto QR (Kamera HP Langsung)' di bawah untuk memindai langsung menggunakan kamera HP Anda."
        );
        return;
      }
    }

    try {
      if (!videoRef.current) return;

      if (!liveScannerRef.current) {
        liveScannerRef.current = new LiveQrScanner(videoRef.current, (decodedText: string) => {
          processQrCode(decodedText);
        });
      }

      await liveScannerRef.current.start();
      setScannerActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn("Gagal memulai kamera scanner:", err);
      setScannerActive(false);

      const errStr = String(err?.name || err?.message || err);
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        setCameraError(
          "Izin akses kamera ditolak oleh browser/sistem HP. Silakan buka Pengaturan Izin Situs pada browser Anda, ubah izin kamera menjadi 'Izinkan' (Allow), lalu ketuk 'Coba Minta Izin Lagi'."
        );
      } else if (errStr.includes("NotFoundError") || errStr.includes("DevicesNotFoundError")) {
        setCameraError("Kamera tidak terdeteksi pada perangkat ini.");
      } else if (errStr.includes("NotReadableError") || errStr.includes("TrackStartError")) {
        setCameraError(
          "Kamera sedang digunakan oleh aplikasi lain atau sistem HP sedang sibuk. Silakan tutup aplikasi kamera lain atau gunakan fitur 'Ambil Foto QR'."
        );
      } else {
        setCameraError("Gagal membuka kamera scanner. Silakan coba lagi atau gunakan tombol Ambil Foto QR.");
      }
    }
  }, [processQrCode]);

  // Scan via foto kamera HP langsung menggunakan jsQR Multi-Pass (kompatibel bahkan di HTTP)
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingScan(true);
      if (liveScannerRef.current) {
        liveScannerRef.current.stop();
        setScannerActive(false);
      }

      // 4-Pass multi-algorithm image detection (Full downscale, Center-crop, Contrast boost, Tight-crop)
      const decodedText = await scanImageFileWithJsQR(file);
      processQrCode(decodedText);
    } catch (err: any) {
      playBeep(false);
      setScanResult({
        type: "error",
        title: "QR Tidak Terdeteksi",
        message:
          err?.message ||
          "Tidak dapat membaca QR Code dari foto. Pastikan posisi tegak, jelas, dan pencahayaan cukup.",
        time: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setIsProcessingScan(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Efek Lifecycle Kamera Scanner (LiveQrScanner - jsQR)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isScannerOpen) {
      // Auto-start kamera saat Bottom Sheet scanner dibuka
      timer = setTimeout(() => {
        startCamera();
      }, 300);
    } else {
      // Hentikan scanner saat Bottom Sheet ditutup
      setCameraError(null);
      if (liveScannerRef.current) {
        liveScannerRef.current.stop();
      }
      setScannerActive(false);
    }

    return () => {
      clearTimeout(timer);
      if (liveScannerRef.current) {
        liveScannerRef.current.destroy();
        liveScannerRef.current = null;
      }
      setScannerActive(false);
    };
  }, [isScannerOpen, startCamera]);

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  const mentoredGroupNames =
    user?.mentored_groups && user.mentored_groups.length > 0
      ? user.mentored_groups.map((g) => g.group_name).join(", ")
      : "Belum Ditugaskan";

  const selectedSessionObj = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const endSessionVal = selectedSessionObj?.endSessions || selectedSessionObj?.end_sessions;
  const isSelectedSessionEnded = endSessionVal ? new Date() > new Date(endSessionVal) : false;

  return (
    <MobileShell
      title="SILO 2026"
      role="mentor"
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* 1. Header Profil Mentor */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #1F4B5D 100%)",
          borderRadius: "20px",
          padding: "20px",
          color: "#FAFAFA",
          marginBottom: "18px",
          boxShadow: "0 10px 28px rgba(15, 118, 110, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <ShieldCheck size={16} color="#68CFEB" />
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#68CFEB",
              fontWeight: 700,
            }}
          >
            Pendamping Kelompok
          </span>
        </div>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          {user?.nama}
        </h2>
        <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: "0 0 14px 0" }}>
          Kelompok Binaan: <strong>{mentoredGroupNames}</strong>
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          <span>Sesi Aktif Sekarang:</span>
          <span style={{ color: "#68CFEB", fontWeight: 700 }}>
            {(() => {
              const cur = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
              if (!cur) return "Belum Ada Sesi";
              const startVal = cur.startSessions || cur.start_sessions;
              return `${cur.name} (${formatSessionDate(startVal)})`;
            })()}
          </span>
        </div>
      </div>

      {/* 2. Kartu Progres Presensi Kelompok Binaan */}
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
            <Users size={18} color="#0F766E" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
              Kehadiran Kelompok Binaan
            </h3>
          </div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(15, 118, 110, 0.1)",
              color: "#0F766E",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {sessions.find((s) => s.id === selectedSessionId)?.name || "Presensi"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div
            onClick={() => {
              setAttendanceModalTab("hadir");
              setAttendanceSearchQuery("");
              setIsAttendanceModalOpen(true);
            }}
            style={{
              padding: "12px",
              borderRadius: "14px",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1.5px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            title="Klik untuk melihat daftar maba yang sudah hadir"
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.72rem", color: "#065F46", fontWeight: 700 }}>Sudah Hadir</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#059669" }}>
                {groupHadirCount} <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>Maba</span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "#059669", opacity: 0.85, marginTop: "2px" }}>
                Lihat daftar &rarr;
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              setAttendanceModalTab("belum");
              setAttendanceSearchQuery("");
              setIsAttendanceModalOpen(true);
            }}
            style={{
              padding: "12px",
              borderRadius: "14px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1.5px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            title={isSelectedSessionEnded ? "Klik untuk melihat daftar maba yang tidak hadir" : "Klik untuk melihat daftar maba yang belum scan presensi"}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Clock size={20} color="#DC2626" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.72rem", color: "#991B1B", fontWeight: 700 }}>
                {isSelectedSessionEnded ? "Tidak Hadir" : "Belum Scan"}
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#DC2626" }}>
                {groupBelumCount} <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>Maba</span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "#DC2626", opacity: 0.85, marginTop: "2px" }}>
                Lihat daftar &rarr;
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "0.75rem",
            color: "rgba(31, 75, 93, 0.7)",
            textAlign: "center",
            marginBottom: "12px",
            fontWeight: 600,
          }}
        >
          Total {groupMaba.length} Mahasiswa Binaan Terdaftar
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            backgroundColor: "#0F766E",
            color: "#FFFFFF",
            border: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Camera size={16} />
          Mulai Pindai Presensi Maba
        </button>
      </div>

      {/* 2.5. Kartu Akses Cepat Pengecekan Atribut Maba */}
      <div
        onClick={() => router.push("/mentor/atribut")}
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
              Pemeriksaan Atribut Maba
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", marginTop: "2px" }}>
              Checklist visual barang bawaan maba binaan &rarr;
            </div>
          </div>
        </div>

        <ChevronRight size={20} color="#0F766E" />
      </div>

      {/* 3. Daftar Tugas Masuk Yang Perlu Direview */}
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
            <ClipboardList size={18} color="#1F4B5D" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
              Tugas Masuk Binaan
            </h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
            {submissions.length} Pengumpulan
          </span>
        </div>

        {submissions.length === 0 ? (
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
            Belum ada tugas baru yang dikirimkan mahasiswa binaan.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {submissions.slice(0, 5).map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.02)",
                  border: "1px solid rgba(31, 75, 93, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1F1E19", wordBreak: "break-word" }}>
                    {sub.maba?.nama}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px" }}>
                    {sub.assignment?.title}
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                  {sub.status === "graded" ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      Nilai: {sub.score}
                    </span>
                  ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "5px 12px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(245, 158, 11, 0.12)",
                          color: "#D97706",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        Belum Dinilai
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ textAlign: "center", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => router.push("/mentor/tugas")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0F766E",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Pantau Semua Tugas Binaan &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>

      {/* 4. FAB SCANNER di Pojok Kanan Bawah */}
      <Fab
        onClick={() => setIsScannerOpen(true)}
        icon={<QrCode size={22} />}
        label="Scan QR"
        ariaLabel="Buka Scanner QR Presensi"
        variant="secondary"
        bottomOffset={84}
      />

      {/* 5. Bottom Sheet: Kamera Scanner & Feedback Status Instan */}
      <BottomSheet
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setCameraError(null);
          setScanResult(null);
        }}
        title="Pemindai Presensi Cepat"
        maxHeight="90vh"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px 0 16px" }}>
          {/* A. Dropdown Selector Sesi Aktif */}
          <div>
            <label
              htmlFor="session-select"
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--lp-ocean-blue, #1F4B5D)",
                marginBottom: "6px",
              }}
            >
              Pilih Sesi Kegiatan:
            </label>
            <select
              id="session-select"
              value={selectedSessionId || ""}
              onChange={(e) => {
                const sId = Number(e.target.value);
                setSelectedSessionId(sId);
                setScanResult(null);
                refreshAttendanceCounts(sId, groupMaba, mentoredGroupIds);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                backgroundColor: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1F1E19",
                outline: "none",
              }}
            >
              {sessions.length === 0 ? (
                <option value="">Tidak ada sesi tersedia</option>
              ) : (
                sessions.map((sess) => {
                  const startVal = sess.startSessions || sess.start_sessions;
                  return (
                    <option key={sess.id} value={sess.id}>
                      {sess.is_active ? "🟢 [AKTIF SEKARANG] " : ""}{sess.name} ({formatSessionDate(startVal)}, {formatSessionTime(startVal)}) - Tol. {sess.toleransi}m
                    </option>
                  );
                })
              )}
            </select>

            {(() => {
              const cur = sessions.find((s) => s.id === selectedSessionId);
              if (!cur) return null;
              const startVal = cur.startSessions || cur.start_sessions;
              return (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "8px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(31, 75, 93, 0.05)",
                    border: "1px solid rgba(31, 75, 93, 0.1)",
                    fontSize: "0.75rem",
                    color: "#1F4B5D",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={13} color="#1F4B5D" />
                    <span>Tanggal: <strong>{formatSessionDate(startVal)}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={13} color="#1F4B5D" />
                    <span>Waktu Mulai: <strong>{formatSessionTime(startVal)}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Shield size={13} color="#0F766E" />
                    <span>Toleransi: <strong>{cur.toleransi ?? 0} mnt</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* B. Area View Kamera Scanner atau Permintaan Izin Akses */}
          <div
            style={{
              position: "relative",
              width: "100%",
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "#11110E",
              minHeight: "280px",
              border: "2px solid rgba(31, 75, 93, 0.2)",
              marginBottom: "12px",
            }}
          >
            {/* Video element untuk LiveQrScanner (jsQR) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: "100%",
                height: "100%",
                minHeight: "280px",
                objectFit: "cover",
                display: "block",
              }}
            />

            {/* Animasi Guide Reticle ketika scanner aktif */}
            {scannerActive && !isProcessingScan && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 4,
                }}
              >
                <div
                  style={{
                    width: "210px",
                    height: "210px",
                    border: "2px solid rgba(104, 207, 235, 0.7)",
                    borderRadius: "16px",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.32)",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", top: "-2px", left: "-2px", width: "22px", height: "22px", borderTop: "4px solid #68CFEB", borderLeft: "4px solid #68CFEB", borderTopLeftRadius: "12px" }} />
                  <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "22px", height: "22px", borderTop: "4px solid #68CFEB", borderRight: "4px solid #68CFEB", borderTopRightRadius: "12px" }} />
                  <span style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "22px", height: "22px", borderBottom: "4px solid #68CFEB", borderLeft: "4px solid #68CFEB", borderBottomLeftRadius: "12px" }} />
                  <span style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "22px", height: "22px", borderBottom: "4px solid #68CFEB", borderRight: "4px solid #68CFEB", borderBottomRightRadius: "12px" }} />
                </div>
              </div>
            )}

            {/* Jika kamera belum aktif atau ada error izin */}
            {!scannerActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "#FFFFFF",
                  padding: "20px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  zIndex: 6,
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: cameraError ? "rgba(239, 68, 68, 0.1)" : "rgba(31, 75, 93, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: cameraError ? "#EF4444" : "#1F4B5D",
                    boxShadow: cameraError ? "0 0 0 6px rgba(239, 68, 68, 0.15)" : "0 0 0 6px rgba(104, 207, 235, 0.15)",
                  }}
                >
                  {cameraError ? <AlertTriangle size={26} /> : <Camera size={26} />}
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F1E19", margin: "0 0 4px 0" }}>
                    {cameraError ? "Izin Kamera Terkendala" : "Menghubungkan Kamera HP..."}
                  </h4>
                  <p style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.75)", lineHeight: 1.45, margin: 0, maxWidth: "280px" }}>
                    {cameraError || "Browser sedang meminta izin untuk mengakses kamera ponsel Anda. Harap ketuk 'Izinkan' (Allow) pada pop-up di layar."}
                  </p>
                </div>

                {/* Tombol Minta Izin Ulang & Foto Langsung */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "300px" }}>
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      backgroundColor: "#1F4B5D",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(31, 75, 93, 0.2)",
                    }}
                  >
                    <RefreshCw size={16} />
                    <span>Minta Izin & Aktifkan Kamera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      backgroundColor: "#0284C7",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)",
                    }}
                  >
                    <Camera size={16} />
                    <span>📸 Ambil Foto QR (Kamera HP Langsung)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Overlay Loader jika sedang memproses scan */}
            {isProcessingScan && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#68CFEB",
                  gap: "8px",
                  zIndex: 20,
                }}
              >
                <RefreshCw size={28} className="animate-spin" />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}>
                  Memverifikasi QR Maba...
                </span>
              </div>
            )}
          </div>

          {/* Hidden File Input untuk Ambil Foto Langsung */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileScan}
          />

          {/* C. Tampilan Status Instan di Bawah Scanner (Tanpa Menutup Lembar) */}
          {scanResult && (
            <div
              style={{
                padding: "14px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                backgroundColor:
                  scanResult.type === "success"
                    ? "rgba(16, 185, 129, 0.12)"
                    : scanResult.type === "warning"
                    ? "rgba(245, 158, 11, 0.12)"
                    : scanResult.type === "info"
                    ? "rgba(104, 207, 235, 0.18)"
                    : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${
                  scanResult.type === "success"
                    ? "#10B981"
                    : scanResult.type === "warning"
                    ? "#F59E0B"
                    : scanResult.type === "info"
                    ? "#38BDF8"
                    : "#EF4444"
                }`,
                animation: "slideUp 200ms ease",
              }}
            >
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                {scanResult.type === "success" && <CheckCircle2 size={22} color="#059669" />}
                {scanResult.type === "warning" && <AlertTriangle size={22} color="#D97706" />}
                {scanResult.type === "info" && <CheckCircle2 size={22} color="#0284C7" />}
                {scanResult.type === "error" && <XCircle size={22} color="#DC2626" />}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color:
                      scanResult.type === "success"
                        ? "#065F46"
                        : scanResult.type === "warning"
                        ? "#92400E"
                        : scanResult.type === "info"
                        ? "#0369A1"
                        : "#991B1B",
                    marginBottom: "2px",
                  }}
                >
                  {scanResult.title}
                </div>

                {scanResult.mabaNama && (
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1F1E19" }}>
                    👤 {scanResult.mabaNama}
                  </div>
                )}

                <div style={{ fontSize: "0.75rem", opacity: 0.85, marginTop: "2px" }}>
                  {scanResult.message} {scanResult.time && `• ${scanResult.time}`}
                </div>
              </div>
            </div>
          )}

          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(31, 75, 93, 0.6)",
              textAlign: "center",
              margin: "4px 0 0 0",
            }}
          >
            Kamera otomatis tetap menyala untuk melanjutkan scan maba berikutnya.
          </p>
        </div>
      </BottomSheet>

      {/* ======================================================== */}
      {/* 📋 MODAL DETAIL DAFTAR PRESENSI MAHASISWA BINAAN         */}
      {/* ======================================================== */}
      {isAttendanceModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(17, 17, 14, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAttendanceModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "22px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 50px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(31, 75, 93, 0.12)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FAFAFA",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={16} color="#0F766E" />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Daftar Kehadiran Binaan
                  </span>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "2px 0 0 0", color: "#1F4B5D" }}>
                  {sessions.find((s) => s.id === selectedSessionId)?.name || "Sesi Presensi"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(31, 75, 93, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#1F4B5D",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs (Sudah Hadir vs Belum Scan) */}
            <div style={{ padding: "12px 20px 8px", backgroundColor: "#FFFFFF" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  backgroundColor: "#F1F5F9",
                  padding: "4px",
                  borderRadius: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setAttendanceModalTab("hadir")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "9px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    backgroundColor: attendanceModalTab === "hadir" ? "#FFFFFF" : "transparent",
                    color: attendanceModalTab === "hadir" ? "#059669" : "#64748B",
                    boxShadow: attendanceModalTab === "hadir" ? "0 2px 6px rgba(0, 0, 0, 0.06)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Sudah Hadir ({groupHadirCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceModalTab("belum")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "99px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    backgroundColor: attendanceModalTab === "belum" ? "#FFFFFF" : "transparent",
                    color: attendanceModalTab === "belum" ? "#DC2626" : "#64748B",
                    boxShadow: attendanceModalTab === "belum" ? "0 2px 6px rgba(0, 0, 0, 0.06)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Clock size={15} />
                  <span>{isSelectedSessionEnded ? `Tidak Hadir (${groupBelumCount})` : `Belum Scan (${groupBelumCount})`}</span>
                </button>
              </div>

              {/* Search Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.15)",
                  backgroundColor: "#FAFAFA",
                  marginTop: "10px",
                }}
              >
                <Search size={15} color="rgba(31, 75, 93, 0.5)" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIM maba..."
                  value={attendanceSearchQuery}
                  onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "0.8rem",
                    color: "#1F1E19",
                    width: "100%",
                  }}
                />
                {attendanceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAttendanceSearchQuery("")}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748B" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List Body (Scrollable) */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 20px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {(() => {
                const q = attendanceSearchQuery.toLowerCase().trim();

                if (attendanceModalTab === "hadir") {
                  const filteredHadir = attendedMabas.filter((item) => {
                    const nama = (item.maba?.nama || "").toLowerCase();
                    const nim = (item.maba?.nim || item.maba?.username || "").toLowerCase();
                    return !q || nama.includes(q) || nim.includes(q);
                  });

                  if (filteredHadir.length === 0) {
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "36px 16px",
                          color: "rgba(31, 75, 93, 0.6)",
                          fontSize: "0.85rem",
                        }}
                      >
                        <CheckCircle2 size={32} color="#CBD5E1" style={{ margin: "0 auto 8px" }} />
                        <div>{q ? "Tidak ada mahasiswa yang cocok dengan pencarian." : "Belum ada mahasiswa binaan yang hadir pada sesi ini."}</div>
                      </div>
                    );
                  }

                  return filteredHadir.map((item, idx) => {
                    const isLate = item.status === "Terlambat";
                    const scanTimeStr = item.scannedAt || item.createdAt
                      ? new Date(item.scannedAt || item.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-";

                    return (
                      <div
                        key={item.id || idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "14px",
                          backgroundColor: "#FAFAFA",
                          border: "1px solid rgba(31, 75, 93, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: isLate ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isLate ? "#D97706" : "#059669",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {(item.maba?.nama || "M")[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "#1F1E19",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.maba?.nama || "Mahasiswa"}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)" }}>
                              NIM: {item.maba?.nim || item.maba?.username || "-"} • {item.maba?.group?.name || "Binaan"}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "999px",
                              backgroundColor: isLate ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              color: isLate ? "#D97706" : "#059669",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              marginBottom: "2px",
                            }}
                          >
                            {isLate ? "Terlambat" : "Hadir"}
                          </span>
                          <div style={{ fontSize: "0.68rem", color: "rgba(31, 75, 93, 0.6)" }}>
                            {scanTimeStr}
                          </div>
                        </div>
                      </div>
                    );
                  });
                } else {
                  const filteredBelum = unattendedMabas.filter((m) => {
                    const nama = (m.nama || "").toLowerCase();
                    const nim = (m.nim || m.username || "").toLowerCase();
                    return !q || nama.includes(q) || nim.includes(q);
                  });

                  if (filteredBelum.length === 0) {
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "36px 16px",
                          color: "#059669",
                          fontSize: "0.85rem",
                        }}
                      >
                        <CheckCircle2 size={32} color="#059669" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontWeight: 700 }}>
                          {isSelectedSessionEnded
                            ? "Semua Mahasiswa Binaan Hadir Tepat Waktu / Tidak Ada yang Absen!"
                            : "Semua Mahasiswa Binaan Sudah Scan Presensi!"}
                        </div>
                      </div>
                    );
                  }

                  return filteredBelum.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        backgroundColor: "#FAFAFA",
                        border: "1px solid rgba(239, 68, 68, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#DC2626",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          {(m.nama || "M")[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              color: "#1F1E19",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.nama}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)" }}>
                            NIM: {m.nim || m.username || "-"} • {m.group?.name || "Binaan"}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "#DC2626",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          {isSelectedSessionEnded ? "Tidak Hadir" : "Belum Scan"}
                        </span>
                      </div>
                    </div>
                  ));
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid rgba(31, 75, 93, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FAFAFA",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAttendanceModalOpen(false);
                  setIsScannerOpen(true);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <Camera size={14} />
                <span>Buka Scanner QR</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "#FFFFFF",
                  color: "#1F4B5D",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
