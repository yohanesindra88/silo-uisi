"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Calendar,
  Users,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

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
  toleransi?: number;
}

interface GroupItem {
  id: number;
  name: string;
}

interface AttendanceRow {
  id: string; // mabaId-sessionId
  nim: string;
  nama: string;
  prodi: string;
  groupName: string;
  groupId?: number;
  sessionName: string;
  sessionId: number;
  scanTime: string;
  status: "Hadir" | "Terlambat" | "Tidak Hadir" | "Belum Hadir" | string;
}

const formatDateTimeLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatTimeRange = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return "-";
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const timeStart = s.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const timeEnd = e.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const dateStr = s.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return `${dateStr}, ${timeStart} - ${timeEnd} WIB`;
  } catch {
    return "-";
  }
};

const getSessionStatus = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return { label: "Jadwal", color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" };
  const now = new Date();
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (now >= s && now <= e) {
    return { label: "Sedang Berlangsung", color: "#059669", bg: "rgba(16, 185, 129, 0.15)" };
  } else if (now < s) {
    return { label: "Akan Datang", color: "#1F4B5D", bg: "rgba(31, 75, 93, 0.12)" };
  } else {
    return { label: "Selesai", color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" };
  }
};

export default function AdminMonitoringPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isSessionsPage = pathname?.includes("sessions");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [allRows, setAllRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Tambah Sesi States
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newStartSessions, setNewStartSessions] = useState("");
  const [newEndSessions, setNewEndSessions] = useState("");
  const [newToleransi, setNewToleransi] = useState(15);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Modal Edit Sesi States
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const [editStartSessions, setEditStartSessions] = useState("");
  const [editEndSessions, setEditEndSessions] = useState("");
  const [editToleransi, setEditToleransi] = useState(15);
  const [isSubmittingEditSession, setIsSubmittingEditSession] = useState(false);
  const [editFormError, setEditFormError] = useState("");
  const [editFormSuccess, setEditFormSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      // 1. Profil
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Sesi
      const sessRes = await fetch("/api/sessions");
      const sessData = await sessRes.json();
      const sessList: SessionItem[] = sessData.data || [];
      setSessions(sessList);

      // 3. Kelompok dari Database API /api/groups
      const groupMap: Record<number, string> = {};
      const groupsRes = await fetch("/api/groups").catch(() => null);
      let groupList: GroupItem[] = [];
      if (groupsRes && groupsRes.ok) {
        const gData = await groupsRes.json();
        if (Array.isArray(gData.data)) {
          groupList = gData.data.map((g: any) => ({
            id: g.id,
            name: g.name,
          }));
          gData.data.forEach((g: any) => {
            if (g.id && g.name) groupMap[g.id] = g.name;
          });
        }
      }
      // Urutkan kelompok berdasarkan nama
      groupList.sort((a, b) => a.name.localeCompare(b.name));
      setGroups(groupList);

      // 4. Seluruh Data Mahasiswa (Maba) Resmi dari Database
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      let mabaList: any[] = [];
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) {
          mabaList = uData.data;
        }
      }

      // 5. Data Kehadiran (t_attendances) dari Database
      const attRes = await fetch("/api/attendance");
      const attData = await attRes.json();
      const rawAttendances: any[] = attData.data || [];

      // Rekonstruksi data baris monitoring lengkap dari database
      const rows: AttendanceRow[] = [];

      // Loop untuk setiap sesi dan setiap maba resmi di database
      sessList.forEach((sess) => {
        mabaList.forEach((maba) => {
          // Cari record presensi maba pada sesi ini
          const att = rawAttendances.find(
            (a) =>
              (a.mabaId === maba.id || a.maba?.nim === maba.nim || a.maba?.username === maba.username) &&
              (a.sessionsId === sess.id || a.sessionId === sess.id || a.session?.id === sess.id)
          );

          const gId = maba.mGroupsId || maba.group?.id || att?.groupsId;
          const gName = maba.group?.name || (gId ? groupMap[gId] : undefined) || "Kelompok";

          if (att) {
            rows.push({
              id: `att-${att.id || `${maba.id}-${sess.id}`}`,
              nim: maba.nim || maba.username || "-",
              nama: maba.nama,
              prodi: maba.prodi || "-",
              groupName: gName,
              groupId: gId,
              sessionName: sess.name,
              sessionId: sess.id,
              scanTime: att.createdAt || att.scannedAt
                ? new Date(att.createdAt || att.scannedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-",
              status: att.status || "Hadir",
            });
          } else {
            const endVal = sess.endSessions || sess.end_sessions;
            const isEnded = endVal ? new Date() > new Date(endVal) : false;
            rows.push({
              id: `unatt-${maba.nim || maba.id}-${sess.id}`,
              nim: maba.nim || maba.username || "-",
              nama: maba.nama,
              prodi: maba.prodi || "-",
              groupName: gName,
              groupId: gId,
              sessionName: sess.name,
              sessionId: sess.id,
              scanTime: "-",
              status: isEnded ? "Tidak Hadir" : "Belum Hadir",
            });
          }
        });
      });

      // Tambahkan data presensi ekstra jika ada maba yang tidak terdaftar di mabaList aktif
      rawAttendances.forEach((att) => {
        const mabaUser = att.maba || att.user;
        const alreadyIncluded = rows.some(
          (r) =>
            (r.nim === mabaUser?.nim || r.nim === mabaUser?.username) &&
            r.sessionId === (att.sessionsId || att.sessionId || att.session?.id)
        );
        if (!alreadyIncluded && mabaUser) {
          const gId = mabaUser.mGroupsId || mabaUser.group?.id || att.groupsId;
          const gName = mabaUser.group?.name || (gId ? groupMap[gId] : undefined) || "Kelompok";
          const sId = att.sessionsId || att.sessionId || att.session?.id;
          rows.push({
            id: `att-extra-${att.id}`,
            nim: mabaUser.nim || mabaUser.username || "-",
            nama: mabaUser.nama || "Mahasiswa",
            prodi: mabaUser.prodi || "-",
            groupName: gName,
            groupId: gId,
            sessionName: att.session?.name || "Sesi",
            sessionId: sId,
            scanTime: att.createdAt || att.scannedAt
              ? new Date(att.createdAt || att.scannedAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            status: att.status || "Hadir",
          });
        }
      });

      setAllRows(rows);
    } catch (err) {
      console.error("Gagal memuat data monitoring:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler Open Modal Tambah Sesi
  const openAddSessionModal = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 10 * 60 * 1000);
    const end = new Date(start.getTime() + 120 * 60 * 1000); // 2 jam kemudian
    setNewSessionName("");
    setNewStartSessions(formatDateTimeLocal(start));
    setNewEndSessions(formatDateTimeLocal(end));
    setNewToleransi(15);
    setFormError("");
    setFormSuccess("");
    setIsAddSessionModalOpen(true);
  };

  // Controller Handler Create Sesi
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newSessionName.trim()) {
      setFormError("Nama sesi kegiatan wajib diisi.");
      return;
    }
    if (!newStartSessions || !newEndSessions) {
      setFormError("Waktu mulai dan waktu selesai wajib ditentukan.");
      return;
    }

    const start = new Date(newStartSessions);
    const end = new Date(newEndSessions);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setFormError("Format tanggal dan waktu tidak valid.");
      return;
    }

    if (end <= start) {
      setFormError("Waktu akhir sesi harus lebih lambat daripada waktu mulai sesi.");
      return;
    }

    setIsSubmittingSession(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSessionName.trim(),
          startSessions: start.toISOString(),
          endSessions: end.toISOString(),
          toleransi: Number(newToleransi) || 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Gagal membuat sesi kegiatan.");
      }

      setFormSuccess("Sesi kegiatan baru berhasil ditambahkan!");
      await loadData();
      if (resData.data?.id) {
        setSelectedSession(String(resData.data.id));
      }

      setTimeout(() => {
        setIsAddSessionModalOpen(false);
        setNewSessionName("");
        setFormSuccess("");
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan sesi.");
    } finally {
      setIsSubmittingSession(false);
    }
  };

  // Handler Open Modal Edit Sesi
  const openEditSessionModal = (sess: SessionItem) => {
    setEditingSession(sess);
    setEditSessionName(sess.name);

    const startVal = (sess as any).startSessions || sess.start_sessions;
    const endVal = (sess as any).endSessions || sess.end_sessions;

    const startDate = startVal ? new Date(startVal) : new Date();
    const endDate = endVal ? new Date(endVal) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    setEditStartSessions(formatDateTimeLocal(startDate));
    setEditEndSessions(formatDateTimeLocal(endDate));
    setEditToleransi(sess.toleransi ?? 15);
    setEditFormError("");
    setEditFormSuccess("");
    setIsEditSessionModalOpen(true);
  };

  // Controller Handler Update Sesi
  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setEditFormError("");
    setEditFormSuccess("");

    if (!editSessionName.trim()) {
      setEditFormError("Nama sesi kegiatan wajib diisi.");
      return;
    }
    if (!editStartSessions || !editEndSessions) {
      setEditFormError("Waktu mulai dan waktu selesai wajib ditentukan.");
      return;
    }

    const start = new Date(editStartSessions);
    const end = new Date(editEndSessions);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setEditFormError("Format tanggal dan waktu tidak valid.");
      return;
    }

    if (end <= start) {
      setEditFormError("Waktu akhir sesi harus lebih lambat daripada waktu mulai sesi.");
      return;
    }

    setIsSubmittingEditSession(true);
    try {
      const res = await fetch(`/api/sessions/${editingSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSessionName.trim(),
          startSessions: start.toISOString(),
          endSessions: end.toISOString(),
          toleransi: Number(editToleransi) || 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Gagal memperbarui sesi kegiatan.");
      }

      setEditFormSuccess("Sesi kegiatan berhasil diperbarui!");
      await loadData();

      setTimeout(() => {
        setIsEditSessionModalOpen(false);
        setEditingSession(null);
        setEditFormSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditFormError(err.message || "Terjadi kesalahan saat menyimpan perubahan sesi.");
    } finally {
      setIsSubmittingEditSession(false);
    }
  };

  // Controller Handler Delete Sesi (Soft Delete)
  const handleDeleteSession = async () => {
    if (!editingSession) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus sesi "${editingSession.name}"?`
    );
    if (!confirmDelete) return;

    setIsSubmittingEditSession(true);
    try {
      const res = await fetch(`/api/sessions/${editingSession.id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Gagal menghapus sesi kegiatan.");
      }

      setEditFormSuccess("Sesi kegiatan berhasil dinonaktifkan.");
      if (selectedSession === String(editingSession.id)) {
        setSelectedSession("all");
      }
      await loadData();

      setTimeout(() => {
        setIsEditSessionModalOpen(false);
        setEditingSession(null);
        setEditFormSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditFormError(err.message || "Terjadi kesalahan saat menghapus sesi.");
    } finally {
      setIsSubmittingEditSession(false);
    }
  };

  // Filter Data
  const filteredRows = allRows.filter((r) => {
    if (selectedSession !== "all" && String(r.sessionId) !== selectedSession) return false;
    if (selectedGroup !== "all" && String(r.groupId) !== selectedGroup) return false;
    if (selectedStatus !== "all" && r.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.nama.toLowerCase().includes(q);
      const matchNim = r.nim.toLowerCase().includes(q);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  // Summary KPI Counters
  const totalHadir = filteredRows.filter((r) => r.status === "Hadir").length;
  const totalTerlambat = filteredRows.filter((r) => r.status === "Terlambat").length;
  const totalTidakHadir = filteredRows.filter((r) => r.status === "Tidak Hadir").length;
  const totalBelum = filteredRows.filter((r) => r.status === "Belum Hadir").length;

  // Handler Download Export
  const handleExportAttendance = () => {
    let url = "/api/export/attendance?";
    if (selectedSession !== "all") url += `sessionId=${selectedSession}&`;
    if (selectedGroup !== "all") url += `groupId=${selectedGroup}&`;
    if (selectedStatus !== "all") url += `status=${selectedStatus}&`;
    window.open(url, "_blank");
  };

  const handleExportAssignments = () => {
    window.open("/api/export/assignments", "_blank");
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title={isSessionsPage ? "Manajemen Sesi" : "Monitoring Presensi"}
      role="admin"
      wide={true}
      user={user ? { nama: user.nama, role: user.role } : undefined}
    >
      {/* Header Banner & Ekspor */}
      <div
        style={{
          background: "linear-gradient(135deg, #11110E 0%, #1F4B5D 100%)",
          borderRadius: "18px",
          padding: "18px",
          color: "#FAFAFA",
          marginBottom: "16px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Sparkles size={16} color="#68CFEB" />
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#68CFEB", fontWeight: 700 }}>
            {isSessionsPage ? "Manajemen Jadwal Sesi" : "Live Monitoring & Data Rekap"}
          </span>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
          {isSessionsPage ? "Sesi Kegiatan & Presensi SILO" : "Rekap Kehadiran Peserta SILO"}
        </h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: "0 0 14px 0" }}>
          Atur jadwal sesi kegiatan, pantau status scan kehadiran per kelompok maba, dan ekspor data rekapitulasi.
        </p>

        {/* Action Buttons: Tambah Sesi & Ekspor CSV/Excel */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={openAddSessionModal}
            style={{
              flex: 1,
              minWidth: "150px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "#68CFEB",
              color: "#11110E",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(104, 207, 235, 0.35)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah Sesi Baru</span>
          </button>

          <button
            type="button"
            onClick={handleExportAttendance}
            style={{
              flex: 1,
              minWidth: "140px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            <Download size={15} />
            <span>Ekspor Presensi</span>
          </button>

          <button
            type="button"
            onClick={handleExportAssignments}
            style={{
              flex: 1,
              minWidth: "140px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Nilai</span>
          </button>
        </div>
      </div>

      {/* Quick Session Cards & Quick Selection */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={15} color="#1F4B5D" />
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F4B5D" }}>
              Daftar Sesi Kegiatan ({sessions.length})
            </span>
          </div>
          <button
            type="button"
            onClick={openAddSessionModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "8px",
              backgroundColor: "rgba(31, 75, 93, 0.08)",
              color: "#1F4B5D",
              border: "1px solid rgba(31, 75, 93, 0.2)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Tambah</span>
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "6px",
            scrollbarWidth: "none",
          }}
        >
          {sessions.map((sess) => {
            const start = (sess as any).startSessions || sess.start_sessions;
            const end = (sess as any).endSessions || sess.end_sessions;
            const statusInfo = getSessionStatus(start, end);
            const isSelected = selectedSession === String(sess.id);

            return (
              <div
                key={sess.id}
                onClick={() => openEditSessionModal(sess)}
                style={{
                  minWidth: "220px",
                  padding: "14px",
                  borderRadius: "14px",
                  backgroundColor: isSelected ? "#1F4B5D" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#1F1E19",
                  border: isSelected ? "2px solid #68CFEB" : "1px solid rgba(31, 75, 93, 0.12)",
                  boxShadow: isSelected
                    ? "0 4px 14px rgba(31, 75, 93, 0.25)"
                    : "0 2px 6px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : statusInfo.bg,
                      color: isSelected ? "#68CFEB" : statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: isSelected ? "#68CFEB" : "#1F4B5D",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "rgba(104, 207, 235, 0.15)" : "rgba(31, 75, 93, 0.06)",
                    }}
                  >
                    <Edit3 size={11} />
                    <span>Edit Sesi</span>
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: "4px", lineHeight: "1.2" }}>
                  {sess.name}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: isSelected ? "rgba(255, 255, 255, 0.8)" : "rgba(31, 75, 93, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "6px",
                  }}
                >
                  <Clock size={11} />
                  <span>{formatTimeRange(start, end)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", opacity: isSelected ? 0.9 : 0.65 }}>
                  <span>Toleransi: {sess.toleransi ?? 0}m</span>
                  <span style={{ fontStyle: "italic", fontWeight: 600 }}>Klik untuk edit &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: totalBelum > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "10px",
            borderRadius: "12px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#065F46", fontWeight: 700 }}>Hadir</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>{totalHadir}</div>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "12px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: 700 }}>Terlambat</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#D97706" }}>{totalTerlambat}</div>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#991B1B", fontWeight: 700 }}>Tidak Hadir</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#DC2626" }}>{totalTidakHadir}</div>
        </div>

        {totalBelum > 0 && (
          <div
            style={{
              padding: "10px",
              borderRadius: "12px",
              backgroundColor: "rgba(100, 116, 139, 0.08)",
              border: "1px solid rgba(100, 116, 139, 0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700 }}>Belum Hadir</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#64748B" }}>{totalBelum}</div>
          </div>
        )}
      </div>

      {/* Filter Toolbar Responsif */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "14px",
          marginBottom: "16px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(31, 75, 93, 0.2)",
            backgroundColor: "#FAFAFA",
          }}
        >
          <Search size={16} color="rgba(31, 75, 93, 0.6)" />
          <input
            type="text"
            placeholder="Cari Nama atau NIM maba..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.85rem",
              width: "100%",
            }}
          />
        </div>

        {/* Dropdown Filters: Sesi, Kelompok Mahasiswa, Status */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
          {/* Filter Sesi */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "3px" }}>
              Filter Sesi:
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.75rem",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Semua Sesi</option>
              {sessions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kelompok Mahasiswa */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "3px" }}>
              Filter Kelompok:
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.75rem",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Semua Kelompok</option>
              {groups.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "3px" }}>
              Filter Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.75rem",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
              <option value="Belum Hadir">Belum Hadir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tampilan Data: Tabel Responsif dengan Mobile Card Fallback */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D" }}>
            Hasil Presensi ({filteredRows.length} Mahasiswa)
          </span>
          {(selectedSession !== "all" || selectedGroup !== "all" || selectedStatus !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSession("all");
                setSelectedGroup("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Reset Filter
            </button>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid rgba(31, 75, 93, 0.08)",
              color: "rgba(31, 75, 93, 0.6)",
              fontSize: "0.85rem",
            }}
          >
            Tidak ada data presensi yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="mobile-card-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredRows.map((row) => {
              const isHadir = row.status === "Hadir";
              const isTerlambat = row.status === "Terlambat";
              const isTidakHadir = row.status === "Tidak Hadir";

              const badgeBg = isHadir
                ? "rgba(16, 185, 129, 0.12)"
                : isTerlambat
                ? "rgba(245, 158, 11, 0.12)"
                : isTidakHadir
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(100, 116, 139, 0.12)";
              const badgeColor = isHadir
                ? "#059669"
                : isTerlambat
                ? "#D97706"
                : isTidakHadir
                ? "#DC2626"
                : "#64748B";

              return (
                <div
                  key={row.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(31, 75, 93, 0.08)",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1F1E19" }}>
                        {row.nama}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>
                        NIM: {row.nim} • {row.groupName}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(31, 75, 93, 0.03)",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "#1F4B5D",
                    }}
                  >
                    <span>Sesi: {row.sessionName}</span>
                    <span>Scan: {row.scanTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Sesi */}
      {isAddSessionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: "rgba(17, 17, 14, 0.65)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingSession) {
              setIsAddSessionModalOpen(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "22px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(31, 75, 93, 0.15)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "16px",
                borderBottom: "1px solid rgba(31, 75, 93, 0.1)",
                paddingBottom: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1F4B5D" }}>
                  Tambah Sesi Kegiatan Baru
                </h3>
                <p style={{ margin: "3px 0 0 0", fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)" }}>
                  Buat jadwal sesi baru untuk presensi QR peserta SILO
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmittingSession && setIsAddSessionModalOpen(false)}
                disabled={isSubmittingSession}
                style={{
                  background: "rgba(31, 75, 93, 0.08)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: isSubmittingSession ? "not-allowed" : "pointer",
                  color: "#1F4B5D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {formError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#DC2626",
                  fontSize: "0.8rem",
                  marginBottom: "14px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#059669",
                  fontSize: "0.8rem",
                  marginBottom: "14px",
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Nama Sesi Kegiatan <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sesi 02 - Pembekalan Materi"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  disabled={isSubmittingSession}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Waktu Mulai <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartSessions}
                    onChange={(e) => setNewStartSessions(e.target.value)}
                    disabled={isSubmittingSession}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.8rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Waktu Selesai <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEndSessions}
                    onChange={(e) => setNewEndSessions(e.target.value)}
                    disabled={isSubmittingSession}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.8rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newToleransi}
                  onChange={(e) => setNewToleransi(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isSubmittingSession}
                  placeholder="15"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)" }}>
                  Contoh: 15 menit setelah waktu mulai akan ditandai Terlambat.
                </span>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddSessionModalOpen(false)}
                  disabled={isSubmittingSession}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    backgroundColor: "#FFFFFF",
                    color: "#1F4B5D",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: isSubmittingSession ? "not-allowed" : "pointer",
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingSession}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: isSubmittingSession ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(31, 75, 93, 0.25)",
                  }}
                >
                  {isSubmittingSession && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSubmittingSession ? "Menyimpan..." : "Simpan Sesi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Sesi Kegiatan */}
      {isEditSessionModalOpen && editingSession && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => {
            if (!isSubmittingEditSession) {
              setIsEditSessionModalOpen(false);
              setEditingSession(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: "#1F4B5D",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    backgroundColor: "rgba(104, 207, 235, 0.2)",
                    borderRadius: "8px",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Edit3 size={18} color="#68CFEB" />
                </div>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>
                    Edit Data Sesi Kegiatan
                  </h3>
                  <p style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.75)", margin: 0 }}>
                    Sesi ID #{editingSession.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingEditSession) {
                    setIsEditSessionModalOpen(false);
                    setEditingSession(null);
                  }
                }}
                disabled={isSubmittingEditSession}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: isSubmittingEditSession ? "not-allowed" : "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateSession} style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Error Message */}
              {editFormError && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#DC2626",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{editFormError}</span>
                </div>
              )}

              {/* Success Message */}
              {editFormSuccess && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#059669",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>{editFormSuccess}</span>
                </div>
              )}

              {/* Nama Sesi Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Nama Sesi Kegiatan <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={editSessionName}
                  onChange={(e) => setEditSessionName(e.target.value)}
                  placeholder="Contoh: Sesi 1 - Opening Ceremony"
                  disabled={isSubmittingEditSession}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Waktu Mulai & Selesai Input Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Waktu Mulai <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editStartSessions}
                    onChange={(e) => setEditStartSessions(e.target.value)}
                    disabled={isSubmittingEditSession}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.8rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Waktu Selesai <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editEndSessions}
                    onChange={(e) => setEditEndSessions(e.target.value)}
                    disabled={isSubmittingEditSession}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.8rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editToleransi}
                  onChange={(e) => setEditToleransi(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isSubmittingEditSession}
                  placeholder="15"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)" }}>
                  Waktu keterlambatan presensi dihitung otomatis berdasarkan batas ini.
                </span>
              </div>

              {/* Quick Filter Selection Option */}
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(31, 75, 93, 0.05)",
                  border: "1px dashed rgba(31, 75, 93, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#1F4B5D", fontWeight: 600 }}>
                  Lihat daftar presensi untuk sesi ini:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSession(String(editingSession.id));
                    setIsEditSessionModalOpen(false);
                    setEditingSession(null);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Filter Presensi
                </button>
              </div>

              {/* Form Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginTop: "10px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  disabled={isSubmittingEditSession}
                  title="Hapus / Nonaktifkan Sesi"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    color: "#DC2626",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: isSubmittingEditSession ? "not-allowed" : "pointer",
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditSessionModalOpen(false);
                      setEditingSession(null);
                    }}
                    disabled={isSubmittingEditSession}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.2)",
                      backgroundColor: "#FFFFFF",
                      color: "#1F4B5D",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: isSubmittingEditSession ? "not-allowed" : "pointer",
                    }}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingEditSession}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 18px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#1F4B5D",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: isSubmittingEditSession ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(31, 75, 93, 0.25)",
                    }}
                  >
                    {isSubmittingEditSession && <Loader2 size={14} className="animate-spin" />}
                    <span>{isSubmittingEditSession ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
