"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DbDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  title: string;
  description: string;
  itemsPreview?: string[];
  totalCount?: number;
  errorMessage?: string | null;
  notice?: string;
}

export const DbDeleteModal: React.FC<DbDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  title,
  description,
  itemsPreview = [],
  totalCount,
  errorMessage,
  notice,
}) => {
  if (!isOpen) return null;

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
        if (!isDeleting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#DC2626",
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
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
                {title}
              </h3>
              <p style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.85)", margin: 0 }}>
                Tindakan ini permanen di basis data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              cursor: isDeleting ? "not-allowed" : "pointer",
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

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#DC2626",
                fontSize: "0.8rem",
                marginBottom: "14px",
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          <p style={{ fontSize: "0.85rem", color: "#374151", margin: "0 0 14px 0", lineHeight: 1.5 }}>
            {description}
          </p>

          {itemsPreview.length > 0 && (
            <div
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: "12px",
                padding: "12px",
                border: "1px solid #E5E7EB",
                marginBottom: "16px",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase" }}>
                Daftar Item ({totalCount || itemsPreview.length}):
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", color: "#1F2937", lineHeight: 1.6 }}>
                {itemsPreview.slice(0, 10).map((name, idx) => (
                  <li key={idx} style={{ fontWeight: 600 }}>
                    {name}
                  </li>
                ))}
                {itemsPreview.length > 10 && (
                  <li style={{ fontStyle: "italic", color: "#6B7280" }}>
                    ...dan {itemsPreview.length - 10} data lainnya
                  </li>
                )}
              </ul>
            </div>
          )}

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "0.75rem", color: "#92400E", lineHeight: 1.4 }}>
              {notice || "Data yang dihapus akan dilepaskan dari relasi kelompok dan pivot terkait secara aman."}
            </span>
          </div>
        </div>

        {/* Footer */}
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
            disabled={isDeleting}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid #D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#374151",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: isDeleting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Ya, Hapus Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
