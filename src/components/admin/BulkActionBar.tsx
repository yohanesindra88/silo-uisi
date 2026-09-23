"use client";

import React from "react";
import { Trash2, X, CheckSquare } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  entityLabel?: string;
  isDeleting?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  entityLabel = "data",
  isDeleting = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 900,
        width: "calc(100% - 32px)",
        maxWidth: "600px",
        backgroundColor: "#111827",
        color: "#FFFFFF",
        padding: "12px 18px",
        borderRadius: "16px",
        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        backdropFilter: "blur(12px)",
        animation: "slideUp 0.25s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            backgroundColor: "rgba(104, 207, 235, 0.2)",
            color: "#68CFEB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckSquare size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#FFFFFF" }}>
            {selectedCount} {entityLabel} Terpilih
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.65)" }}>
            Centang baris untuk menambah atau kurangi
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={isDeleting}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: "transparent",
            color: "#E2E8F0",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: isDeleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <X size={14} />
          <span>Batal</span>
        </button>

        <button
          type="button"
          onClick={onBulkDelete}
          disabled={isDeleting}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#DC2626",
            color: "#FFFFFF",
            fontSize: "0.78rem",
            fontWeight: 800,
            cursor: isDeleting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
          }}
        >
          <Trash2 size={14} />
          <span>Hapus Terpilih ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
};
