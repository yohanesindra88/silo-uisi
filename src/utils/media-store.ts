/**
 * Akses filesystem untuk media hasil upload. SERVER-ONLY.
 *
 * Root-nya adalah bind mount dari host (lihat MEDIA_HOST_DIR di docker-compose.yml),
 * jadi seluruh logika keamanan path tinggal di sini dan dipakai bersama oleh
 * route baca `/media/[...path]` maupun route tulis `/api/media`.
 */

import { promises as fs, constants as fsConstants } from "fs";
import path from "path";

/**
 * Direktori akar media. Sengaja BUKAN NEXT_PUBLIC_* — nilai ini tidak boleh
 * bocor ke bundle browser.
 */
// path.resolve() pada string relatif sudah memakai cwd. Menulisnya begini
// (alih-alih path.join(process.cwd(), …)) menghindari peringatan analisis
// statis Turbopack soal path dinamis.
export const MEDIA_ROOT = path.resolve(process.env.MEDIA_ROOT || "storage/media");

/** Direktori staging untuk penulisan atomik. WAJIB satu filesystem dengan MEDIA_ROOT. */
export const MEDIA_TMP_DIR = path.join(MEDIA_ROOT, ".tmp");

/** Prefix URL publik untuk berkas di MEDIA_ROOT. */
export const MEDIA_URL_PREFIX = "/media";

/** Batas ukuran berkas upload, default 8 MiB. */
export const MEDIA_MAX_BYTES = Number(process.env.MEDIA_MAX_BYTES || 8 * 1024 * 1024);

/** Sisa ruang disk minimum sebelum upload ditolak. */
const MIN_FREE_BYTES = 500 * 1024 * 1024;

/** Segmen path yang selalu ditolak. */
function isUnsafeSegment(segment: string): boolean {
  return (
    segment === "" ||
    segment === "." ||
    segment === ".." ||
    segment.startsWith(".") ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0")
  );
}

/**
 * Gabungkan segmen path relatif ke MEDIA_ROOT dengan aman.
 *
 * Mengembalikan null (bukan melempar) bila ada indikasi traversal, supaya
 * pemanggil bisa membalas 404 dan tidak mengonfirmasi bentuk filesystem ke
 * pihak yang sedang menyelidik.
 */
export function safeJoin(segments: string[]): string | null {
  if (segments.length === 0) return null;

  const decoded: string[] = [];
  for (const raw of segments) {
    let seg: string;
    try {
      seg = decodeURIComponent(raw);
    } catch {
      return null;
    }
    if (isUnsafeSegment(seg)) return null;
    decoded.push(seg);
  }

  const abs = path.resolve(MEDIA_ROOT, ...decoded);
  if (abs !== MEDIA_ROOT && !abs.startsWith(MEDIA_ROOT + path.sep)) {
    return null;
  }
  return abs;
}

/**
 * Verifikasi ulang setelah resolusi symlink.
 *
 * Penting karena MEDIA_ROOT writable dari host — seseorang bisa saja menaruh
 * `ln -s /etc` di dalamnya, dan pemeriksaan prefix pada path logis saja tidak
 * akan menangkapnya.
 */
export async function assertInsideRoot(abs: string): Promise<boolean> {
  try {
    const real = await fs.realpath(abs);
    return real === MEDIA_ROOT || real.startsWith(MEDIA_ROOT + path.sep);
  } catch {
    return false;
  }
}

/**
 * Pastikan MEDIA_ROOT ada dan bisa ditulis.
 *
 * Kegagalan di sini hampir selalu berarti satu hal: bind mount dimiliki root
 * sementara container berjalan sebagai uid 1000. Pesan error-nya sengaja
 * menyebutkan diagnosisnya langsung.
 */
export async function assertWritable(): Promise<void> {
  await fs.mkdir(MEDIA_TMP_DIR, { recursive: true });
  try {
    await fs.access(MEDIA_ROOT, fsConstants.W_OK | fsConstants.X_OK);
  } catch {
    throw new Error(
      `MEDIA_ROOT (${MEDIA_ROOT}) tidak writable — cek ownership bind mount. ` +
        `Container berjalan sebagai uid 1000; jalankan di host: ` +
        `sudo chown -R 1000:1000 <MEDIA_HOST_DIR>`
    );
  }
}

/** Sisa ruang disk pada MEDIA_ROOT, dalam byte. */
export async function freeBytes(): Promise<number> {
  const st = await fs.statfs(MEDIA_ROOT);
  return Number(st.bavail) * Number(st.bsize);
}

/** True bila ruang disk masih cukup untuk menerima upload. */
export async function hasRoomForUpload(): Promise<boolean> {
  try {
    return (await freeBytes()) > MIN_FREE_BYTES;
  } catch {
    // statfs tidak tersedia — jangan blokir upload karena ini.
    return true;
  }
}

/** Peta ekstensi -> Content-Type. Tipe TIDAK PERNAH diambil dari isi berkas. */
export const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

/**
 * Ekstensi yang boleh dilayani route baca.
 *
 * `.svg` SENGAJA TIDAK ADA DI SINI. Route ini hanya melayani berkas hasil
 * upload, dan upload SVG selalu ditolak (lihat tabel magic byte di route
 * /api/media). Logo sponsor yang memang .svg berasal dari repo dan dilayani
 * static handler Next dari public/, bukan lewat jalur ini.
 * Jangan tambahkan ".svg" tanpa memahami konsekuensinya.
 */
export function isServableExtension(ext: string): boolean {
  return Object.prototype.hasOwnProperty.call(CONTENT_TYPES, ext.toLowerCase());
}
