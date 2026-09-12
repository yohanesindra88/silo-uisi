"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  User,
  Shield,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { LiveQrScanner, scanImageFileWithJsQR } from "@/utils/qr-scanner";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface SessionItem {
  id: number;
  name: string;
  start_sessions?: string;
  end_sessions?: string;
  startSessions?: string;
  endSessions?: string;
  toleransi: number;
  is_active?: boolean;
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

interface ScanResult {
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  mabaNama?: string;
  nim?: string;
  time?: string;
  status?: string;
}

export default function MentorScanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sesi
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | "">("");

  // Izin Kamera & Scanner State
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ nim: string; nama: string; time: string; status: string }>>([]);

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
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    } catch {}
  }, []);

  const lastScannedRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  // 1. Ambil data sesi & profil mentor
  const loadInitialData = useCallback(async () => {
    try {
      const [meRes, sessRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/sessions"),
      ]);

      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const meData = await meRes.json();
      if (meData.success && meData.user) {
        if (meData.user.role !== "mentor") {
          router.replace(`/${meData.user.role}`);
          return;
        }
        setCurrentUser(meData.user);
      } else {
        router.replace("/login");
        return;
      }

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const activeSessions = sessData.data || [];
        setSessions(activeSessions);
        if (activeSessions.length > 0) {
          // Prioritaskan sesi yang sedang aktif saat ini jika ada, atau sesi paling baru
          const currentActive = activeSessions.find((s: any) => s.is_active);
          const latestSession = [...activeSessions].sort(
            (a: any, b: any) =>
              new Date(b.startSessions || b.start_sessions || 0).getTime() -
              new Date(a.startSessions || a.start_sessions || 0).getTime()
          )[0];
          setSelectedSessionId(currentActive ? currentActive.id : (latestSession ? latestSession.id : activeSessions[0].id));
        }
      }
    } catch (err) {
      console.error("Gagal inisialisasi data scan mentor:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fungsi Memproses Hasil Scan QR
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

    if (!selectedSessionId) {
      playBeep(false);
      setScanResult({
        type: "warning",
        title: "Pilih Sesi Terlebih Dahulu",
        message: "Silakan pilih sesi kegiatan sebelum memindai presensi.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Getar singkat haptik ponsel jika didukung
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
        const status = result.data?.status || "Hadir";
        const mabaNama = result.data?.maba?.nama || result.mabaName || "Mahasiswa";
        const nim = result.data?.maba?.nim || "-";

        setScanResult({
          type: status === "Terlambat" ? "warning" : "success",
          title: status === "Terlambat" ? "Presensi Diterima (Terlambat)" : "Presensi Berhasil (Tepat Waktu)",
          message: status === "Terlambat"
            ? "Mahasiswa hadir melebihi batas waktu toleransi yang ditetapkan."
            : "Mahasiswa tercatat hadir tepat waktu sesuai jadwal sesi.",
          mabaNama,
          nim,
          status,
          time: timeStr,
        });

        setRecentScans((prev) => [
          { nim, nama: mabaNama, time: timeStr, status },
          ...prev.slice(0, 9),
        ]);
      } else if (result.code === "ALREADY_ATTENDED") {
        playBeep(false);
        const mabaNama = result.data?.maba?.nama || result.mabaName || "Mahasiswa";
        const nim = result.data?.maba?.nim || "-";
        setScanResult({
          type: "info",
          title: "Sudah Presensi Sebelumnya",
          message: result.message || "Mahasiswa ini telah tercatat hadir pada sesi yang dipilih.",
          mabaNama,
          nim,
          time: timeStr,
        });
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
          message: result.message || `Data QR/NIM "${cleanToken}" tidak terdaftar di sistem.`,
          time: timeStr,
        });
      } else {
        playBeep(false);
        setScanResult({
          type: "error",
          title: "Presensi Gagal",
          message: result.message || "Terjadi kendala saat memproses presensi QR.",
          time: timeStr,
        });
      }
    } catch (err) {
      console.error("Gagal memproses presensi:", err);
      playBeep(false);
      setScanResult({
        type: "error",
        title: "Koneksi Bermasalah",
        message: "Tidak dapat terhubung ke server presensi. Silakan periksa jaringan Anda.",
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    }
  };

  // 3. Meminta Izin Kamera dan Menjalankan Scanner Live via jsQR
  const requestCameraAccess = useCallback(async () => {
    setPermissionError(null);

    // Cek Secure Context (Kamera live stream butuh HTTPS atau localhost di HP)
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
          handleProcessScan(decodedText);
        });
      }

      await liveScannerRef.current.start();
      setIsScanning(true);
      setPermissionGranted(true);
      setPermissionError(null);
    } catch (err: any) {
      console.warn("Gagal inisialisasi scanner live jsQR:", err);
      setIsScanning(false);
      setPermissionGranted(false);

      const errStr = String(err?.name || err?.message || err);
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        setPermissionError(
          "Izin akses kamera ditolak oleh browser/sistem HP. Silakan buka Pengaturan Izin Situs pada browser Anda, ubah izin kamera menjadi 'Izinkan' (Allow), lalu ketuk tombol 'Minta Izin & Buka Kamera' di bawah."
        );
      } else if (errStr.includes("NotFoundError") || errStr.includes("DevicesNotFoundError")) {
        setPermissionError("Kamera tidak terdeteksi pada perangkat ini.");
      } else if (errStr.includes("NotReadableError") || errStr.includes("TrackStartError")) {
        setPermissionError(
          "Kamera sedang digunakan oleh aplikasi lain atau sistem HP sedang sibuk. Silakan tutup aplikasi kamera lain atau gunakan tombol 'Ambil Foto QR'."
        );
      } else {
        setPermissionError(
          err?.message || "Gagal mengakses kamera scanner. Pastikan browser diizinkan mengakses kamera atau gunakan fitur 'Ambil Foto QR'."
        );
      }
    }
  }, [handleProcessScan]);

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

      // Memindai foto menggunakan jsQR dengan multi-pass binarization (sangat akurat untuk foto layar monitor!)
      const decodedText = await scanImageFileWithJsQR(file);
      handleProcessScan(decodedText);
    } catch (err: any) {
      console.warn("Gagal scan dari foto via jsQR:", err);
      playBeep(false);
      setScanResult({
        type: "error",
        title: "QR Tidak Terdeteksi",
        message: err?.message || "Tidak dapat mendeteksi QR Code dari foto. Pastikan posisi tegak, jelas, dan pencahayaan cukup.",
        time: new Date().toLocaleTimeString("id-ID"),
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto-request kamera saat halaman dibuka
  useEffect(() => {
    const timer = setTimeout(() => {
      requestCameraAccess();
    }, 400);
    return () => clearTimeout(timer);
  }, [requestCameraAccess]);

  // 4. Hentikan kamera saat unmount
  useEffect(() => {
    return () => {
      if (liveScannerRef.current) {
        liveScannerRef.current.stop();
        liveScannerRef.current = null;
      }
    };
  }, []);

  // 5. Submit Manual NIM
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNim.trim()) return;
    handleProcessScan(manualNim.trim());
    setManualNim("");
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  const selectedSessionObj = sessions.find((s) => s.id === selectedSessionId);

  return (
    <MobileShell
      title="Scanner QR Presensi"
      role="mentor"
      user={currentUser ? { nama: currentUser.nama, role: currentUser.role, nim: currentUser.nim } : undefined}
    >
      {/* Header Info Sesi */}
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
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
          Pilih Sesi Presensi Aktif:
        </label>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1.5px solid rgba(31, 75, 93, 0.2)",
            backgroundColor: "#FAFAFA",
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
              const dateFormatted = formatSessionDate(startVal);
              const timeFormatted = formatSessionTime(startVal);
              return (
                <option key={sess.id} value={sess.id}>
                  {sess.is_active ? "🟢 [AKTIF SEKARANG] " : ""}{sess.name} ({dateFormatted}, {timeFormatted}) - Tol. {sess.toleransi}m
                </option>
              );
            })
          )}
        </select>

        {selectedSessionObj && (() => {
          const startVal = selectedSessionObj.startSessions || selectedSessionObj.start_sessions;
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
                <Shield size={14} color="#0F766E" />
                <span>
                  Toleransi: <strong>{selectedSessionObj.toleransi ?? 0} menit</strong>
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ======================================================== */}
      {/* 🛡️ PERMINTAAN IZIN KAMERA / VIEWFINDER SCANNER           */}
      {/* ======================================================== */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "22px",
          padding: "16px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.12)",
          boxShadow: "0 6px 20px rgba(31, 75, 93, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
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
              {isScanning ? "Kamera Scanner Aktif" : (permissionError ? "Kamera Terkendala" : "Menghubungkan Kamera HP...")}
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
            {showManualInput ? "Tutup Input Manual" : "Input Manual NIM"}
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
          {/* Target Video element untuk jsQR Live Scanner */}
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

          {/* Animasi Scanner Guide Reticle ketika kamera aktif */}
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

          {/* Overlay jika belum scanning atau ada error izin kamera */}
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

        {/* Hidden File Input untuk Ambil Foto Langsung via Kamera HP */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileScan}
        />
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
      {/* KARTU STATUS HASIL SCAN TERAKHIR                         */}
      {/* ======================================================== */}
      {scanResult && (
        <div
          style={{
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "18px",
            backgroundColor:
              scanResult.type === "success"
                ? "rgba(16, 185, 129, 0.08)"
                : scanResult.type === "warning"
                ? "rgba(245, 158, 11, 0.08)"
                : scanResult.type === "info"
                ? "rgba(104, 207, 235, 0.12)"
                : "rgba(239, 68, 68, 0.08)",
            border: `1.5px solid ${
              scanResult.type === "success"
                ? "rgba(16, 185, 129, 0.3)"
                : scanResult.type === "warning"
                ? "rgba(245, 158, 11, 0.3)"
                : scanResult.type === "info"
                ? "rgba(104, 207, 235, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            }`,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {scanResult.type === "success" && <CheckCircle2 size={20} color="#059669" />}
              {scanResult.type === "warning" && <AlertTriangle size={20} color="#D97706" />}
              {scanResult.type === "info" && <Info size={20} color="#0284C7" />}
              {scanResult.type === "error" && <AlertTriangle size={20} color="#DC2626" />}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
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

          <div style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.85)" }}>
            {scanResult.message}
          </div>

          {scanResult.mabaNama && (
            <div
              style={{
                marginTop: "4px",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1F1E19" }}>
                  {scanResult.mabaNama}
                </div>
                {scanResult.nim && (
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontFamily: "monospace" }}>
                    NIM: {scanResult.nim}
                  </div>
                )}
              </div>

              {scanResult.status && (
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    backgroundColor: scanResult.status === "Hadir" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: scanResult.status === "Hadir" ? "#059669" : "#D97706",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                  }}
                >
                  {scanResult.status}
                </span>
              )}
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
                  <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontFamily: "monospace" }}>
                    {sc.nim} • {sc.time}
                  </div>
                </div>
                <span
                  style={{
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
              </div>
            ))}
          </div>
        </div>
      )}
    </MobileShell>
  );
}
