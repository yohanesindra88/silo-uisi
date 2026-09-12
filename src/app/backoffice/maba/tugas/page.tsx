"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  FileText,
  Calendar,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  ChevronRight,
  Send,
  Loader2,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
  nim?: string | null;
}

interface AssignmentItem {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  due_date?: string;
  attachmentUrl?: string;
  attachment_url?: string;
}

interface SubmissionItem {
  id: number;
  assignmentId?: number;
  assignment_id?: number;
  mabaId?: number;
  maba_id?: number;
  fileUrl?: string;
  file_url?: string;
  notes?: string;
  status: "submitted" | "late" | "graded" | "resubmit";
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string;
  submitted_at?: string;
}

const formatDueDateSafe = (d: any) => {
  if (!d) return "-";
  const normalized = typeof d === "string" ? d.replace(" ", "T") : d;
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) return String(d);
  return parsed.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

export default function MabaTugasPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, SubmissionItem>>({});
  const [loading, setLoading] = useState(true);

  // Bottom Sheet Upload / Detail State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Mode pengumpulan: unggah berkas ke server sendiri, atau tempel tautan.
  // Mode tautan dipertahankan karena alur Google Drive / Instagram / TikTok
  // sudah dipakai di produksi dan baris lama menyimpan URL semacam itu.
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMeta, setUploadedMeta] = useState<{
    thumbnail: string;
    originalName: string;
  } | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "submission");

      const res = await fetch("/api/media", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setUploadError(json.message || "Gagal mengunggah berkas.");
        return;
      }

      setFileUrl(json.data.url);
      setUploadedMeta({
        thumbnail: json.data.variants?.["600"] || json.data.url,
        originalName: json.data.originalName || file.name,
      });
    } catch {
      setUploadError("Gagal menghubungi server. Periksa koneksi Anda.");
    } finally {
      setUploading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // Load assignments
      const assignRes = await fetch("/api/assignments");
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(assignData.data || []);
      }

      // Load maba submissions
      if (meData.user?.id) {
        const subRes = await fetch(`/api/submissions?mabaId=${meData.user.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          const map: Record<number, SubmissionItem> = {};
          (subData.data || []).forEach((item: any) => {
            const aId = item.assignmentId || item.assignment_id;
            if (aId) map[aId] = item;
          });
          setSubmissions(map);
        }
      }
    } catch (err) {
      console.error("Gagal memuat tugas maba:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssignment = (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    const existing = submissions[assignment.id];
    if (existing) {
      const existingUrl = existing.fileUrl || existing.file_url || "";
      setFileUrl(existingUrl);
      setNotes(existing.notes || "");

      // Baris lama menyimpan tautan Drive/Instagram; baris baru menyimpan URL
      // hasil unggahan. Bentuk URL-nya yang menentukan mode mana yang dibuka.
      if (existingUrl.startsWith("/media/uploads/")) {
        setUploadMode("file");
        setUploadedMeta({
          thumbnail: existingUrl.replace(/\.(w\d+|orig)\.webp$/i, ".w600.webp"),
          originalName: "Berkas yang sudah diunggah",
        });
      } else {
        setUploadMode(existingUrl ? "link" : "file");
        setUploadedMeta(null);
      }
    } else {
      setFileUrl("");
      setNotes("");
      setUploadMode("file");
      setUploadedMeta(null);
    }
    setUploadError(null);
    setSubmitFeedback(null);
    setIsSheetOpen(true);
  };

  const handleSubmitTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !user) return;

    if (!fileUrl.trim()) {
      setSubmitFeedback({ type: "error", msg: "Link URL file tugas wajib diisi." });
      return;
    }

    setSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          mabaId: user.id,
          fileUrl: fileUrl.trim(),
          notes: notes.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setSubmitFeedback({ type: "error", msg: result.message || "Gagal mengumpulkan tugas." });
        return;
      }

      setSubmitFeedback({
        type: "success",
        msg: result.isLate
          ? "Tugas tersimpan (Tercatat Terlambat melewati deadline)."
          : "Tugas berhasil dikumpulkan tepat waktu!",
      });

      loadData();
      setTimeout(() => {
        setIsSheetOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitFeedback({ type: "error", msg: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat, Mohon Tunggu" />;
  }

  const selectedSub = selectedAssignment ? submissions[selectedAssignment.id] : null;
  const isSelectedGraded = selectedSub?.status === "graded";

  return (
    <MobileShell
      title="Daftar Penugasan"
      role="maba"
      user={user ? { nama: user.nama, role: user.role, nim: user.nim } : undefined}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #2A6880 100%)",
          borderRadius: "18px",
          padding: "18px",
          color: "#FAFAFA",
          marginBottom: "18px",
          boxShadow: "0 8px 24px rgba(31, 75, 93, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Sparkles size={16} color="#68CFEB" />
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#68CFEB", fontWeight: 700 }}>
            Tugas Orientasi SILO 2026
          </span>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 4px 0", color: "#FFFFFF" }}>
          Pengumpulan &amp; Review Tugas
        </h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.9, margin: 0 }}>
          Kumpulkan tugas tepat waktu melalui tautan Google Drive / Docs sesuai instruksi panitia.
        </p>
      </div>

      {/* List Penugasan */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "30px" }}>
        {assignments.length === 0 ? (
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
            Belum ada daftar penugasan aktif dari panitia.
          </div>
        ) : (
          assignments.map((item) => {
            const sub = submissions[item.id];
            const isGraded = sub?.status === "graded";
            const isLate = sub?.status === "late";
            const isSubmitted = sub?.status === "submitted";

            // Status Badge Config
            let badgeText = "Belum Mengumpulkan";
            let badgeBg = "rgba(239, 68, 68, 0.1)";
            let badgeColor = "#DC2626";

            if (isGraded) {
              badgeText = `Dinilai: ${sub.score}/100`;
              badgeBg = "rgba(16, 185, 129, 0.12)";
              badgeColor = "#059669";
            } else if (isLate) {
              badgeText = "Terlambat";
              badgeBg = "rgba(245, 158, 11, 0.12)";
              badgeColor = "#D97706";
            } else if (isSubmitted) {
              badgeText = "Tepat Waktu";
              badgeBg = "rgba(104, 207, 235, 0.2)";
              badgeColor = "#0F766E";
            }

            return (
              <div
                key={item.id}
                onClick={() => handleOpenAssignment(item)}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(31, 75, 93, 0.08)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "transform 150ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F1E19", margin: "0 0 4px 0" }}>
                      {item.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.65)" }}>
                      <Calendar size={14} />
                      <span>Batas: {formatDueDateSafe(item.dueDate || item.due_date)}</span>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badgeText}
                  </span>
                </div>

                {item.description && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "rgba(31, 75, 93, 0.8)",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </p>
                )}

                {/* Feedback preview jika sudah dinilai */}
                {isGraded && sub?.feedback && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      fontSize: "0.75rem",
                      color: "#065F46",
                    }}
                  >
                    <strong>Catatan Evaluasi:</strong> &quot;{sub.feedback}&quot;
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "4px",
                    color: "var(--lp-ocean-blue, #1F4B5D)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  <span>{isGraded ? "Lihat Review Lengkap" : sub ? "Edit Pengumpulan" : "Kumpulkan Sekarang"}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sheet Modal Pengumpulan & Review */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={isSelectedGraded ? "Hasil Penilaian Tugas" : selectedSub ? "Update Pengumpulan Tugas" : "Kumpulkan Tugas"}
        maxHeight="88vh"
      >
        {selectedAssignment && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "4px 0 18px" }}>
            {/* Informasi Tugas */}
            <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "rgba(31, 75, 93, 0.04)" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1F1E19", marginBottom: "4px" }}>
                {selectedAssignment.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", marginBottom: "8px" }}>
                Batas Waktu: {formatDueDateSafe(selectedAssignment.dueDate || selectedAssignment.due_date)}
              </div>
              {selectedAssignment.description && (
                <div style={{ fontSize: "0.8rem", color: "#1F1E19", lineHeight: 1.4 }}>
                  {selectedAssignment.description}
                </div>
              )}
              {(selectedAssignment.attachmentUrl || selectedAssignment.attachment_url) && (
                <a
                  href={selectedAssignment.attachmentUrl || selectedAssignment.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.75rem",
                    color: "#0F766E",
                    fontWeight: 700,
                    marginTop: "8px",
                  }}
                >
                  <ExternalLink size={14} />
                  Buka Panduan / Template Tugas
                </a>
              )}
            </div>

            {/* Kartu Hasil Review Nilai & Feedback (Jika sudah dinilai) */}
            {isSelectedGraded && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(104, 207, 235, 0.12) 100%)",
                  border: "1px solid #10B981",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#065F46", fontWeight: 700 }}>
                    <Award size={20} color="#059669" />
                    <span>Nilai Tugas Anda</span>
                  </div>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "#059669",
                    }}
                  >
                    {selectedSub?.score}
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(6, 95, 70, 0.7)" }}>/100</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#065F46", marginBottom: "4px" }}>
                  Catatan Evaluasi / Review:
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#1F1E19",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    padding: "10px",
                    borderRadius: "8px",
                    lineHeight: 1.4,
                  }}
                >
                  {selectedSub?.feedback || "Tugas telah diperiksa dan dinilai dengan baik."}
                </div>
              </div>
            )}

            {/* Feedback Alert */}
            {submitFeedback && (
              <div
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  backgroundColor: submitFeedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  color: submitFeedback.type === "success" ? "#059669" : "#DC2626",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {submitFeedback.msg}
              </div>
            )}

            {/* Form Pengumpulan / Update Link URL */}
            <form onSubmit={handleSubmitTugas} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Berkas Tugas:
                </label>

                {/* Pemilih mode */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                  {([
                    { key: "file" as const, label: "Unggah Berkas" },
                    { key: "link" as const, label: "Tautan URL" },
                  ]).map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        setUploadMode(mode.key);
                        setFileUrl("");
                        setUploadedMeta(null);
                        setUploadError(null);
                      }}
                      disabled={isSelectedGraded}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: "10px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: isSelectedGraded ? "not-allowed" : "pointer",
                        border: uploadMode === mode.key ? "1px solid #1F4B5D" : "1px solid rgba(31, 75, 93, 0.2)",
                        backgroundColor: uploadMode === mode.key ? "#1F4B5D" : "#FFFFFF",
                        color: uploadMode === mode.key ? "#FFFFFF" : "#1F4B5D",
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {uploadMode === "file" ? (
                  <>
                    {uploadedMeta ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "1px solid rgba(31, 75, 93, 0.2)",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadedMeta.thumbnail}
                          alt="Pratinjau berkas"
                          style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }}
                        />
                        <span style={{ flex: 1, fontSize: "0.75rem", color: "#1F4B5D", wordBreak: "break-all" }}>
                          {uploadedMeta.originalName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFileUrl("");
                            setUploadedMeta(null);
                          }}
                          disabled={isSelectedGraded}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(31, 75, 93, 0.2)",
                            backgroundColor: "#FFFFFF",
                            color: "#1F4B5D",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Ganti
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={isSelectedGraded || uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(file);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: "1px dashed rgba(31, 75, 93, 0.35)",
                          fontSize: "0.8rem",
                          boxSizing: "border-box",
                          backgroundColor: isSelectedGraded ? "rgba(0,0,0,0.03)" : "#FFFFFF",
                        }}
                      />
                    )}

                    {uploading && (
                      <span style={{ fontSize: "0.7rem", color: "#1F4B5D", marginTop: "4px", display: "block" }}>
                        Mengunggah berkas…
                      </span>
                    )}
                    {uploadError && (
                      <span style={{ fontSize: "0.7rem", color: "#DC2626", marginTop: "4px", display: "block" }}>
                        {uploadError}
                      </span>
                    )}
                    {!uploading && !uploadError && (
                      <span style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "4px", display: "block" }}>
                        Format JPG, PNG, WebP, atau PDF. Maksimum 8 MB.
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      disabled={isSelectedGraded}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(31, 75, 93, 0.2)",
                        fontSize: "0.85rem",
                        boxSizing: "border-box",
                        backgroundColor: isSelectedGraded ? "rgba(0,0,0,0.03)" : "#FFFFFF",
                      }}
                    />
                    <span style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)", marginTop: "2px", display: "block" }}>
                      Pastikan akses link Google Drive telah disetel ke &quot;Anyone with the link can view&quot;.
                    </span>
                  </>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Catatan Pengumpulan Tugas (Opsional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tugas sudah direvisi sesuai format bab 1 & 2..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSelectedGraded}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                    backgroundColor: isSelectedGraded ? "rgba(0,0,0,0.03)" : "#FFFFFF",
                  }}
                />
              </div>

              {!isSelectedGraded && (
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1F4B5D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(31, 75, 93, 0.25)",
                    marginTop: "6px",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{selectedSub ? "Perbarui Tautan Tugas" : "Kirimkan Tugas"}</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}
      </BottomSheet>
    </MobileShell>
  );
}
