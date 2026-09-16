"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";

interface ImportSummaryCardProps {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}

export const ImportSummaryCard: React.FC<ImportSummaryCardProps> = ({
  totalRows,
  validCount,
  warningCount,
  errorCount,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      {/* Total Baris */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "18px",
          border: "1.5px solid rgba(31, 75, 93, 0.12)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "rgba(31, 75, 93, 0.08)",
            color: "#1F4B5D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={20} />
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(31, 75, 93, 0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Total Baris
          </p>
          <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1F4B5D", margin: "2px 0 0 0" }}>
            {totalRows}
          </p>
        </div>
      </div>

      {/* Siap Simpan / Valid */}
      <div
        style={{
          backgroundColor: "#ECFDF5",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "18px",
          border: "1.5px solid #A7F3D0",
          boxShadow: "0 4px 14px rgba(5, 150, 105, 0.06)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "#D1FAE5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#047857", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Siap Simpan
          </p>
          <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#065F46", margin: "2px 0 0 0" }}>
            {validCount}
          </p>
        </div>
      </div>

      {/* Peringatan / Update */}
      <div
        style={{
          backgroundColor: "#FFFBEB",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "18px",
          border: "1.5px solid #FDE68A",
          boxShadow: "0 4px 14px rgba(217, 119, 6, 0.06)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "#FEF3C7",
            color: "#D97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#B45309", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Peringatan / Update
          </p>
          <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#92400E", margin: "2px 0 0 0" }}>
            {warningCount}
          </p>
        </div>
      </div>

      {/* Baris Error */}
      <div
        style={{
          backgroundColor: "#FEF2F2",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "18px",
          border: "1.5px solid #FECACA",
          boxShadow: "0 4px 14px rgba(220, 38, 38, 0.06)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <XCircle size={20} />
        </div>
        <div>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#B91C1C", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Baris Error
          </p>
          <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "#991B1B", margin: "2px 0 0 0" }}>
            {errorCount}
          </p>
        </div>
      </div>
    </div>
  );
};
