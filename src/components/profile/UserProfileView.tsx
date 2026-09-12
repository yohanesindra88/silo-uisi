"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Shield,
  GraduationCap,
  Users,
  Building,
  KeyRound,
  LogOut,
  Edit3,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ClipboardList,
  BarChart2,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Award,
} from "lucide-react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";

export interface UserProfileData {
  id: number;
  nama: string;
  nim?: string;
  username: string;
  role: string;
  fakultas?: string;
  prodi?: string;
  qr_token?: string;
  group?: { id: number; name: string } | null;
  mentored_groups?: Array<{ group_id: number; group_name: string }>;
}

interface UserProfileViewProps {
  expectedRole?: "maba" | "mentor" | "admin" | "panitia";
}

export function UserProfileView({ expectedRole }: UserProfileViewProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // State Edit Profil
  const [isEditing, setIsEditing] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editProdi, setEditProdi] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // State Ganti Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // State Logout Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 1. Ambil data sesi pengguna aktif
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setEditNama(data.user.nama || "");
        setEditFakultas(data.user.fakultas || "");
        setEditProdi(data.user.prodi || "");
      } else {
        router.replace("/login");
      }
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 2. Simpan Pembaruan Profil (Nama, Fakultas, Prodi)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditMessage(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editNama,
          fakultas: editFakultas,
          prodi: editProdi,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setEditMessage({ type: "success", text: "Profil berhasil diperbarui!" });
        setTimeout(() => {
          setIsEditing(false);
          setEditMessage(null);
        }, 1200);
      } else {
        setEditMessage({ type: "error", text: data.message || "Gagal memperbarui profil." });
      }
    } catch (err) {
      setEditMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setEditSaving(false);
    }
  };

  // 3. Ganti Kata Sandi
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Konfirmasi kata sandi tidak cocok." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Kata sandi baru minimal 6 karakter." });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPasswordMessage({ type: "success", text: "Kata sandi berhasil diubah!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordMessage(null);
        }, 1200);
      } else {
        setPasswordMessage({ type: "error", text: data.message || "Gagal mengubah kata sandi." });
      }
    } catch (err) {
      setPasswordMessage({ type: "error", text: "Terjadi kesalahan koneksi server." });
    } finally {
      setPasswordSaving(false);
    }
  };

  // 4. Proses Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (err) {
      console.error("Gagal logout:", err);
      router.replace("/login");
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  const role = user?.role || expectedRole || "maba";
  const isMaba = role === "maba";
  const isMentor = role === "mentor";
  const isAdmin = role === "admin" || role === "panitia";

  // Role Badge Styling
  const roleBadge = isMaba
    ? { text: "MAHASISWA BARU", bg: "rgba(104, 207, 235, 0.2)", color: "#0284C7" }
    : isMentor
    ? { text: "MENTOR PENDAMPING", bg: "rgba(16, 185, 129, 0.15)", color: "#059669" }
    : { text: "PANITIA / ADMIN", bg: "rgba(245, 158, 11, 0.18)", color: "#D97706" };

  // Format Display Kelompok
  const kelompokDisplay = isMaba
    ? user?.group?.name || "Belum Ada Kelompok"
    : isMentor
    ? user?.mentored_groups && user.mentored_groups.length > 0
      ? user.mentored_groups.map((g) => g.group_name).join(", ")
      : user?.group?.name || "Belum Ditugaskan"
    : "Panitia Pengarah & Pelaksana SILO 2026";

  return (
    <MobileShell
      title="Profil Pengguna"
      role={role as any}
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* 1. Header Card Profil Pengguna */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #163744 100%)",
          borderRadius: "22px",
          padding: "22px",
          color: "#FFFFFF",
          marginBottom: "18px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 28px rgba(31, 75, 93, 0.22)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(104, 207, 235, 0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          {/* Avatar Inisial */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "#68CFEB",
              color: "#1F1E19",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              fontWeight: 900,
              boxShadow: "0 4px 14px rgba(104, 207, 235, 0.4)",
              flexShrink: 0,
              border: "3px solid #FFFFFF",
            }}
          >
            {user?.nama ? user.nama.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <div
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                backgroundColor: roleBadge.bg,
                color: roleBadge.color,
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              {roleBadge.text}
            </div>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
              {user?.nama}
            </h2>

            <div style={{ fontSize: "0.8rem", color: "#68CFEB", fontFamily: "monospace", fontWeight: 700 }}>
              {user?.nim ? `NIM: ${user.nim}` : `User: @${user?.username}`}
            </div>
          </div>
        </div>

        {/* Ringkasan Singkat Kelompok & Prodi */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            fontSize: "0.78rem",
          }}
        >
          <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>Cluster:</span>
          <span style={{ color: "#68CFEB", fontWeight: 700 }}>{kelompokDisplay}</span>
        </div>
      </div>

      {/* 2. Informasi Lengkap Identitas (Nama Lengkap, NIM, Kelompok, Fakultas, Prodi) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "18px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} color="#1F4B5D" />
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1F4B5D" }}>
              Data Identitas Resmi
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid rgba(31, 75, 93, 0.2)",
              backgroundColor: isEditing ? "rgba(31, 75, 93, 0.08)" : "#FFFFFF",
              color: "#1F4B5D",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Edit3 size={13} />
            <span>{isEditing ? "Batal" : "Edit Profil"}</span>
          </button>
        </div>

        {/* Tampilan Form Edit / Read Only */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {editMessage && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  backgroundColor: editMessage.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  color: editMessage.type === "success" ? "#065F46" : "#991B1B",
                  fontWeight: 600,
                }}
              >
                {editMessage.text}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Nama Lengkap
              </label>
              <input
                type="text"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(31, 75, 93, 0.25)",
                  fontSize: "0.85rem",
                  color: "#1F1E19",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Fakultas
              </label>
              <input
                type="text"
                value={editFakultas}
                onChange={(e) => setEditFakultas(e.target.value)}
                placeholder="Contoh: Fakultas Teknologi Industri (FTI)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(31, 75, 93, 0.25)",
                  fontSize: "0.85rem",
                  color: "#1F1E19",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                Program Studi (Prodi)
              </label>
              <input
                type="text"
                value={editProdi}
                onChange={(e) => setEditProdi(e.target.value)}
                placeholder="Contoh: S1 Sistem Informasi"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(31, 75, 93, 0.25)",
                  fontSize: "0.85rem",
                  color: "#1F1E19",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={editSaving}
              style={{
                marginTop: "6px",
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: "#1F4B5D",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                opacity: editSaving ? 0.7 : 1,
              }}
            >
              {editSaving ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* 1. Nama Lengkap */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(31, 75, 93, 0.06)" }}>
              <UserIcon size={18} color="#1F4B5D" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                  Nama Lengkap
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F1E19" }}>
                  {user?.nama}
                </div>
              </div>
            </div>

            {/* 2. NIM / NIP */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(31, 75, 93, 0.06)" }}>
              <Shield size={18} color="#1F4B5D" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                  NIM / ID Nomor Induk
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F4B5D", fontFamily: "monospace" }}>
                  {user?.nim || user?.username || "-"}
                </div>
              </div>
            </div>

            {/* 3. Kelompok */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(31, 75, 93, 0.06)" }}>
              <Users size={18} color="#1F4B5D" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                  Kelompok Binaan
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F1E19" }}>
                  {kelompokDisplay}
                </div>
              </div>
            </div>

            {/* 4. Fakultas */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(31, 75, 93, 0.06)" }}>
              <Building size={18} color="#1F4B5D" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                  Fakultas
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F1E19" }}>
                  {user?.fakultas || "-"}
                </div>
              </div>
            </div>

            {/* 5. Program Studi (Prodi) */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <GraduationCap size={18} color="#1F4B5D" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", fontWeight: 700, textTransform: "uppercase" }}>
                  Program Studi (Prodi)
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F1E19" }}>
                  {user?.prodi || "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pintasan Navigasi Fitur Peran */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
        }}
      >
        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D", marginBottom: "12px", textTransform: "uppercase" }}>
          Pintasan Cepat
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {isMaba && (
            <>
              <Link
                href="/maba/card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <QrCode size={18} color="#1F4B5D" />
                  <span>Buka QR Card Maba</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>

              <Link
                href="/maba/tugas"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ClipboardList size={18} color="#1F4B5D" />
                  <span>Daftar Tugas Orientasi</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>
            </>
          )}

          {isMentor && (
            <>
              <Link
                href="/mentor/scan"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <QrCode size={18} color="#1F4B5D" />
                  <span>Buka Scanner QR Kamera</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>

              <Link
                href="/mentor/monitoring"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart2 size={18} color="#1F4B5D" />
                  <span>Monitoring Presensi Maba</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>
            </>
          )}

          {isAdmin && (
            <>
              <Link
                href="/admin/monitoring"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BarChart2 size={18} color="#1F4B5D" />
                  <span>Monitoring Presensi & Ekspor</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>

              <Link
                href="/admin/tugas"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  textDecoration: "none",
                  color: "#1F1E19",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ClipboardList size={18} color="#1F4B5D" />
                  <span>Kelola Tugas Orientasi</span>
                </div>
                <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 4. Pengaturan Keamanan (Ganti Password & Keluar) */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "30px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F4B5D", marginBottom: "4px", textTransform: "uppercase" }}>
          Keamanan & Akun
        </div>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(31, 75, 93, 0.15)",
            backgroundColor: "#FFFFFF",
            color: "#1F1E19",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <KeyRound size={18} color="#1F4B5D" />
            <span>Ganti Kata Sandi</span>
          </div>
          <ChevronRight size={16} color="rgba(31, 75, 93, 0.5)" />
        </button>

        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#DC2626",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginTop: "4px",
          }}
        >
          <LogOut size={18} />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL GANTI KATA SANDI                                   */}
      {/* ======================================================== */}
      {isPasswordModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "22px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F4B5D", margin: "0 0 6px 0" }}>
              Ganti Kata Sandi
            </h3>
            <p style={{ fontSize: "0.78rem", color: "rgba(31, 75, 93, 0.7)", margin: "0 0 16px 0" }}>
              Pastikan kata sandi baru Anda mudah diingat dan minimal 6 karakter.
            </p>

            {passwordMessage && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  marginBottom: "12px",
                  backgroundColor: passwordMessage.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  color: passwordMessage.type === "success" ? "#065F46" : "#991B1B",
                  fontWeight: 600,
                }}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Kata Sandi Lama
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Masukkan kata sandi lama"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Kata Sandi Baru
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimal 6 karakter"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ketik ulang kata sandi baru"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.75rem",
                  color: "#1F4B5D",
                  cursor: "pointer",
                  margin: "4px 0 8px",
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPassword ? "Sembunyikan karakter" : "Tampilkan karakter"}</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
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
                  type="submit"
                  disabled={passwordSaving}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    opacity: passwordSaving ? 0.7 : 1,
                  }}
                >
                  {passwordSaving ? "Menyimpan..." : "Ubah Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI LOGOUT                                  */}
      {/* ======================================================== */}
      {isLogoutModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "22px",
              width: "100%",
              maxWidth: "340px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <LogOut size={24} />
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F1E19", margin: "0 0 6px 0" }}>
              Konfirmasi Keluar
            </h3>
            <p style={{ fontSize: "0.8rem", color: "rgba(31, 75, 93, 0.7)", margin: "0 0 18px 0" }}>
              Apakah Anda yakin ingin keluar dari akun <strong>{user?.nama}</strong>?
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "11px",
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
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  opacity: loggingOut ? 0.7 : 1,
                }}
              >
                {loggingOut ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
