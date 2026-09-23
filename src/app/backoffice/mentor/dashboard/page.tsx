"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Clock,
  Calendar,
  Shield,
  ClipboardList,
  ShieldCheck,
  Camera,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  PackageCheck,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ScanResultModal, ScanResultData } from "@/components/scanner/ScanResultModal";
import { getAllowedProdisForMentor } from "@/config/attendance";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  mentored_groups?: Array<{ group_id: number; group_name: string }>;
}

interface SessionItem {
  id: number;
  name: string;
  attendanceType?: string;
  attendance_type?: string;
  start_sessions?: string;
  end_sessions?: string;
  startSessions?: string;
  endSessions?: string;
  toleransi: number;
  is_active: boolean;
}

interface MabaItem {
  id: number;
  nama: string;
  nim?: string | null;
  username?: string | null;
  mGroupsId?: number | null;
  group?: { id?: number; name?: string } | null;
}

interface AttendanceItem {
  id: number;
  mabaId?: number;
  groupsId?: number;
  status: string;
  scannedAt?: string;
  createdAt?: string;
  maba?: {
    id?: number;
    nama?: string;
    nim?: string;
    username?: string;
    mGroupsId?: number;
    group?: { id?: number; name?: string };
  };
}

const formatSessionDate = (dateVal?: string | Date | null): string => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const month = months[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

const formatSessionTime = (dateVal?: string | Date | null): string => {
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

export default function MentorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [groupMaba, setGroupMaba] = useState<MabaItem[]>([]);
  const [mentoredGroupIds, setMentoredGroupIds] = useState<number[]>([]);
  const [groupHadirCount, setGroupHadirCount] = useState<number>(0);
  const [groupBelumCount, setGroupBelumCount] = useState<number>(0);
  const [attendedMabas, setAttendedMabas] = useState<AttendanceItem[]>([]);
  const [unattendedMabas, setUnattendedMabas] = useState<MabaItem[]>([]);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceModalTab, setAttendanceModalTab] = useState<"hadir" | "belum">("hadir");
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // State scanner & Bottom Sheet
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Modal Pop-Up Hasil Scan & Input Manual NIM
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [modalResultData, setModalResultData] = useState<ScanResultData | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualNim, setManualNim] = useState("");

  const liveScannerRef = useRef<LiveQrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");

  // Helper untuk memuat data kehadiran maba kelompok binaan dari DB
  const refreshAttendanceCounts = useCallback(
    async (sessionId: number, mabaList: MabaItem[], gIds: number[]) => {
      if (!sessionId) return;
      try {
        const attRes = await fetch(`/api/attendance?sessionId=${sessionId}`);
        if (attRes.ok) {
          const attData = await attRes.json();
          const rawAttendances: AttendanceItem[] = attData.data || [];

          const mabaIds = new Set(mabaList.map((m) => m.id));
          const mabaNims = new Set(mabaList.map((m) => m.nim || m.username));

          // Filter data kehadiran yang sesuai dengan maba binaan
          const matched = rawAttendances.filter((a) => {
            const mId = a.mabaId || a.maba?.id;
            const mNim = a.maba?.nim || a.maba?.username;
            const grId = a.groupsId || a.maba?.mGroupsId || a.maba?.group?.id;
            return (
              (mId && mabaIds.has(mId)) ||
              (mNim && mabaNims.has(mNim)) ||
              (grId && gIds.length > 0 && gIds.includes(grId))
            );
          });

          const attendedIds = new Set<number>();
          const attendedNims = new Set<string>();
          matched.forEach((a) => {
            const idVal = a.mabaId || a.maba?.id;
            if (idVal) attendedIds.add(idVal);
            const nimVal = a.maba?.nim || a.maba?.username;
            if (nimVal) attendedNims.add(nimVal);
          });

          const hadirList = matched.filter(
            (a) => a.status === "Hadir" || a.status === "Terlambat"
          );
          const belumList = mabaList.filter((m) => {
            const hasId = attendedIds.has(m.id);
            const nimVal = m.nim || m.username;
            const hasNim = Boolean(nimVal && attendedNims.has(nimVal));
            return !hasId && !hasNim;
          });

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
        currentUser.mentored_groups.forEach((g: { group_id?: number }) => {
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
      let mabas: MabaItem[] = [];
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) {
          if (groupIds.length > 0) {
            mabas = uData.data.filter((m: MabaItem) =>
              m.mGroupsId && groupIds.includes(m.mGroupsId) ||
              m.group?.id && groupIds.includes(m.group.id)
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
        const currentTime = new Date();
        const activeBySchedule = list.filter((s: SessionItem) => {
          const startVal = s.startSessions || s.start_sessions;
          const endVal = s.endSessions || s.end_sessions;
          if (!startVal || !endVal) return false;
          return currentTime >= new Date(startVal) && currentTime <= new Date(endVal);
        });
        const active = activeBySchedule[0] || list.find((s) => s.is_active);
        const latest = [...list].sort(
          (a, b) =>
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
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  // Audio feedback helper (Web Audio API)
  const playBeep = useCallback((success: boolean) => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  // Filter sesi aktif: waktu sekarang berada di antara startSessions dan endSessions
  const now = new Date();
  const activeSessions = sessions.filter((s: SessionItem) => {
    const startVal = s.startSessions || s.start_sessions;
    const endVal = s.endSessions || s.end_sessions;
    if (!startVal || !endVal) return false;
    return now >= new Date(startVal) && now <= new Date(endVal);
  });

  const selectedSessionObj =
    sessions.find((s) => s.id === selectedSessionId) ||
    activeSessions[0] ||
    sessions[0];
  const endSessionVal = selectedSessionObj?.endSessions || selectedSessionObj?.end_sessions;
  const isSelectedSessionEnded = endSessionVal ? new Date() > new Date(endSessionVal) : false;
  const isProdiSession =
    (selectedSessionObj?.attendance_type || selectedSessionObj?.attendanceType) === "prodi";
  const attendanceKeterangan = isProdiSession ? "Prodi" : "Kelompok";
  const mentorAllowedProdis = useMemo(
    () => (user?.prodi ? getAllowedProdisForMentor(user.prodi) : []),
    [user]
  );

  // Helper Penanganan Modal Hasil Scan & Jeda Scanner
  const handleCloseResultModal = useCallback(() => {
    setIsResultModalOpen(false);
    // Lanjutkan scanning dengan jeda aman agar tidak membaca ulang QR yang sama
    setTimeout(() => {
      liveScannerRef.current?.resume();
    }, 350);
  }, []);

  const triggerScanResult = useCallback((resultData: ScanResultData) => {
    setModalResultData(resultData);
    setIsResultModalOpen(true);
    // Jeda pembacaan frame saat modal pop-up tampil di layar
    liveScannerRef.current?.pause();
  }, []);

  // 2. Fungsi proses hasil scan QR
  const processQrCode = async (decodedText: string) => {
    const cleanToken = String(decodedText || "").trim();
    if (!cleanToken) return;

    const currentTime = Date.now();
    // Debounce: jika token sama terdeteksi kurang dari 3 detik, abaikan
    if (
      cleanToken === lastScannedCodeRef.current &&
      currentTime - lastScanTimestampRef.current < 3000
    ) {
      return;
    }

    lastScanTimestampRef.current = currentTime;
    lastScannedCodeRef.current = cleanToken;

    if (!selectedSessionId || activeSessions.length === 0) {
      playBeep(false);
      triggerScanResult({
        type: "warning",
        title: "Tidak Ada Sesi Aktif",
        message: "Saat ini tidak ada sesi kegiatan yang aktif sesuai jadwal (WIB). Presensi ditutup.",
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
      const currentSessionName = selectedSessionObj?.name;

      if (res.ok && result.success) {
        playBeep(true);
        const status = result.data?.status;
        const isLate = status === "Terlambat";
        triggerScanResult({
          type: isLate ? "warning" : "success",
          title: isLate ? "Presensi Dicatat: Terlambat" : "Presensi Berhasil: Hadir",
          message: isLate
            ? `Tercatat melewati batas toleransi (${result.data?.session?.toleransi || 15} mnt).`
            : "Tepat waktu sesuai jadwal sesi.",
          mabaNama: result.data?.maba?.nama || "Mahasiswa",
          nim: result.data?.maba?.nim || result.data?.maba?.username,
          prodi: result.data?.maba?.prodi,
          kelompok: result.data?.maba?.group?.name,
          time: timeStr,
          status: status || (isLate ? "Terlambat" : "Hadir"),
          sessionName: currentSessionName,
          attendanceType: attendanceKeterangan,
        });
        // Perbarui data ringkasan kehadiran secara instan
        if (selectedSessionId) {
          refreshAttendanceCounts(selectedSessionId, groupMaba, mentoredGroupIds);
        }
      } else if (result.code === "ALREADY_ATTENDED") {
        playBeep(false);
        const maba = result.data?.maba;
        const mabaNama = maba?.nama || result.mabaName || "Mahasiswa";
        triggerScanResult({
          type: "info",
          title: "Sudah Presensi Sebelumnya",
          message: result.message || "Mahasiswa ini telah tercatat hadir pada sesi ini.",
          mabaNama,
          nim: maba?.nim || maba?.username,
          prodi: maba?.prodi,
          kelompok: maba?.group?.name,
          time: timeStr,
          status: "Sudah Hadir",
          sessionName: currentSessionName,
          attendanceType: attendanceKeterangan,
        });
        if (selectedSessionId) {
          refreshAttendanceCounts(selectedSessionId, groupMaba, mentoredGroupIds);
        }
      } else if (result.code === "SESSION_NOT_STARTED" || result.code === "SESSION_ENDED") {
        playBeep(false);
        triggerScanResult({
          type: "warning",
          title: result.code === "SESSION_NOT_STARTED" ? "Sesi Belum Dimulai" : "Sesi Telah Berakhir",
          message: result.message || "Presensi hanya dapat dilakukan selama rentang waktu sesi berlangsung.",
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "USER_NOT_FOUND") {
        playBeep(false);
        triggerScanResult({
          type: "error",
          title: "Mahasiswa Tidak Ditemukan",
          message: result.message || `Data QR/NIM "${cleanToken}" tidak ditemukan dalam database.`,
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "UNAUTHORIZED_GROUP") {
        playBeep(false);
        const maba = result.data?.maba;
        triggerScanResult({
          type: "error",
          title: "Bukan Mahasiswa Kelompok Binaan",
          message: result.message || "Mahasiswa tidak terdaftar di kelompok binaan Anda.",
          mabaNama: maba?.nama,
          nim: maba?.nim || maba?.username,
          prodi: maba?.prodi,
          kelompok: maba?.group?.name,
          time: timeStr,
          sessionName: currentSessionName,
          attendanceType: "Kelompok",
        });
      } else if (result.code === "UNAUTHORIZED_PRODI") {
        playBeep(false);
        const maba = result.data?.maba;
        triggerScanResult({
          type: "error",
          title: "Di Luar Kewenangan Prodi",
          message: result.message || "Anda tidak memiliki izin memindai mahasiswa di luar prodi binaan Anda.",
          mabaNama: maba?.nama,
          nim: maba?.nim || maba?.username,
          prodi: maba?.prodi,
          kelompok: maba?.group?.name,
          time: timeStr,
          sessionName: currentSessionName,
          attendanceType: "Prodi",
          allowedProdis: mentorAllowedProdis,
        });
      } else {
        playBeep(false);
        triggerScanResult({
          type: "error",
          title: "Scan Gagal",
          message: result.message || "QR Code tidak valid atau terjadi kesalahan.",
          time: timeStr,
          sessionName: currentSessionName,
        });
      }
    } catch (err: unknown) {
      console.error("Scan error:", err);
      playBeep(false);
      triggerScanResult({
        type: "error",
        title: "Koneksi Bermasalah",
        message: "Tidak dapat menghubungi server presensi.",
      });
    } finally {
      setIsProcessingScan(false);
    }
  };

  const processQrCodeRef = useRef(processQrCode);
  useEffect(() => {
    processQrCodeRef.current = processQrCode;
  });

  // 3. Memulai Kamera Scanner & Meminta Izin Akses ke HP (LiveQrScanner - jsQR)
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Tandai preferensi izin selalu aktif
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("silo_camera_always_allowed", "true");
      } catch {}

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
          processQrCodeRef.current(decodedText);
        });
      }

      await liveScannerRef.current.start();
      setScannerActive(true);
      setCameraError(null);
    } catch (err: unknown) {
      console.warn("Gagal memulai kamera scanner:", err);
      setScannerActive(false);

      const errStr = String(err);
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        setCameraError(
          "Izin akses kamera ditolak oleh browser/sistem HP. Silakan buka Pengaturan Izin Situs pada browser Anda, ubah izin kamera menjadi 'Izinkan' (Allow), lalu ketuk 'Minta Izin & Aktifkan Kamera'."
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
  }, []);

  // 4. Query Permission Otomatis ("Always Allow" Detection & Auto-start)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      try {
        navigator.permissions
          .query({ name: "camera" as PermissionName })
          .then((permissionStatus) => {
            if (permissionStatus.state === "granted" && isScannerOpen && !scannerActive) {
              startCamera();
            }

            permissionStatus.onchange = () => {
              if (permissionStatus.state === "granted" && isScannerOpen && !scannerActive) {
                startCamera();
              }
            };
          })
          .catch(() => {});
      } catch {}
    }
  }, [isScannerOpen, scannerActive, startCamera]);

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
    } catch (err: unknown) {
      playBeep(false);
      const errObj = err as { message?: string };
      triggerScanResult({
        type: "error",
        title: "QR Tidak Terdeteksi",
        message:
          errObj?.message ||
          "Tidak dapat membaca QR Code dari foto. Pastikan posisi tegak, jelas, dan pencahayaan cukup.",
        time: new Date().toLocaleTimeString("id-ID"),
        sessionName: selectedSessionObj?.name,
      });
    } finally {
      setIsProcessingScan(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNim.trim()) return;
    processQrCode(manualNim.trim());
    setManualNim("");
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        {(() => {
          const sess = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
          const isP = (sess?.attendance_type || sess?.attendanceType) === "prodi";
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} color="#0F766E" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F4B5D" }}>
                  {isP ? "Kehadiran Mahasiswa Prodi" : "Kehadiran Kelompok Binaan"}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: isP ? "rgba(124, 58, 237, 0.12)" : "rgba(14, 165, 233, 0.12)",
                    color: isP ? "#7C3AED" : "#0284C7",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                  }}
                >
                  {isP ? "🎓 Prodi" : "👥 Kelompok"}
                </span>
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
                  {sess?.name || "Presensi"}
                </span>
              </div>
            </div>
          );
        })()}

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
          onClick={() => {
            if (activeSessions.length > 0 && !activeSessions.some((s) => s.id === selectedSessionId)) {
              setSelectedSessionId(activeSessions[0].id);
            }
            setIsScannerOpen(true);
          }}
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
        onClick={() => {
          if (activeSessions.length > 0 && !activeSessions.some((s) => s.id === selectedSessionId)) {
            setSelectedSessionId(activeSessions[0].id);
          }
          setIsScannerOpen(true);
        }}
        icon={<QrCode size={22} />}
        label="Scan QR"
        ariaLabel="Buka Scanner QR Presensi"
        variant="secondary"
        bottomOffset={84}
      />

      {/* 5. Bottom Sheet: Kamera Scanner Presensi QR */}
      <BottomSheet
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setCameraError(null);
        }}
        title="Scanner QR Presensi"
        maxHeight="92vh"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "4px 0 16px" }}>
          {/* A. Dropdown Sesi Presensi Aktif & Kartu Detail Sesi */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "14px",
              border: "1px solid rgba(31, 75, 93, 0.1)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <label
                htmlFor="session-select"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#1F4B5D",
                }}
              >
                Pilih Sesi Presensi Aktif:
              </label>

              {/* Badge Indikator Tipe Sesi */}
              {selectedSessionObj && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    backgroundColor: isProdiSession ? "rgba(124, 58, 237, 0.12)" : "rgba(14, 165, 233, 0.12)",
                    color: isProdiSession ? "#6D28D9" : "#0369A1",
                    border: `1px solid ${isProdiSession ? "rgba(124, 58, 237, 0.25)" : "rgba(14, 165, 233, 0.25)"}`,
                  }}
                >
                  {isProdiSession ? <GraduationCap size={13} /> : <Users size={13} />}
                  <span>{attendanceKeterangan}</span>
                </span>
              )}
            </div>

            <select
              id="session-select"
              value={selectedSessionId || ""}
              onChange={(e) => {
                const sId = e.target.value ? Number(e.target.value) : null;
                setSelectedSessionId(sId);
                if (sId) {
                  refreshAttendanceCounts(sId, groupMaba, mentoredGroupIds);
                }
              }}
              disabled={activeSessions.length === 0}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1.5px solid rgba(31, 75, 93, 0.2)",
                backgroundColor: activeSessions.length === 0 ? "#F1F5F9" : "#FAFAFA",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#1F1E19",
                outline: "none",
                cursor: activeSessions.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {activeSessions.length === 0 ? (
                <option value="">Tidak ada sesi aktif saat ini</option>
              ) : (
                activeSessions.map((sess) => {
                  const startVal = sess.startSessions || sess.start_sessions;
                  const timeFormatted = formatSessionTime(startVal);
                  return (
                    <option key={sess.id} value={sess.id}>
                      {sess.name} ({timeFormatted})
                    </option>
                  );
                })
              )}
            </select>

            {/* Alert jika tidak ada sesi aktif saat ini */}
            {activeSessions.length === 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#B45309",
                  fontSize: "0.78rem",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>Saat ini tidak ada sesi kegiatan yang aktif sesuai jadwal (WIB). Fitur presensi hanya dapat digunakan saat sesi berlangsung.</span>
              </div>
            )}

            {/* Detail Kartu Sesi Terpilih (Menampilkan Waktu Selesai Presensi) */}
            {selectedSessionObj && (() => {
              const startVal = selectedSessionObj.startSessions || selectedSessionObj.start_sessions;
              const endVal = selectedSessionObj.endSessions || selectedSessionObj.end_sessions;
              return (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "12px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(31, 75, 93, 0.05)",
                    border: "1px solid rgba(31, 75, 93, 0.12)",
                    fontSize: "0.78rem",
                    color: "#1F4B5D",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={13} color="#1F4B5D" />
                    <span>
                      Tanggal: <strong>{formatSessionDate(startVal)}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={13} color="#1F4B5D" />
                    <span>
                      Waktu Mulai: <strong>{formatSessionTime(startVal)}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={13} color="#1F4B5D" />
                    <span>
                      Waktu Selesai: <strong>{formatSessionTime(endVal)}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Shield size={13} color="#0F766E" />
                    <span>
                      Toleransi: <strong>{selectedSessionObj.toleransi ?? 0} menit</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: isProdiSession ? "rgba(124, 58, 237, 0.12)" : "rgba(14, 165, 233, 0.12)",
                      color: isProdiSession ? "#6D28D9" : "#0369A1",
                      fontWeight: 700,
                    }}
                  >
                    {isProdiSession ? <GraduationCap size={12} /> : <Users size={12} />}
                    <span>
                      Keterangan: <strong>{attendanceKeterangan}</strong>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* B. Banner Kewenangan Mentor */}
          <div
            style={{
              backgroundColor: isProdiSession ? "rgba(124, 58, 237, 0.08)" : "rgba(15, 118, 110, 0.08)",
              border: `1px solid ${isProdiSession ? "rgba(124, 58, 237, 0.2)" : "rgba(15, 118, 110, 0.2)"}`,
              borderRadius: "14px",
              padding: "10px 14px",
              fontSize: "0.78rem",
              color: "#1F1E19",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "3px" }}>
              {isProdiSession ? <GraduationCap size={15} color="#7C3AED" /> : <Users size={15} color="#0F766E" />}
              <span style={{ color: isProdiSession ? "#6D28D9" : "#0F766E" }}>
                {isProdiSession ? "Kewenangan Presensi Prodi" : "Kewenangan Presensi Kelompok"}
              </span>
            </div>
            <div style={{ fontSize: "0.74rem", color: "rgba(31, 75, 93, 0.85)", lineHeight: 1.4 }}>
              {isProdiSession ? (
                <span>
                  Sesi ini adalah presensi prodi. Anda hanya berhak memindai mahasiswa prodi binaan:{" "}
                  <strong>{mentorAllowedProdis.join(", ") || user?.prodi || "Prodi Anda"}</strong>.
                </span>
              ) : (
                <span>
                  Sesi ini adalah presensi kelompok. Anda hanya berhak memindai mahasiswa kelompok binaan:{" "}
                  <strong>{mentoredGroupNames}</strong>.
                </span>
              )}
            </div>
          </div>

          {/* C. Viewfinder Scanner QR Code */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              padding: "14px",
              border: "1px solid rgba(31, 75, 93, 0.12)",
              boxShadow: "0 4px 16px rgba(31, 75, 93, 0.04)",
            }}
          >
            {/* Header Kamera Bar (Kamera Aktif & Input Manual Switcher) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: scannerActive ? "#10B981" : (cameraError ? "#EF4444" : "#F59E0B"),
                    display: "inline-block",
                    boxShadow: scannerActive ? "0 0 8px #10B981" : "none",
                  }}
                />
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D" }}>
                  {scannerActive ? "Kamera Scanner Aktif" : (cameraError ? "Kamera Terkendala" : "Menghubungkan Kamera...")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "#FFFFFF",
                  color: "#1F4B5D",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {showManualInput ? "Tutup Manual NIM" : "Input Manual NIM"}
              </button>
            </div>

            {/* Input Manual NIM Form */}
            {showManualInput && (
              <form
                onSubmit={handleManualSubmit}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.05)",
                  padding: "10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(31, 75, 93, 0.12)",
                }}
              >
                <input
                  type="text"
                  placeholder="Masukkan NIM Mahasiswa..."
                  value={manualNim}
                  onChange={(e) => setManualNim(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isProcessingScan || !manualNim.trim()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    opacity: isProcessingScan || !manualNim.trim() ? 0.6 : 1,
                  }}
                >
                  Presensi
                </button>
              </form>
            )}

            {/* Viewfinder Video Kamera */}
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "300px",
                backgroundColor: "#000000",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "10px",
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "300px",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Animasi Reticle Frame Laser saat scanner aktif */}
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
                      width: "220px",
                      height: "220px",
                      border: "2px solid rgba(104, 207, 235, 0.7)",
                      borderRadius: "16px",
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.32)",
                      position: "relative",
                    }}
                  >
                    <span style={{ position: "absolute", top: "-2px", left: "-2px", width: "24px", height: "24px", borderTop: "4px solid #68CFEB", borderLeft: "4px solid #68CFEB", borderTopLeftRadius: "12px" }} />
                    <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "24px", height: "24px", borderTop: "4px solid #68CFEB", borderRight: "4px solid #68CFEB", borderTopRightRadius: "12px" }} />
                    <span style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "24px", height: "24px", borderBottom: "4px solid #68CFEB", borderLeft: "4px solid #68CFEB", borderBottomLeftRadius: "12px" }} />
                    <span style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "24px", height: "24px", borderBottom: "4px solid #68CFEB", borderRight: "4px solid #68CFEB", borderBottomRightRadius: "12px" }} />
                  </div>
                </div>
              )}

              {/* Layar Fallback jika kamera belum menyala / terkendala izin */}
              {!scannerActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 16px",
                    textAlign: "center",
                    zIndex: 6,
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: cameraError ? "rgba(239, 68, 68, 0.08)" : "rgba(31, 75, 93, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      boxShadow: cameraError ? "0 0 0 6px rgba(239, 68, 68, 0.15)" : "0 0 0 6px rgba(104, 207, 235, 0.15)",
                    }}
                  >
                    {cameraError ? <AlertTriangle size={28} color="#EF4444" /> : <Camera size={28} color="#1F4B5D" />}
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F1E19", margin: "0 0 6px 0" }}>
                    {cameraError ? "Izin Kamera Terkendala" : "Menghubungkan Kamera HP..."}
                  </h3>

                  <p style={{ fontSize: "0.78rem", lineHeight: 1.45, color: "rgba(31, 75, 93, 0.8)", margin: "0 0 16px 0", maxWidth: "290px" }}>
                    {cameraError || "Browser sedang mengaktifkan scanner kamera. Harap ketuk 'Izinkan' (Allow) jika muncul permintaan izin kamera pada browser."}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px",
                        borderRadius: "12px",
                        backgroundColor: "#1F4B5D",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(31, 75, 93, 0.2)",
                      }}
                    >
                      <RefreshCw size={16} />
                      <span>Minta Izin & Aktifkan Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px",
                        borderRadius: "12px",
                        backgroundColor: "#0284C7",
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(2, 132, 199, 0.2)",
                      }}
                    >
                      <Camera size={16} />
                      <span>📸 Ambil Foto QR (Kamera HP Langsung)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay Loader jika sedang memverifikasi scan */}
              {isProcessingScan && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#68CFEB",
                    gap: "10px",
                    zIndex: 20,
                  }}
                >
                  <RefreshCw size={32} className="animate-spin" />
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(31, 75, 93, 0.7)",
                  margin: 0,
                  flex: 1,
                }}
              >
                Arahkan kamera ke QR Code maba. Hasil presensi akan langsung muncul di pop-up layar.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(2, 132, 199, 0.1)",
                  color: "#0284C7",
                  border: "1px solid rgba(2, 132, 199, 0.2)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Camera size={13} />
                <span>Foto Kamera HP</span>
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* 6. Modal Pop-Up Hasil Presensi Instan (Bebas Scroll & Auto-Resume) */}
      <ScanResultModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        data={modalResultData}
        autoCloseSeconds={4}
      />

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
                    const timeVal = item.scannedAt || item.createdAt;
                    const scanTimeStr = timeVal
                      ? new Date(timeVal).toLocaleTimeString("id-ID", {
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
                  if (activeSessions.length > 0 && !activeSessions.some((s) => s.id === selectedSessionId)) {
                    setSelectedSessionId(activeSessions[0].id);
                  }
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
