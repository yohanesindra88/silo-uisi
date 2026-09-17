"use client";

import React from "react";
import { CheckCircle2, XCircle, Info, ArrowRight } from "lucide-react";

interface ImportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  actionType?: "delete_db" | "delete_preview" | "edit_db" | "edit_preview";
  targetName?: string;
}

export const ImportFeedbackModal: React.FC<ImportFeedbackModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  actionType,
  targetName,
}) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

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
        zIndex: 10000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "460px",
          padding: "28px 24px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          border: isSuccess
            ? "1.5px solid rgba(5, 150, 105, 0.2)"
            : isError
            ? "1.5px solid rgba(220, 38, 38, 0.2)"
            : "1.5px solid rgba(31, 75, 93, 0.2)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Circle */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: isSuccess
              ? "#ECFDF5"
              : isError
              ? "#FEF2F2"
              : "#EFF6FF",
            border: isSuccess
              ? "3px solid #A7F3D0"
              : isError
              ? "3px solid #FECACA"
              : "3px solid #BFDBFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "18px",
            boxShadow: isSuccess
              ? "0 8px 20px rgba(5, 150, 105, 0.18)"
              : isError
              ? "0 8px 20px rgba(220, 38, 38, 0.18)"
              : "0 8px 20px rgba(37, 99, 235, 0.18)",
          }}
        >
          {isSuccess && <CheckCircle2 size={40} color="#059669" />}
          {isError && <XCircle size={40} color="#DC2626" />}
          {!isSuccess && !isError && <Info size={40} color="#2563EB" />}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: isSuccess ? "#065F46" : isError ? "#991B1B" : "#1E3A8A",
            margin: "0 0 8px 0",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>

        {/* Target Badge */}
        {targetName && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              backgroundColor: "rgba(31, 75, 93, 0.08)",
              color: "#1F4B5D",
              fontSize: "0.78rem",
              fontWeight: 800,
              marginBottom: "12px",
            }}
          >
            Target: <strong>{targetName}</strong>
          </div>
        )}

        {/* Message */}
        <p
          style={{
            fontSize: "0.85rem",
            color: "#475569",
            lineHeight: 1.55,
            margin: "0 0 20px 0",
            maxWidth: "380px",
          }}
        >
          {message}
        </p>

        {/* Action Detail Note */}
        {actionType === "delete_db" && (
          <div
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
              fontSize: "0.76rem",
              color: "#166534",
              textAlign: "left",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} color="#16A34A" style={{ flexShrink: 0 }} />
            <span>
              Status baris telah berubah menjadi <strong>VALID</strong>. Data kini siap diimpor sebagai record baru saat Anda menekan tombol simpan.
            </span>
          </div>
        )}

        {actionType === "delete_preview" && (
          <div
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              fontSize: "0.76rem",
              color: "#475569",
              textAlign: "left",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Info size={16} color="#64748B" style={{ flexShrink: 0 }} />
            <span>
              Baris telah dikeluarkan dari daftar antrean. Data di database tetap aman dan tidak akan ditimpa.
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "14px",
            border: "none",
            backgroundColor: isSuccess ? "#0F766E" : isError ? "#DC2626" : "#1F4B5D",
            color: "#FFFFFF",
            fontSize: "0.9rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: isSuccess
              ? "0 4px 14px rgba(15, 118, 110, 0.3)"
              : "0 4px 14px rgba(220, 38, 38, 0.3)",
            transition: "all 0.15s ease",
          }}
        >
          <span>Mengerti &amp; Lanjutkan</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
