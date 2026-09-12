"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, QrCode, ClipboardList, User as UserIcon } from "lucide-react";
import LowPolyBackground from "@/app/components/LowPolyBackground";
import styles from "./mobile-shell.module.css";

export interface MobileShellProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  user?: {
    nama?: string;
    role?: string;
    nim?: string | null;
  };
  showBottomNav?: boolean;
  className?: string;
  role?: "maba" | "mentor" | "panitia" | "admin" | string;
  wide?: boolean;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  title = "SILO UISI 2026",
  showBackButton = false,
  onBack,
  user,
  showBottomNav = true,
  className = "",
  role,
  wide = false,
}) => {
  const pathname = usePathname();

  // Dynamic Navigation Items berdasarkan role
  const userRole = (user?.role || role || "").toLowerCase();
  const getNavItems = () => {
    if (userRole === "mentor") {
      return [
        { label: "Home", href: "/mentor", icon: Home },
        { label: "Scan QR", href: "/mentor/scan", icon: QrCode },
        { label: "Tugas", href: "/mentor/tugas", icon: ClipboardList },
        { label: "Profil", href: "/mentor/profile", icon: UserIcon },
      ];
    } else if (userRole === "admin" || userRole === "panitia") {
      return [
        { label: "Home", href: "/admin", icon: Home },
        { label: "Sesi", href: "/admin/sessions", icon: QrCode },
        { label: "Tugas", href: "/admin/tugas", icon: ClipboardList },
        { label: "Profil", href: "/admin/profile", icon: UserIcon },
      ];
    }
    // Default maba
    return [
      { label: "Home", href: "/maba", icon: Home },
      { label: "QR Card", href: "/maba/card", icon: QrCode },
      { label: "Tugas", href: "/maba/tugas", icon: ClipboardList },
      { label: "Profil", href: "/maba/profile", icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className={styles.wrapper}>
      {/* Background Geometris Low-Poly Seragam dengan Tampilan Beranda */}
      <LowPolyBackground />

      {/* Mobile-First Frame Container */}
      <div
        className={`${styles.frame} ${wide ? styles.frameWide : ""} mobile-shell-frame ${className}`}
      >
        {/* Top Header / App Bar */}
        <header className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack || (() => window.history.back())}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lp-text, #1F1E19)",
                }}
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Image
                  src="/apple-icon.png"
                  alt="SILO UISI Logo"
                  width={34}
                  height={34}
                  style={{ borderRadius: "8px" }}
                />
              </div>
            )}

            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--lp-ocean-blue, #1F4B5D)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`${styles.main} ${showBottomNav ? styles.mainWithNav : styles.mainNoNav}`}
        >
          {children}
        </main>

        {/* Bottom Navigation Bar */}
        {showBottomNav && (
          <nav
            className={`${styles.bottomNav} ${wide ? styles.bottomNavWide : ""}`}
          >
            {navItems.map((item) => {
              const isHomeHref =
                item.href === "/maba" || item.href === "/mentor" || item.href === "/admin";

              let isActive = false;
              if (isHomeHref) {
                isActive = pathname === item.href || pathname === `${item.href}/dashboard`;
              } else {
                isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  (item.href === "/admin/sessions" &&
                    (pathname === "/admin/monitoring" ||
                      pathname.startsWith("/admin/monitoring/")));
              }

              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    color: isActive ? "var(--lp-ocean-blue, #1F4B5D)" : "rgba(31, 75, 93, 0.5)",
                    fontSize: "0.75rem",
                    fontWeight: isActive ? 800 : 600,
                    textDecoration: "none",
                    padding: "6px 10px",
                    transition: "color 150ms ease",
                  }}
                >
                  <IconComponent size={23} strokeWidth={isActive ? 2.6 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};
