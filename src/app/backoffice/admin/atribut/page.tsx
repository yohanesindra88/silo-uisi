"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MobileShell } from "@/components/ui/mobile-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  PackageCheck,
  Calendar,
  Plus,
  Trash2,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  X,
  Loader2,
  ShieldCheck,
  Info,
  Download,
  FileSpreadsheet,
  RefreshCw,
  XCircle,
  CheckSquare,
  Square,
  Edit3,
  Save,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDateLong } from "@/utils/date";

interface AttributeItem {
  id: number;
  name: string;
  description: string | null;
  targetDate: string;
  type: "individu" | "kelompok";
  createdAt?: string;
  creator?: {
    id: number;
    nama: string;
    role: string;
  } | null;
}

interface UserProfile {
  id: number;
  nama: string;
  role: string;
}

interface CheckDetail {
  isBrought: boolean;
  notes: string | null;
  isSaved: boolean;
  checkId?: number;
  checkedAt?: string;
  checkedByName?: string;
  isModified?: boolean;
}

interface MabaItem {
  id: number;
  nama: string;
  nim: string;
  groupId: number;
  groupName: string;
  checks: Record<number, CheckDetail>;
}

interface GroupCheckItem {
  groupId: number;
  groupName: string;
  checks: Record<number, CheckDetail>;
}

interface MonitoringData {
  targetDate: string;
  groups: Array<{ id: number; name: string; description?: string | null }>;
  selectedGroupId: number | null;
  attributes: {
    all: AttributeItem[];
    individu: AttributeItem[];
    kelompok: AttributeItem[];
  };
  mabaList: MabaItem[];
  groupChecks: GroupCheckItem[];
}

const formatDateId = (dateStr: string) => {
  return formatDateLong(dateStr);
};

const getTodayInputStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getPaginationItems = (current: number, total: number): (number | string)[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export default function AdminAtributPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Tab Utama: "monitoring" (Rekap & Checklist Bawaan) vs "master" (Master Atribut)
  const [mainTab, setMainTab] = useState<"monitoring" | "master">("monitoring");

  // ==========================================
  // STATE TAB 1: MASTER ATRIBUT
  // ==========================================
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [masterFilterType, setMasterFilterType] = useState<string>("all");
  const [masterFilterDate, setMasterFilterDate] = useState<string>("");
  const [masterSearchQuery, setMasterSearchQuery] = useState("");

  // Modal Form Tambah / Edit Master Atribut
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(getTodayInputStr());
  const [formType, setFormType] = useState<"individu" | "kelompok">("individu");
  const [submitting, setSubmitting] = useState(false);

  // Helper Buka Modal Tambah Atribut Baru
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormDate(monitoringDate || getTodayInputStr());
    setFormType("individu");
    setIsModalOpen(true);
    setFeedback(null);
  };

  // Helper Buka Modal Edit Atribut (Khusus Admin)
  const handleOpenEditModal = (attr: AttributeItem) => {
    if (user?.role !== "admin") {
      alert("Akses ditolak: Fitur edit atribut hanya dapat diakses oleh Admin.");
      return;
    }
    setEditingId(attr.id);
    setFormName(attr.name);
    setFormDesc(attr.description || "");
    setFormDate(attr.targetDate.split("T")[0]);
    setFormType(attr.type);
    setIsModalOpen(true);
    setFeedback(null);
  };

  // ==========================================
  // STATE TAB 2: MONITORING & REKAP BAWAAN
  // ==========================================
  const [monitoringDate, setMonitoringDate] = useState<string>(getTodayInputStr());
  const [monitoringGroupId, setMonitoringGroupId] = useState<number | "all">("all");
  const [monitoringSubTab, setMonitoringSubTab] = useState<"individu" | "kelompok">("individu");
  const [statusFilter, setStatusFilter] = useState<"all" | "kurang" | "lengkap" | "belum_dicek">("all");
  const [monitoringSearch, setMonitoringSearch] = useState("");
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Pagination Monitoring State (Default 10 item, opsi: 10, 25, 50, 100)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset halaman ke 1 saat filter, pencarian, kelompok, tanggal, sub-tab, atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, monitoringSearch, monitoringGroupId, monitoringDate, monitoringSubTab, pageSize]);

  // State Checklist Lokal (bisa diedit admin)
  const [mabaChecksState, setMabaChecksState] = useState<Record<number, Record<number, CheckDetail>>>({});
  const [groupChecksState, setGroupChecksState] = useState<Record<number, Record<number, CheckDetail>>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal Catatan Per Item
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteTarget, setActiveNoteTarget] = useState<{
    type: "maba" | "group";
    id: number;
    attrId: number;
    title: string;
    note: string;
  } | null>(null);

  // ----------------------------------------------------
  // 1. Inisialisasi Profil & Data Master
  // ----------------------------------------------------
  const loadMasterAttributes = useCallback(async () => {
    try {
      const attrRes = await fetch("/api/attributes");
      if (attrRes.ok) {
        const attrData = await attrRes.json();
        setAttributes(attrData.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat master atribut:", err);
    }
  }, []);

  const loadAuthAndMaster = useCallback(async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      if (!meData.success || !meData.user) {
        router.push("/login");
        return;
      }
      setUser(meData.user);

      if (meData.user.role !== "admin" && meData.user.role !== "panitia") {
        router.push("/login");
        return;
      }

      await loadMasterAttributes();
    } catch (err) {
      console.error("Gagal inisialisasi:", err);
    } finally {
      setLoading(false);
    }
  }, [router, loadMasterAttributes]);

  useEffect(() => {
    loadAuthAndMaster();
  }, [loadAuthAndMaster]);

  // ----------------------------------------------------
  // 2. Fetch Data Monitoring & Rekap Bawaan
  // ----------------------------------------------------
  const loadMonitoringData = useCallback(async (targetDate: string, groupId?: number | "all") => {
    try {
      setLoadingMonitoring(true);
      let url = `/api/attributes/mentor-check?target_date=${targetDate}`;
      if (groupId && groupId !== "all") {
        url += `&group_id=${groupId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil data checklist monitoring atribut.");
      }

      const resData = await res.json();
      const data: MonitoringData = resData.data;
      setMonitoringData(data);

      // Inisialisasi state checklist maba
      const initialMabaState: Record<number, Record<number, CheckDetail>> = {};
      for (const maba of data.mabaList) {
        initialMabaState[maba.id] = {};
        for (const attr of data.attributes.individu) {
          const existing = maba.checks[attr.id];
          if (existing && existing.isSaved) {
            initialMabaState[maba.id][attr.id] = {
              ...existing,
              isModified: false,
            };
          } else {
            // Belum dicek oleh mentor
            initialMabaState[maba.id][attr.id] = {
              isBrought: false,
              notes: null,
              isSaved: false,
              isModified: false,
            };
          }
        }
      }
      setMabaChecksState(initialMabaState);

      // Inisialisasi state checklist kelompok
      const initialGroupState: Record<number, Record<number, CheckDetail>> = {};
      for (const grp of data.groupChecks) {
        initialGroupState[grp.groupId] = {};
        for (const attr of data.attributes.kelompok) {
          const existing = grp.checks[attr.id];
          if (existing && existing.isSaved) {
            initialGroupState[grp.groupId][attr.id] = {
              ...existing,
              isModified: false,
            };
          } else {
            initialGroupState[grp.groupId][attr.id] = {
              isBrought: false,
              notes: null,
              isSaved: false,
              isModified: false,
            };
          }
        }
      }
      setGroupChecksState(initialGroupState);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("Error load monitoring check:", err);
      setFeedback({ type: "error", message: err.message || "Gagal memuat rekap bawaan maba." });
    } finally {
      setLoadingMonitoring(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === "monitoring") {
      loadMonitoringData(monitoringDate, monitoringGroupId);
    }
  }, [mainTab, monitoringDate, monitoringGroupId, loadMonitoringData]);

  // ----------------------------------------------------
  // 3. Handlers Master Atribut (CRUD)
  // ----------------------------------------------------
  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate) {
      setFeedback({ type: "error", message: "Nama atribut dan tanggal target wajib diisi." });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editingId) {
        // MODE EDIT: Khusus Admin
        if (user?.role !== "admin") {
          throw new Error("Akses ditolak: Fitur edit atribut hanya dapat diakses oleh Admin.");
        }

        const res = await fetch(`/api/attributes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || null,
            target_date: formDate,
            type: formType,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || "Gagal memperbarui atribut.");
        }

        setFeedback({ type: "success", message: `Atribut "${formName}" berhasil diperbarui!` });
      } else {
        // MODE TAMBAH BARU
        const res = await fetch("/api/attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim() || null,
            target_date: formDate,
            type: formType,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.message || "Gagal menambahkan atribut baru.");
        }

        setFeedback({ type: "success", message: `Atribut "${formName}" berhasil ditambahkan!` });
      }

      setEditingId(null);
      setFormName("");
      setFormDesc("");
      setIsModalOpen(false);
      await loadMasterAttributes();
      if (formDate === monitoringDate) {
        await loadMonitoringData(monitoringDate, monitoringGroupId);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Terjadi kesalahan sistem." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaster = async (id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus atribut "${name}"? Seluruh data checklist terkait juga akan terhapus.`)) return;

    try {
      const res = await fetch(`/api/attributes/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        alert(resData.message || "Gagal menghapus atribut.");
        return;
      }
      setFeedback({ type: "success", message: `Atribut "${name}" berhasil dihapus.` });
      await loadMasterAttributes();
      if (mainTab === "monitoring") {
        await loadMonitoringData(monitoringDate, monitoringGroupId);
      }
    } catch (err: any) {
      alert("Gagal menghapus atribut: " + err.message);
    }
  };

  // ----------------------------------------------------
  // 4. Handlers Checklist Monitoring (Admin Override)
  // ----------------------------------------------------
  const toggleMabaItem = (mabaId: number, attrId: number) => {
    setMabaChecksState((prev) => {
      const curMaba = prev[mabaId] || {};
      const curItem = curMaba[attrId] || { isBrought: false, notes: null, isSaved: false };
      const nextBrought = !curItem.isBrought;

      return {
        ...prev,
        [mabaId]: {
          ...curMaba,
          [attrId]: {
            ...curItem,
            isBrought: nextBrought,
            isSaved: true,
            isModified: true,
          },
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const toggleGroupItem = (grpId: number, attrId: number) => {
    setGroupChecksState((prev) => {
      const curGroup = prev[grpId] || {};
      const curItem = curGroup[attrId] || { isBrought: false, notes: null, isSaved: false };
      const nextBrought = !curItem.isBrought;

      return {
        ...prev,
        [grpId]: {
          ...curGroup,
          [attrId]: {
            ...curItem,
            isBrought: nextBrought,
            isSaved: true,
            isModified: true,
          },
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Tandai semua atribut seorang maba sebagai Membawa (Lengkap)
  const markMabaAllBrought = (mabaId: number) => {
    if (!monitoringData) return;
    setMabaChecksState((prev) => {
      const curMaba = prev[mabaId] || {};
      const updatedMaba: Record<number, CheckDetail> = { ...curMaba };

      for (const attr of monitoringData.attributes.individu) {
        updatedMaba[attr.id] = {
          ...(curMaba[attr.id] || { notes: null }),
          isBrought: true,
          isSaved: true,
          isModified: true,
        };
      }

      return {
        ...prev,
        [mabaId]: updatedMaba,
      };
    });
    setHasUnsavedChanges(true);
  };

  // Buka Modal Catatan
  const openNoteModal = (
    type: "maba" | "group",
    id: number,
    attrId: number,
    title: string,
    currentNote: string
  ) => {
    setActiveNoteTarget({
      type,
      id,
      attrId,
      title,
      note: currentNote,
    });
    setNoteModalOpen(true);
  };

  // Simpan Catatan dari Modal
  const saveNoteFromModal = (noteText: string) => {
    if (!activeNoteTarget) return;
    const { type, id, attrId } = activeNoteTarget;

    if (type === "maba") {
      setMabaChecksState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [attrId]: {
            ...(prev[id]?.[attrId] || { isBrought: false, isSaved: false }),
            notes: noteText.trim() || null,
            isModified: true,
          },
        },
      }));
    } else {
      setGroupChecksState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [attrId]: {
            ...(prev[id]?.[attrId] || { isBrought: false, isSaved: false }),
            notes: noteText.trim() || null,
            isModified: true,
          },
        },
      }));
    }

    setHasUnsavedChanges(true);
    setNoteModalOpen(false);
    setActiveNoteTarget(null);
  };

  // Simpan Perubahan Checklist ke Server
  const handleSaveBatchChanges = async () => {
    if (!monitoringData) return;

    try {
      setSavingBatch(true);
      setFeedback(null);

      const batchPayload: Array<{
        attributeId: number;
        mabaId?: number | null;
        groupId?: number | null;
        isBrought: boolean;
        notes?: string | null;
      }> = [];

      // Kumpulkan item maba yang dimodifikasi atau sudah memiliki status
      for (const maba of monitoringData.mabaList) {
        const mabaChecks = mabaChecksState[maba.id] || {};
        for (const attr of monitoringData.attributes.individu) {
          const item = mabaChecks[attr.id];
          if (item && (item.isModified || item.isSaved)) {
            batchPayload.push({
              attributeId: attr.id,
              mabaId: maba.id,
              isBrought: item.isBrought,
              notes: item.notes,
            });
          }
        }
      }

      // Kumpulkan item kelompok
      for (const grp of monitoringData.groupChecks) {
        const grpChecks = groupChecksState[grp.groupId] || {};
        for (const attr of monitoringData.attributes.kelompok) {
          const item = grpChecks[attr.id];
          if (item && (item.isModified || item.isSaved)) {
            batchPayload.push({
              attributeId: attr.id,
              groupId: grp.groupId,
              isBrought: item.isBrought,
              notes: item.notes,
            });
          }
        }
      }

      if (batchPayload.length === 0) {
        setFeedback({ type: "success", message: "Tidak ada perubahan checklist untuk disimpan." });
        setHasUnsavedChanges(false);
        return;
      }

      const res = await fetch("/api/attributes/check-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks: batchPayload }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Gagal menyimpan hasil verifikasi.");
      }

      setFeedback({
        type: "success",
        message: `Berhasil menyimpan verifikasi ${resData.count || batchPayload.length} item atribut!`,
      });
      setHasUnsavedChanges(false);
      await loadMonitoringData(monitoringDate, monitoringGroupId);
    } catch (err: any) {
      console.error("Gagal menyimpan perubahan batch:", err);
      setFeedback({ type: "error", message: err.message || "Gagal menyimpan perubahan." });
    } finally {
      setSavingBatch(false);
    }
  };

  // ----------------------------------------------------
  // 5. Ekspor Rekap Excel (.xlsx)
  // ----------------------------------------------------
  const handleExportExcel = async () => {
    if (!monitoringData) return;

    try {
      setExportingExcel(true);
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Sheet 1: Rekap Individu
      const rowsIndividu = monitoringData.mabaList.map((maba, idx) => {
        const row: Record<string, any> = {
          No: idx + 1,
          NIM: maba.nim || "-",
          "Nama Mahasiswa": maba.nama,
          Kelompok: maba.groupName,
        };

        let totalBrought = 0;
        let totalChecked = 0;
        const notesArr: string[] = [];

        for (const attr of monitoringData.attributes.individu) {
          const state = mabaChecksState[maba.id]?.[attr.id];
          const isSaved = state ? state.isSaved : maba.checks[attr.id]?.isSaved;
          const isBrought = state ? state.isBrought : maba.checks[attr.id]?.isBrought;
          const note = state ? state.notes : maba.checks[attr.id]?.notes;

          let statusText = "Belum Dicek";
          if (isSaved) {
            statusText = isBrought ? "Membawa (V)" : "Tidak Membawa (X)";
            totalChecked++;
            if (isBrought) totalBrought++;
          }

          row[attr.name] = statusText;
          if (note) notesArr.push(`${attr.name}: ${note}`);
        }

        let summaryStatus = "Belum Diperiksa";
        if (totalChecked > 0) {
          if (
            totalChecked === monitoringData.attributes.individu.length &&
            totalBrought === totalChecked
          ) {
            summaryStatus = "Lengkap (100%)";
          } else {
            summaryStatus = `Kurang (${monitoringData.attributes.individu.length - totalBrought} Item)`;
          }
        }

        row["Status Akhir"] = summaryStatus;
        row["Catatan Evaluasi"] = notesArr.length > 0 ? notesArr.join(" | ") : "-";
        return row;
      });

      const wsIndividu = XLSX.utils.json_to_sheet(rowsIndividu);
      XLSX.utils.book_append_sheet(wb, wsIndividu, "Rekap Individu");

      // Sheet 2: Rekap Kelompok
      const rowsKelompok = monitoringData.groupChecks.map((grp, idx) => {
        const row: Record<string, any> = {
          No: idx + 1,
          "Nama Kelompok": grp.groupName,
        };

        let totalBrought = 0;
        let totalChecked = 0;
        const notesArr: string[] = [];

        for (const attr of monitoringData.attributes.kelompok) {
          const state = groupChecksState[grp.groupId]?.[attr.id];
          const isSaved = state ? state.isSaved : grp.checks[attr.id]?.isSaved;
          const isBrought = state ? state.isBrought : grp.checks[attr.id]?.isBrought;
          const note = state ? state.notes : grp.checks[attr.id]?.notes;

          let statusText = "Belum Dicek";
          if (isSaved) {
            statusText = isBrought ? "Membawa (V)" : "Tidak Membawa (X)";
            totalChecked++;
            if (isBrought) totalBrought++;
          }

          row[attr.name] = statusText;
          if (note) notesArr.push(`${attr.name}: ${note}`);
        }

        let summaryStatus = "Belum Diperiksa";
        if (totalChecked > 0) {
          if (
            totalChecked === monitoringData.attributes.kelompok.length &&
            totalBrought === totalChecked
          ) {
            summaryStatus = "Lengkap";
          } else {
            summaryStatus = "Kurang";
          }
        }

        row["Status Akhir"] = summaryStatus;
        row["Catatan"] = notesArr.length > 0 ? notesArr.join(" | ") : "-";
        return row;
      });

      const wsKelompok = XLSX.utils.json_to_sheet(rowsKelompok);
      XLSX.utils.book_append_sheet(wb, wsKelompok, "Rekap Kelompok");

      // Simpan file
      XLSX.writeFile(wb, `rekap_atribut_silo_${monitoringDate}.xlsx`);
      setFeedback({ type: "success", message: `File rekap Excel berhasil diunduh!` });
    } catch (err: any) {
      console.error("Gagal export excel:", err);
      setFeedback({ type: "error", message: "Gagal membuat file Excel: " + err.message });
    } finally {
      setExportingExcel(false);
    }
  };

  // ----------------------------------------------------
  // 6. Kalkulasi Statistik & Filter Data Monitoring
  // ----------------------------------------------------
  const individuAttrs = monitoringData?.attributes.individu || [];
  const kelompokAttrs = monitoringData?.attributes.kelompok || [];
  const mabaListRaw = monitoringData?.mabaList || [];
  const groupChecksRaw = monitoringData?.groupChecks || [];

  // Hitung status setiap maba
  const analyzedMabaList = useMemo(() => {
    return mabaListRaw.map((maba) => {
      const curChecks = mabaChecksState[maba.id] || {};
      let totalChecked = 0;
      let totalBrought = 0;
      let totalNotBrought = 0;

      for (const attr of individuAttrs) {
        const item = curChecks[attr.id];
        const isSaved = item ? item.isSaved : maba.checks[attr.id]?.isSaved;
        const isBrought = item ? item.isBrought : maba.checks[attr.id]?.isBrought;

        if (isSaved) {
          totalChecked++;
          if (isBrought) {
            totalBrought++;
          } else {
            totalNotBrought++;
          }
        }
      }

      let statusCategory: "lengkap" | "kurang" | "belum_dicek" = "belum_dicek";
      if (individuAttrs.length === 0) {
        statusCategory = "belum_dicek";
      } else if (totalChecked === 0) {
        statusCategory = "belum_dicek";
      } else if (totalChecked === individuAttrs.length && totalBrought === totalChecked) {
        statusCategory = "lengkap";
      } else {
        statusCategory = "kurang";
      }

      return {
        ...maba,
        statusCategory,
        totalChecked,
        totalBrought,
        totalNotBrought,
        totalAttrs: individuAttrs.length,
      };
    });
  }, [mabaListRaw, mabaChecksState, individuAttrs]);

  // Ringkasan KPI Monitoring
  const statsSummary = useMemo(() => {
    const total = analyzedMabaList.length;
    const lengkap = analyzedMabaList.filter((m) => m.statusCategory === "lengkap").length;
    const kurang = analyzedMabaList.filter((m) => m.statusCategory === "kurang").length;
    const belum = analyzedMabaList.filter((m) => m.statusCategory === "belum_dicek").length;
    const persenLengkap = total > 0 ? Math.round((lengkap / total) * 100) : 0;

    return {
      total,
      lengkap,
      kurang,
      belum,
      persenLengkap,
    };
  }, [analyzedMabaList]);

  // Filter Mahasiswa Aktif
  const filteredMabaList = useMemo(() => {
    return analyzedMabaList.filter((maba) => {
      // Filter status
      if (statusFilter !== "all" && maba.statusCategory !== statusFilter) {
        return false;
      }

      // Filter search
      if (monitoringSearch.trim()) {
        const q = monitoringSearch.toLowerCase();
        const matchNama = maba.nama.toLowerCase().includes(q);
        const matchNim = maba.nim.toLowerCase().includes(q);
        const matchGroup = maba.groupName.toLowerCase().includes(q);
        if (!matchNama && !matchNim && !matchGroup) return false;
      }

      return true;
    });
  }, [analyzedMabaList, statusFilter, monitoringSearch]);

  // Filter Kelompok Aktif
  const filteredGroupList = useMemo(() => {
    return groupChecksRaw.filter((grp) => {
      if (monitoringGroupId !== "all" && grp.groupId !== monitoringGroupId) {
        return false;
      }
      if (monitoringSearch.trim()) {
        const q = monitoringSearch.toLowerCase();
        if (!grp.groupName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [groupChecksRaw, monitoringGroupId, monitoringSearch]);

  // ==========================================
  // LOGIKA PAGINATION MONITORING
  // ==========================================
  const totalMabaItems = filteredMabaList.length;
  const totalMabaPages = Math.max(1, Math.ceil(totalMabaItems / pageSize));
  const activeMabaPage = Math.min(Math.max(1, currentPage), totalMabaPages);
  const mabaStartIndex = (activeMabaPage - 1) * pageSize;
  const paginatedMabaList = useMemo(() => {
    return filteredMabaList.slice(mabaStartIndex, mabaStartIndex + pageSize);
  }, [filteredMabaList, mabaStartIndex, pageSize]);

  const totalGroupItems = filteredGroupList.length;
  const totalGroupPages = Math.max(1, Math.ceil(totalGroupItems / pageSize));
  const activeGroupPage = Math.min(Math.max(1, currentPage), totalGroupPages);
  const groupStartIndex = (activeGroupPage - 1) * pageSize;
  const paginatedGroupList = useMemo(() => {
    return filteredGroupList.slice(groupStartIndex, groupStartIndex + pageSize);
  }, [filteredGroupList, groupStartIndex, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      const el = document.getElementById("monitoringListTop");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const renderPagination = (
    current: number,
    totalPages: number,
    totalItems: number,
    labelItem: string
  ) => {
    if (totalItems === 0) return null;

    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, totalItems);
    const pageItems = getPaginationItems(current, totalPages);

    return (
      <div
        style={{
          marginTop: "16px",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "14px 18px",
          border: "1px solid rgba(31, 75, 93, 0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Info & Pengaturan Per Halaman */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.8rem", color: "#1F4B5D", fontWeight: 600 }}>
            Menampilkan <strong style={{ color: "#0F766E", fontWeight: 800 }}>{startItem} - {endItem}</strong> dari{" "}
            <strong style={{ fontWeight: 800 }}>{totalItems}</strong> {labelItem}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
              Per halaman:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                backgroundColor: "rgba(31, 75, 93, 0.04)",
                color: "#1F4B5D",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Tombol Navigasi Halaman */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {/* Tombol First Page */}
            <button
              type="button"
              disabled={current <= 1}
              onClick={() => handlePageChange(1)}
              title="Halaman Pertama"
              style={{
                padding: "6px 8px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                backgroundColor: current <= 1 ? "rgba(31, 75, 93, 0.03)" : "#FFFFFF",
                color: current <= 1 ? "rgba(31, 75, 93, 0.3)" : "#1F4B5D",
                cursor: current <= 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Tombol Prev */}
            <button
              type="button"
              disabled={current <= 1}
              onClick={() => handlePageChange(current - 1)}
              title="Halaman Sebelumnya"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                backgroundColor: current <= 1 ? "rgba(31, 75, 93, 0.03)" : "#FFFFFF",
                color: current <= 1 ? "rgba(31, 75, 93, 0.3)" : "#1F4B5D",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: current <= 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={15} /> Prev
            </button>

            {/* Nomor Halaman */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {pageItems.map((p, idx) => {
                if (p === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: "0 4px",
                        color: "rgba(31, 75, 93, 0.4)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = Number(p);
                const isActive = pageNum === current;

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      minWidth: "32px",
                      height: "32px",
                      padding: "0 6px",
                      borderRadius: "8px",
                      border: isActive ? "none" : "1px solid rgba(31, 75, 93, 0.15)",
                      backgroundColor: isActive ? "#0F766E" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#1F4B5D",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      boxShadow: isActive ? "0 2px 6px rgba(15, 118, 110, 0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Tombol Next */}
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() => handlePageChange(current + 1)}
              title="Halaman Selanjutnya"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                backgroundColor: current >= totalPages ? "rgba(31, 75, 93, 0.03)" : "#FFFFFF",
                color: current >= totalPages ? "rgba(31, 75, 93, 0.3)" : "#1F4B5D",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: current >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              Next <ChevronRight size={15} />
            </button>

            {/* Tombol Last Page */}
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="Halaman Terakhir"
              style={{
                padding: "6px 8px",
                borderRadius: "8px",
                border: "1px solid rgba(31, 75, 93, 0.15)",
                backgroundColor: current >= totalPages ? "rgba(31, 75, 93, 0.03)" : "#FFFFFF",
                color: current >= totalPages ? "rgba(31, 75, 93, 0.3)" : "#1F4B5D",
                cursor: current >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Filter Master Atribut
  const filteredMasterAttributes = useMemo(() => {
    return attributes.filter((attr) => {
      if (masterFilterType !== "all" && attr.type !== masterFilterType) return false;
      if (masterFilterDate) {
        const datePart = attr.targetDate.split("T")[0];
        if (datePart !== masterFilterDate) return false;
      }
      if (masterSearchQuery.trim()) {
        const q = masterSearchQuery.toLowerCase();
        const matchName = attr.name.toLowerCase().includes(q);
        const matchDesc = attr.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [attributes, masterFilterType, masterFilterDate, masterSearchQuery]);

  // Pengelompokan Master Atribut per Tanggal
  const groupedMasterByDate: Record<string, AttributeItem[]> = {};
  for (const item of filteredMasterAttributes) {
    const dStr = item.targetDate.split("T")[0];
    if (!groupedMasterByDate[dStr]) {
      groupedMasterByDate[dStr] = [];
    }
    groupedMasterByDate[dStr].push(item);
  }

  if (loading) {
    return <LoadingScreen message="Memuat Panel Kelola Atribut Maba..." />;
  }

  return (
    <MobileShell
      title="Kelola Atribut Maba"
      showBackButton={true}
      onBack={() => router.push("/admin")}
      user={user || undefined}
      role="admin"
      wide={true}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1F4B5D 0%, #0F766E 100%)",
          borderRadius: "20px",
          padding: "22px 20px",
          color: "#FFFFFF",
          marginBottom: "18px",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              fontSize: "0.75rem",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            <ShieldCheck size={14} /> Panel Kontrol Admin SILO
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF" }}>
            Atribut &amp; Bawaan Mahasiswa Baru
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
            Kelola daftar atribut harian dan pantau hasil verifikasi kelengkapan maba secara real-time.
          </p>
        </div>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: feedback.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${feedback.type === "success" ? "#10B981" : "#EF4444"}`,
            color: feedback.type === "success" ? "#065F46" : "#991B1B",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {feedback.type === "success" ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "2px" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Save Banner jika ada Perubahan Lokal */}
      {hasUnsavedChanges && (
        <div
          style={{
            position: "sticky",
            top: "12px",
            zIndex: 90,
            marginBottom: "16px",
            padding: "12px 18px",
            borderRadius: "14px",
            backgroundColor: "#1F4B5D",
            color: "#FFFFFF",
            boxShadow: "0 10px 25px rgba(31, 75, 93, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            border: "1.5px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#F59E0B",
                animation: "pulse 1.5s infinite",
              }}
            />
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              Ada perubahan status pemeriksaan bawaan yang belum disimpan!
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                loadMonitoringData(monitoringDate, monitoringGroupId);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleSaveBatchChanges}
              disabled={savingBatch}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: savingBatch ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
              }}
            >
              {savingBatch ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Switcher: Monitoring vs Master */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          backgroundColor: "#FFFFFF",
          padding: "6px",
          borderRadius: "16px",
          marginBottom: "20px",
          border: "1px solid rgba(31, 75, 93, 0.1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => setMainTab("monitoring")}
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: mainTab === "monitoring" ? "#0F766E" : "transparent",
            color: mainTab === "monitoring" ? "#FFFFFF" : "#1F4B5D",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: mainTab === "monitoring" ? "0 4px 12px rgba(15, 118, 110, 0.25)" : "none",
          }}
        >
          <ClipboardList size={18} />
          <span>Monitoring &amp; Rekap Bawaan</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("master")}
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: mainTab === "master" ? "#1F4B5D" : "transparent",
            color: mainTab === "master" ? "#FFFFFF" : "#1F4B5D",
            fontWeight: 800,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: mainTab === "master" ? "0 4px 12px rgba(31, 75, 93, 0.25)" : "none",
          }}
        >
          <Sliders size={18} />
          <span>Daftar Atribut ({attributes.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN TAB 1: MONITORING & REKAP BAWAAN MABA                                */}
      {/* ========================================================================= */}
      {mainTab === "monitoring" && (
        <div>
          {/* Baris Filter & Aksi Monitoring */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "18px",
              border: "1px solid rgba(31, 75, 93, 0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Baris Atas: Tanggal, Kelompok, Export & Refresh */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                alignItems: "center",
              }}
            >
              {/* Filter Tanggal Target */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Tanggal Kegiatan
                </label>
                <DatePicker
                  value={monitoringDate}
                  onChange={(val) => setMonitoringDate(val)}
                  placeholder="Pilih Tanggal Kegiatan"
                />
              </div>

              {/* Filter Kelompok / Negara */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Kelompok / Negara
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={monitoringGroupId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMonitoringGroupId(v === "all" ? "all" : Number(v));
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.2)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1F4B5D",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value="all">Semua Kelompok ({monitoringData?.groups.length || 0})</option>
                    {(monitoringData?.groups || []).map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    color="#1F4B5D"
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                </div>
              </div>

              {/* Tombol Aksi Ekspor & Refresh */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "100%" }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exportingExcel || loadingMonitoring || (mabaListRaw.length === 0 && groupChecksRaw.length === 0)}
                  title="Unduh Rekapitulasi Excel"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#0F766E",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: exportingExcel ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(15, 118, 110, 0.2)",
                  }}
                >
                  {exportingExcel ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                  <span>Unduh (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadMonitoringData(monitoringDate, monitoringGroupId)}
                  disabled={loadingMonitoring}
                  title="Muat ulang data"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(31, 75, 93, 0.08)",
                    color: "#1F4B5D",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RefreshCw size={16} className={loadingMonitoring ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Baris Bawah: Sub-tab Individu vs Kelompok, Status Filter, Search */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                {/* Switcher Sub-Tab */}
                <div style={{ display: "flex", gap: "6px", backgroundColor: "rgba(31, 75, 93, 0.06)", padding: "4px", borderRadius: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setMonitoringSubTab("individu")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: monitoringSubTab === "individu" ? "#1F4B5D" : "transparent",
                      color: monitoringSubTab === "individu" ? "#FFFFFF" : "#1F4B5D",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <User size={14} /> Atribut Individu ({individuAttrs.length} Item)
                  </button>

                  <button
                    type="button"
                    onClick={() => setMonitoringSubTab("kelompok")}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: monitoringSubTab === "kelompok" ? "#D97706" : "transparent",
                      color: monitoringSubTab === "kelompok" ? "#FFFFFF" : "#1F4B5D",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Users size={14} /> Atribut Kelompok ({kelompokAttrs.length} Item)
                  </button>
                </div>

                {/* Filter Status (Khusus Mahasiswa/Individu) */}
                {monitoringSubTab === "individu" && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[
                      { id: "all", label: "Semua", count: statsSummary.total },
                      { id: "kurang", label: "Tidak Lengkap / Kurang", count: statsSummary.kurang, color: "#DC2626", bg: "rgba(239, 68, 68, 0.12)" },
                      { id: "lengkap", label: "Lengkap (100%)", count: statsSummary.lengkap, color: "#059669", bg: "rgba(16, 185, 129, 0.12)" },
                      { id: "belum_dicek", label: "Belum Dicek", count: statsSummary.belum, color: "#D97706", bg: "rgba(245, 158, 11, 0.12)" },
                    ].map((f) => {
                      const isActive = statusFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setStatusFilter(f.id as any)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "8px",
                            border: isActive ? `1.5px solid ${f.color || "#1F4B5D"}` : "1px solid rgba(31, 75, 93, 0.1)",
                            backgroundColor: isActive ? (f.bg || "#1F4B5D") : "#FFFFFF",
                            color: isActive ? (f.color || "#FFFFFF") : "#1F4B5D",
                            fontSize: "0.74rem",
                            fontWeight: isActive ? 800 : 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span>{f.label}</span>
                          <span
                            style={{
                              padding: "1px 6px",
                              borderRadius: "999px",
                              backgroundColor: isActive ? "rgba(0,0,0,0.08)" : "rgba(31, 75, 93, 0.08)",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                            }}
                          >
                            {f.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input Pencarian */}
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  color="rgba(31, 75, 93, 0.4)"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder={
                    monitoringSubTab === "individu"
                      ? "Cari nama mahasiswa, NIM, atau kelompok..."
                      : "Cari nama kelompok..."
                  }
                  value={monitoringSearch}
                  onChange={(e) => setMonitoringSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 36px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.15)",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Kartu Ringkasan Metrik (KPIs) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "18px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>Total Maba</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F4B5D", marginTop: "2px" }}>
                {statsSummary.total}
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(31, 75, 93, 0.5)", marginTop: "2px" }}>
                Mahasiswa Terdata
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#065F46", fontWeight: 700 }}>Lengkap (100%)</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                {statsSummary.lengkap}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                {statsSummary.persenLengkap}% Terpenuhi
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#991B1B", fontWeight: 700 }}>Tidak Membawa</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#DC2626", marginTop: "2px" }}>
                {statsSummary.kurang}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#DC2626", fontWeight: 600, marginTop: "2px" }}>
                Perlu Follow Up Tatib
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#92400E", fontWeight: 700 }}>Belum Diperiksa</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#D97706", marginTop: "2px" }}>
                {statsSummary.belum}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#D97706", fontWeight: 600, marginTop: "2px" }}>
                Menunggu Mentor
              </div>
            </div>
          </div>

          {/* Kondisi Jika Tidak Ada Master Atribut pada Tanggal Ini */}
          {individuAttrs.length === 0 && kelompokAttrs.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "40px 20px",
                textAlign: "center",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                marginBottom: "20px",
              }}
            >
              <PackageCheck size={48} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 6px 0", color: "#1F4B5D" }}>
                Belum Ada Atribut untuk {formatDateId(monitoringDate)}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.7)", margin: "0 auto 18px auto", maxWidth: "440px", lineHeight: 1.4 }}>
                Belum ada barang bawaan yang dijadwalkan pada tanggal ini. Anda dapat mendaftarkan atribut baru di tab &quot;Daftar Atribut&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMainTab("master");
                  handleOpenCreateModal();
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Plus size={16} /> Tambah Atribut untuk Tanggal Ini
              </button>
            </div>
          ) : loadingMonitoring ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Loader2 size={32} className="animate-spin" color="#0F766E" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: "0.85rem", color: "#1F4B5D", fontWeight: 600 }}>Memuat status kelengkapan atribut maba...</p>
            </div>
          ) : (
            <div>
              {/* Quick Atribut Terjadwal Bar dengan Tombol Edit untuk Admin */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(31, 75, 93, 0.08)",
                }}
              >
                <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#1F4B5D" }}>
                  Daftar Atribut {monitoringSubTab === "individu" ? "Individu" : "Kelompok"} Terjadwal:
                </span>
                {(monitoringSubTab === "individu" ? individuAttrs : kelompokAttrs).map((attr) => (
                  <div
                    key={attr.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(31, 75, 93, 0.06)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#1F4B5D",
                    }}
                  >
                    <span>{attr.name}</span>
                    {user?.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(attr)}
                        title="Edit atribut ini (Khusus Admin)"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0 2px",
                          color: "#0F766E",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Anchor Scroll untuk Navigasi Halaman */}
              <div id="monitoringListTop" />

              {/* Bar Pengaturan Tampilan & Range Data di Bagian Atas */}
              {((monitoringSubTab === "individu" && filteredMabaList.length > 0) ||
                (monitoringSubTab === "kelompok" && filteredGroupList.length > 0)) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "14px",
                    padding: "8px 14px",
                    backgroundColor: "rgba(31, 75, 93, 0.04)",
                    borderRadius: "12px",
                    border: "1px solid rgba(31, 75, 93, 0.08)",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "#1F4B5D", fontWeight: 700 }}>
                    Menampilkan{" "}
                    <span style={{ color: "#0F766E", fontWeight: 800 }}>
                      {monitoringSubTab === "individu"
                        ? `${mabaStartIndex + 1} - ${Math.min(mabaStartIndex + pageSize, totalMabaItems)}`
                        : `${groupStartIndex + 1} - ${Math.min(groupStartIndex + pageSize, totalGroupItems)}`}
                    </span>{" "}
                    dari{" "}
                    <span style={{ fontWeight: 800 }}>
                      {monitoringSubTab === "individu" ? `${totalMabaItems} Mahasiswa` : `${totalGroupItems} Kelompok`}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>
                      Tampilkan per halaman:
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[10, 25, 50, 100].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                          }}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            border: pageSize === size ? "none" : "1px solid rgba(31, 75, 93, 0.15)",
                            backgroundColor: pageSize === size ? "#0F766E" : "#FFFFFF",
                            color: pageSize === size ? "#FFFFFF" : "#1F4B5D",
                            fontSize: "0.74rem",
                            fontWeight: pageSize === size ? 800 : 600,
                            cursor: "pointer",
                            boxShadow: pageSize === size ? "0 1px 4px rgba(15, 118, 110, 0.25)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {monitoringSubTab === "individu" ? (
            /* ======================================================= */
            /* SUB-TAB INDIVIDU: DAFTAR MAHASISWA & STATUS ATRIBUT      */
            /* ======================================================= */
            filteredMabaList.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "40px 20px",
                  textAlign: "center",
                  border: "1px solid rgba(31, 75, 93, 0.08)",
                }}
              >
                <Search size={36} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 10px" }} />
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F4B5D", margin: "0 0 4px 0" }}>
                  Tidak Ada Mahasiswa yang Sesuai Filter
                </h4>
                <p style={{ fontSize: "0.8rem", color: "rgba(31, 75, 93, 0.6)", margin: 0 }}>
                  Coba ubah filter status atau kata kunci pencarian Anda.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {paginatedMabaList.map((maba) => {
                  const mabaChecks = mabaChecksState[maba.id] || {};

                  return (
                    <div
                      key={maba.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "16px",
                        padding: "16px 18px",
                        border: "1px solid rgba(31, 75, 93, 0.08)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Baris Atas Profil Maba */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          borderBottom: "1px solid rgba(31, 75, 93, 0.06)",
                          paddingBottom: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                              {maba.nama}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(31, 75, 93, 0.08)",
                                color: "#1F4B5D",
                              }}
                            >
                              NIM: {maba.nim || "-"}
                            </span>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(15, 118, 110, 0.1)",
                                color: "#0F766E",
                              }}
                            >
                              {maba.groupName}
                            </span>
                          </div>
                        </div>

                        {/* Badge Status Keseluruhan Maba & Quick Action */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {maba.statusCategory === "lengkap" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "0.74rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              <CheckCircle2 size={13} /> Lengkap ({maba.totalBrought}/{maba.totalAttrs})
                            </span>
                          ) : maba.statusCategory === "kurang" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "0.74rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              <XCircle size={13} /> Kurang {maba.totalNotBrought} Barang
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "0.74rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "999px",
                                backgroundColor: "rgba(245, 158, 11, 0.12)",
                                color: "#D97706",
                                border: "1px solid rgba(245, 158, 11, 0.2)",
                              }}
                            >
                              <Clock size={13} /> Belum Diperiksa
                            </span>
                          )}

                          {/* Tombol Cepat: Tandai Lengkap */}
                          <button
                            type="button"
                            onClick={() => markMabaAllBrought(maba.id)}
                            title="Tandai semua barang bawaan maba ini sebagai Lengkap (Bawa)"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(31, 75, 93, 0.15)",
                              backgroundColor: "#FFFFFF",
                              color: "#1F4B5D",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckSquare size={12} color="#059669" /> Tandai Lengkap
                          </button>
                        </div>
                      </div>

                      {/* Chips Daftar Atribut Individu */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "8px" }}>
                        {individuAttrs.map((attr) => {
                          const check = mabaChecks[attr.id] || maba.checks[attr.id] || {
                            isBrought: false,
                            notes: null,
                            isSaved: false,
                          };

                          const isSaved = check.isSaved;
                          const isBrought = check.isBrought;
                          const hasNote = Boolean(check.notes);

                          return (
                            <div
                              key={attr.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                borderRadius: "10px",
                                backgroundColor: !isSaved
                                  ? "rgba(31, 75, 93, 0.03)"
                                  : isBrought
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "rgba(239, 68, 68, 0.08)",
                                border: `1px solid ${
                                  !isSaved
                                    ? "rgba(31, 75, 93, 0.1)"
                                    : isBrought
                                    ? "rgba(16, 185, 129, 0.3)"
                                    : "rgba(239, 68, 68, 0.3)"
                                }`,
                                gap: "8px",
                              }}
                            >
                              <div
                                onClick={() => toggleMabaItem(maba.id, attr.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: 1,
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                {isSaved ? (
                                  isBrought ? (
                                    <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                                  ) : (
                                    <XCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                                  )
                                ) : (
                                  <Clock size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                )}

                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D" }}>
                                    {attr.name}
                                  </div>
                                  <div style={{ fontSize: "0.68rem", color: "rgba(31, 75, 93, 0.6)" }}>
                                    {!isSaved ? "Belum dicek" : isBrought ? "Membawa" : "Tidak membawa"}
                                  </div>
                                </div>
                              </div>

                              {/* Tombol Catatan */}
                              <button
                                type="button"
                                onClick={() =>
                                  openNoteModal(
                                    "maba",
                                    maba.id,
                                    attr.id,
                                    `${maba.nama} - ${attr.name}`,
                                    check.notes || ""
                                  )
                                }
                                title={hasNote ? `Catatan: ${check.notes}` : "Tambahkan catatan"}
                                style={{
                                  padding: "4px 6px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: hasNote ? "rgba(217, 119, 6, 0.15)" : "transparent",
                                  color: hasNote ? "#D97706" : "rgba(31, 75, 93, 0.4)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Edit3 size={13} />
                                {hasNote && <span>Note</span>}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info Catatan Terbuka jika ada */}
                      {individuAttrs.some((a) => Boolean(mabaChecks[a.id]?.notes)) && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(245, 158, 11, 0.08)",
                            border: "1px dashed rgba(245, 158, 11, 0.3)",
                            fontSize: "0.74rem",
                            color: "#92400E",
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>Catatan Evaluasi: </span>
                          {individuAttrs
                            .filter((a) => Boolean(mabaChecks[a.id]?.notes))
                            .map((a) => `${a.name}: "${mabaChecks[a.id]?.notes}"`)
                            .join(" • ")}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>

                {/* Footer Pagination Mahasiswa */}
                {renderPagination(activeMabaPage, totalMabaPages, totalMabaItems, "mahasiswa")}
              </div>
            )
          ) : (
            /* ======================================================= */
            /* SUB-TAB KELOMPOK: DAFTAR KELOMPOK & ATRIBUT TIM         */
            /* ======================================================= */
            filteredGroupList.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "40px 20px",
                  textAlign: "center",
                  border: "1px solid rgba(31, 75, 93, 0.08)",
                }}
              >
                <Users size={36} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 10px" }} />
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1F4B5D", margin: "0 0 4px 0" }}>
                  Tidak Ada Kelompok Terdaftar
                </h4>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {paginatedGroupList.map((grp) => {
                  const grpChecks = groupChecksState[grp.groupId] || {};

                  return (
                    <div
                      key={grp.groupId}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "16px",
                        padding: "16px 18px",
                        border: "1px solid rgba(31, 75, 93, 0.08)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          borderBottom: "1px solid rgba(31, 75, 93, 0.06)",
                          paddingBottom: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Users size={18} color="#D97706" />
                          <h4 style={{ fontSize: "0.98rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                            {grp.groupName}
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(217, 119, 6, 0.12)",
                            color: "#D97706",
                          }}
                        >
                          Atribut Tim
                        </span>
                      </div>

                      {/* Grid Item Kelompok */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                        {kelompokAttrs.map((attr) => {
                          const check = grpChecks[attr.id] || grp.checks[attr.id] || {
                            isBrought: false,
                            notes: null,
                            isSaved: false,
                          };

                          const isSaved = check.isSaved;
                          const isBrought = check.isBrought;
                          const hasNote = Boolean(check.notes);

                          return (
                            <div
                              key={attr.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                backgroundColor: !isSaved
                                  ? "rgba(31, 75, 93, 0.03)"
                                  : isBrought
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "rgba(239, 68, 68, 0.08)",
                                border: `1px solid ${
                                  !isSaved
                                    ? "rgba(31, 75, 93, 0.1)"
                                    : isBrought
                                    ? "rgba(16, 185, 129, 0.3)"
                                    : "rgba(239, 68, 68, 0.3)"
                                }`,
                                gap: "8px",
                              }}
                            >
                              <div
                                onClick={() => toggleGroupItem(grp.groupId, attr.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: 1,
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                {isSaved ? (
                                  isBrought ? (
                                    <CheckCircle2 size={18} color="#059669" />
                                  ) : (
                                    <XCircle size={18} color="#DC2626" />
                                  )
                                ) : (
                                  <Clock size={18} color="#9CA3AF" />
                                )}

                                <div>
                                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F4B5D" }}>
                                    {attr.name}
                                  </div>
                                  <div style={{ fontSize: "0.7rem", color: "rgba(31, 75, 93, 0.6)" }}>
                                    {!isSaved ? "Belum dicek" : isBrought ? "Membawa" : "Tidak membawa"}
                                  </div>
                                </div>
                              </div>

                              {/* Tombol Catatan */}
                              <button
                                type="button"
                                onClick={() =>
                                  openNoteModal(
                                    "group",
                                    grp.groupId,
                                    attr.id,
                                    `${grp.groupName} - ${attr.name}`,
                                    check.notes || ""
                                  )
                                }
                                title={hasNote ? `Catatan: ${check.notes}` : "Tambahkan catatan"}
                                style={{
                                  padding: "4px 6px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: hasNote ? "rgba(217, 119, 6, 0.15)" : "transparent",
                                  color: hasNote ? "#D97706" : "rgba(31, 75, 93, 0.4)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                <Edit3 size={13} />
                                {hasNote && <span>Note</span>}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info Catatan jika ada */}
                      {kelompokAttrs.some((a) => Boolean(grpChecks[a.id]?.notes)) && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(245, 158, 11, 0.08)",
                            border: "1px dashed rgba(245, 158, 11, 0.3)",
                            fontSize: "0.74rem",
                            color: "#92400E",
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>Catatan: </span>
                          {kelompokAttrs
                            .filter((a) => Boolean(grpChecks[a.id]?.notes))
                            .map((a) => `${a.name}: "${grpChecks[a.id]?.notes}"`)
                            .join(" • ")}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>

                {/* Footer Pagination Kelompok */}
                {renderPagination(activeGroupPage, totalGroupPages, totalGroupItems, "kelompok")}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )}

      {/* ========================================================================= */}
      {/* KONTEN TAB 2: MASTER ATRIBUT (CRUD)                                       */}
      {/* ========================================================================= */}
      {mainTab === "master" && (
        <div>
          {/* Ringkasan Master */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "18px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.7)", fontWeight: 600 }}>Total Atribut</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F4B5D", marginTop: "2px" }}>
                {attributes.length}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#0F766E", fontWeight: 600 }}>Atribut Individu</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0F766E", marginTop: "2px" }}>
                {attributes.filter((a) => a.type === "individu").length}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "14px 12px",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#D97706", fontWeight: 600 }}>Atribut Kelompok</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#D97706", marginTop: "2px" }}>
                {attributes.filter((a) => a.type === "kelompok").length}
              </div>
            </div>
          </div>

          {/* Baris Aksi & Filter Master */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "18px",
              border: "1px solid rgba(31, 75, 93, 0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
                }}
              >
                <Plus size={18} /> Tambah Atribut Baru
              </button>

              {/* Filter Tipe Tabs */}
              <div style={{ display: "flex", gap: "6px", backgroundColor: "rgba(31, 75, 93, 0.06)", padding: "4px", borderRadius: "10px" }}>
                {[
                  { id: "all", label: "Semua" },
                  { id: "individu", label: "Individu" },
                  { id: "kelompok", label: "Kelompok" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMasterFilterType(t.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: masterFilterType === t.id ? "#1F4B5D" : "transparent",
                      color: masterFilterType === t.id ? "#FFFFFF" : "#1F4B5D",
                      fontSize: "0.78rem",
                      fontWeight: masterFilterType === t.id ? 700 : 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Pencarian & Filter Tanggal Master */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  color="rgba(31, 75, 93, 0.4)"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="text"
                  placeholder="Cari nama atribut atau deskripsi..."
                  value={masterSearchQuery}
                  onChange={(e) => setMasterSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 36px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.15)",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "160px" }}>
                <DatePicker
                  value={masterFilterDate}
                  onChange={(val) => setMasterFilterDate(val)}
                  placeholder="Filter Tanggal"
                />
                {masterFilterDate && (
                  <button
                    type="button"
                    onClick={() => setMasterFilterDate("")}
                    title="Reset filter tanggal"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.15)",
                      backgroundColor: "rgba(31, 75, 93, 0.05)",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#1F4B5D",
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Master Atribut Dikelompokkan Per Tanggal */}
          {Object.keys(groupedMasterByDate).length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "40px 20px",
                textAlign: "center",
                border: "1px solid rgba(31, 75, 93, 0.08)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
              }}
            >
              <PackageCheck size={44} color="rgba(31, 75, 93, 0.3)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 6px 0", color: "#1F4B5D" }}>
                Belum Ada Atribut Terdaftar
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.7)", margin: "0 0 16px 0" }}>
                {masterSearchQuery || masterFilterDate || masterFilterType !== "all"
                  ? "Tidak ada atribut yang sesuai dengan kriteria filter."
                  : "Klik tombol 'Tambah Atribut Baru' untuk mengatur daftar atribut bawaan maba."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(groupedMasterByDate).map(([dateKey, items]) => (
                <div
                  key={dateKey}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "18px",
                    border: "1px solid rgba(31, 75, 93, 0.08)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                  }}
                >
                  {/* Header Tanggal */}
                  <div
                    style={{
                      backgroundColor: "rgba(31, 75, 93, 0.04)",
                      padding: "14px 18px",
                      borderBottom: "1px solid rgba(31, 75, 93, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={18} color="#0F766E" />
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F4B5D" }}>
                        {formatDateId(dateKey)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          backgroundColor: "rgba(15, 118, 110, 0.1)",
                          color: "#0F766E",
                        }}
                      >
                        {items.length} Item
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMonitoringDate(dateKey);
                          setMainTab("monitoring");
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          backgroundColor: "#0F766E",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Pantau Bawaan &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((attr, idx) => (
                      <div
                        key={attr.id}
                        style={{
                          padding: "14px 18px",
                          borderBottom: idx < items.length - 1 ? "1px solid rgba(31, 75, 93, 0.06)" : "none",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "14px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                backgroundColor: attr.type === "kelompok" ? "rgba(217, 119, 6, 0.12)" : "rgba(15, 118, 110, 0.12)",
                                color: attr.type === "kelompok" ? "#D97706" : "#0F766E",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {attr.type === "kelompok" ? <Users size={12} /> : <User size={12} />}
                              {attr.type}
                            </span>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1F1E19" }}>
                              {attr.name}
                            </h4>
                          </div>

                          {attr.description && (
                            <p style={{ fontSize: "0.82rem", color: "rgba(31, 75, 93, 0.75)", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                              {attr.description}
                            </p>
                          )}

                          <div style={{ fontSize: "0.72rem", color: "rgba(31, 75, 93, 0.5)", marginTop: "6px" }}>
                            Dibuat oleh: {attr.creator?.nama || "Admin"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          {user?.role === "admin" && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(attr)}
                              title="Edit atribut (Khusus Admin)"
                              style={{
                                padding: "8px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "rgba(15, 118, 110, 0.08)",
                                color: "#0F766E",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background 0.15s",
                              }}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMaster(attr.id, attr.name)}
                            title="Hapus atribut"
                            style={{
                              padding: "8px",
                              borderRadius: "8px",
                              border: "none",
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              color: "#DC2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH MASTER ATRIBUT                                            */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {editingId ? (
                  <Edit3 size={22} color="#0F766E" />
                ) : (
                  <PackageCheck size={22} color="#0F766E" />
                )}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                    {editingId ? "Edit Atribut" : "Tambah Atribut Baru"}
                  </h3>
                  {editingId && (
                    <span style={{ fontSize: "0.7rem", color: "#0F766E", fontWeight: 700 }}>
                      Khusus Admin
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(31, 75, 93, 0.6)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Nama Atribut / Barang Bawaan *
                </label>
                <input
                  type="text"
                  placeholder="Misal: Name Tag Resmi Ukuran B2"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Deskripsi &amp; Instruksi Kelengkapan
                </label>
                <textarea
                  rows={3}
                  placeholder="Misal: Wajib dikalungkan di leher dengan lanyard resmi..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.2)",
                    fontSize: "0.85rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Tanggal Kegiatan / Target Date *
                </label>
                <DatePicker
                  value={formDate}
                  onChange={(val) => setFormDate(val)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "6px" }}>
                  Tipe Atribut *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setFormType("individu")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formType === "individu" ? "#0F766E" : "rgba(31, 75, 93, 0.15)"}`,
                      backgroundColor: formType === "individu" ? "rgba(15, 118, 110, 0.08)" : "#FFFFFF",
                      color: formType === "individu" ? "#0F766E" : "#1F4B5D",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <User size={16} /> Individu (Per Maba)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("kelompok")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formType === "kelompok" ? "#D97706" : "rgba(31, 75, 93, 0.15)"}`,
                      backgroundColor: formType === "kelompok" ? "rgba(217, 119, 6, 0.08)" : "#FFFFFF",
                      color: formType === "kelompok" ? "#D97706" : "#1F4B5D",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Users size={16} /> Kelompok (1 Per Tim)
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
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
                    flex: 2,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#0F766E",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Menyimpan...
                    </>
                  ) : editingId ? (
                    "Perbarui Atribut"
                  ) : (
                    "Simpan Atribut"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATATAN ATRIBUT                                                  */}
      {/* ========================================================================= */}
      {noteModalOpen && activeNoteTarget && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              padding: "22px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit3 size={18} color="#0F766E" />
                <h4 style={{ fontSize: "0.98rem", fontWeight: 800, margin: 0, color: "#1F4B5D" }}>
                  Catatan Pemeriksaan Atribut
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(31, 75, 93, 0.6)" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.8rem", color: "rgba(31, 75, 93, 0.8)", margin: "0 0 12px 0", fontWeight: 600 }}>
              {activeNoteTarget.title}
            </p>

            <textarea
              rows={3}
              placeholder="Misal: Tertinggal di kos, diminta bawa susulan besok..."
              defaultValue={activeNoteTarget.note}
              id="attrNoteTextarea"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(31, 75, 93, 0.2)",
                fontSize: "0.85rem",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: "14px",
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px",
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
                onClick={() => {
                  const val = (document.getElementById("attrNoteTextarea") as HTMLTextAreaElement)?.value || "";
                  saveNoteFromModal(val);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#0F766E",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
