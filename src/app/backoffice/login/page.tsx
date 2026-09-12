"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { User, Lock, Eye, EyeOff, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import LowPolyBackground from "@/app/components/LowPolyBackground";
import styles from "./login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized"
      ? "Akses ditolak. Akun tidak ditemukan!"
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Mohon isi username dan password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal masuk. Periksa kembali username dan password Anda.");
        return;
      }

      // Jika ada redirect param, utamakan redirect tersebut
      if (redirectParam && redirectParam.startsWith("/")) {
        router.push(redirectParam);
        router.refresh();
        return;
      }

      // Role-Based Redirection
      const userRole = data.user?.role;
      if (userRole === "admin" || userRole === "panitia") {
        router.push("/admin");
      } else if (userRole === "mentor") {
        router.push("/mentor");
      } else if (userRole === "maba") {
        router.push("/maba");
      } else {
        router.push("/kelompok");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <LowPolyBackground />

      {/* Centered Login Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Image
              src="/apple-icon.png"
              alt="AETHERA SILO Logo"
              width={50}
              height={50}
              className={styles.logoImage}
              priority
            />
          </div>
          <h1 className={styles.title}>Masuk Akun</h1>
          <p className={styles.subtitle}>AETHERA SILO UISI 2026</p>
        </div>

        {error && (
          <div
            className={styles.errorMessage}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Username / NIM
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.fieldIcon} />
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Masukkan username atau NIM"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className={styles.footerLink}>
          <Link href="/" className={styles.backHome}>
            <ArrowLeft size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <LoginForm />
    </Suspense>
  );
}
