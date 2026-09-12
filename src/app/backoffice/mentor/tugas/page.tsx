"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  ChevronRight,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
  mentored_groups?: Array<{ group_id: number; group_name: string }>;
}

interface SubmissionItem {
  id: number;
  assignmentId?: number;
  assignment_id?: number;
  mabaId?: number;
  maba_id?: number;
  fileUrl?: string;
  file_url?: string;
  notes?: string | null;
  status: "submitted" | "late" | "graded" | "resubmit";
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string;
  submitted_at?: string;
  maba: {
    id: number;
    nama: string;
    nim?: string | null;
    group?: { name: string } | null;
  };
  assignment: {
    id: number;
    title: string;
    dueDate?: string;
    due_date?: string;
  };
}

export default function MentorTugasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "graded">("all");
  const [loading, setLoading] = useState(true);

  // Bottom Sheet Detail Pengumpulan State (Monitoring Only)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      if (meData.user?.id) {
        const subRes = await fetch(`/api/submissions?mentorId=${meData.user.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissions(subData.data || []);
        }
      }
    } catch (err) {
      console.error("Gagal memuat monitoring tugas mentor:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setIsSheetOpen(true);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter === "pending") return sub.status !== "graded";
    if (statusFilter === "graded") return sub.status === "graded";
    return true;
  });

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title="Monitoring Tugas Binaan"
      role="mentor"
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* Header Info */}
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
          <ShieldCheck size={16} color="#68CFEB" />
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#68CFEB", fontWeight: 700 }}>
            Panel Monitoring Mentor
          </span>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          Pantau Tugas Mahasiswa Binaan
        </h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
          Pantau progres pengumpulan tugas, periksa kelengkapan berkas binaan, serta tinjau hasil penilaian dan evaluasi yang diberikan oleh Admin.
        </p>
      </div>

      {/* Info Banner Mode Monitoring */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "12px",
          backgroundColor: "rgba(104, 207, 235, 0.12)",
          border: "1px solid rgba(104, 207, 235, 0.3)",
          color: "#1F4B5D",
          fontSize: "0.74rem",
          marginBottom: "16px",
          lineHeight: 1.35,
        }}
      >
        <Info size={16} color="#0F766E" style={{ flexShrink: 0, marginTop: "1px" }} />
        <span>
          <strong>Hak Akses Mentor:</strong> Penilaian dan pemberian nilai skor tugas dilakukan secara terpusat oleh <strong>Admin</strong>. Mentor bertindak sebagai pemantau perkembangan mahasiswa binaan.
        </span>
      </div>

      {/* Tab Filter Status */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          backgroundColor: "rgba(31, 75, 93, 0.05)",
          padding: "4px",
          borderRadius: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: statusFilter === "all" ? "#FFFFFF" : "transparent",
            color: statusFilter === "all" ? "#1F4B5D" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: statusFilter === "all" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Semua ({submissions.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: statusFilter === "pending" ? "#FFFFFF" : "transparent",
            color: statusFilter === "pending" ? "#D97706" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: statusFilter === "pending" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Belum Dinilai ({submissions.filter((s) => s.status !== "graded").length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("graded")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: statusFilter === "graded" ? "#FFFFFF" : "transparent",
            color: statusFilter === "graded" ? "#059669" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: statusFilter === "graded" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Sudah Dinilai ({submissions.filter((s) => s.status === "graded").length})
        </button>
      </div>

      {/* List Submissions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "30px" }}>
        {filteredSubmissions.length === 0 ? (
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
            Tidak ada data tugas pada filter ini.
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isGraded = sub.status === "graded";
            const isLate = sub.status === "late";

            return (
              <div
                key={sub.id}
                onClick={() => handleOpenDetail(sub)}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(31, 75, 93, 0.08)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1F1E19", wordBreak: "break-word" }}>
                      {sub.maba?.nama}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", marginTop: "2px" }}>
                      NIM: {sub.maba?.nim || "-"} • {sub.maba?.group?.name || "Binaan"}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                    {isGraded ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
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
                        <Award size={13} />
                        Nilai: {sub.score}/100
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "5px 12px",
                          borderRadius: "999px",
                          backgroundColor: isLate ? "rgba(245, 158, 11, 0.12)" : "rgba(104, 207, 235, 0.2)",
                          color: isLate ? "#D97706" : "#0F766E",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        <Clock size={13} />
                        {isLate ? "Terlambat (Belum Dinilai)" : "Menunggu Dinilai Admin"}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(31, 75, 93, 0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#1F4B5D" }}>{sub.assignment?.title}</span>
                  <span style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)" }}>
                    {(() => {
                      const dateVal = sub.submittedAt || sub.submitted_at;
                      return dateVal ? new Date(dateVal).toLocaleDateString("id-ID") : "-";
                    })()}
                  </span>
                </div>

                {sub.notes && (
                  <div style={{ fontSize: "0.74rem", color: "rgba(31, 75, 93, 0.75)", fontStyle: "italic" }}>
                    Catatan Maba: &quot;{sub.notes}&quot;
                  </div>
                )}

                {sub.feedback && (
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      fontSize: "0.74rem",
                      color: "#065F46",
                    }}
                  >
                    <strong>Catatan Review Admin:</strong> &quot;{sub.feedback}&quot;
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "4px",
                    color: "#0F766E",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginTop: "2px",
                  }}
                >
                  <span>Lihat Detail Tugas</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sheet Detail & Monitoring Tugas */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Detail Pengumpulan Tugas"
        maxHeight="88vh"
      >
        {selectedSub && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "4px 0 18px" }}>
            {/* Info Maba & Tugas */}
            <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(31, 75, 93, 0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1F1E19", wordBreak: "break-word" }}>
                    {selectedSub.maba?.nama}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)" }}>
                    NIM: {selectedSub.maba?.nim || "-"} • {selectedSub.maba?.group?.name}
                  </div>
                </div>
                {selectedSub.score !== null && selectedSub.score !== undefined && (
                  <div style={{ flexShrink: 0, marginLeft: "auto" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        lineHeight: 1.2,
                      }}
                    >
                      Nilai Admin: {selectedSub.score}/100
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1F4B5D", marginTop: "4px" }}>
                Tugas: {selectedSub.assignment?.title}
              </div>

              {/* Tanggal Pengumpulan */}
              <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.65)", marginTop: "4px" }}>
                Waktu Pengumpulan:{" "}
                {selectedSub.submittedAt || selectedSub.submitted_at
                  ? new Date(selectedSub.submittedAt || (selectedSub.submitted_at as string)).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </div>

              {selectedSub.notes && (
                <div style={{ fontSize: "0.75rem", marginTop: "8px", color: "rgba(31, 75, 93, 0.85)", fontStyle: "italic" }}>
                  <strong>Catatan dari Mahasiswa:</strong> &quot;{selectedSub.notes}&quot;
                </div>
              )}
            </div>

            {/* Tombol Buka File Tugas di Tab Baru */}
            {(selectedSub.fileUrl || selectedSub.file_url) ? (
              <a
                href={selectedSub.fileUrl || selectedSub.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(104, 207, 235, 0.2)",
                  color: "#0F766E",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  border: "1px solid rgba(104, 207, 235, 0.4)",
                }}
              >
                <ExternalLink size={16} />
                Buka Berkas Tugas Mahasiswa
              </a>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "#DC2626", fontStyle: "italic", textAlign: "center" }}>
                Mahasiswa belum menyertakan link berkas.
              </div>
            )}

            {/* Status Penilaian dari Admin */}
            {selectedSub.score !== null && selectedSub.score !== undefined ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#065F46", fontWeight: 700, fontSize: "0.85rem" }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <span>Sudah Dinilai oleh Admin</span>
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#059669" }}>
                    {selectedSub.score} <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(6, 95, 70, 0.7)" }}>/ 100</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065F46", marginBottom: "2px" }}>
                    Catatan Review Admin:
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#1F1E19",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      fontStyle: selectedSub.feedback ? "normal" : "italic",
                    }}
                  >
                    {selectedSub.feedback ? `"${selectedSub.feedback}"` : "Tidak ada catatan evaluasi khusus."}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#B45309", fontWeight: 700, fontSize: "0.85rem" }}>
                  <Clock size={18} color="#D97706" />
                  <span>Menunggu Penilaian Admin</span>
                </div>
                <p style={{ fontSize: "0.76rem", color: "rgba(31, 75, 93, 0.8)", margin: 0, lineHeight: 1.4 }}>
                  Tugas ini sudah diserahkan oleh mahasiswa dan sedang dalam antrean pemeriksaan oleh Admin. Anda dapat memeriksa berkas di atas untuk memantau kelayakan tugas.
                </p>
              </div>
            )}

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                backgroundColor: "rgba(31, 75, 93, 0.06)",
                color: "#1F4B5D",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Tutup Rincian
            </button>
          </div>
        )}
      </BottomSheet>
    </MobileShell>
  );
}
