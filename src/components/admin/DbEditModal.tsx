"use client";

import React, { useState } from "react";
import { Edit3, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export interface GroupOption {
  id: number;
  name: string;
}

export interface UserEditData {
  id: number;
  nama: string;
  nim?: string | null;
  username: string;
  role: string;
  fakultas?: string | null;
  prodi?: string | null;
  mGroupsId?: number | null;
  group?: { id: number; name: string } | null;
  groupMentors?: Array<{
    mGroupsId: number;
    group?: { id: number; name: string } | null;
  }>;
}

export interface GroupEditData {
  id: number;
  name: string;
  description?: string | null;
}

interface DbEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "users" | "groups";
  data: UserEditData | GroupEditData | null;
  groupsList?: GroupOption[];
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  errorMessage?: string | null;
}

interface DbEditModalFormProps {
  onClose: () => void;
  type: "users" | "groups";
  data: UserEditData | GroupEditData;
  groupsList: GroupOption[];
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  errorMessage?: string | null;
}

const DbEditModalForm: React.FC<DbEditModalFormProps> = ({
  onClose,
  type,
  data,
  groupsList,
  onSave,
  isSaving,
  errorMessage,
}) => {
  // Inisialisasi state langsung dari props tanpa useEffect (menghindari cascading render)
  const isUser = type === "users";
  const userData = isUser ? (data as UserEditData) : null;
  const groupData = !isUser ? (data as GroupEditData) : null;

  const [nama, setNama] = useState(userData?.nama || "");
  const [nim, setNim] = useState(userData?.nim || "");
  const [username, setUsername] = useState(userData?.username || "");
  const [role, setRole] = useState(userData?.role || "maba");
  const [fakultas, setFakultas] = useState(userData?.fakultas || "");
  const [prodi, setProdi] = useState(userData?.prodi || "");
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    userData?.mGroupsId
      ? String(userData.mGroupsId)
      : userData?.group?.id
      ? String(userData.group.id)
      : userData?.groupMentors?.[0]?.mGroupsId
      ? String(userData.groupMentors[0].mGroupsId)
      : ""
  );

  const [groupName, setGroupName] = useState(groupData?.name || "");
  const [groupDesc, setGroupDesc] = useState(groupData?.description || "");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (type === "users") {
      if (!nama.trim()) {
        setFormError("Nama lengkap wajib diisi.");
        return;
      }
      if (!username.trim()) {
        setFormError("Username wajib diisi.");
        return;
      }

      await onSave({
        nama: nama.trim(),
        nim: nim.trim() || null,
        username: username.trim(),
        role: role.trim().toLowerCase(),
        fakultas: fakultas.trim() || null,
        prodi: prodi.trim() || null,
        mGroupsId: selectedGroupId ? Number(selectedGroupId) : null,
      });
    } else {
      if (!groupName.trim()) {
        setFormError("Nama kelompok wajib diisi.");
        return;
      }

      await onSave({
        name: groupName.trim(),
        description: groupDesc.trim() || null,
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 48px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#1F4B5D",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(104, 207, 235, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Edit3 size={18} color="#68CFEB" />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
              {type === "users" ? "Edit Data Pengguna" : "Edit Data Kelompok"}
            </h3>
            <p style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.75)", margin: 0 }}>
              ID #{data.id} • Tersimpan di Basis Data
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          style={{
            background: "none",
            border: "none",
            color: "#FFFFFF",
            cursor: isSaving ? "not-allowed" : "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.8,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {(errorMessage || formError) && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#DC2626",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage || formError}</span>
            </div>
          )}

          {type === "users" ? (
            <>
              {/* Field Nama */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Nama Lengkap <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Field NIM */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    NIM (Nomor Induk)
                  </label>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    disabled={isSaving}
                    placeholder="Opsional"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Field Username */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Username <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Field Peran (Role) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Peran (Role) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="maba">Mahasiswa Baru (maba)</option>
                    <option value="mentor">Mentor Pendamping</option>
                    <option value="panitia">Panitia / Admin</option>
                  </select>
                </div>

                {/* Field Kelompok */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Negara
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    disabled={isSaving}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="">-- Tanpa Kelompok --</option>
                    {groupsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Field Fakultas */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Fakultas
                  </label>
                  <input
                    type="text"
                    value={fakultas}
                    onChange={(e) => setFakultas(e.target.value)}
                    disabled={isSaving}
                    placeholder="FTEIC / FEB / FTI"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Field Prodi */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                    Program Studi
                  </label>
                  <input
                    type="text"
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value)}
                    disabled={isSaving}
                    placeholder="Informatika / SI / dll"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(31, 75, 93, 0.25)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Field Nama Kelompok */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Nama Kelompok <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: Kelompok 01 - Garuda"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Field Deskripsi Kelompok */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#1F4B5D", marginBottom: "4px" }}>
                  Deskripsi / Catatan Kelompok
                </label>
                <textarea
                  rows={3}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  disabled={isSaving}
                  placeholder="Keterangan tambahan kelompok..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(31, 75, 93, 0.25)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div
          style={{
            padding: "14px 20px",
            backgroundColor: "#F9FAFB",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid #D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#374151",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#1F4B5D",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(31, 75, 93, 0.25)",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const DbEditModal: React.FC<DbEditModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  groupsList = [],
  onSave,
  isSaving,
  errorMessage,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <DbEditModalForm
        key={`${type}-${data.id}`}
        onClose={onClose}
        type={type}
        data={data}
        groupsList={groupsList}
        onSave={onSave}
        isSaving={isSaving}
        errorMessage={errorMessage}
      />
    </div>
  );
};
