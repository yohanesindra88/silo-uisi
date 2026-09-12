'use client';

import React, { useState, useEffect } from "react";

// Target event date: 6 Oktober 2026
const TARGET_DATE = new Date("2026-10-06T23:59:59+07:00").getTime();

interface TimeLeft {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = TARGET_DATE - now;

  if (diff <= 0) {
    return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const nowDate = new Date(now);
  const targetDate = new Date(TARGET_DATE);

  // Calendar month difference
  let months =
    (targetDate.getFullYear() - nowDate.getFullYear()) * 12 +
    (targetDate.getMonth() - nowDate.getMonth());

  let days = targetDate.getDate() - nowDate.getDate();

  if (days < 0) {
    months--;
    // Days in previous month
    const prevMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
    days += prevMonth.getDate();
  }

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { months: Math.max(0, months), days: Math.max(0, days), hours, minutes, seconds };
}

const gradients = [
  "var(--lp-ocean-blue)",
  "var(--lp-aqua)",
  "var(--lp-charcoal)",
  "var(--lp-ocean-blue)",
  "var(--lp-aqua)",
];

function CountdownUnit({ value, label, gradient }: { value: number; label: string; gradient: string }) {
  const displayValue = String(value).padStart(2, "0");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <div
        style={{
          position: "relative",
          width: "clamp(72px, 12vw, 110px)",
          height: "clamp(80px, 13vw, 120px)",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3.5px",
            background: gradient,
            borderRadius: "20px 20px 0 0",
          }}
        />
        {/* Center divider */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "10%",
            right: "10%",
            height: "1px",
            background: "rgba(0,0,0,0.04)",
          }}
        />
        {/* Low-poly subtle pattern */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.03 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cdPoly" x="0" y="0" width="30" height="26" patternUnits="userSpaceOnUse">
              <polygon points="15,0 30,26 0,26" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cdPoly)" />
        </svg>
        <span
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 800,
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            position: "relative",
            zIndex: 2,
          }}
        >
          {displayValue}
        </span>
      </div>
      <span
        style={{
          fontSize: "clamp(0.65rem, 1.2vw, 0.8rem)",
          fontWeight: 800,
          color: "#1f4b5d",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        height: "clamp(80px, 13vw, 120px)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "2px",
          transform: "rotate(45deg)",
          background: "var(--lp-ocean-blue)",
          animation: "countdownPulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "2px",
          transform: "rotate(45deg)",
          background: "var(--lp-aqua)",
          animation: "countdownPulse 1.5s ease-in-out infinite 0.3s",
        }}
      />
    </div>
  );
}

export default function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return (
      <section
        id="countdown"
        style={{
          padding: "clamp(3rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)",
          minHeight: "400px",
        }}
      />
    );
  }

  const isFinished =
    timeLeft.months === 0 &&
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  return (
    <>
      <style>{`
        @keyframes countdownPulse {
          0%, 100% { opacity: 0.3; transform: rotate(45deg) scale(0.8); }
          50% { opacity: 1; transform: rotate(45deg) scale(1.2); }
        }
        @keyframes countdownFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section
        id="countdown"
        style={{
          padding: "clamp(3rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)",
          position: "relative",
          overflow: "hidden",
          animation: "countdownFadeIn 0.8s ease-out",
        }}
      >
        {/* Geometric background decorations */}
        <svg
          width="80"
          height="70"
          viewBox="0 0 80 70"
          style={{ position: "absolute", top: "20px", right: "60px", opacity: 0.06 }}
        >
          <polygon points="40,0 80,70 0,70" fill="var(--lp-aqua)" />
        </svg>
        <svg
          width="50"
          height="44"
          viewBox="0 0 50 44"
          style={{ position: "absolute", bottom: "30px", left: "40px", opacity: 0.06 }}
        >
          <polygon points="25,0 50,44 0,44" fill="var(--lp-ocean-blue)" />
        </svg>

        <h2
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            marginBottom: "0.5rem",
            textAlign: "center",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, var(--lp-text), #3B4F6B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Menuju AETHERA SILO UISI 2026 🔺
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "var(--lp-text-muted)",
            fontSize: "0.95rem",
            marginBottom: "3rem",
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          6 Oktober 2026 — Bersiaplah untuk perjalanan menuju cahaya paling murni.
        </p>

        {isFinished ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <h3
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--lp-ocean-blue)",
              }}
            >
              🎉 AETHERA SILO UISI 2026 Dimulai!
            </h3>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: "clamp(0.5rem, 2vw, 1.25rem)",
              flexWrap: "wrap",
            }}
          >
            <CountdownUnit value={timeLeft.months} label="Bulan" gradient={gradients[0]} />
            <Separator />
            <CountdownUnit value={timeLeft.days} label="Hari" gradient={gradients[1]} />
            <Separator />
            <CountdownUnit value={timeLeft.hours} label="Jam" gradient={gradients[2]} />
            <Separator />
            <CountdownUnit value={timeLeft.minutes} label="Menit" gradient={gradients[3]} />
            <Separator />
            <CountdownUnit value={timeLeft.seconds} label="Detik" gradient={gradients[4]} />
          </div>
        )}

        {/* Bottom geometric accent */}
        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center", gap: "6px" }}>
          <div style={{ width: "30px", height: "3px", borderRadius: "2px", background: "var(--lp-ocean-blue)" }} />
          <div style={{ width: "30px", height: "3px", borderRadius: "2px", background: "var(--lp-aqua)" }} />
          <div style={{ width: "30px", height: "3px", borderRadius: "2px", background: "var(--lp-charcoal)" }} />
        </div>
      </section>
    </>
  );
}
