"use client";

import React, { useState } from "react";
import { GroupImportRow, UserImportRow } from "@/controllers/import.controller";
import { X, Save, Database, AlertTriangle, Loader2 } from "lucide-react";

interface ImportEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "groups" | "users";
  rowNumber: number;
  initialData: GroupImportRow | UserImportRow | null;
  isExistingInDb: boolean;
  onSaveRow: (
    updatedData: GroupImportRow | UserImportRow,
    saveDirectlyToDb: boolean
  ) => Promise<void>;
}

interface ImportEditModalContentProps {
  onClose: () => void;
  type: "groups" | "users";
  rowNumber: number;
  initialData: GroupImportRow | UserImportRow;
  isExistingInDb: boolean;
  onSaveRow: (
    updatedData: GroupImportRow | UserImportRow,
    saveDirectlyToDb: boolean
  ) => Promise<void>;
}

const ImportEditModalContent: React.FC<ImportEditModalContentProps> = ({
  onClose,
  type,
  rowNumber,
  initialData,
  isExistingInDb,
  onSaveRow,
}) => {
  const groupInitial = type === "groups" ? (initialData as GroupImportRow) : null;
  const userInitial = type === "users" ? (initialData as UserImportRow) : null;

  // State form untuk Kelompok
  const [namaKelompok, setNamaKelompok] = useState(groupInitial?.nama_kelompok || "");
  const [deskripsi, setDeskripsi] = useState(groupInitial?.deskripsi || "");

  // State form untuk Pengguna
  const [nama, setNama] = useState(userInitial?.nama || "");
  const [nim, setNim] = useState(userInitial?.nim || "");
  const [username, setUsername] = useState(userInitial?.username || "");
  const [role, setRole] = useState(userInitial?.role || "maba");
  const [fakultas, setFakultas] = useState(userInitial?.fakultas || "");
  const [prodi, setProdi] = useState(userInitial?.prodi || "");
  const [userKelompok, setUserKelompok] = useState(userInitial?.nama_kelompok || "");

  const [savingPreview, setSavingPreview] = useState(false);
  const [savingDb, setSavingDb] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (saveDirectlyToDb: boolean) => {
    setErrorMessage(null);

    if (type === "groups") {
      if (!namaKelompok.trim()) {
        setErrorMessage("Nama kelompok wajib diisi.");
        return;
      }
      const updated: GroupImportRow = {
        nama_kelompok: namaKelompok.trim(),
        deskripsi: deskripsi.trim() || null,
      };

      try {
        if (saveDirectlyToDb) setSavingDb(true);
        else setSavingPreview(true);

        await onSaveRow(updated, saveDirectlyToDb);
        onClose();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal menyimpan perubahan."
        );
      } finally {
        setSavingPreview(false);
        setSavingDb(false);
      }
    } else {
      if (!nama.trim()) {
        setErrorMessage("Nama lengkap wajib diisi.");
        return;
      }
      if (!username.trim()) {
        setErrorMessage("Username wajib diisi.");
        return;
      }

      const updated: UserImportRow = {
        nama: nama.trim(),
        nim: nim.trim() || null,
        username: username.trim(),
        role: role.trim().toLowerCase(),
        fakultas: fakultas.trim() || null,
        prodi: prodi.trim() || null,
        nama_kelompok: userKelompok.trim() || null,
        password_default: (initialData as UserImportRow).password_default || null,
      };

      try {
        if (saveDirectlyToDb) setSavingDb(true);
        else setSavingPreview(true);

        await onSaveRow(updated, saveDirectlyToDb);
        onClose();
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal menyimpan perubahan."
        );
      } finally {
        setSavingPreview(false);
        setSavingDb(false);
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(31, 75, 93, 0.15)",
          overflow: "hidden",
          animation: "scaleUp 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1F4B5D", margin: 0 }}>
                Edit Data Baris #{rowNumber}
              </h3>
              {isExistingInDb && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    border: "1px solid #FDE68A",
                  }}
                >
                  Sudah Ada di DB
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.76rem", color: "#64748B", margin: "2px 0 0 0" }}>
              Perbarui atribut baris data {type === "groups" ? "kelompok" : "pengguna"}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Scroll Form */}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
          {isExistingInDb && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                marginBottom: "16px",
              }}
            >
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "0.78rem", color: "#92400E", lineHeight: 1.45 }}>
                <strong>Catatan:</strong> Data ini telah tercatat di sistem. Anda dapat memperbarui datanya pada antrean impor, atau langsung menyinkronkannya ke database.
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "0.78rem",
                marginBottom: "14px",
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          {type === "groups" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                  Nama Kelompok <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={namaKelompok}
                  onChange={(e) => setNamaKelompok(e.target.value)}
                  placeholder="Contoh: Rasi 01"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                  Deskripsi Kelompok
                </label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Deskripsi singkat kelompok..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                  Nama Lengkap <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama mahasiswa atau mentor"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #CBD5E1",
                    fontSize: "0.85rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    NIM
                  </label>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="Contoh: 10121100"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    Username <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username login"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    Role Pengguna
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="maba">Maba (Mahasiswa Baru)</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin / Panitia</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    Nama Kelompok
                  </label>
                  <input
                    type="text"
                    value={userKelompok}
                    onChange={(e) => setUserKelompok(e.target.value)}
                    placeholder="Contoh: Rasi 01"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    Fakultas
                  </label>
                  <input
                    type="text"
                    value={fakultas}
                    onChange={(e) => setFakultas(e.target.value)}
                    placeholder="Contoh: FTID"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "5px" }}>
                    Program Studi
                  </label>
                  <input
                    type="text"
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value)}
                    placeholder="Contoh: Informatika"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.85rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "#F8FAFC",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={savingPreview || savingDb}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Batal
          </button>

          {isExistingInDb && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={savingPreview || savingDb}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#0F766E",
                color: "#FFFFFF",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(15, 118, 110, 0.25)",
              }}
            >
              {savingDb ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              <span>Simpan Langsung ke DB</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={savingPreview || savingDb}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#1F4B5D",
              color: "#FFFFFF",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(31, 75, 93, 0.25)",
            }}
          >
            {savingPreview ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Perbarui Antrean Impor</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImportEditModal: React.FC<ImportEditModalProps> = ({
  isOpen,
  initialData,
  ...props
}) => {
  if (!isOpen || !initialData) return null;

  return (
    <ImportEditModalContent
      key={`${props.type}-${props.rowNumber}`}
      {...props}
      initialData={initialData}
    />
  );
};
