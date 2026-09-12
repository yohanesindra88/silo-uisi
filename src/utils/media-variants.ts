/**
 * Pembangkit varian gambar. SERVER-ONLY — jangan diimpor dari komponen klien.
 *
 * Dipakai oleh dua pemanggil lewat satu code path yang sama:
 *   - `scripts/gen-variants.ts` (build time, untuk aset di public/)
 *   - route upload `/api/media`  (runtime, untuk berkas dari user)
 *
 * Menjaganya tetap satu fungsi berarti aset situs dan berkas upload tidak bisa
 * diam-diam menyimpang soal kualitas, orientasi EXIF, atau penamaan.
 */

import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

import {
  MEDIA_ORIG_MAX_WIDTH,
  MEDIA_WIDTH_BUCKETS,
  MediaBucket,
  variantFileName,
} from "./media-path";

export interface RenderedVariant {
  bucket: MediaBucket;
  /** Nama file saja, tanpa direktori. */
  file: string;
  bytes: number;
  width: number;
  height: number;
}

/** Batas piksel input — penjaga decompression bomb. */
const MAX_INPUT_PIXELS = 50_000_000;

/** Dimensi maksimum yang masih diterima setelah dekode. */
export const MAX_IMAGE_DIMENSION = 12_000;

const ALL_BUCKETS: MediaBucket[] = [...MEDIA_WIDTH_BUCKETS, "orig"];

function targetWidthFor(bucket: MediaBucket): number {
  return bucket === "orig" ? MEDIA_ORIG_MAX_WIDTH : bucket;
}

function qualityFor(bucket: MediaBucket): number {
  return bucket === "orig" ? 88 : 82;
}

/**
 * Baca metadata gambar dan pastikan masih dalam batas wajar.
 * Melempar Error bila input bukan gambar yang bisa didekode.
 */
export async function probeImage(input: Buffer): Promise<{ width: number; height: number; format: string }> {
  const meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).metadata();

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (width <= 0 || height <= 0) {
    throw new Error("Dimensi gambar tidak valid.");
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Dimensi gambar melebihi ${MAX_IMAGE_DIMENSION}px.`);
  }

  return { width, height, format: meta.format ?? "unknown" };
}

/**
 * Render satu buffer gambar menjadi seluruh varian .webp.
 *
 * Menulis LANGSUNG ke `destDir` dengan nama final. Pemanggil yang membutuhkan
 * atomisitas (route upload) harus mengarahkan `destDir` ke direktori staging
 * lalu me-rename sendiri — lihat `src/app/backoffice/api/media/route.ts`.
 *
 * `.rotate()` dipanggil lebih dulu supaya orientasi EXIF diterapkan ke piksel,
 * lalu seluruh metadata EXIF dibuang oleh encoder webp. Itu sekaligus
 * menghapus koordinat GPS yang ikut menempel pada foto dari HP.
 */
export async function renderVariants(
  input: Buffer,
  destDir: string,
  baseName: string
): Promise<RenderedVariant[]> {
  await fs.mkdir(destDir, { recursive: true });

  const out: RenderedVariant[] = [];

  for (const bucket of ALL_BUCKETS) {
    const pipeline = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
      .rotate()
      .resize({
        width: targetWidthFor(bucket),
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: qualityFor(bucket), effort: 4 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    const file = variantFileName(baseName, bucket);
    await fs.writeFile(path.join(destDir, file), data);

    out.push({
      bucket,
      file,
      bytes: data.byteLength,
      width: info.width,
      height: info.height,
    });
  }

  return out;
}

/** Daftar nama file varian untuk sebuah basis, tanpa merender apa pun. */
export function expectedVariantFiles(baseName: string): string[] {
  return ALL_BUCKETS.map((bucket) => variantFileName(baseName, bucket));
}
