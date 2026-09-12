/**
 * Media path & slug helpers.
 *
 * Modul ini sengaja murni (tanpa dependency, tanpa akses filesystem) supaya bisa
 * diimpor dari tiga tempat sekaligus: bundle browser, route handler Node, dan
 * script build `scripts/gen-variants.ts`.
 */

/** Lebar varian yang dibangkitkan untuk setiap gambar. */
export const MEDIA_WIDTH_BUCKETS = [600, 1000] as const;

/** Lebar maksimum bucket "orig" — bukan file mentah, lihat catatan di media-variants.ts. */
export const MEDIA_ORIG_MAX_WIDTH = 2000;

/** Prefix URL publik untuk varian aset situs (disajikan static handler Next dari public/). */
export const VARIANT_URL_PREFIX = "/_m";

/** Nama direktori varian di dalam public/. */
export const VARIANT_DIR_NAME = "_m";

export type MediaBucket = (typeof MEDIA_WIDTH_BUCKETS)[number] | "orig";

/**
 * Ubah satu segmen path menjadi slug yang aman untuk URL tanpa perlu encoding.
 *
 * Korpus `public/` memuat spasi, apostrof, "&", huruf beraksen, dan ekstensi
 * uppercase (".JPG"). Hasil fungsi ini dibatasi ke [a-z0-9._-] sehingga URL
 * akhirnya tidak pernah membutuhkan encodeURIComponent — itulah alasan kita
 * melakukan slugging alih-alih encoding.
 */
export function slugSegment(input: string): string {
  return input
    .normalize("NFKD")
    // buang combining mark hasil dekomposisi (é -> e)
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // apostrof hilang, bukan jadi "-" ("Naafi' Amrulloh" -> "naafi-amrulloh")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Buang query string dan slash di depan. */
export function normalizeSourcePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  return withoutQuery.startsWith("/") ? withoutQuery.slice(1) : withoutQuery;
}

/**
 * Petakan path sumber ke basis varian (tanpa suffix bucket dan tanpa ekstensi).
 *
 *   "/fotoAnggota/SC&Acara/Sneha Naafi' Amrulloh.JPG"
 *     -> "fotoanggota/sc-acara/sneha-naafi-amrulloh"
 */
export function variantBasePath(sourcePath: string): string {
  const clean = normalizeSourcePath(sourcePath);
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return "";

  const fileName = segments.pop() as string;
  // Ekstensi dibuang: output varian selalu .webp
  const dotIndex = fileName.lastIndexOf(".");
  const stem = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;

  return [...segments.map(slugSegment), slugSegment(stem)]
    .filter(Boolean)
    .join("/");
}

/** Nama file varian: "<base>.w600.webp" | "<base>.w1000.webp" | "<base>.orig.webp" */
export function variantFileName(base: string, bucket: MediaBucket): string {
  const suffix = bucket === "orig" ? "orig" : `w${bucket}`;
  return `${base}.${suffix}.webp`;
}

/** Pilih bucket terkecil yang >= lebar yang diminta; di atas bucket terbesar -> "orig". */
export function resolveBucket(width: number | undefined): MediaBucket {
  if (width === undefined) return MEDIA_WIDTH_BUCKETS[0];
  if (width <= 0) return "orig";
  for (const bucket of MEDIA_WIDTH_BUCKETS) {
    if (width <= bucket) return bucket;
  }
  return "orig";
}

/** File yang disajikan apa adanya, tanpa varian. */
export function isPassthroughAsset(path: string): boolean {
  return normalizeSourcePath(path).toLowerCase().endsWith(".svg");
}
