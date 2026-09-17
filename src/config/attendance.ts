/**
 * Konfigurasi Pemetaan Izin Pemindaian Presensi Antar-Prodi (PRODI_SCAN_PERMISSIONS)
 * Khusus untuk Sesi Berbasis Program Studi (attendance_type: 'PRODI')
 * Contoh: Sesi Pengambilan Atribut Kampus & Foto KTM
 */

// Daftar nama kanonikal Program Studi resmi UISI
export const CANONICAL_PRODI = {
  AKUNTANSI: "Akuntansi",
  EKONOMI_SYARIAH: "Ekonomi Syariah",
  MANAJEMEN: "Manajemen",
  MANAJEMEN_REKAYASA: "Manajemen Rekayasa",
  TEKNIK_KIMIA: "Teknik Kimia",
  TEKNIK_LOGISTIK: "Teknik Logistik",
  TIP: "Teknologi Industri Pertanian",
  INFORMATIKA: "Informatika",
  SISTEM_INFORMASI: "Sistem Informasi",
  DKV: "Desain Komunikasi Visual",
} as const;

/**
 * Aturan Pemetaan Izin Scan Sesi Khusus Prodi:
 * - Akuntansi <-> Eksyar
 * - Manajemen <-> Manajemen
 * - Manajemen Rekayasa <-> Teknik Kimia
 * - Teknik Logistik <-> Teknik Logistik
 * - TIP <-> Informatika
 * - Sisfor -> Sisfor & DKV (Mentor Sisfor berwenang memindai maba Sisfor maupun DKV)
 */
export const PRODI_SCAN_PERMISSIONS: Record<string, string[]> = {
  [CANONICAL_PRODI.AKUNTANSI]: [CANONICAL_PRODI.AKUNTANSI, CANONICAL_PRODI.EKONOMI_SYARIAH],
  [CANONICAL_PRODI.EKONOMI_SYARIAH]: [CANONICAL_PRODI.EKONOMI_SYARIAH, CANONICAL_PRODI.AKUNTANSI],
  [CANONICAL_PRODI.MANAJEMEN]: [CANONICAL_PRODI.MANAJEMEN],
  [CANONICAL_PRODI.MANAJEMEN_REKAYASA]: [CANONICAL_PRODI.MANAJEMEN_REKAYASA, CANONICAL_PRODI.TEKNIK_KIMIA],
  [CANONICAL_PRODI.TEKNIK_KIMIA]: [CANONICAL_PRODI.TEKNIK_KIMIA, CANONICAL_PRODI.MANAJEMEN_REKAYASA],
  [CANONICAL_PRODI.TEKNIK_LOGISTIK]: [CANONICAL_PRODI.TEKNIK_LOGISTIK],
  [CANONICAL_PRODI.TIP]: [CANONICAL_PRODI.TIP, CANONICAL_PRODI.INFORMATIKA],
  [CANONICAL_PRODI.INFORMATIKA]: [CANONICAL_PRODI.INFORMATIKA, CANONICAL_PRODI.TIP],
  [CANONICAL_PRODI.SISTEM_INFORMASI]: [CANONICAL_PRODI.SISTEM_INFORMASI, CANONICAL_PRODI.DKV],
  [CANONICAL_PRODI.DKV]: [CANONICAL_PRODI.DKV, CANONICAL_PRODI.SISTEM_INFORMASI],
};

/**
 * Normalisasi string nama prodi (menghilangkan spasi berlebih, case insensitive,
 * dan memetakan singkatan populer seperti 'Sisfor', 'DKV', 'Eksyar', 'TIP', dll. ke nama kanonikal).
 */
