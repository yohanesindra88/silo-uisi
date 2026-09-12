"use client";

import React from "react";

export default function LowPolyBackground() {
  return (
    <>
      {/* Fixed low-poly SVG background layer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Triangular pattern overlay */}
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.04 }}
        >
          <defs>
            <pattern id="lowpoly" x="0" y="0" width="120" height="104" patternUnits="userSpaceOnUse">
              <polygon points="0,104 60,0 120,104" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <polygon points="60,0 120,104 180,0" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <polygon points="-60,0 0,104 60,0" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lowpoly)" />
        </svg>

        {/* Gradient blobs */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(104,207,235,0.1)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(31,75,93,0.08)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(31,30,25,0.04)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Floating geometric shapes */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Triangle 1 */}
        <svg
          width="60"
          height="52"
          viewBox="0 0 60 52"
          style={{
            position: "absolute",
            top: "15%",
            left: "8%",
            opacity: 0.15,
            animation: "float 8s ease-in-out infinite",
          }}
        >
          <polygon points="30,0 60,52 0,52" fill="var(--lp-ocean-blue)" />
        </svg>

        {/* Diamond 2 */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          style={{
            position: "absolute",
            top: "25%",
            right: "12%",
            opacity: 0.12,
            animation: "floatSlow 10s ease-in-out infinite",
          }}
        >
          <rect width="28" height="28" x="6" y="6" rx="4" fill="var(--lp-aqua)" transform="rotate(45 20 20)" />
        </svg>

        {/* Hexagon 3 */}
        <svg
          width="50"
          height="44"
          viewBox="0 0 50 44"
          style={{
            position: "absolute",
            top: "60%",
            left: "5%",
            opacity: 0.1,
            animation: "float 12s ease-in-out infinite 2s",
          }}
        >
          <polygon points="25,0 50,12 50,36 25,44 0,36 0,12" fill="var(--lp-charcoal)" />
        </svg>

        {/* Circle 4 */}
        <svg
          width="35"
          height="35"
          viewBox="0 0 35 35"
          style={{
            position: "absolute",
            top: "75%",
            right: "8%",
            opacity: 0.12,
            animation: "floatSlow 9s ease-in-out infinite 1s",
          }}
        >
          <circle cx="17.5" cy="17.5" r="15" fill="none" stroke="#68CFEB" strokeWidth="2" />
        </svg>

        {/* Small triangle 5 */}
        <svg
          width="30"
          height="26"
          viewBox="0 0 30 26"
          style={{
            position: "absolute",
            top: "45%",
            right: "25%",
            opacity: 0.08,
            animation: "float 7s ease-in-out infinite 3s",
          }}
        >
          <polygon points="15,0 30,26 0,26" fill="#1F4B5D" />
        </svg>
      </div>
    </>
  );
}
