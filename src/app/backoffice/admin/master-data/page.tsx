"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ImportDropzone } from "@/components/admin/ImportDropzone";
import { ImportSummaryCard } from "@/components/admin/ImportSummaryCard";
import { ImportPreviewTable } from "@/components/admin/ImportPreviewTable";
import { ImportSuccessModal } from "@/components/admin/ImportSuccessModal";
import { ImportEditModal } from "@/components/admin/ImportEditModal";
import { ImportDeleteModal } from "@/components/admin/ImportDeleteModal";
import { ImportFeedbackModal } from "@/components/admin/ImportFeedbackModal";
import { DbUsersTable, DbUserItem } from "@/components/admin/DbUsersTable";
import { DbGroupsTable, DbGroupItem } from "@/components/admin/DbGroupsTable";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { DbDeleteModal } from "@/components/admin/DbDeleteModal";
import { DbEditModal, UserEditData, GroupEditData } from "@/components/admin/DbEditModal";
import {
  Users,
  Layers,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import {
  RowValidationResult,
  GroupImportRow,
  UserImportRow,
  CreatedUserCredential,
} from "@/controllers/import.controller";

interface UserProfile {
  id: number;
  nama: string;
  role: string;
}

interface PreviewData {
  type: "groups" | "users";
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
  };
  rows: RowValidationResult<GroupImportRow | UserImportRow>[];
}

interface ImportResultData {
  total: number;
  createdCount: number;
  updatedCount: number;
  newGroupsCreated?: number;
  credentials?: CreatedUserCredential[];
}

