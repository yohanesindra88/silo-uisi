"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  Shield,
  ShieldCheck,
  RefreshCw,
  Users,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { LiveQrScanner, scanImageFileWithJsQR } from "@/utils/qr-scanner";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { getAllowedProdisForMentor } from "@/config/attendance";
import { ScanResultModal, ScanResultData } from "@/components/scanner/ScanResultModal";

export interface SessionItem {
  id: number;
  name: string;
  attendanceType?: string;
  attendance_type?: string;
  start_sessions?: string;
  end_sessions?: string;
  startSessions?: string;
  endSessions?: string;
  toleransi: number;
  is_active?: boolean;
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

export interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  mentored_groups?: Array<{ group_id: number; group_name: string }>;
}

export interface ScanResult {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  mabaNama?: string;
  nim?: string;
  prodi?: string;
  kelompok?: string;
  time?: string;
  status?: string;
  allowedProdis?: string[];
}

export interface QrAttendanceScannerProps {
  expectedRole?: "mentor" | "admin" | "panitia" | "any";
  pageTitle?: string;
}

export default function QrAttendanceScanner({
  expectedRole = "any",
  pageTitle = "Scanner QR Presensi",
}: QrAttendanceScannerProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sesi
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | "">("");

  // Izin Kamera & Scanner State
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Modal Pop-Up Hasil Scan
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [modalResultData, setModalResultData] = useState<ScanResultData | null>(null);

  const [recentScans, setRecentScans] = useState<
    Array<{ nim: string; nama: string; prodi?: string; kelompok?: string; time: string; status: string }>
  >([]);

  // Manual Input Fallback
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualNim, setManualNim] = useState("");

  const liveScannerRef = useRef<LiveQrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        // Nada sukses ceria (C6 -> G6)
        osc.type = "sine";
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
        osc.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Nada gagal / peringatan
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch { }
  }, []);

  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  // 1. Ambil data sesi & profil pengguna
  const loadInitialData = useCallback(async () => {
    try {
      const [meRes, sessRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/sessions?active=true"),
      ]);

      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const meData = await meRes.json();
      if (meData.success && meData.user) {
        const user = meData.user;
        const role = String(user.role).toLowerCase();

        // Validasi akses sesuai role
        if (expectedRole === "mentor" && role !== "mentor" && role !== "admin" && role !== "panitia") {
          router.replace(`/${role}`);
          return;
        } else if (expectedRole === "admin" && role !== "admin" && role !== "panitia") {
          router.replace(`/${role}`);
          return;
        }

        setCurrentUser(user);
      } else {
        router.replace("/login");
        return;
      }

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const rawSessions: SessionItem[] = sessData.data || [];
        const now = new Date();
        const activeSessions = rawSessions.filter((s: SessionItem) => {
          const startVal = s.startSessions || s.start_sessions;
          const endVal = s.endSessions || s.end_sessions;
          if (!startVal || !endVal) return false;
          return now >= new Date(startVal) && now <= new Date(endVal);
        });

        setSessions(activeSessions);
        if (activeSessions.length > 0) {
          setSelectedSessionId(activeSessions[0].id);
        } else {
          setSelectedSessionId("");
        }
      }
    } catch (err) {
      console.error("Gagal inisialisasi data scanner:", err);
    } finally {
      setLoading(false);
    }
  }, [router, expectedRole]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInitialData().then(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [loadInitialData]);

  // Sesi yang dipilih
  const selectedSessionObj = sessions.find((s) => s.id === selectedSessionId);
  const isProdiSession = (selectedSessionObj?.attendance_type || selectedSessionObj?.attendanceType) === "prodi";
  const attendanceKeterangan = isProdiSession ? "Prodi" : "Kelompok";

  // Peran Pengguna
  const isSupervisor =
    currentUser && (currentUser.role === "admin" || currentUser.role === "panitia");
  const isMentor = currentUser && currentUser.role === "mentor";

  const mentorAllowedProdis = isMentor ? getAllowedProdisForMentor(currentUser.prodi || undefined) : [];

  // 2. Helper Penanganan Modal Hasil Scan & Jeda Scanner
  const handleCloseResultModal = useCallback(() => {
    setIsResultModalOpen(false);
    // Lanjutkan scanning dengan jeda aman agar tidak membaca ulang QR yang sama
    setTimeout(() => {
      liveScannerRef.current?.resume();
    }, 350);
  }, []);

  const triggerScanResult = useCallback((resultData: ScanResultData) => {
    setScanResult(resultData as ScanResult);
    setModalResultData(resultData);
    setIsResultModalOpen(true);
    // Jeda pembacaan frame saat modal pop-up tampil di layar
    liveScannerRef.current?.pause();
  }, []);

  // 3. Fungsi Memproses Hasil Scan QR
  const handleProcessScan = async (qrTokenOrNim: string) => {
    const cleanToken = String(qrTokenOrNim || "").trim();
    if (!cleanToken) return;

    // Debounce scan beruntun dari token yang sama dalam jeda 3 detik
    const now = Date.now();
    if (cleanToken === lastScannedRef.current.code && now - lastScannedRef.current.time < 3000) {
      return;
    }
    lastScannedRef.current = { code: cleanToken, time: now };

    if (isProcessing) return;

    if (!selectedSessionId || sessions.length === 0) {
      playBeep(false);
      triggerScanResult({
        type: "warning",
        title: "Tidak Ada Sesi Aktif",
        message: "Saat ini tidak ada sesi kegiatan yang aktif sesuai jadwal. Presensi ditutup.",
      });
      return;
    }

    setIsProcessing(true);
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
        const status = result.data?.status || "Hadir";
        const maba = result.data?.maba;
        const mabaNama = maba?.nama || result.mabaName || "Mahasiswa";
        const nim = maba?.nim || "-";
        const prodi = maba?.prodi || "-";
        const kelompok = maba?.group?.name || "-";

        triggerScanResult({
          type: status === "Terlambat" ? "warning" : "success",
          title: status === "Terlambat" ? "Presensi Diterima (Terlambat)" : "Presensi Berhasil (Tepat Waktu)",
          message: status === "Terlambat"
            ? "Mahasiswa hadir melebihi batas waktu toleransi yang ditetapkan."
            : "Mahasiswa tercatat hadir tepat waktu sesuai jadwal kegiatan.",
          mabaNama,
          nim,
          prodi,
          kelompok,
          status,
          time: timeStr,
          sessionName: currentSessionName,
        });

        setRecentScans((prev) => [
          { nim, nama: mabaNama, prodi, kelompok, time: timeStr, status },
          ...prev.slice(0, 9),
        ]);
      } else if (result.code === "ALREADY_ATTENDED") {
        playBeep(false);
        const maba = result.data?.maba;
        const mabaNama = maba?.nama || "Mahasiswa";
        const nim = maba?.nim || "-";
        const prodi = maba?.prodi || "-";
        const kelompok = maba?.group?.name || "-";

        triggerScanResult({
          type: "info",
          title: "Sudah Presensi Sebelumnya",
          message: result.message || "Mahasiswa ini telah tercatat hadir pada sesi yang dipilih.",
          mabaNama,
          nim,
          prodi,
          kelompok,
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "UNAUTHORIZED_GROUP") {
        playBeep(false);
        const maba = result.data?.maba;
        triggerScanResult({
          type: "error",
          title: "Di Luar Negara",
          message: result.message || "Mahasiswa ini tidak terdaftar di dalam Negara Anda.",
          mabaNama: maba?.nama,
          nim: maba?.nim,
          prodi: maba?.prodi,
          kelompok: maba?.group?.name,
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "UNAUTHORIZED_PRODI") {
        playBeep(false);
        const maba = result.data?.maba;
        triggerScanResult({
          type: "error",
          title: "Di Luar Kewenangan Prodi",
          message: result.message || "Sebagai mentor prodi ini, Anda tidak memiliki izin untuk memindai prodi mahasiswa terkait.",
          mabaNama: maba?.nama,
          nim: maba?.nim,
          prodi: maba?.prodi,
          kelompok: maba?.group?.name,
          allowedProdis: result.data?.allowedProdis,
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "SESSION_NOT_STARTED" || result.code === "SESSION_ENDED") {
        playBeep(false);
        triggerScanResult({
          type: "warning",
          title: result.code === "SESSION_NOT_STARTED" ? "Sesi Belum Dimulai" : "Sesi Telah Berakhir",
          message: result.message || "Sesi kegiatan belum dimulai atau telah ditutup.",
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else if (result.code === "USER_NOT_FOUND") {
        playBeep(false);
        triggerScanResult({
          type: "error",
          title: "Mahasiswa Tidak Ditemukan",
          message: result.message || `Data QR/NIM "${cleanToken}" tidak terdaftar di sistem.`,
          time: timeStr,
          sessionName: currentSessionName,
        });
      } else {
        playBeep(false);
        triggerScanResult({
          type: "error",
          title: "Presensi Gagal",
          message: result.message || "Terjadi kendala saat memproses presensi QR.",
          time: timeStr,
          sessionName: currentSessionName,
        });
      }
    } catch (err) {
      console.error("Gagal memproses presensi:", err);
      playBeep(false);
      triggerScanResult({
        type: "error",
        title: "Koneksi Bermasalah",
        message: "Tidak dapat terhubung ke server presensi. Silakan periksa jaringan Anda.",
        time: new Date().toLocaleTimeString("id-ID"),
        sessionName: selectedSessionObj?.name,
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  const handleProcessScanRef = useRef(handleProcessScan);
  useEffect(() => {
    handleProcessScanRef.current = handleProcessScan;
  });

  // 4. Meminta Izin Kamera dan Menjalankan Scanner Live via jsQR
  const requestCameraAccess = useCallback(async () => {
    setPermissionError(null);

    if (typeof window !== "undefined") {
      const isSecure = window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isSecure) {
        setPermissionError(
          "Browser HP membatasi kamera live streaming di jaringan HTTP lokal (bukan HTTPS). Gunakan tombol 'Ambil Foto QR (Kamera HP Langsung)' di bawah ini untuk memindai langsung menggunakan kamera HP Anda."
        );
        return;
      }
    }

    try {
      if (!videoRef.current) return;

      if (!liveScannerRef.current) {
        liveScannerRef.current = new LiveQrScanner(videoRef.current, (decodedText) => {
          handleProcessScanRef.current(decodedText);
        });
      }

      await liveScannerRef.current.start();
      setIsScanning(true);
      try {
        localStorage.setItem("silo_camera_always_allowed", "true");
      } catch {}
      setPermissionError(null);
    } catch (err: unknown) {
      console.warn("Gagal inisialisasi scanner live jsQR:", err);
      setIsScanning(false);

      const errObj = err as { name?: string; message?: string };
      const errStr = String(errObj?.name || errObj?.message || err);
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        setPermissionError(
          "Izin akses kamera ditolak oleh browser/sistem HP. Silakan buka Pengaturan Izin Situs pada browser Anda, ubah izin kamera menjadi 'Selalu Izinkan' (Always Allow), lalu ketuk tombol 'Minta Izin & Buka Kamera' di bawah."
        );
      } else if (errStr.includes("NotFoundError") || errStr.includes("DevicesNotFoundError")) {
        setPermissionError("Kamera tidak terdeteksi pada perangkat ini.");
      } else if (errStr.includes("NotReadableError") || errStr.includes("TrackStartError")) {
        setPermissionError(
          "Kamera sedang digunakan oleh aplikasi lain atau sistem HP sedang sibuk. Silakan tutup aplikasi kamera lain atau gunakan tombol 'Ambil Foto QR'."
        );
      } else {
        setPermissionError(
          errObj?.message || "Gagal mengakses kamera scanner. Pastikan browser diizinkan mengakses kamera atau gunakan fitur 'Ambil Foto QR'."
        );
      }
    }
  }, []);

  // 5. Query Permission Otomatis ("Always Allow" Detection & Listener)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      try {
        navigator.permissions
          .query({ name: "camera" as PermissionName })
          .then((permissionStatus) => {
            if (permissionStatus.state === "granted") {
              requestCameraAccess();
            }

            permissionStatus.onchange = () => {
              if (permissionStatus.state === "granted") {
                requestCameraAccess();
              }
            };
          })
          .catch(() => {
            // Browser tidak mengizinkan query camera permission
          });
      } catch {}
    }
  }, [requestCameraAccess]);

  // Scan via foto kamera HP langsung menggunakan jsQR 4-Pass Multi-Algorithm
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      if (liveScannerRef.current?.scanning) {
        liveScannerRef.current.stop();
        setIsScanning(false);
      }

      const decodedText = await scanImageFileWithJsQR(file);
      handleProcessScanRef.current(decodedText);
    } catch (err: unknown) {
      console.warn("Gagal scan dari foto via jsQR:", err);
      playBeep(false);
      const errObj = err as { message?: string };
      triggerScanResult({
        type: "error",
        title: "QR Tidak Terdeteksi",
        message: errObj?.message || "Tidak dapat mendeteksi QR Code dari foto. Pastikan posisi tegak, jelas, dan pencahayaan cukup.",
        time: new Date().toLocaleTimeString("id-ID"),
        sessionName: selectedSessionObj?.name,
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      requestCameraAccess();
    }, 300);
    return () => clearTimeout(timer);
  }, [requestCameraAccess]);

  useEffect(() => {
    return () => {
      if (liveScannerRef.current) {
        liveScannerRef.current.stop();
        liveScannerRef.current = null;
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNim.trim()) return;
    handleProcessScan(manualNim.trim());
    setManualNim("");
  };

  if (loading) {
    return <LoadingScreen message="Memuat Scanner Presensi..." />;
  }

  const appRole = isSupervisor ? "admin" : "mentor";

  return (
    <MobileShell
      title={pageTitle}
      role={appRole}
      user={currentUser ? { nama: currentUser.nama, role: currentUser.role, nim: currentUser.nim } : undefined}
    >
      {/* ======================================================== */}
      {/* 🛡️ BANNER KHUSUS: MODE SUPERVISOR (PANITIA & ADMIN)      */}
      {/* ======================================================== */}
      {isSupervisor && (
        <div
          style={{
            background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
            borderRadius: "18px",
            padding: "16px 18px",
            marginBottom: "16px",
            color: "#FFFFFF",
            boxShadow: "0 6px 20px rgba(31, 75, 93, 0.18)",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} color="#68CFEB" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Mode Panitia: Akses Penuh / Universal Scanner
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  backgroundColor: "#F59E0B",
                  color: "#1F1E19",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                }}
              >
                Akses Supervisor
              </span>
            </div>
            <p
              style={{
                fontSize: "0.76rem",
                lineHeight: 1.45,
                margin: "4px 0 0 0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Anda memiliki akses supervisor untuk memindai seluruh mahasiswa baru di semua jenis sesi (baik sesi berbasis <strong>Kelompok</strong> maupun <strong>Prodi</strong>). Keterangan sesi terpilih: <strong>{attendanceKeterangan}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HEADER PEMILIHAN SESI & INDIKATOR TIPE SESI              */}
      {/* ======================================================== */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "16px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D" }}>
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
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : "")}
          disabled={sessions.length === 0}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1.5px solid rgba(31, 75, 93, 0.2)",
            backgroundColor: sessions.length === 0 ? "#F1F5F9" : "#FAFAFA",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#1F1E19",
            outline: "none",
            cursor: sessions.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {sessions.length === 0 ? (
            <option value="">Tidak ada sesi aktif saat ini</option>
          ) : (
            sessions.map((sess) => {
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

        {sessions.length === 0 && (
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

        {selectedSessionObj && (() => {
          const startVal = selectedSessionObj.startSessions || selectedSessionObj.start_sessions;
          const endVal = selectedSessionObj.endSessions || selectedSessionObj.end_sessions;
          return (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "12px",
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "12px",
                backgroundColor: "rgba(31, 75, 93, 0.05)",
                border: "1px solid rgba(31, 75, 93, 0.12)",
                fontSize: "0.78rem",
                color: "#1F4B5D",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={14} color="#1F4B5D" />
                <span>
                  Tanggal: <strong>{formatSessionDate(startVal)}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} color="#1F4B5D" />
                <span>
                  Waktu Mulai: <strong>{formatSessionTime(startVal)}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} color="#1F4B5D" />
                <span>
                  Waktu Selesai: <strong>{formatSessionTime(endVal)}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={14} color="#0F766E" />
                <span>
                  Toleransi: <strong>{selectedSessionObj.toleransi ?? 0} menit</strong>
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  backgroundColor: isProdiSession ? "rgba(124, 58, 237, 0.12)" : "rgba(14, 165, 233, 0.12)",
                  color: isProdiSession ? "#6D28D9" : "#0369A1",
                  fontWeight: 700,
                }}
              >
                {isProdiSession ? <GraduationCap size={13} /> : <Users size={13} />}
                <span>
                  Keterangan Presensi: <strong>{attendanceKeterangan}</strong>
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ======================================================== */}
      {/* 📷 VIEWFINDER SCANNER QR CODE                            */}
      {/* ======================================================== */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "22px",
          padding: "16px",
          marginBottom: "16px",
          border: "1px solid rgba(31, 75, 93, 0.12)",
          boxShadow: "0 6px 20px rgba(31, 75, 93, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isScanning ? "#10B981" : (permissionError ? "#EF4444" : "#F59E0B"),
                display: "inline-block",
                boxShadow: isScanning ? "0 0 8px #10B981" : "none",
              }}
            />
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D" }}>
              {isScanning ? "Kamera Scanner Aktif" : (permissionError ? "Kamera Terkendala" : "Menghubungkan Kamera...")}
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

        {/* Viewfinder Video Kamera jsQR */}
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: "320px",
            backgroundColor: "#000000",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "12px",
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
              minHeight: "320px",
              objectFit: "cover",
              display: "block",
            }}
          />

          {isScanning && !isProcessing && (
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
                  width: "230px",
                  height: "230px",
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

          {!isScanning && (
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
                  backgroundColor: permissionError ? "rgba(239, 68, 68, 0.08)" : "rgba(31, 75, 93, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  boxShadow: permissionError ? "0 0 0 6px rgba(239, 68, 68, 0.15)" : "0 0 0 6px rgba(104, 207, 235, 0.15)",
                }}
              >
                {permissionError ? <AlertTriangle size={28} color="#EF4444" /> : <Camera size={28} color="#1F4B5D" />}
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F1E19", margin: "0 0 6px 0" }}>
                {permissionError ? "Izin Kamera Terkendala" : "Menghubungkan Kamera Scanner..."}
              </h3>

              <p style={{ fontSize: "0.78rem", lineHeight: 1.45, color: "rgba(31, 75, 93, 0.8)", margin: "0 0 16px 0", maxWidth: "300px" }}>
                {permissionError || "Browser sedang mengaktifkan feed kamera. Harap ketuk 'Izinkan' (Allow) jika muncul notifikasi izin pada browser."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
                <button
                  type="button"
                  onClick={requestCameraAccess}
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
                  <span>Minta Izin & Buka Kamera</span>
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

          {isProcessing && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(31, 75, 93, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.95rem",
                gap: "8px",
                zIndex: 10,
                flexDirection: "column",
              }}
            >
              <RefreshCw size={24} className="animate-spin" />
              <span>Memproses Data Presensi...</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileScan}
        />

        {/* ======================================================== */}
        {/* 🎓 DAFTAR PRODI YANG BERHAK DIPINDAI (UNTUK MENTOR)      */}
        {/* ======================================================== */}
        {isMentor && isProdiSession && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "rgba(124, 58, 237, 0.05)",
              border: "1.5px dashed rgba(124, 58, 237, 0.25)",
              marginTop: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <GraduationCap size={16} color="#6D28D9" />
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#6D28D9" }}>
                Kewenangan Sesi: Prodi
              </span>
            </div>

            <div style={{ fontSize: "0.75rem", color: "#1F1E19", marginBottom: "8px" }}>
              Prodi Anda: <strong>{currentUser?.prodi || "Tidak Tercantum"}</strong>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.8)", fontWeight: 600 }}>
                Berhak memindai maba dari Program Studi:
              </span>
              {mentorAllowedProdis.map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#6D28D9",
                    color: "#FFFFFF",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  ✓ {p}
                </span>
              ))}
            </div>

            <div style={{ fontSize: "0.7rem", color: "rgba(109, 40, 217, 0.8)", marginTop: "6px" }}>
              💡 Sesi ini berbasis Prodi. Mahasiswa di luar daftar program studi di atas tidak dapat dipindai oleh akun Anda.
            </div>
          </div>
        )}

        {/* Info Negara untuk Sesi GROUP (Mentor) */}
        {isMentor && !isProdiSession && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "rgba(14, 165, 233, 0.05)",
              border: "1.5px dashed rgba(14, 165, 233, 0.25)",
              marginTop: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Users size={16} color="#0284C7" />
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0369A1" }}>
                Kewenangan Sesi: Kelompok
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.8)", fontWeight: 600 }}>
                Negara yang Berhak Anda Pindai:
              </span>
              {currentUser?.mentored_groups && currentUser.mentored_groups.length > 0 ? (
                currentUser.mentored_groups.map((g) => (
                  <span
                    key={g.group_id}
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#0284C7",
                      color: "#FFFFFF",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    ✓ {g.group_name}
                  </span>
                ))
              ) : (
                <em style={{ fontSize: "0.72rem", color: "#DC2626" }}>Belum ada Negara</em>
              )}
            </div>

            <div style={{ fontSize: "0.7rem", color: "rgba(3, 105, 161, 0.85)" }}>
              💡 Sesi ini berbasis Kelompok. Mahasiswa di luar Negara Anda tidak dapat dipindai oleh akun Anda.
            </div>
          </div>
        )}
      </div>

      {/* Input Manual NIM Fallback */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "16px",
            border: "1px solid rgba(31, 75, 93, 0.12)",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D", marginBottom: "8px" }}>
            Input Presensi Manual (NIM / Token)
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Contoh: 302261001"
              value={manualNim}
              onChange={(e) => setManualNim(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1.5px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                backgroundColor: "#1F4B5D",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Catat
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* KARTU KONFIRMASI IDENTITAS LENGKAP & HASIL SCAN          */}
      {/* ======================================================== */}
      {scanResult && (
        <div
          style={{
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "18px",
            backgroundColor:
              scanResult.type === "success"
                ? "rgba(16, 185, 129, 0.08)"
                : scanResult.type === "warning"
                  ? "rgba(245, 158, 11, 0.08)"
                  : scanResult.type === "info"
                    ? "rgba(104, 207, 235, 0.12)"
                    : "rgba(239, 68, 68, 0.08)",
            border: `1.5px solid ${scanResult.type === "success"
                ? "rgba(16, 185, 129, 0.35)"
                : scanResult.type === "warning"
                  ? "rgba(245, 158, 11, 0.35)"
                  : scanResult.type === "info"
                    ? "rgba(104, 207, 235, 0.35)"
                    : "rgba(239, 68, 68, 0.35)"
              }`,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {scanResult.type === "success" && <CheckCircle2 size={22} color="#059669" />}
              {scanResult.type === "warning" && <AlertTriangle size={22} color="#D97706" />}
              {scanResult.type === "info" && <Info size={22} color="#0284C7" />}
              {scanResult.type === "error" && <AlertTriangle size={22} color="#DC2626" />}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  color:
                    scanResult.type === "success"
                      ? "#065F46"
                      : scanResult.type === "warning"
                        ? "#92400E"
                        : scanResult.type === "info"
                          ? "#0369A1"
                          : "#991B1B",
                }}
              >
                {scanResult.title}
              </span>
            </div>
            {scanResult.time && (
              <span style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.6)", fontWeight: 600 }}>
                {scanResult.time}
              </span>
            )}
          </div>

          <div style={{ fontSize: "0.84rem", lineHeight: 1.45, color: "rgba(31, 75, 93, 0.9)" }}>
            {scanResult.message}
          </div>

          {/* Kartu Identitas Lengkap Maba (Nama, NIM, Prodi, Kelompok) */}
          {scanResult.mabaNama && (
            <div
              style={{
                marginTop: "4px",
                padding: "14px",
                borderRadius: "14px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(31, 75, 93, 0.1)",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1F1E19" }}>
                    {scanResult.mabaNama}
                  </div>
                  {scanResult.nim && (
                    <div style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.7)", fontFamily: "monospace", marginTop: "2px" }}>
                      NIM: <strong>{scanResult.nim}</strong>
                    </div>
                  )}
                </div>

                {scanResult.status && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: scanResult.status === "Hadir" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: scanResult.status === "Hadir" ? "#059669" : "#D97706",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                    }}
                  >
                    {scanResult.status}
                  </span>
                )}
              </div>

              {/* Detail Prodi & Kelompok */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(31, 75, 93, 0.08)",
                  fontSize: "0.78rem",
                }}
              >
                <div
                  style={{
                    padding: isProdiSession ? "6px 8px" : "0",
                    borderRadius: isProdiSession ? "8px" : "0",
                    backgroundColor: isProdiSession ? "rgba(124, 58, 237, 0.08)" : "transparent",
                    border: isProdiSession ? "1px solid rgba(124, 58, 237, 0.2)" : "none",
                  }}
                >
                  <span
                    style={{
                      color: isProdiSession ? "#6D28D9" : "rgba(31, 75, 93, 0.65)",
                      display: "block",
                      fontSize: "0.7rem",
                      fontWeight: isProdiSession ? 700 : 500,
                    }}
                  >
                    Program Studi {isProdiSession ? "(Keterangan: Prodi)" : ""}:
                  </span>
                  <strong style={{ color: isProdiSession ? "#5B21B6" : "#1F4B5D" }}>
                    {scanResult.prodi || "-"}
                  </strong>
                </div>

                <div
                  style={{
                    padding: !isProdiSession ? "6px 8px" : "0",
                    borderRadius: !isProdiSession ? "8px" : "0",
                    backgroundColor: !isProdiSession ? "rgba(14, 165, 233, 0.08)" : "transparent",
                    border: !isProdiSession ? "1px solid rgba(14, 165, 233, 0.2)" : "none",
                  }}
                >
                  <span
                    style={{
                      color: !isProdiSession ? "#0369A1" : "rgba(31, 75, 93, 0.65)",
                      display: "block",
                      fontSize: "0.7rem",
                      fontWeight: !isProdiSession ? 700 : 500,
                    }}
                  >
                    Kelompok Mahasiswa : 
                  </span>
                  <strong style={{ color: !isProdiSession ? "#075985" : "#1F4B5D" }}>
                    {scanResult.kelompok || "-"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Riwayat Scan Sesi Ini */}
      {recentScans.length > 0 && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "30px",
            border: "1px solid rgba(31, 75, 93, 0.08)",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D", marginBottom: "10px", textTransform: "uppercase" }}>
            Riwayat Scan Sesi Ini ({recentScans.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentScans.map((sc, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(31, 75, 93, 0.03)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F1E19" }}>{sc.nama}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)" }}>
                    <span style={{ fontFamily: "monospace" }}>{sc.nim}</span> • {sc.prodi || "-"} • {sc.kelompok || "-"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: sc.status === "Hadir" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: sc.status === "Hadir" ? "#059669" : "#D97706",
                    }}
                  >
                    {sc.status}
                  </span>
                  <div style={{ fontSize: "0.68rem", color: "rgba(31, 75, 93, 0.5)", marginTop: "2px" }}>
                    {sc.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🚀 MODAL POP-UP FEEDBACK LANGSUNG HASIL SCAN QR          */}
      {/* ======================================================== */}
      <ScanResultModal
        isOpen={isResultModalOpen}
        onClose={handleCloseResultModal}
        data={modalResultData}
        autoCloseSeconds={4}
      />
    </MobileShell>
  );
}
