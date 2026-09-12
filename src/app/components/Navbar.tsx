'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  Compass, 
  ChevronDown, 
  Sparkles, 
  Users, 
  BookOpen, 
  Globe,
  LogIn,
  User
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jelajahDropdownOpen, setJelajahDropdownOpen] = useState(false);
  const [mobileJelajahOpen, setMobileJelajahOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    nama: string;
    role: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil sesi user yang sedang aktif secara otomatis
  useEffect(() => {
    let isMounted = true;
    async function checkUserSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user && isMounted) {
            setCurrentUser(data.user);
          } else if (isMounted) {
            setCurrentUser(null);
          }
        } else if (isMounted) {
          setCurrentUser(null);
        }
      } catch {
        if (isMounted) setCurrentUser(null);
      }
    }
    checkUserSession();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const getDashboardUrl = (role?: string) => {
    const r = (role || "").toLowerCase();
    if (r === "admin" || r === "panitia") return "/admin";
    if (r === "mentor") return "/mentor";
    if (r === "maba") return "/maba";
    return "/login";
  };

  const getShortUsername = (username?: string) => {
    if (!username) return "Akun";
    return username.length > 12 ? `${username.slice(0, 10)}..` : username;
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const isJelajahActive = () => {
    return ["/logo", "/panitia", "/penugasan", "/kelompok"].some((p) => pathname?.startsWith(p));
  };

  // Close mobile menu & dropdown on route change
  useEffect(() => {
    const t = setTimeout(() => {
      setMobileMenuOpen(false);
      setJelajahDropdownOpen(false);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on resize to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setJelajahDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
          <img 
            src="/logo_aethera.png?v=4" 
            alt="AETHERA Logo"
            width={32}
            height={32}
            className={styles.logoImg}
            style={{ objectFit: "contain" }}
          />
          <span className={styles.logoTextFull}>AETHERA SILO UISI 2026</span>
          <span className={styles.logoTextMedium}>AETHERA SILO 2026</span>
          <span className={styles.logoTextShort}>AETHERA SILO</span>
        </Link>

        {/* Desktop Nav Links (> 1024px) */}
        <div className={styles.navLinksDesktop}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActive("/") ? styles.activeNavLink : ""}`}
          >
            Beranda
          </Link>
          <Link
            href="/merch"
            className={`${styles.navLink} ${isActive("/merch") ? styles.activeNavLink : ""}`}
          >
            Merchandise
          </Link>

          {/* Dropdown Menu Jelajah */}
          <div className={styles.dropdownWrapper} ref={dropdownRef}>
            <button
              className={`${styles.navLink} ${styles.dropdownTrigger} ${isJelajahActive() ? styles.activeNavLink : ""}`}
              onClick={() => setJelajahDropdownOpen(!jelajahDropdownOpen)}
              type="button"
              aria-expanded={jelajahDropdownOpen}
            >
              <Compass size={17} /> Jelajah <ChevronDown size={14} className={`${styles.chevron} ${jelajahDropdownOpen ? styles.chevronRotated : ""}`} />
            </button>

            <div className={`${styles.dropdownMenu} ${jelajahDropdownOpen ? styles.dropdownShow : ""}`}>
              <Link href="/logo" className={styles.dropdownItem} onClick={() => setJelajahDropdownOpen(false)}>
                <Sparkles size={16} className={styles.dropdownIcon} /> Filosofi Logo
              </Link>
              <Link href="/panitia" className={styles.dropdownItem} onClick={() => setJelajahDropdownOpen(false)}>
                <Users size={16} className={styles.dropdownIcon} /> Panitia SILO
              </Link>
              <Link href="/penugasan" className={styles.dropdownItem} onClick={() => setJelajahDropdownOpen(false)}>
                <BookOpen size={16} className={styles.dropdownIcon} /> Penugasan &amp; Guidebook
              </Link>
              <Link href="/kelompok" className={styles.dropdownItem} onClick={() => setJelajahDropdownOpen(false)}>
                <Globe size={16} className={styles.dropdownIcon} /> Cluster Kelompok
              </Link>
            </div>
          </div>

          {/* Tombol Login / User Dashboard Header Paling Kanan */}
          {currentUser ? (
            <Link
              href={getDashboardUrl(currentUser.role)}
              className={`${styles.loginBtn} ${styles.userActiveBtn}`}
              title={`Akun: ${currentUser.nama} (@${currentUser.username}) - Buka Dashboard`}
            >
              <User size={16} className={styles.userIcon} />
              <span className={styles.usernameText}>
                {getShortUsername(currentUser.username)}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={`${styles.loginBtn} ${isActive("/login") ? styles.activeLoginBtn : ""}`}
            >
              <LogIn size={16} />
              <span>Masuk</span>
            </Link>
          )}
        </div>

        {/* Mobile / Tablet Toggle Button (<= 1024px) */}
        <button
          className={styles.mobileToggleBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Tutup Navigasi" : "Buka Navigasi"}
          aria-expanded={mobileMenuOpen}
          type="button"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile & Tablet Full Navigation Drawer */}
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.mobileMenuShow : ""}`}>
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileNavGroup}>
            <span className={styles.mobileGroupLabel}>NAVIGASI UTAMA</span>
            <Link
              href="/"
              className={`${styles.mobileNavLink} ${isActive("/") ? styles.mobileActiveLink : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={19} /> Beranda
            </Link>
            <Link
              href="/merch"
              className={`${styles.mobileNavLink} ${isActive("/merch") ? styles.mobileActiveLink : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag size={19} /> Merchandise
            </Link>
          </div>

          <div className={styles.mobileNavGroup}>
            <button
              className={styles.mobileAccordionHeader}
              onClick={() => setMobileJelajahOpen(!mobileJelajahOpen)}
              type="button"
            >
              <span className={styles.mobileGroupTitle}>
                <Compass size={19} /> Jelajah Website
              </span>
              <ChevronDown
                size={18}
                className={`${styles.chevron} ${mobileJelajahOpen ? styles.chevronRotated : ""}`}
              />
            </button>

            {mobileJelajahOpen && (
              <div className={styles.mobileSubLinks}>
                <Link
                  href="/logo"
                  className={`${styles.mobileSubLink} ${isActive("/logo") ? styles.mobileActiveSubLink : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles size={17} style={{ color: "var(--lp-aqua)" }} /> Filosofi Logo
                </Link>
                <Link
                  href="/panitia"
                  className={`${styles.mobileSubLink} ${isActive("/panitia") ? styles.mobileActiveSubLink : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={17} style={{ color: "var(--lp-aqua)" }} /> Panitia SILO
                </Link>
                <Link
                  href="/penugasan"
                  className={`${styles.mobileSubLink} ${isActive("/penugasan") ? styles.mobileActiveSubLink : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen size={17} style={{ color: "var(--lp-aqua)" }} /> Penugasan &amp; Guidebook
                </Link>
                <Link
                  href="/kelompok"
                  className={`${styles.mobileSubLink} ${isActive("/kelompok") ? styles.mobileActiveSubLink : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Globe size={17} style={{ color: "var(--lp-aqua)" }} /> Cluster Kelompok
                </Link>
              </div>
            )}
          </div>

          {/* Tombol Login / Dashboard Mobile */}
          <div className={styles.mobileLoginWrapper}>
            {currentUser ? (
              <Link
                href={getDashboardUrl(currentUser.role)}
                className={`${styles.mobileLoginBtn} ${styles.mobileUserActiveBtn}`}
                onClick={() => setMobileMenuOpen(false)}
                title={`Dashboard ${currentUser.nama}`}
              >
                <User size={19} />
                <span>
                  {getShortUsername(currentUser.username)} &bull; Dashboard
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={styles.mobileLoginBtn}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={19} />
                <span>Masuk ke Akun</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
