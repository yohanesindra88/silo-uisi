/**
 * Media URL helper — pengganti Cloudinary.
 *
 * Aset situs disajikan dari varian .webp yang dibangkitkan saat build oleh
 * `scripts/gen-variants.ts` ke `public/_m/`, lalu dilayani static handler Next.
 * Upload runtime disajikan route handler `/media/[...path]` dari bind mount.
 */

import {
  MediaBucket,
  VARIANT_URL_PREFIX,
  isPassthroughAsset,
  normalizeSourcePath,
  resolveBucket,
  variantBasePath,
  variantFileName,
} from "./media-path";

export interface MediaOptions {
  width?: number;
  /**
   * Tidak dipakai. Dulu dipetakan ke parameter q_* Cloudinary; sekarang kualitas
   * ditentukan saat varian dibangkitkan. Dipertahankan hanya demi kompatibilitas
   * signature — tidak ada call site yang pernah mengirimnya.
   */
  quality?: string;
}

/**
 * Ubah path aset menjadi URL yang bisa disajikan.
 *
 * Urutan cabangnya harus dipertahankan persis seperti helper Cloudinary lama:
 *
 *   1. path kosong                 -> ""       (AnggotaDivisi punya member tanpa foto)
 *   2. sudah absolut http(s)       -> apa adanya (nilai Submission.fileUrl lewat sini)
 *   3. .svg                        -> apa adanya (logo sponsor, tidak dirasterisasi)
 *   4. sisanya                     -> varian .webp
 *
 * @param path    Path aset relatif terhadap public/, mis. "/dokumentasi/doc_1.webp"
 * @param options Lebar yang diinginkan. Angka 0 berarti varian terbesar ("orig").
 */
export function getMediaUrl(
  path: string,
  options?: MediaOptions | number
): string {
  if (!path) return "";

  // Biarkan URL absolut lewat tanpa disentuh.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Upload runtime sudah berupa URL final dari route upload.
  if (path.startsWith(`${VARIANT_URL_PREFIX}/`) || path.startsWith("/media/")) {
    return path;
  }

  // SVG disajikan apa adanya dari public/ — vektor tidak punya varian lebar.
  if (isPassthroughAsset(path)) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const requestedWidth =
    typeof options === "number" ? options : options?.width;
  const bucket: MediaBucket = resolveBucket(requestedWidth);

  const base = variantBasePath(path);
  if (!base) return "";

  return `${VARIANT_URL_PREFIX}/${variantFileName(base, bucket)}`;
}

/**
 * Tukar bucket pada URL media yang sudah jadi.
 *
 * Dipakai untuk menampilkan thumbnail dari URL upload yang tersimpan di
 * `Submission.fileUrl`, tanpa perlu menyentuh database:
 *
 *   "/media/uploads/submission/2026/09/3f1c.orig.webp"
 *     -> "/media/uploads/submission/2026/09/3f1c.w600.webp"
 *
 * URL eksternal dan non-media dikembalikan apa adanya.
 */
export function mediaVariantUrl(url: string, width: number): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/media/") && !url.startsWith(`${VARIANT_URL_PREFIX}/`)) {
    return url;
  }

  const bucket = resolveBucket(width);
  const suffix = bucket === "orig" ? "orig" : `w${bucket}`;

  // Ganti hanya suffix bucket terakhir: "<apa pun>.<bucket>.webp"
  const replaced = url.replace(/\.(w\d+|orig)\.webp$/i, `.${suffix}.webp`);
  return replaced;
}

/** Path relatif public/ tanpa query dan slash depan — dipakai script build. */
export { normalizeSourcePath };
