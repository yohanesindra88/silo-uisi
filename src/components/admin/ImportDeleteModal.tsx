"use client";

import React, { useState } from "react";
import { X, Trash2, ListX, Database, Loader2 } from "lucide-react";

interface ImportDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "groups" | "users";
  rowNumber: number;
  identifier: string;
  isExistingInDb: boolean;
  onDeleteFromPreview: () => void;
  onDeleteFromDb?: () => Promise<void>;
}

export const ImportDeleteModal: React.FC<ImportDeleteModalProps> = ({
  isOpen,
  onClose,
  type,
  rowNumber,
  identifier,
  isExistingInDb,
  onDeleteFromPreview,
  onDeleteFromDb,
}) => {
  const [deletingDb, setDeletingDb] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteDb = async () => {
    if (!onDeleteFromDb) return;
    setErrorMessage(null);
    try {
      setDeletingDb(true);
      await onDeleteFromDb();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menghapus data dari database."
      );
    } finally {
      setDeletingDb(false);
    }
  };

  const handleDeletePreview = () => {
    onDeleteFromPreview();
    onClose();
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
          maxWidth: "480px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(31, 75, 93, 0.15)",
          overflow: "hidden",
          animation: "scaleUp 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFF5F5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#991B1B", margin: 0 }}>
                Hapus Data Baris #{rowNumber}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "2px 0 0 0" }}>
                Target: <strong>{identifier}</strong> ({type === "groups" ? "Kelompok" : "Pengguna"})
              </p>
            </div>
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
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

          {isExistingInDb ? (
            <div>
              <p style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                Data <strong>{identifier}</strong> terdeteksi sudah tercatat di dalam database.
                Pilih opsi tindakan penghapusan di bawah:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Opsi 1: Hapus dari Database */}
                <button
                  type="button"
                  onClick={handleDeleteDb}
                  disabled={deletingDb}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1.5px solid #FCA5A5",
                    backgroundColor: "#FEF2F2",
                    textAlign: "left",
                    cursor: deletingDb ? "wait" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#DC2626",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {deletingDb ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#991B1B" }}>
                      Hapus dari Database Sistem
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#7F1D1D", marginTop: "3px", lineHeight: 1.4 }}>
                      Menghapus data lama dari database. Baris ini pada tabel impor akan berubah menjadi <strong>data baru yang VALID</strong> (siap diimpor ulang secara bersih).
                    </div>
                  </div>
                </button>

                {/* Opsi 2: Hapus dari Antrean Impor */}
                <button
                  type="button"
                  onClick={handleDeletePreview}
                  disabled={deletingDb}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1.5px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#64748B",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    <ListX size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#334155" }}>
                      Hapus dari Antrean Impor Saja
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#64748B", marginTop: "3px", lineHeight: 1.4 }}>
                      Mengeluarkan baris ini dari file impor saat ini. Data yang ada di dalam database tidak akan disentuh dan tidak akan di-update.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.85rem", color: "#334155", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus baris #{rowNumber} (<strong>{identifier}</strong>) dari daftar antrean impor?
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
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
                <button
                  type="button"
                  onClick={handleDeletePreview}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#DC2626",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus dari Antrean</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer for Existing In DB */}
        {isExistingInDb && (
          <div
            style={{
              padding: "12px 22px",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "flex-end",
              backgroundColor: "#F8FAFC",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={deletingDb}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
