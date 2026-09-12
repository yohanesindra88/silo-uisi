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
  Search,
  Sparkles,
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

interface AttendanceRow {
  id: string;
  nim: string;
  nama: string;
  groupName: string;
  groupId?: number;
  sessionName: string;
  sessionId: number;
  scanTime: string;
  status: "Hadir" | "Terlambat" | "Tidak Hadir" | "Belum Hadir" | string;
}

export default function MentorMonitoringPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [allRows, setAllRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // Sesi
      const sessRes = await fetch("/api/sessions");
      const sessData = await sessRes.json();
      const sessList: SessionItem[] = sessData.data || [];
      setSessions(sessList);

      // Dapatkan kelompok yang dibimbing mentor ini
      const mentorGroupIds: number[] = [];
      if (Array.isArray(meData.user?.mentored_groups)) {
        meData.user.mentored_groups.forEach((g: any) => {
          if (g.group_id && !mentorGroupIds.includes(g.group_id)) {
            mentorGroupIds.push(g.group_id);
          }
        });
      }
      if (meData.user?.m_groups_id && !mentorGroupIds.includes(meData.user.m_groups_id)) {
        mentorGroupIds.push(meData.user.m_groups_id);
      }

      // Ambil data maba resmi dari database sesuai kelompok binaan
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      let mabaList: any[] = [];
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) {
          mabaList = mentorGroupIds.length > 0
            ? uData.data.filter((m: any) => mentorGroupIds.includes(m.mGroupsId || m.group?.id))
            : [];
        }
      }

      // Ambil data presensi dari database
      const attRes = await fetch("/api/attendance");
      const attData = await attRes.json();
      const rawAttendances = attData.data || [];

      const rows: AttendanceRow[] = [];
      const mabaIdSet = new Set(mabaList.map((m) => m.id));
      const mabaNimSet = new Set(mabaList.map((m) => m.nim || m.username));

      rawAttendances.forEach((att: any, idx: number) => {
        const mabaUser = att.maba || att.user;
        const gId = mabaUser?.mGroupsId || mabaUser?.group?.id || att.groupsId;
        const isBelongToMentor =
          mentorGroupIds.includes(gId) ||
          mabaIdSet.has(att.mabaId || mabaUser?.id) ||
          mabaNimSet.has(mabaUser?.nim || mabaUser?.username);

        if (!isBelongToMentor) return;

        const recordId = att.id || `${att.mabaId || mabaUser?.id || idx}-${att.sessionsId || att.sessionId || idx}`;
        const sId = att.sessionsId || att.sessionId || att.session?.id;

        rows.push({
          id: `att-${recordId}`,
          nim: mabaUser?.nim || mabaUser?.username || "-",
          nama: mabaUser?.nama || "Mahasiswa",
          groupName: mabaUser?.group?.name || "Kelompok Binaan",
          groupId: gId,
          sessionName: att.session?.name || "Sesi",
          sessionId: sId,
          scanTime: att.createdAt || att.scannedAt ? new Date(att.createdAt || att.scannedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
          status: att.status || "Hadir",
        });
      });

      // Tambahkan baris Tidak Hadir (jika sesi selesai) atau Belum Hadir (jika sesi belum selesai) untuk maba binaan yang belum scan
      const now = new Date();
      sessList.forEach((sess) => {
        const endVal = sess.endSessions || sess.end_sessions;
        const isEnded = endVal ? now > new Date(endVal) : false;
        const unattStatus = isEnded ? "Tidak Hadir" : "Belum Hadir";

        mabaList.forEach((m) => {
          const exists = rows.some((r) => r.nim === (m.nim || m.username) && r.sessionId === sess.id);
          if (!exists) {
            rows.push({
              id: `unatt-${m.nim || m.id}-${sess.id}`,
              nim: m.nim || m.username || "-",
              nama: m.nama,
              groupName: m.group?.name || "Kelompok Binaan",
              groupId: m.mGroupsId || m.group?.id,
              sessionName: sess.name,
              sessionId: sess.id,
              scanTime: "-",
              status: unattStatus,
            });
          }
        });
      });

      setAllRows(rows);
    } catch (err) {
      console.error("Gagal memuat monitoring mentor:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter Data
  const filteredRows = allRows.filter((r) => {
    if (selectedSession !== "all" && String(r.sessionId) !== selectedSession) return false;
    if (selectedStatus !== "all" && r.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.nama.toLowerCase().includes(q);
      const matchNim = r.nim.toLowerCase().includes(q);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  const totalHadir = filteredRows.filter((r) => r.status === "Hadir").length;
  const totalTerlambat = filteredRows.filter((r) => r.status === "Terlambat").length;
  const totalTidakHadir = filteredRows.filter((r) => r.status === "Tidak Hadir").length;
  const totalBelum = filteredRows.filter((r) => r.status === "Belum Hadir").length;

  const handleExportAttendance = () => {
    let url = "/api/export/attendance?";
    if (selectedSession !== "all") url += `sessionId=${selectedSession}&`;
    if (selectedStatus !== "all") url += `status=${selectedStatus}&`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title="Monitoring Presensi"
      role="mentor"
      wide={true}
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #1F4B5D 100%)",
          borderRadius: "18px",
          padding: "18px",
          color: "#FAFAFA",
          marginBottom: "16px",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Sparkles size={16} color="#68CFEB" />
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#68CFEB", fontWeight: 700 }}>
            Pemantauan Presensi Binaan
          </span>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
          Status Kehadiran Kelompok
        </h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: "0 0 14px 0" }}>
          Pantau status scan maba binaan per sesi dan unduh laporan presensi ke format Excel/CSV.
        </p>

        <button
          type="button"
          onClick={handleExportAttendance}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "10px",
            backgroundColor: "#68CFEB",
            color: "#1F1E19",
            border: "none",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <Download size={14} />
          <span>Unduh Rekap Presensi (CSV)</span>
        </button>
      </div>

      {/* Counter Ringkasan */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: totalBelum > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", color: "#065F46", fontWeight: 700 }}>Hadir</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669" }}>{totalHadir}</div>
        </div>

        <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: 700 }}>Terlambat</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#D97706" }}>{totalTerlambat}</div>
        </div>

        <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", color: "#991B1B", fontWeight: 700 }}>Tidak Hadir</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#DC2626" }}>{totalTidakHadir}</div>
        </div>

        {totalBelum > 0 && (
          <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "rgba(100, 116, 139, 0.08)", border: "1px solid rgba(100, 116, 139, 0.2)", textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700 }}>Belum Hadir</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#64748B" }}>{totalBelum}</div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(31, 75, 93, 0.2)", backgroundColor: "#FAFAFA" }}>
          <Search size={16} color="rgba(31, 75, 93, 0.6)" />
          <input
            type="text"
            placeholder="Cari Nama / NIM maba..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.85rem", width: "100%" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "3px" }}>
              Sesi:
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(31, 75, 93, 0.2)", fontSize: "0.75rem", backgroundColor: "#FFFFFF" }}
            >
              <option value="all">Semua Sesi</option>
              {sessions.map((s) => {
                const startVal = s.startSessions || s.start_sessions;
                return (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} ({formatSessionDate(startVal)})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "3px" }}>
              Status:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(31, 75, 93, 0.2)", fontSize: "0.75rem", backgroundColor: "#FFFFFF" }}
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

      {/* Mobile Card List Fallback */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
        {filteredRows.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(31, 75, 93, 0.08)", color: "rgba(31, 75, 93, 0.6)", fontSize: "0.85rem" }}>
            Tidak ada data presensi.
          </div>
        ) : (
          filteredRows.map((row) => {
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
                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1F1E19" }}>{row.nama}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>NIM: {row.nim} • {row.groupName}</div>
                  </div>
                  <span style={{ padding: "4px 8px", borderRadius: "999px", backgroundColor: badgeBg, color: badgeColor, fontSize: "0.7rem", fontWeight: 700 }}>
                    {row.status}
                  </span>
                </div>

                <div style={{ padding: "6px 10px", borderRadius: "8px", backgroundColor: "rgba(31, 75, 93, 0.03)", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#0F766E" }}>
                  <span>Sesi: {row.sessionName}</span>
                  <span>Scan: {row.scanTime}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MobileShell>
  );
}
