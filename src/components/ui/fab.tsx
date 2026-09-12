"use client";

import React from "react";
import styles from "./fab.module.css";

export interface FabProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  ariaLabel: string;
  className?: string;
  variant?: "primary" | "secondary" | "accent";
  bottomOffset?: number; // Jarak dari bawah layar dalam pixel (default 84px agar di atas BottomNav)
}

export const Fab: React.FC<FabProps> = ({
  onClick,
  icon,
  label,
  ariaLabel,
  className = "",
  variant = "primary",
  bottomOffset = 84,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "accent":
        return {
          background: "linear-gradient(135deg, #68CFEB 0%, #38BDF8 100%)",
          color: "#1F1E19",
          boxShadow: "0 8px 24px rgba(104, 207, 235, 0.45)",
        };
      case "secondary":
        return {
          background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
          color: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(15, 118, 110, 0.4)",
        };
      case "primary":
      default:
        return {
          background: "linear-gradient(135deg, #1F4B5D 0%, #2A6880 100%)",
          color: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(31, 75, 93, 0.45)",
        };
    }
  };

  const styleConfig = getVariantStyles();

  return (
    <div
      className={styles.fabContainer}
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`fab-button ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: label ? "8px" : "0",
          padding: label ? "12px 20px" : "14px",
          borderRadius: label ? "999px" : "50%",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          cursor: "pointer",
          transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms ease",
          outline: "none",
          fontWeight: 700,
          fontSize: "0.9rem",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          ...styleConfig,
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.92)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = "scale(0.92)";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </span>
        {label && <span>{label}</span>}
      </button>
    </div>
  );
};