export default function AdminMasterDataPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // View Mode: "database" (Tabel Database) | "import" (Unggah Excel)
  const [viewMode, setViewMode] = useState<"database" | "import">("database");

  // ==========================================
  // STATE: DATA TERSIMPAN DI BASIS DATA
  // ==========================================
  const [dbActiveTab, setDbActiveTab] = useState<"users" | "groups">("users");
  const [dbUsers, setDbUsers] = useState<DbUserItem[]>([]);
  const [dbGroups, setDbGroups] = useState<DbGroupItem[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Checkbox Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

  // Modal Edit di DB State
  const [dbEditModal, setDbEditModal] = useState<{
    isOpen: boolean;
    type: "users" | "groups";
    data: UserEditData | GroupEditData | null;
  }>({
    isOpen: false,
    type: "users",
    data: null,
  });
  const [isSavingDbEdit, setIsSavingDbEdit] = useState(false);
  const [dbEditError, setDbEditError] = useState<string | null>(null);

  // Modal Hapus di DB State (Single & Bulk)
  const [dbDeleteModal, setDbDeleteModal] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    entityType: "users" | "groups";
    id?: number;
    ids?: number[];
    name?: string;
    previewNames?: string[];
    count?: number;
  }>({
    isOpen: false,
    type: "single",
    entityType: "users",
  });
  const [isDeletingDb, setIsDeletingDb] = useState(false);
  const [dbDeleteError, setDbDeleteError] = useState<string | null>(null);

  // ==========================================
  // STATE: IMPORT BERKAS EXCEL
  // ==========================================
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [skipErrors, setSkipErrors] = useState(true);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Sukses Import
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // Modal Edit & Delete Baris Preview Import
  const [activeActionRow, setActiveActionRow] = useState<{
    row: RowValidationResult<GroupImportRow | UserImportRow>;
    isExistingInDb: boolean;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Modal Feedback Notifikasi Hasil Aksi Import
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
    actionType?: "delete_db" | "delete_preview" | "edit_db" | "edit_preview";
    targetName?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  // ==========================================
  // 1. Validasi Autentikasi Pengguna & Load Data DB
  // ==========================================
  const loadDbData = useCallback(async () => {
    setLoadingDb(true);
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/groups?includeRelations=true"),
      ]);

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        if (Array.isArray(uJson.data)) {
          setDbUsers(uJson.data);
        }
      }

      if (groupsRes.ok) {
        const gJson = await groupsRes.json();
        if (Array.isArray(gJson.data)) {
          setDbGroups(gJson.data);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data master dari DB:", err);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.user.role !== "admin" && data.user.role !== "panitia") {
          router.push("/login?error=unauthorized");
          return;
        }
        setUser(data.user);
        await loadDbData();
      } catch (err) {
        console.error("Gagal memeriksa sesi:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, loadDbData]);

  const isAdmin = user?.role === "admin";

  // ==========================================
  // HANDLERS: TAB & SELEKSI CHECKBOX DB
  // ==========================================
  const toggleUserSelect = (id: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUsers = (ids: number[]) => {
    setSelectedUserIds(new Set(ids));
  };

  const clearUserSelection = () => {
    setSelectedUserIds(new Set());
  };

  const toggleGroupSelect = (id: number) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllGroups = (ids: number[]) => {
    setSelectedGroupIds(new Set(ids));
  };

  const clearGroupSelection = () => {
    setSelectedGroupIds(new Set());
  };

  // ==========================================
  // HANDLERS: AKSI EDIT DI DATABASE
  // ==========================================
  const handleOpenEditUser = (item: DbUserItem) => {
    setDbEditError(null);
    setDbEditModal({
      isOpen: true,
      type: "users",
      data: item,
    });
  };

  const handleOpenEditGroup = (item: DbGroupItem) => {
    setDbEditError(null);
    setDbEditModal({
      isOpen: true,
      type: "groups",
      data: item,
    });
  };

  const handleSaveDbEdit = async (payload: Record<string, unknown>) => {
    if (!dbEditModal.data) return;
    setIsSavingDbEdit(true);
    setDbEditError(null);

    try {
      const res = await fetch(`/api/admin/master-data/${dbEditModal.type}/${dbEditModal.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui data.");
      }

      setDbEditModal((prev) => ({ ...prev, isOpen: false }));
      setFeedback({
        type: "success",
        message: json.message || "Perubahan data berhasil disimpan!",
      });

      setFeedbackModal({
        isOpen: true,
        title: "Perubahan Berhasil Disimpan!",
        message: json.message || "Data telah berhasil diperbarui di database.",
        type: "success",
        actionType: "edit_db",
      });

      await loadDbData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan perubahan.";
      setDbEditError(msg);
    } finally {
      setIsSavingDbEdit(false);
    }
  };

  // ==========================================
  // HANDLERS: AKSI HAPUS DI DATABASE (SINGLE & BULK)
  // ==========================================
  const handleOpenDeleteUser = (item: DbUserItem) => {
    setDbDeleteError(null);
    setDbDeleteModal({
      isOpen: true,
      type: "single",
      entityType: "users",
      id: item.id,
      name: `${item.nama} (${item.username})`,
      previewNames: [`${item.nama} - NIM: ${item.nim || "-"} (${item.username})`],
      count: 1,
    });
  };

  const handleOpenDeleteGroup = (item: DbGroupItem) => {
    setDbDeleteError(null);
    setDbDeleteModal({
      isOpen: true,
      type: "single",
      entityType: "groups",
      id: item.id,
      name: item.name,
      previewNames: [item.name],
      count: 1,
    });
  };

  const handleOpenBulkDelete = (entityType: "users" | "groups") => {
    setDbDeleteError(null);
    if (entityType === "users") {
      const ids = Array.from(selectedUserIds);
      const names = dbUsers
        .filter((u) => selectedUserIds.has(u.id))
        .map((u) => `${u.nama} (${u.username})`);

      setDbDeleteModal({
        isOpen: true,
        type: "bulk",
        entityType: "users",
        ids,
        count: ids.length,
        previewNames: names,
      });
    } else {
      const ids = Array.from(selectedGroupIds);
      const names = dbGroups
        .filter((g) => selectedGroupIds.has(g.id))
        .map((g) => g.name);

      setDbDeleteModal({
        isOpen: true,
        type: "bulk",
        entityType: "groups",
        ids,
        count: ids.length,
        previewNames: names,
      });
    }
  };

  const handleConfirmDbDelete = async () => {
    setIsDeletingDb(true);
    setDbDeleteError(null);

    try {
      if (dbDeleteModal.type === "single" && dbDeleteModal.id) {
        const res = await fetch(`/api/admin/master-data/${dbDeleteModal.entityType}/${dbDeleteModal.id}`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal menghapus data dari database.");
        }

        setDbDeleteModal((prev) => ({ ...prev, isOpen: false }));
        setFeedback({
          type: "success",
          message: json.message || "Data berhasil dihapus dari database.",
        });

        setFeedbackModal({
          isOpen: true,
          title: "Data Berhasil Dihapus!",
          message: json.message || "Data telah dihapus permanen dari basis data.",
          type: "success",
          actionType: "delete_db",
          targetName: dbDeleteModal.name,
        });
      } else if (dbDeleteModal.type === "bulk" && dbDeleteModal.ids) {
        const res = await fetch("/api/admin/master-data/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: dbDeleteModal.entityType,
            ids: dbDeleteModal.ids,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Gagal menghapus data massal.");
        }

        // Bersihkan seleksi centang
        if (dbDeleteModal.entityType === "users") {
          clearUserSelection();
        } else {
          clearGroupSelection();
        }

        setDbDeleteModal((prev) => ({ ...prev, isOpen: false }));
        setFeedback({
          type: "success",
          message: json.message || "Data terpilih berhasil dihapus dari database.",
        });

        setFeedbackModal({
          isOpen: true,
          title: "Hapus Massal Berhasil!",
          message: json.message || `${dbDeleteModal.ids.length} data terpilih telah berhasil dihapus dari basis data.`,
          type: "success",
          actionType: "delete_db",
        });
      }

      await loadDbData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus data.";
      setDbDeleteError(msg);
    } finally {
      setIsDeletingDb(false);
    }
  };

  // ==========================================
  // HANDLERS: IMPORT BERKAS EXCEL
  // ==========================================
  const handleImportTabChange = (tab: "users" | "groups") => {
    setActiveTab(tab);
    setSelectedFile(null);
    setPreviewData(null);
    setFeedback(null);
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setPreviewData(null);
    setFeedback(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memproses preview file Excel.");
      }

      setPreviewData(json.data);
      if (json.data.summary.errorCount > 0) {
        setFeedback({
          type: "error",
          message: `Ditemukan ${json.data.summary.errorCount} baris bermasalah. Periksa rincian pada tabel preview di bawah.`,
        });
      } else {
        setFeedback({
          type: "success",
          message: `File berhasil diproses: ${json.data.summary.validCount} baris valid siap diimpor ke database.`,
        });
      }
    } catch (err: unknown) {
      console.error("Error preview:", err);
      const errMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat membaca file Excel.";
      setFeedback({
        type: "error",
        message: errMessage,
      });
      setSelectedFile(null);
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData || previewData.rows.length === 0) return;

    const validRows = skipErrors
      ? previewData.rows.filter((r) => r.isValid)
      : previewData.rows;

    if (validRows.length === 0) {
      setFeedback({
        type: "error",
        message: "Tidak ada baris data valid untuk diimpor. Perbaiki file terlebih dahulu.",
      });
      return;
    }

    if (previewData.summary.errorCount > 0 && !skipErrors) {
      setFeedback({
        type: "error",
        message: "Centang opsi 'Lewati baris bermasalah' untuk melanjutkan import baris yang valid.",
      });
      return;
    }

    setImporting(true);
    setFeedback(null);

    try {
      const endpoint = activeTab === "groups" ? "/api/admin/import/groups" : "/api/admin/import/users";
      const payloadKey = activeTab === "groups" ? "groups" : "users";
      const payloadData = validRows.map((r) => r.data);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [payloadKey]: payloadData }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal mengeksekusi import data.");
      }

      setImportResult(json.data);
      setIsSuccessModalOpen(true);
      setSelectedFile(null);
      setPreviewData(null);

      // Sinkronkan data tabel database seketika
      await loadDbData();
    } catch (err: unknown) {
      console.error("Error eksekusi import:", err);
      const errMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data ke database.";
      setFeedback({
        type: "error",
        message: errMessage,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSaveEditRow = async (
    updatedData: GroupImportRow | UserImportRow,
    saveDirectlyToDb: boolean
  ) => {
    if (!activeActionRow || !previewData) return;
    const targetRowNumber = activeActionRow.row.rowNumber;

    if (saveDirectlyToDb) {
      const identifier =
        activeTab === "groups"
          ? (activeActionRow.row.data as GroupImportRow).nama_kelompok
          : (activeActionRow.row.data as UserImportRow).username;

      const res = await fetch("/api/admin/import/manage-existing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          identifier,
          data: updatedData,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui data di database.");
      }
      await loadDbData();
    }

    const newRows = previewData.rows.map((r) => {
      if (r.rowNumber !== targetRowNumber) return r;

      if (saveDirectlyToDb) {
        return {
          ...r,
          data: updatedData,
          status: "VALID" as const,
          warnings: ["Data berhasil disinkronkan ke database."],
          isValid: true,
        };
      }

      const oldIdentifier =
        activeTab === "groups"
          ? (r.data as GroupImportRow).nama_kelompok
          : (r.data as UserImportRow).username;
      const newIdentifier =
        activeTab === "groups"
          ? (updatedData as GroupImportRow).nama_kelompok
          : (updatedData as UserImportRow).username;

      const filteredWarnings =
        oldIdentifier !== newIdentifier
          ? r.warnings.filter(
              (w) =>
                !w.toLowerCase().includes("sudah ada di database") &&
                !w.toLowerCase().includes("sudah terdaftar pada pengguna lain")
            )
          : r.warnings;

      return {
        ...r,
        data: updatedData,
        status:
          r.errors.length > 0
            ? ("ERROR" as const)
            : filteredWarnings.length > 0
            ? ("WARNING" as const)
            : ("VALID" as const),
        warnings: filteredWarnings,
        isValid: r.errors.length === 0,
      };
    });

    const newValidCount = newRows.filter((r) => r.isValid).length;
    const newErrorCount = newRows.filter((r) => r.status === "ERROR").length;
    const newWarningCount = newRows.filter((r) => r.status === "WARNING").length;

    setPreviewData({
      ...previewData,
      summary: {
        totalRows: newRows.length,
        validCount: newValidCount,
        errorCount: newErrorCount,
        warningCount: newWarningCount,
      },
      rows: newRows,
    });

    setFeedback({
      type: "success",
      message: saveDirectlyToDb
        ? "Data berhasil diperbarui di database dan antrean impor."
        : `Baris #${targetRowNumber} berhasil diperbarui di antrean impor.`,
    });

    const targetName =
      activeTab === "groups"
        ? (updatedData as GroupImportRow).nama_kelompok
        : (updatedData as UserImportRow).nama || (updatedData as UserImportRow).username;

    setFeedbackModal({
      isOpen: true,
      title: saveDirectlyToDb
        ? "Berhasil Disimpan ke Database!"
        : "Data Baris Berhasil Diperbarui!",
      message: saveDirectlyToDb
        ? `Perubahan data "${targetName}" telah berhasil disimpan langsung ke database dan disinkronkan ke tabel antrean impor.`
        : `Baris #${targetRowNumber} (${targetName}) berhasil diperbarui pada antrean impor.`,
      type: "success",
      actionType: saveDirectlyToDb ? "edit_db" : "edit_preview",
      targetName,
    });
  };

  const handleDeleteFromPreview = () => {
    if (!activeActionRow || !previewData) return;
    const targetRowNumber = activeActionRow.row.rowNumber;

    const identifier =
      activeTab === "groups"
        ? (activeActionRow.row.data as GroupImportRow).nama_kelompok
        : (activeActionRow.row.data as UserImportRow).nama ||
          (activeActionRow.row.data as UserImportRow).username;

    const newRows = previewData.rows.filter((r) => r.rowNumber !== targetRowNumber);
    const newValidCount = newRows.filter((r) => r.isValid).length;
    const newErrorCount = newRows.filter((r) => r.status === "ERROR").length;
    const newWarningCount = newRows.filter((r) => r.status === "WARNING").length;

    setPreviewData({
      ...previewData,
      summary: {
        totalRows: newRows.length,
        validCount: newValidCount,
        errorCount: newErrorCount,
        warningCount: newWarningCount,
      },
      rows: newRows,
    });

    setFeedback({
      type: "success",
      message: `Baris #${targetRowNumber} berhasil dihapus dari antrean impor.`,
    });

    setFeedbackModal({
      isOpen: true,
      title: "Dihapus dari Antrean Impor",
      message: `Baris #${targetRowNumber} (${identifier}) telah berhasil dikeluarkan dari daftar impor saat ini. Data yang tersimpan di dalam database tetap aman dan tidak diubah.`,
      type: "info",
      actionType: "delete_preview",
      targetName: identifier,
    });
  };

  const handleDeleteFromDb = async () => {
    if (!activeActionRow || !previewData) return;

    const identifier =
      activeTab === "groups"
        ? (activeActionRow.row.data as GroupImportRow).nama_kelompok
        : (activeActionRow.row.data as UserImportRow).username;

    const res = await fetch("/api/admin/import/manage-existing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeTab,
        identifier,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal menghapus data dari database.");
    }

    const targetRowNumber = activeActionRow.row.rowNumber;
    const newRows = previewData.rows.map((r) => {
      if (r.rowNumber !== targetRowNumber) return r;

      const filteredWarnings = r.warnings.filter(
        (w) =>
          !w.toLowerCase().includes("sudah ada di database") &&
          !w.toLowerCase().includes("sudah terdaftar pada pengguna lain")
      );

      return {
        ...r,
        status:
          r.errors.length > 0
            ? ("ERROR" as const)
            : filteredWarnings.length > 0
            ? ("WARNING" as const)
            : ("VALID" as const),
        warnings: filteredWarnings,
        isValid: r.errors.length === 0,
      };
    });

    const newValidCount = newRows.filter((r) => r.isValid).length;
    const newErrorCount = newRows.filter((r) => r.status === "ERROR").length;
    const newWarningCount = newRows.filter((r) => r.status === "WARNING").length;

    setPreviewData({
      ...previewData,
      summary: {
        totalRows: newRows.length,
        validCount: newValidCount,
        errorCount: newErrorCount,
        warningCount: newWarningCount,
      },
      rows: newRows,
    });

    setFeedback({
      type: "success",
      message: `Data "${identifier}" berhasil dihapus dari database.`,
    });

    setFeedbackModal({
      isOpen: true,
      title: "Berhasil Dihapus dari Database!",
      message: `Data "${identifier}" telah resmi dihapus dari basis data sistem. Baris pada antrean impor kini berstatus VALID sebagai data baru yang siap didaftarkan ulang.`,
      type: "success",
      actionType: "delete_db",
      targetName: identifier,
    });

    await loadDbData();
  };

  const handleOpenEditPreviewRow = (
    row: RowValidationResult<GroupImportRow | UserImportRow>,
    isExistingInDb: boolean
  ) => {
    setActiveActionRow({ row, isExistingInDb });
    setIsEditModalOpen(true);
  };

  const handleOpenDeletePreviewRow = (
    row: RowValidationResult<GroupImportRow | UserImportRow>,
    isExistingInDb: boolean
  ) => {
    setActiveActionRow({ row, isExistingInDb });
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return <LoadingScreen message="Memuat Master Data..." />;
  }

  const validCount = previewData?.summary.validCount ?? 0;
  const errorCount = previewData?.summary.errorCount ?? 0;

  return (
    <MobileShell
      title="Master Data & Import"
      role="admin"
      wide={true}
      user={user ? { nama: user.nama, role: user.role } : undefined}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "80px" }}>
        {/* Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #11110E 0%, #1F4B5D 60%, #0F766E 100%)",
            borderRadius: "24px",
            padding: "24px 28px",
            color: "#FAFAFA",
            marginBottom: "20px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 28px rgba(31, 75, 93, 0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-20px",
              top: "-20px",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(104, 207, 235, 0.25) 0%, rgba(255, 255, 255, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.16)",
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "10px",
                letterSpacing: "0.02em",
              }}
            >
              <ShieldCheck size={14} /> Panel Administrasi SILO 2026
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              {viewMode === "database"
                ? "Data Master Tersimpan di Database"
                : "Import Data User & Kelompok (Excel)"}
            </h1>
            <p style={{ fontSize: "0.85rem", opacity: 0.92, margin: 0, lineHeight: 1.5, maxWidth: "720px" }}>
              {viewMode === "database"
                ? "Kelola semua data pengguna dan kelompok yang tersimpan di sistem basis data. Anda dapat mencari, mengedit baris, menghapus data tunggal, ataupun melakukan penghapusan massal (bulk delete)."
                : "Unggah berkas Excel untuk mendaftarkan akun mahasiswa baru, mentor, admin, dan kelompok secara massal dengan generator password unik otomatis."}
            </p>
          </div>
        </div>

        {/* MODE SWITCHER: "📁 Data Master di Database" vs "📤 Import Berkas Excel" */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px",
              backgroundColor: "rgba(31, 75, 93, 0.08)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setViewMode("database");
                setFeedback(null);
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px 16px",
                borderRadius: "15px",
                fontSize: "0.84rem",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: viewMode === "database" ? "#FFFFFF" : "transparent",
                color: viewMode === "database" ? "#1F4B5D" : "rgba(31, 75, 93, 0.7)",
                boxShadow: viewMode === "database" ? "0 4px 14px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <Database size={17} color={viewMode === "database" ? "#1F4B5D" : "#64748B"} />
              <span>Data di Database</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("import");
                setFeedback(null);
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px 16px",
                borderRadius: "15px",
                fontSize: "0.84rem",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: viewMode === "import" ? "#FFFFFF" : "transparent",
                color: viewMode === "import" ? "#0F766E" : "rgba(31, 75, 93, 0.7)",
                boxShadow: viewMode === "import" ? "0 4px 14px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              <FileSpreadsheet size={17} color={viewMode === "import" ? "#0F766E" : "#64748B"} />
              <span>Import Berkas Excel</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 18px",
              borderRadius: "16px",
              marginBottom: "20px",
              fontSize: "0.82rem",
              fontWeight: 600,
              backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
              border: `1.5px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              color: feedback.type === "success" ? "#065F46" : "#991B1B",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            }}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <div style={{ flex: 1, lineHeight: 1.45 }}>{feedback.message}</div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: DATA MASTER TERSIMPAN DI DATABASE                */}
        {/* ======================================================== */}
        {viewMode === "database" && (
          <div>
            {/* Sub-tab Switcher DB: Users vs Groups + Refresh Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "4px",
                  backgroundColor: "rgba(31, 75, 93, 0.06)",
                  borderRadius: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDbActiveTab("users")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: dbActiveTab === "users" ? "#FFFFFF" : "transparent",
                    color: dbActiveTab === "users" ? "#1F4B5D" : "rgba(31, 75, 93, 0.65)",
                    boxShadow: dbActiveTab === "users" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Users size={15} />
                  <span>Master Pengguna ({dbUsers.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDbActiveTab("groups")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: dbActiveTab === "groups" ? "#FFFFFF" : "transparent",
                    color: dbActiveTab === "groups" ? "#0F766E" : "rgba(31, 75, 93, 0.65)",
                    boxShadow: dbActiveTab === "groups" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <Layers size={15} />
                  <span>Master Kelompok ({dbGroups.length})</span>
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadDbData}
                disabled={loadingDb}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(31, 75, 93, 0.2)",
                  backgroundColor: "#FFFFFF",
                  color: "#1F4B5D",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: loadingDb ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <RefreshCw size={13} className={loadingDb ? "animate-spin" : ""} />
                <span>{loadingDb ? "Memuat..." : "Segarkan Data"}</span>
              </button>
            </div>

            {/* Content Table DB */}
            {loadingDb ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid rgba(31, 75, 93, 0.1)",
                  color: "#1F4B5D",
                }}
              >
                <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Mengambil data dari database...</div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "4px" }}>
                  Mohon tunggu beberapa detik
                </div>
              </div>
            ) : dbActiveTab === "users" ? (
              <>
                <DbUsersTable
                  users={dbUsers}
                  selectedIds={selectedUserIds}
                  onToggleSelect={toggleUserSelect}
                  onSelectAll={selectAllUsers}
                  onClearSelection={clearUserSelection}
                  onEdit={handleOpenEditUser}
                  onDelete={handleOpenDeleteUser}
                  isAdmin={isAdmin}
                />

                {/* Floating Bulk Action Bar untuk Pengguna */}
                <BulkActionBar
                  selectedCount={selectedUserIds.size}
                  onClearSelection={clearUserSelection}
                  onBulkDelete={() => handleOpenBulkDelete("users")}
                  entityLabel="pengguna"
                  isDeleting={isDeletingDb}
                />
              </>
            ) : (
              <>
                <DbGroupsTable
                  groups={dbGroups}
                  selectedIds={selectedGroupIds}
                  onToggleSelect={toggleGroupSelect}
                  onSelectAll={selectAllGroups}
                  onClearSelection={clearGroupSelection}
                  onEdit={handleOpenEditGroup}
                  onDelete={handleOpenDeleteGroup}
                  isAdmin={isAdmin}
                />

                {/* Floating Bulk Action Bar untuk Kelompok */}
                <BulkActionBar
                  selectedCount={selectedGroupIds.size}
                  onClearSelection={clearGroupSelection}
                  onBulkDelete={() => handleOpenBulkDelete("groups")}
                  entityLabel="kelompok"
                  isDeleting={isDeletingDb}
                />
              </>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: IMPORT BERKAS EXCEL                              */}
        {/* ======================================================== */}
        {viewMode === "import" && (
          <div>
            {/* Tab Switcher Import Excel */}
            <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "22px" }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "5px",
                  backgroundColor: "rgba(31, 75, 93, 0.08)",
                  borderRadius: "18px",
                  width: "100%",
                  maxWidth: "480px",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleImportTabChange("users")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "14px",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: activeTab === "users" ? "#FFFFFF" : "transparent",
                    color: activeTab === "users" ? "#0F766E" : "#1F4B5D",
                    boxShadow: activeTab === "users" ? "0 3px 10px rgba(0, 0, 0, 0.08)" : "none",
                  }}
                >
                  <Users size={17} />
                  <span>Master Pengguna (Akun)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleImportTabChange("groups")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "14px",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: activeTab === "groups" ? "#FFFFFF" : "transparent",
                    color: activeTab === "groups" ? "#0F766E" : "#1F4B5D",
                    boxShadow: activeTab === "groups" ? "0 3px 10px rgba(0, 0, 0, 0.08)" : "none",
                  }}
                >
                  <Layers size={17} />
                  <span>Master Kelompok</span>
                </button>
              </div>
            </div>

            {/* Dropzone Upload Excel */}
            <div style={{ marginBottom: "24px" }}>
              <ImportDropzone
                type={activeTab}
                selectedFile={selectedFile}
                loading={parsing}
                onFileSelected={handleFileSelected}
                onClearFile={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                  setFeedback(null);
                }}
                templateDownloadUrl={`/api/admin/templates/${activeTab}`}
              />
            </div>

            {/* Preview & Execution Section */}
            {previewData && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Summary Card */}
                <ImportSummaryCard
                  totalRows={previewData.summary.totalRows}
                  validCount={previewData.summary.validCount}
                  warningCount={previewData.summary.warningCount}
                  errorCount={previewData.summary.errorCount}
                />

                {/* Preview Table */}
                <ImportPreviewTable
                  rows={previewData.rows}
                  type={activeTab}
                  onEditRow={handleOpenEditPreviewRow}
                  onDeleteRow={handleOpenDeletePreviewRow}
                />

                {/* Import Action Bar */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "18px",
                    padding: "18px 24px",
                    border: "1px solid rgba(31, 75, 93, 0.12)",
                    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1F4B5D",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#0F766E",
                        cursor: "pointer",
                      }}
                    />
                    <span>
                      Lewati baris bermasalah (impor{" "}
                      <strong style={{ color: "#059669" }}>{validCount} baris valid</strong> saja)
                    </span>
                  </label>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewData(null);
                        setFeedback(null);
                      }}
                      disabled={importing}
                      style={{
                        padding: "11px 20px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        border: "1.5px solid rgba(31, 75, 93, 0.2)",
                        backgroundColor: "#FFFFFF",
                        color: "#1F4B5D",
                        cursor: importing ? "not-allowed" : "pointer",
                      }}
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={importing || validCount === 0 || (errorCount > 0 && !skipErrors)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "11px 24px",
                        borderRadius: "12px",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        border: "none",
                        cursor:
                          importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                            ? "not-allowed"
                            : "pointer",
                        backgroundColor:
                          importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                            ? "#CBD5E1"
                            : "#0F766E",
                        color:
                          importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                            ? "#94A3B8"
                            : "#FFFFFF",
                        boxShadow:
                          importing || validCount === 0 || (errorCount > 0 && !skipErrors)
                            ? "none"
                            : "0 4px 14px rgba(15, 118, 110, 0.28)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {importing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Eksekusi Import ({validCount} Data)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DIALOGS: DATABASE & IMPORT                         */}
      {/* ======================================================== */}

      {/* 1. Modal Edit Data di Database */}
      <DbEditModal
        isOpen={dbEditModal.isOpen}
        onClose={() => setDbEditModal((prev) => ({ ...prev, isOpen: false }))}
        type={dbEditModal.type}
        data={dbEditModal.data}
        groupsList={dbGroups.map((g) => ({ id: g.id, name: g.name }))}
        onSave={handleSaveDbEdit}
        isSaving={isSavingDbEdit}
        errorMessage={dbEditError}
      />

      {/* 2. Modal Hapus Data di Database (Single & Bulk Delete) */}
      <DbDeleteModal
        isOpen={dbDeleteModal.isOpen}
        onClose={() => setDbDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDbDelete}
        isDeleting={isDeletingDb}
        title={
          dbDeleteModal.type === "bulk"
            ? `Hapus Massal ${dbDeleteModal.count} ${dbDeleteModal.entityType === "users" ? "Pengguna" : "Kelompok"}`
            : `Hapus ${dbDeleteModal.entityType === "users" ? "Pengguna" : "Kelompok"}`
        }
        description={
          dbDeleteModal.type === "bulk"
            ? dbDeleteModal.entityType === "users"
              ? `Apakah Anda yakin ingin menghapus ${dbDeleteModal.count} data pengguna terpilih secara permanen dari basis data?`
              : `Apakah Anda yakin ingin menghapus ${dbDeleteModal.count} data kelompok terpilih secara permanen dari basis data?`
            : dbDeleteModal.entityType === "users"
              ? `Apakah Anda yakin ingin menghapus pengguna "${dbDeleteModal.name}" secara permanen dari database?`
              : `Apakah Anda yakin ingin menghapus kelompok "${dbDeleteModal.name}" secara permanen dari database?`
        }
        notice={
          dbDeleteModal.entityType === "groups"
            ? "Akun mahasiswa baru (maba) di dalam kelompok ini TETAP DIPERTAHANKAN (hanya dilepaskan dari kelompok). Data presensi kelompok, cek atribut kelompok, dan relasi mentor kelompok akan dibersihkan otomatis."
            : "Seluruh data terkait pengguna ini akan dibersihkan otomatis, termasuk data kehadiran/presensi, berkas pengumpulan tugas, serta relasi mentor kelompok jika pengguna adalah mentor."
        }
        itemsPreview={dbDeleteModal.previewNames}
        totalCount={dbDeleteModal.count}
        errorMessage={dbDeleteError}
      />

      {/* 3. Modal Sukses Import Excel & Rekap Kredensial */}
      <ImportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        type={activeTab}
        result={importResult}
      />

      {/* 4. Modal Edit Baris Preview Import */}
      <ImportEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setActiveActionRow(null);
        }}
        type={activeTab}
        rowNumber={activeActionRow?.row.rowNumber || 0}
        initialData={activeActionRow?.row.data || null}
        isExistingInDb={activeActionRow?.isExistingInDb || false}
        onSaveRow={handleSaveEditRow}
      />

      {/* 5. Modal Hapus Baris Preview Import */}
      <ImportDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActiveActionRow(null);
        }}
        type={activeTab}
        rowNumber={activeActionRow?.row.rowNumber || 0}
        identifier={
          activeTab === "groups"
            ? (activeActionRow?.row.data as GroupImportRow)?.nama_kelompok || ""
            : (activeActionRow?.row.data as UserImportRow)?.nama ||
              (activeActionRow?.row.data as UserImportRow)?.username ||
              ""
        }
        isExistingInDb={activeActionRow?.isExistingInDb || false}
        onDeleteFromPreview={handleDeleteFromPreview}
        onDeleteFromDb={activeActionRow?.isExistingInDb ? handleDeleteFromDb : undefined}
      />

      {/* 6. Modal Feedback Notifikasi Hasil Aksi */}
      <ImportFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        actionType={feedbackModal.actionType}
        targetName={feedbackModal.targetName}
      />
    </MobileShell>
  );
}
