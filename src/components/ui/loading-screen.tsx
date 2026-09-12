"use client";

import React from "react";
import Image from "next/image";
import LowPolyBackground from "@/app/components/LowPolyBackground";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Memuat, Mohon Tunggu",
  fullScreen = true,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: fullScreen ? "100dvh" : "280px",
        width: "100%",
        backgroundColor: "transparent",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <LowPolyBackground />

      {/* Bouncing Logo Animation */}
      <div className="silo-bounce-wrapper">
        <div className="silo-bounce-logo">
          <Image
            src="/icon.png"
            alt="Logo AETHERA SILO UISI"
            width={76}
            height={76}
            style={{
              width: "76px",
              height: "76px",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 18px rgba(104, 207, 235, 0.45))",
            }}
          />
        </div>
        <div className="silo-shadow" />
      </div>

      {/* Loading Text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "1.08rem",
            fontWeight: 800,
            color: "var(--lp-ocean-blue, #1F4B5D)",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </p>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--lp-text-muted, #64748B)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          AETHERA SILO UISI 2026
        </span>
      </div>
    </div>
  );
};

export default LoadingScreen;
