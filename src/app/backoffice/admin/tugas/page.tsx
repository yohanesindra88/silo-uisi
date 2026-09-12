"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Fab } from "@/components/ui/fab";
import {
  FileText,
  Calendar,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Send,
  Sparkles,
  Search,
  Filter,
  Download,
  X,
  FileCheck,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
}

interface AssignmentWithStats {
  id: number;
  title: string;
  description?: string | null;
  dueDate: string;
  attachmentUrl?: string | null;
  createdAt: string;
  totalSubmissions: number;
  gradedCount: number;
  submittedCount: number;
  lateCount: number;
  totalMaba: number;
  percentage: number;
  isExpired: boolean;
  avgScore?: number | null;
}

interface GroupItem {
  id: number;
  name: string;
}

interface StudentSubmissionRow {
  mabaId: number;
  nim: string;
  nama: string;
  prodi: string;
  groupId?: number;
  groupName: string;
  hasSubmitted: boolean;
  submissionId?: number;
  status: "submitted" | "late" | "graded" | "resubmit" | "unsubmitted";
  score?: number | null;
  feedback?: string | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  fileUrl?: string;
  notes?: string | null;
  submittedAt?: string;
}

export default function AdminTugasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [allMaba, setAllMaba] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<GroupItem[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "history">("all");
  const [loading, setLoading] = useState(true);

  // Bottom Sheet States (Tambah / Edit / Hapus)
  const [sheetMode, setSheetMode] = useState<"none" | "create" | "edit" | "delete">("none");
  const [targetAssignment, setTargetAssignment] = useState<AssignmentWithStats | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // State Perluasan Kartu Tugas (Expandable Card)
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentWithStats | null>(null);
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [subGroupFilter, setSubGroupFilter] = useState<string>("all");
  const [subSearchQuery, setSubSearchQuery] = useState<string>("");

  // Modal Penilaian & Review Tugas (Khusus Admin)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewSub, setSelectedReviewSub] = useState<StudentSubmissionRow | null>(null);
  const [reviewScore, setReviewScore] = useState<string>("");
  const [reviewFeedback, setReviewFeedback] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewModalError, setReviewModalError] = useState<string | null>(null);
  const [reviewModalSuccess, setReviewModalSuccess] = useState<string | null>(null);

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

      // 2. Seluruh Maba dari Basis Data
      const usersRes = await fetch("/api/users?role=maba").catch(() => null);
      let mabas: any[] = [];
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData.data)) mabas = uData.data;
      }
      setAllMaba(mabas);

      // 3. Kelompok Mahasiswa dari Basis Data
      const groupsRes = await fetch("/api/groups").catch(() => null);
      let groups: GroupItem[] = [];
      if (groupsRes && groupsRes.ok) {
        const gData = await groupsRes.json();
        if (Array.isArray(gData.data)) {
          groups = gData.data.map((g: any) => ({ id: g.id, name: g.name }));
        }
      }
      groups.sort((a, b) => a.name.localeCompare(b.name));
      setAllGroups(groups);

      // 4. Daftar Penugasan dari Basis Data
      const assignRes = await fetch("/api/assignments");
      const assignData = await assignRes.json();
      const rawAssignments = assignData.data || [];

      // 5. Data Pengumpulan Tugas dari Basis Data
      const subRes = await fetch("/api/submissions");
      const subData = await subRes.json();
      const rawSubmissions: any[] = subData.data || [];
      setAllSubmissions(rawSubmissions);

      const totalMabaCount = Math.max(mabas.length, 1);
      const now = new Date();

      const calculated: AssignmentWithStats[] = rawAssignments.map((a: any) => {
        const matching = rawSubmissions.filter(
          (s) => s.assignmentId === a.id || s.assignment_id === a.id
        );
        const submittedCount = matching.filter((s) => s.status === "submitted").length;
        const lateCount = matching.filter((s) => s.status === "late").length;
        const gradedCount = matching.filter((s) => s.status === "graded").length;
        const gradedWithScore = matching.filter(
          (s) => s.status === "graded" && s.score !== null && s.score !== undefined
        );
        const avgScore =
          gradedWithScore.length > 0
            ? Math.round(
                gradedWithScore.reduce((acc: number, curr: any) => acc + Number(curr.score), 0) /
                  gradedWithScore.length
              )
            : null;
        const total = matching.length;
        const rawDue = a.dueDate || a.due_date;
        const dueDateObj = new Date(rawDue);
        const isExpired = !isNaN(dueDateObj.getTime()) && dueDateObj < now;
        const pct = Math.min(Math.round((total / totalMabaCount) * 100), 100);

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: rawDue,
          attachmentUrl: a.attachmentUrl || a.attachment_url,
          createdAt: a.createdAt || a.created_at,
          totalSubmissions: total,
          gradedCount,
          submittedCount,
          lateCount,
          totalMaba: mabas.length,
          percentage: pct,
          isExpired,
          avgScore,
        };
      });

      setAssignments(calculated);
      setViewingAssignment((prev) => {
        if (!prev) return null;
        return calculated.find((a) => a.id === prev.id) || prev;
      });
    } catch (err) {
      console.error("Gagal memuat tugas admin:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Form
  const handleOpenCreate = () => {
    setTargetAssignment(null);
    setTitle("");
    setDescription("");
    // Default deadline 7 hari dari sekarang
    const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tzOffset = defaultDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(defaultDate.getTime() - tzOffset).toISOString().slice(0, 16);
    setDueDate(localISOTime);
    setAttachmentUrl("");
    setActionFeedback(null);
    setSheetMode("create");
  };

  // Open Edit Form
  const handleOpenEdit = (item: AssignmentWithStats) => {
    setTargetAssignment(item);
    setTitle(item.title);
    setDescription(item.description || "");
    const dt = new Date(item.dueDate);
    if (!isNaN(dt.getTime())) {
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
      setDueDate(localISOTime);
    } else {
      setDueDate("");
    }
    setAttachmentUrl(item.attachmentUrl || "");
    setActionFeedback(null);
    setSheetMode("edit");
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item: AssignmentWithStats) => {
    setTargetAssignment(item);
    setActionFeedback(null);
    setSheetMode("delete");
  };

  // Toggle Perlebar / Tutup Daftar Pengumpul pada Card
  const handleToggleSubmissions = (item: AssignmentWithStats) => {
    if (expandedAssignmentId === item.id) {
      setExpandedAssignmentId(null);
      setViewingAssignment(null);
    } else {
      setExpandedAssignmentId(item.id);
      setViewingAssignment(item);
      setSubStatusFilter("all");
      setSubGroupFilter("all");
      setSubSearchQuery("");
    }
  };

  // Save Create Assignment
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) {
      setActionFeedback("Judul tugas dan deadline wajib diisi.");
      return;
    }

    setSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: new Date(dueDate).toISOString(),
          attachmentUrl: attachmentUrl.trim() || null,
          createdBy: user?.id,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setActionFeedback(result.message || "Gagal membuat tugas.");
        return;
      }

      setActionFeedback("✅ Penugasan baru berhasil dipublikasikan!");
      await loadData();
      setTimeout(() => setSheetMode("none"), 1200);
    } catch (err) {
      console.error(err);
      setActionFeedback("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Edit Assignment
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssignment || !title || !dueDate) return;

    setSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/assignments/${targetAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate: new Date(dueDate).toISOString(),
          attachmentUrl: attachmentUrl.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setActionFeedback(result.message || "Gagal memperbarui tugas.");
        return;
      }

      setActionFeedback("✅ Penugasan berhasil diperbarui!");
      await loadData();
      setTimeout(() => setSheetMode("none"), 1200);
    } catch (err) {
      console.error(err);
      setActionFeedback("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Soft Delete
  const handleConfirmDelete = async () => {
    if (!targetAssignment) return;

    setSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/assignments/${targetAssignment.id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        setActionFeedback(result.message || "Gagal menghapus tugas.");
        return;
      }

      setActionFeedback("✅ Penugasan berhasil dihapus.");
      await loadData();
      setTimeout(() => setSheetMode("none"), 1200);
    } catch (err) {
      console.error(err);
      setActionFeedback("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers Penilaian & Review (Khusus Admin)
  const handleOpenReviewModal = (row: StudentSubmissionRow) => {
    setSelectedReviewSub(row);
    setReviewScore(row.score !== null && row.score !== undefined ? String(row.score) : "");
    setReviewFeedback(row.feedback || "");
    setReviewModalError(null);
    setReviewModalSuccess(null);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewSub || !selectedReviewSub.submissionId || !user) return;

    const numScore = Number(reviewScore);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setReviewModalError("Nilai skor harus berupa angka antara 0 hingga 100.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewModalError(null);
    setReviewModalSuccess(null);

    try {
      const res = await fetch(`/api/submissions/${selectedReviewSub.submissionId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: numScore,
          feedback: reviewFeedback.trim(),
          reviewedBy: user.id,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setReviewModalError(result.message || "Gagal menyimpan review/nilai tugas.");
        return;
      }

      setReviewModalSuccess(`✅ Berhasil memberikan nilai ${numScore} untuk ${selectedReviewSub.nama}!`);
      await loadData();

      setTimeout(() => {
        setIsReviewModalOpen(false);
        setSelectedReviewSub(null);
      }, 1000);
    } catch (err: any) {
      console.error("Gagal submit review admin:", err);
      setReviewModalError("Terjadi kesalahan jaringan saat menyimpan review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter tab data
  const filteredList = assignments.filter((item) => {
    if (tabFilter === "active") return !item.isExpired;
    if (tabFilter === "history") return item.isExpired;
    return true;
  });

  // Susun data pengumpulan lengkap untuk assignment yang sedang dilihat
  const viewingSubmissionsList: StudentSubmissionRow[] = [];
  if (viewingAssignment) {
    const groupMap: Record<number, string> = {};
    allGroups.forEach((g) => {
      if (g.id && g.name) groupMap[g.id] = g.name;
    });

    const processedMabaIds = new Set<number>();

    allMaba.forEach((maba) => {
      processedMabaIds.add(maba.id);
      const sub = allSubmissions.find(
        (s) =>
          (s.assignmentId === viewingAssignment.id || s.assignment_id === viewingAssignment.id) &&
          (s.mabaId === maba.id || s.maba?.id === maba.id || s.maba?.nim === maba.nim)
      );

      const gId = maba.mGroupsId || maba.group?.id || sub?.maba?.mGroupsId || sub?.maba?.group?.id;
      const gName = maba.group?.name || sub?.maba?.group?.name || (gId ? groupMap[gId] : undefined) || "Kelompok";

      if (sub) {
        viewingSubmissionsList.push({
          mabaId: maba.id,
          nim: maba.nim || maba.username || "-",
          nama: maba.nama,
          prodi: maba.prodi || "-",
          groupId: gId,
          groupName: gName,
          hasSubmitted: true,
          submissionId: sub.id,
          status: sub.status || "submitted",
          score: sub.score !== null && sub.score !== undefined ? Number(sub.score) : null,
          feedback: sub.feedback,
          reviewerName: sub.reviewer?.nama || null,
          reviewedAt: sub.reviewedAt || sub.reviewed_at || null,
          fileUrl: sub.fileUrl || sub.file_url,
          notes: sub.notes,
          submittedAt: sub.submittedAt || sub.submitted_at,
        });
      } else {
        viewingSubmissionsList.push({
          mabaId: maba.id,
          nim: maba.nim || maba.username || "-",
          nama: maba.nama,
          prodi: maba.prodi || "-",
          groupId: gId,
          groupName: gName,
          hasSubmitted: false,
          status: "unsubmitted",
        });
      }
    });

    // Masukkan juga submission yang mungkin maba-nya belum tercatat di allMaba
    const extraSubmissions = allSubmissions.filter(
      (s) =>
        (s.assignmentId === viewingAssignment.id || s.assignment_id === viewingAssignment.id) &&
        s.maba &&
        !processedMabaIds.has(s.maba.id || s.mabaId)
    );
    extraSubmissions.forEach((s) => {
      const extraMaba = s.maba;
      const gId = extraMaba.mGroupsId || extraMaba.group?.id || s.mabaGroupId;
      const gName = extraMaba.group?.name || (gId ? groupMap[gId] : undefined) || "Kelompok";
      viewingSubmissionsList.push({
        mabaId: extraMaba.id || s.mabaId,
        nim: extraMaba.nim || "-",
        nama: extraMaba.nama || "Mahasiswa",
        prodi: extraMaba.prodi || "-",
        groupId: gId,
        groupName: gName,
        hasSubmitted: true,
        submissionId: s.id,
        status: s.status || "submitted",
        score: s.score !== null && s.score !== undefined ? Number(s.score) : null,
        feedback: s.feedback,
        reviewerName: s.reviewer?.nama || null,
        reviewedAt: s.reviewedAt || s.reviewed_at || null,
        fileUrl: s.fileUrl || s.file_url,
        notes: s.notes,
        submittedAt: s.submittedAt || s.submitted_at,
      });
    });
  }

  // Filter mahasiswa pengumpul pada modal
  const filteredSubmissionRows = viewingSubmissionsList.filter((row) => {
    if (subGroupFilter !== "all") {
      const matchId = String(row.groupId) === subGroupFilter;
      const matchName = row.groupName.toLowerCase() === subGroupFilter.toLowerCase();
      if (!matchId && !matchName) return false;
    }
    if (subStatusFilter !== "all") {
      if (subStatusFilter === "submitted" && row.status !== "submitted") return false;
      if (subStatusFilter === "late" && row.status !== "late") return false;
      if (subStatusFilter === "graded" && row.status !== "graded") return false;
      if (subStatusFilter === "unsubmitted" && row.status !== "unsubmitted") return false;
    }
    if (subSearchQuery.trim()) {
      const q = subSearchQuery.toLowerCase();
      const matchName = row.nama.toLowerCase().includes(q);
      const matchNim = row.nim.toLowerCase().includes(q);
      if (!matchName && !matchNim) return false;
    }
    return true;
  });

  const totalSubmittedInViewing = filteredSubmissionRows.filter((r) => r.hasSubmitted).length;
  const totalNotSubmittedInViewing = filteredSubmissionRows.filter((r) => !r.hasSubmitted).length;
  const totalGradedInViewing = filteredSubmissionRows.filter((r) => r.status === "graded").length;

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  return (
    <MobileShell
      title="Kelola Penugasan"
      role="admin"
      wide={true}
      user={user ? { nama: user.nama, role: user.role } : undefined}
    >
      {/* Header Banner */}
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
            Manajemen Orientasi
          </span>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          Kelola Penugasan Mahasiswa
        </h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: 0 }}>
          Pantau status pengumpulan maba, publikasikan tugas baru, dan periksa berkas kiriman mahasiswa secara real-time.
        </p>
      </div>

      {/* Tabs Filter */}
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
          onClick={() => setTabFilter("all")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: tabFilter === "all" ? "#FFFFFF" : "transparent",
            color: tabFilter === "all" ? "#1F4B5D" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: tabFilter === "all" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Semua ({assignments.length})
        </button>

        <button
          type="button"
          onClick={() => setTabFilter("active")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: tabFilter === "active" ? "#FFFFFF" : "transparent",
            color: tabFilter === "active" ? "#059669" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: tabFilter === "active" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Aktif ({assignments.filter((a) => !a.isExpired).length})
        </button>

        <button
          type="button"
          onClick={() => setTabFilter("history")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: tabFilter === "history" ? "#FFFFFF" : "transparent",
            color: tabFilter === "history" ? "#64748B" : "rgba(31, 75, 93, 0.65)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow: tabFilter === "history" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
          }}
        >
          Riwayat ({assignments.filter((a) => a.isExpired).length})
        </button>
      </div>

      {/* List Assignments */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "30px" }}>
        {filteredList.length === 0 ? (
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
            Tidak ada tugas pada kategori ini.
          </div>
        ) : (
          filteredList.map((item) => {
          const isExpanded = expandedAssignmentId === item.id;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: "#FFFFFF",
                padding: isExpanded ? "20px" : "16px",
                borderRadius: "16px",
                border: isExpanded ? "2px solid #1F4B5D" : "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: isExpanded ? "0 10px 28px rgba(31, 75, 93, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {/* Header Kartu Tugas */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F1E19", margin: "0 0 4px 0" }}>
                    {item.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>
                    <Calendar size={14} />
                    <span>
                      Batas:{" "}
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                        : "-"}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "999px",
                    backgroundColor: item.isExpired ? "rgba(100, 116, 139, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    color: item.isExpired ? "#64748B" : "#059669",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {item.isExpired ? "Riwayat" : "Aktif"}
                </span>
              </div>

              {item.description && (
                <p style={{ fontSize: "0.8rem", color: "rgba(31, 75, 93, 0.8)", margin: 0 }}>
                  {item.description}
                </p>
              )}

              {/* Rekap Persentase Pengumpulan Maba */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 75, 93, 0.03)",
                  border: "1px solid rgba(31, 75, 93, 0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D" }}>
                    Terkumpul: {item.totalSubmissions} dari {item.totalMaba} Mahasiswa
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: item.percentage >= 70 ? "#059669" : "#D97706" }}>
                    {item.percentage}%
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "rgba(31, 75, 93, 0.1)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: `${item.percentage}%`,
                      height: "100%",
                      backgroundColor: item.percentage >= 70 ? "#10B981" : "#F59E0B",
                      borderRadius: "999px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.65)", flexWrap: "wrap", gap: "4px" }}>
                  <span>Tepat Waktu: {item.submittedCount}</span>
                  <span>Terlambat: {item.lateCount}</span>
                  <span>Dinilai: {item.gradedCount}</span>
                  {item.avgScore !== null && item.avgScore !== undefined && (
                    <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                      <Award size={12} color="#059669" />
                      Rerata: {item.avgScore}/100
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Lihat Pengumpul (Expand), Edit, Hapus */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center", marginTop: "2px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleToggleSubmissions(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: isExpanded ? "1px solid #1F4B5D" : "none",
                    backgroundColor: isExpanded ? "rgba(31, 75, 93, 0.1)" : "#1F4B5D",
                    color: isExpanded ? "#1F4B5D" : "#FFFFFF",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: isExpanded ? "none" : "0 2px 8px rgba(31, 75, 93, 0.2)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Users size={15} />
                  <span>
                    {isExpanded
                      ? "Tutup Pengumpul"
                      : `Lihat Pengumpul (${item.totalSubmissions}/${item.totalMaba})`}
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(31, 75, 93, 0.2)",
                      backgroundColor: "#FFFFFF",
                      color: "#1F4B5D",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={13} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      backgroundColor: "rgba(239, 68, 68, 0.05)",
                      color: "#DC2626",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BAGIAN DIPERLEBAR: DAFTAR PENGUMPUL & FILTER TERPADU (INLINE PADA CARD)    */}
              {/* ========================================================================= */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "16px",
                    borderTop: "1.5px dashed rgba(31, 75, 93, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {/* Toolbar Ringkasan & Unduh CSV */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                      backgroundColor: "rgba(31, 75, 93, 0.03)",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid rgba(31, 75, 93, 0.08)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileCheck size={16} color="#1F4B5D" />
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F4B5D" }}>
                          Daftar Pengumpulan Mahasiswa
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", fontSize: "0.73rem", color: "rgba(31, 75, 93, 0.7)", flexWrap: "wrap" }}>
                        <span>Terkumpul: <strong style={{ color: "#059669" }}>{totalSubmittedInViewing}</strong></span>
                        <span>•</span>
                        <span>Belum: <strong style={{ color: "#DC2626" }}>{totalNotSubmittedInViewing}</strong></span>
                        <span>•</span>
                        <span>Dinilai: <strong style={{ color: "#1F4B5D" }}>{totalGradedInViewing}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(`/api/export/assignments?assignmentId=${item.id}`, "_blank");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        color: "#1F4B5D",
                        border: "1px solid rgba(31, 75, 93, 0.25)",
                        fontWeight: 700,
                        fontSize: "0.74rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <Download size={13} />
                      <span>Unduh CSV</span>
                    </button>
                  </div>

                  {/* Filter Toolbar: Search, Kelompok, Status Pills */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {/* Search Input */}
                      <div style={{ position: "relative", flex: "1 1 200px" }}>
                        <Search
                          size={14}
                          style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "rgba(31, 75, 93, 0.5)",
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Cari nama atau NIM maba..."
                          value={subSearchQuery}
                          onChange={(e) => setSubSearchQuery(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 10px 7px 30px",
                            borderRadius: "8px",
                            border: "1px solid rgba(31, 75, 93, 0.2)",
                            fontSize: "0.76rem",
                            outline: "none",
                            backgroundColor: "#FFFFFF",
                          }}
                        />
                        {subSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSubSearchQuery("")}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px",
                              color: "rgba(31, 75, 93, 0.5)",
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Filter Kelompok */}
                      <div style={{ position: "relative", minWidth: "160px", flex: "0 1 180px" }}>
                        <select
                          value={subGroupFilter}
                          onChange={(e) => setSubGroupFilter(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "7px 24px 7px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(31, 75, 93, 0.2)",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            color: "#1F4B5D",
                            backgroundColor: "#FFFFFF",
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="all">Semua Kelompok</option>
                          {allGroups.map((g) => (
                            <option key={g.id} value={String(g.id)}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pill Filter Status Pengumpulan */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[
                        { id: "all", label: "Semua" },
                        { id: "submitted", label: "Tepat Waktu" },
                        { id: "late", label: "Terlambat" },
                        { id: "graded", label: "Sudah Dinilai" },
                        { id: "unsubmitted", label: "Belum Mengumpulkan" },
                      ].map((btn) => {
                        const isActive = subStatusFilter === btn.id;
                        return (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => setSubStatusFilter(btn.id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              border: isActive ? "1px solid #1F4B5D" : "1px solid rgba(31, 75, 93, 0.15)",
                              backgroundColor: isActive ? "#1F4B5D" : "#FFFFFF",
                              color: isActive ? "#FFFFFF" : "rgba(31, 75, 93, 0.75)",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daftar Mahasiswa Pengumpul */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      maxHeight: "550px",
                      overflowY: "auto",
                      paddingRight: "2px",
                    }}
                  >
                    {filteredSubmissionRows.length === 0 ? (
                      <div
                        style={{
                          padding: "24px 16px",
                          textAlign: "center",
                          backgroundColor: "rgba(31, 75, 93, 0.02)",
                          borderRadius: "10px",
                          border: "1px dashed rgba(31, 75, 93, 0.15)",
                          color: "rgba(31, 75, 93, 0.6)",
                          fontSize: "0.78rem",
                        }}
                      >
                        Tidak ada mahasiswa yang sesuai dengan filter pencarian.
                      </div>
                    ) : (
                      filteredSubmissionRows.map((row) => (
                        <div
                          key={`${row.mabaId}-${row.submissionId || "nosub"}`}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "12px",
                            backgroundColor: row.hasSubmitted ? "#FFFFFF" : "rgba(239, 68, 68, 0.02)",
                            border: row.hasSubmitted
                              ? row.status === "graded"
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : "1px solid rgba(31, 75, 93, 0.12)"
                              : "1px solid rgba(239, 68, 68, 0.2)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.02)",
                          }}
                        >
                          {/* Header Baris Maba */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1F1E19" }}>
                                {row.nama}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.7)", marginTop: "1px" }}>
                                NIM: {row.nim} • {row.groupName || "Tanpa Kelompok"}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "999px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                backgroundColor:
                                  row.status === "graded"
                                    ? "rgba(16, 185, 129, 0.12)"
                                    : row.status === "late"
                                    ? "rgba(245, 158, 11, 0.12)"
                                    : row.status === "submitted"
                                    ? "rgba(104, 207, 235, 0.2)"
                                    : "rgba(239, 68, 68, 0.12)",
                                color:
                                  row.status === "graded"
                                    ? "#059669"
                                    : row.status === "late"
                                    ? "#D97706"
                                    : row.status === "submitted"
                                    ? "#0F766E"
                                    : "#DC2626",
                              }}
                            >
                              {row.status === "graded"
                                ? "Selesai Dinilai"
                                : row.status === "late"
                                ? "Terlambat"
                                : row.status === "submitted"
                                ? "Tepat Waktu"
                                : "Belum Mengumpulkan"}
                            </span>
                          </div>

                          {row.hasSubmitted ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.74rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(31, 75, 93, 0.7)", flexWrap: "wrap", gap: "4px" }}>
                                <span>
                                  Dikirim:{" "}
                                  {row.submittedAt
                                    ? new Date(row.submittedAt).toLocaleString("id-ID", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })
                                    : "-"}
                                </span>
                                {row.fileUrl && (
                                  <a
                                    href={row.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#1F4B5D",
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textDecoration: "none",
                                      backgroundColor: "rgba(31, 75, 93, 0.06)",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <ExternalLink size={11} />
                                    <span>Buka Berkas</span>
                                  </a>
                                )}
                              </div>

                              {row.notes && (
                                <div style={{ color: "#1F1E19", fontStyle: "italic", fontSize: "0.72rem", backgroundColor: "rgba(31, 75, 93, 0.03)", padding: "4px 8px", borderRadius: "6px" }}>
                                  Catatan Maba: &quot;{row.notes}&quot;
                                </div>
                              )}

                              {/* Kartu Nilai jika sudah dinilai */}
                              {row.score !== null && row.score !== undefined ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(16, 185, 129, 0.08)",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#065F46", fontWeight: 700, fontSize: "0.76rem" }}>
                                    <Award size={14} color="#059669" />
                                    <span>Nilai Tugas:</span>
                                  </div>
                                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#059669" }}>
                                    {row.score} <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(6, 95, 70, 0.7)" }}>/ 100</span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "rgba(31, 75, 93, 0.04)",
                                    color: "rgba(31, 75, 93, 0.65)",
                                    fontSize: "0.7rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  ⏳ Belum dinilai. Silakan periksa berkas dan beri nilai.
                                </div>
                              )}

                              {/* Catatan Feedback Review */}
                              {row.feedback && (
                                <div
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(104, 207, 235, 0.08)",
                                    border: "1px solid rgba(104, 207, 235, 0.25)",
                                    color: "#0F766E",
                                    fontSize: "0.74rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "3px",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontWeight: 700 }}>Catatan Review Admin:</span>
                                    {row.reviewerName && (
                                      <span style={{ fontSize: "0.68rem", opacity: 0.85, color: "#1F4B5D" }}>
                                        Oleh: {row.reviewerName}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontStyle: "italic", color: "#11110E", lineHeight: 1.35 }}>
                                    &quot;{row.feedback}&quot;
                                  </div>
                                  {row.reviewedAt && (
                                    <span style={{ fontSize: "0.65rem", opacity: 0.65, textAlign: "right" }}>
                                      Dinilai pada:{" "}
                                      {new Date(row.reviewedAt).toLocaleString("id-ID", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Tombol Beri Nilai & Review Khusus Admin */}
                              <div style={{ marginTop: "2px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewModal(row)}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    padding: "7px 12px",
                                    borderRadius: "8px",
                                    backgroundColor: row.score !== null && row.score !== undefined ? "rgba(31, 75, 93, 0.08)" : "#1F4B5D",
                                    color: row.score !== null && row.score !== undefined ? "#1F4B5D" : "#FFFFFF",
                                    border: row.score !== null && row.score !== undefined ? "1px solid rgba(31, 75, 93, 0.25)" : "none",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <Award size={14} />
                                  <span>{row.score !== null && row.score !== undefined ? "Edit Nilai & Catatan Review" : "Beri Nilai & Review Tugas"}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.72rem", color: "#DC2626", fontStyle: "italic" }}>
                              Belum mengunggah berkas penugasan.
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tombol Tutup Daftar Pengumpul di Bagian Bawah */}
                  <div style={{ textAlign: "center", paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedAssignmentId(null);
                        setViewingAssignment(null);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "transparent",
                        border: "none",
                        color: "rgba(31, 75, 93, 0.7)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      <span>Tutup Daftar Pengumpul</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {/* FAB Tambah Tugas Baru (+) */}
      <Fab
        onClick={handleOpenCreate}
        icon={<Plus size={24} />}
        label="Tugas Baru"
        ariaLabel="Publikasi Tugas Baru"
        variant="primary"
        bottomOffset={84}
      />

      {/* Modal Penilaian & Review Tugas (Khusus Admin) */}
      {isReviewModalOpen && selectedReviewSub && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(17, 17, 14, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => {
            if (!isSubmittingReview) {
              setIsReviewModalOpen(false);
              setSelectedReviewSub(null);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              padding: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={18} color="#1F4B5D" />
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F4B5D", margin: 0 }}>
                    Penilaian &amp; Review Tugas
                  </h3>
                </div>
                <p style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", margin: "4px 0 0" }}>
                  Mahasiswa: <strong style={{ color: "#1F1E19" }}>{selectedReviewSub.nama}</strong> ({selectedReviewSub.nim || "-"})
                </p>
                <p style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.6)", margin: "2px 0 0" }}>
                  Kelompok: {selectedReviewSub.groupName || "Belum Ditentukan"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingReview) {
                    setIsReviewModalOpen(false);
                    setSelectedReviewSub(null);
                  }
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#1F4B5D",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Berkas Penugasan yang Dikirim */}
            {selectedReviewSub.fileUrl && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(104, 207, 235, 0.1)",
                  border: "1px solid rgba(104, 207, 235, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0F766E", fontWeight: 700 }}>
                  <FileText size={16} />
                  <span>Berkas Pengumpulan Maba</span>
                </div>
                <a
                  href={selectedReviewSub.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1F4B5D",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Buka Berkas</span>
                </a>
              </div>
            )}

            {selectedReviewSub.notes && (
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(31, 75, 93, 0.04)",
                  fontSize: "0.72rem",
                  color: "#1F1E19",
                  fontStyle: "italic",
                }}
              >
                Catatan Mahasiswa: &quot;{selectedReviewSub.notes}&quot;
              </div>
            )}

            {/* Error & Success Feedback */}
            {reviewModalError && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#DC2626",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                ⚠️ {reviewModalError}
              </div>
            )}

            {reviewModalSuccess && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#059669",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {reviewModalSuccess}
              </div>
            )}

            {/* Form Input Nilai & Feedback */}
            <form onSubmit={handleSaveReview} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Nilai Tugas (Skala 0 - 100) <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  required
                  placeholder="Contoh: 85"
                  value={reviewScore}
                  onChange={(e) => setReviewScore(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1F1E19",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Catatan Review / Feedback Admin (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan evaluasi, saran perbaikan, atau catatan untuk mahasiswa..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.8rem",
                    color: "#1F1E19",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setSelectedReviewSub(null);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    backgroundColor: "transparent",
                    color: "rgba(31, 75, 93, 0.8)",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: isSubmittingReview ? "not-allowed" : "pointer",
                    opacity: isSubmittingReview ? 0.7 : 1,
                  }}
                >
                  {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                  <span>{isSubmittingReview ? "Menyimpan..." : "Simpan Nilai & Review"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modal: Tambah / Edit / Hapus */}
      <BottomSheet
        isOpen={sheetMode !== "none"}
        onClose={() => setSheetMode("none")}
        title={
          sheetMode === "create"
            ? "Publikasi Tugas Baru"
            : sheetMode === "edit"
            ? "Edit Informasi Tugas"
            : "Konfirmasi Hapus Tugas"
        }
        maxHeight="88vh"
      >
        <div style={{ padding: "4px 0 18px" }}>
          {/* Feedback Alert */}
          {actionFeedback && (
            <div
              style={{
                padding: "10px",
                borderRadius: "10px",
                backgroundColor: actionFeedback.startsWith("✅") ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: actionFeedback.startsWith("✅") ? "#059669" : "#DC2626",
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              {actionFeedback}
            </div>
          )}

          {/* Form Tambah / Edit Tugas */}
          {(sheetMode === "create" || sheetMode === "edit") && (
            <form
              onSubmit={sheetMode === "create" ? handleSaveCreate : handleSaveEdit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Judul Penugasan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mind Mapping Karir & Tri Dharma"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  placeholder="Tuliskan format pengumpulan, instruksi, dan kriteria penilaian..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Batas Waktu Pengumpulan (Due Date):
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  Link URL Template / Referensi (Opsional):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
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

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSheetMode("none")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    backgroundColor: "#FFFFFF",
                    color: "#1F4B5D",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{sheetMode === "create" ? "Publikasikan" : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Konfirmasi Hapus Tugas */}
          {sheetMode === "delete" && targetAssignment && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  color: "#DC2626",
                }}
              >
                <AlertTriangle size={24} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Apakah Anda yakin ingin menghapus penugasan <strong>&quot;{targetAssignment.title}&quot;</strong>?
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSheetMode("none")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    backgroundColor: "#FFFFFF",
                    color: "#1F4B5D",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>Ya, Hapus Tugas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </MobileShell>
  );
}