export function normalizeProdi(rawProdi: string | null | undefined): string {
  if (!rawProdi) return "";
  const cleaned = String(rawProdi).trim().toLowerCase().replace(/\s+/g, " ");

  // 1. Akuntansi
  if (cleaned === "akuntansi" || cleaned === "akt" || cleaned === "akun") {
    return CANONICAL_PRODI.AKUNTANSI;
  }

  // 2. Ekonomi Syariah / Eksyar
  if (
    cleaned === "ekonomi syariah" ||
    cleaned === "eksyar" ||
    cleaned === "es" ||
    cleaned.includes("syariah")
  ) {
    return CANONICAL_PRODI.EKONOMI_SYARIAH;
  }

  // 3. Manajemen Rekayasa (harus dicek sebelum Manajemen biasa)
  if (
    cleaned === "manajemen rekayasa" ||
    cleaned === "mr" ||
    cleaned.includes("rekayasa")
  ) {
    return CANONICAL_PRODI.MANAJEMEN_REKAYASA;
  }

  // 4. Manajemen
  if (cleaned === "manajemen" || cleaned === "mnj" || cleaned === "man") {
    return CANONICAL_PRODI.MANAJEMEN;
  }

  // 5. Teknik Kimia
  if (cleaned === "teknik kimia" || cleaned === "tk" || cleaned === "kimia") {
    return CANONICAL_PRODI.TEKNIK_KIMIA;
  }

  // 6. Teknik Logistik
  if (cleaned === "teknik logistik" || cleaned === "tl" || cleaned === "logistik") {
    return CANONICAL_PRODI.TEKNIK_LOGISTIK;
  }

  // 7. Teknologi Industri Pertanian (TIP)
  if (
    cleaned === "teknologi industri pertanian" ||
    cleaned === "tip" ||
    cleaned.includes("pertanian")
  ) {
    return CANONICAL_PRODI.TIP;
  }

  // 8. Informatika
  if (
    cleaned === "informatika" ||
    cleaned === "teknik informatika" ||
    cleaned === "if" ||
    cleaned === "ti"
  ) {
    return CANONICAL_PRODI.INFORMATIKA;
  }

  // 9. Sistem Informasi (Sisfor)
  if (
    cleaned === "sistem informasi" ||
    cleaned === "sisfor" ||
    cleaned === "si"
  ) {
    return CANONICAL_PRODI.SISTEM_INFORMASI;
  }

  // 10. Desain Komunikasi Visual (DKV)
  if (
    cleaned === "desain komunikasi visual" ||
    cleaned === "dkv" ||
    cleaned.includes("komunikasi visual")
  ) {
    return CANONICAL_PRODI.DKV;
  }

  // Fallback: kembalikan teks asli dengan kapitalisasi rapi
  return String(rawProdi).trim();
}

/**
 * Validasi apakah mentor suatu prodi berhak memindai mahasiswa dari target prodi.
 */
export function canMentorScanProdi(
  mentorProdi: string | null | undefined,
  mabaProdi: string | null | undefined
): boolean {
  if (!mentorProdi || !mabaProdi) return false;

  const normalizedMentor = normalizeProdi(mentorProdi);
  const normalizedMaba = normalizeProdi(mabaProdi);

  if (!normalizedMentor || !normalizedMaba) return false;

  const allowedList = PRODI_SCAN_PERMISSIONS[normalizedMentor];
  if (!allowedList) {
    // Jika prodi tidak terdaftar di matriks, mentor hanya boleh scan prodi yang persis sama
    return normalizedMentor.toLowerCase() === normalizedMaba.toLowerCase();
  }

  return allowedList.some((p) => p.toLowerCase() === normalizedMaba.toLowerCase());
}

/**
 * Mengambil daftar prodi yang berhak dipindai oleh mentor berdasarkan prodinya.
 */
export function getAllowedProdisForMentor(
  mentorProdi: string | null | undefined
): string[] {
  if (!mentorProdi) return [];
  const normalized = normalizeProdi(mentorProdi);
  const allowed = PRODI_SCAN_PERMISSIONS[normalized];
  if (allowed && allowed.length > 0) {
    return allowed;
  }
  return [normalized || mentorProdi];
}

/**
 * Normalisasi tipe presensi sesi ('grup' atau 'prodi')
 */
export function normalizeAttendanceType(rawType?: string | null): "grup" | "prodi" {
  return rawType === "prodi" ? "prodi" : "grup";
}

/**
 * Mendapatkan label keterangan tampilan ('Prodi' atau 'Kelompok')
 */
export function getAttendanceTypeLabel(rawType?: string | null): "Prodi" | "Kelompok" {
  return rawType === "prodi" ? "Prodi" : "Kelompok";
}

/**
 * Cek apakah sesi bertipe prodi
 */
export function isProdiAttendanceType(rawType?: string | null): boolean {
  return rawType === "prodi";
}

