/**
 * Route upload media. Dipanggil klien sebagai POST /api/media (lewat rewrite).
 *
 * Catatan keamanan penting: src/proxy.ts `config.matcher` TIDAK mencakup
 * /api/* maupun /backoffice/api/*, jadi tidak ada proteksi middleware di depan
 * route ini. Seluruh autentikasi dan otorisasi harus dilakukan di sini.
 */

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyJwt } from "@/utils/auth";
import { probeImage, renderVariants } from "@/utils/media-variants";
import {
  MEDIA_MAX_BYTES,
  MEDIA_ROOT,
  MEDIA_TMP_DIR,
  MEDIA_URL_PREFIX,
  assertWritable,
  hasRoomForUpload,
} from "@/utils/media-store";
import { rateLimit } from "@/utils/rate-limit";
import { MEDIA_WIDTH_BUCKETS, variantFileName } from "@/utils/media-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 20 upload per jam per user. */
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type Purpose = "submission" | "site";

const PURPOSE_BY_ROLE: Record<string, Purpose[]> = {
  maba: ["submission"],
  mentor: ["submission"],
  admin: ["submission", "site"],
  panitia: ["submission", "site"],
};

/**
 * Tabel magic byte. Ini satu-satunya penentu tipe berkas — nilai `file.type`
 * dari klien hanya dipakai sebagai pembanding, tidak pernah dipercaya.
 *
 * SVG SENGAJA TIDAK ADA DI SINI dan tidak boleh ditambahkan. SVG adalah dokumen
 * yang bisa memuat <script>; menyajikannya dari origin kita sendiri sama dengan
 * memberi penyerang eksekusi skrip same-origin. Logo sponsor yang berformat SVG
 * berasal dari repo (tepercaya) dan dilayani dari public/, bukan lewat sini.
 */
const MAGIC: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  {
    mime: "image/jpeg",
    ext: ".jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: ".png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    ext: ".webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    mime: "application/pdf",
    ext: ".pdf",
    test: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-",
  },
];

function sniff(buf: Buffer): { mime: string; ext: string } | null {
  const head = buf.subarray(0, 16);
  for (const entry of MAGIC) {
    if (entry.test(head)) return { mime: entry.mime, ext: entry.ext };
  }
  return null;
}

function fail(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ---- 1. Autentikasi --------------------------------------------------
  let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);
  }
  if (!token) return fail("Sesi tidak ditemukan. Silakan login kembali.", 401);

  const user = await verifyJwt(token);
  if (!user) return fail("Sesi tidak valid atau telah kedaluwarsa.", 401);

  // ---- 2. Otorisasi ----------------------------------------------------
  const allowedPurposes = PURPOSE_BY_ROLE[user.role];
  if (!allowedPurposes) return fail("Peran Anda tidak diizinkan mengunggah berkas.", 403);

  // ---- 3. Rate limit ---------------------------------------------------
  const limit = rateLimit(`media:${user.id}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Terlalu banyak unggahan. Coba lagi dalam ${limit.retryAfter} detik.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // ---- 4. Batas ukuran, SEBELUM menyentuh body -------------------------
  // App Router tidak punya batas body bawaan, dan req.formData() mem-buffer
  // seluruh body ke memori. Pemeriksaan Content-Length ini satu-satunya
  // proteksi nyata terhadap POST raksasa.
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MEDIA_MAX_BYTES * 1.1) {
    return fail(
      `Berkas terlalu besar. Maksimum ${Math.floor(MEDIA_MAX_BYTES / 1024 / 1024)} MB.`,
      413
    );
  }

  if (!(await hasRoomForUpload())) {
    return fail("Ruang penyimpanan server tidak mencukupi.", 507);
  }

  // ---- 5. Ambil berkas -------------------------------------------------
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Gagal membaca data unggahan.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("Berkas tidak ditemukan pada field 'file'.", 400);

  const requestedPurpose = String(form.get("purpose") || "submission") as Purpose;
  if (!allowedPurposes.includes(requestedPurpose)) {
    return fail("Anda tidak diizinkan mengunggah untuk tujuan tersebut.", 403);
  }

  // Content-Length bisa absen pada chunked transfer dan bisa berbohong.
  if (file.size <= 0) return fail("Berkas kosong.", 400);
  if (file.size > MEDIA_MAX_BYTES) {
    return fail(
      `Berkas terlalu besar. Maksimum ${Math.floor(MEDIA_MAX_BYTES / 1024 / 1024)} MB.`,
      413
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // ---- 6. Validasi tipe ------------------------------------------------
  const sniffed = sniff(buf);
  if (!sniffed) {
    return fail("Tipe berkas tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.", 415);
  }
  // Magic byte adalah OTORITAS; `file.type` dari klien hanya dicatat.
  // Menolak berdasarkan ketidakcocokan akan menjegal unggahan yang sah: sebagian
  // browser mobile mengirim "application/octet-stream", dan ada pula yang
  // mengirim "image/jpg" alih-alih "image/jpeg". Jaminan keamanannya tetap utuh
  // karena tipe hasil sniff yang dipakai memproses, dan seluruh gambar di-encode
  // ulang lewat sharp sehingga payload polyglot ikut mati.
  if (file.type && file.type !== sniffed.mime) {
    console.warn(
      `[media] tipe dideklarasikan berbeda dari isinya (user ${user.id}): ` +
        `declared=${file.type} sniffed=${sniffed.mime}`
    );
  }

  const isPdf = sniffed.mime === "application/pdf";
  if (isPdf && requestedPurpose !== "submission") {
    return fail("PDF hanya diperbolehkan untuk pengumpulan tugas.", 415);
  }

  // ---- 7. Tulis -------------------------------------------------------
  try {
    await assertWritable();
  } catch (err) {
    console.error("[media]", err instanceof Error ? err.message : err);
    return fail("Penyimpanan media tidak tersedia.", 500);
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const relDir = path.join("uploads", requestedPurpose, yyyy, mm);
  const destDir = path.join(MEDIA_ROOT, relDir);

  // Nama tak tertebak: URL ini satu-satunya kontrol akses atas berkas tugas.
  const id = randomUUID().replace(/-/g, "");

  const staged: string[] = [];
  const committed: string[] = [];

  try {
    await fs.mkdir(destDir, { recursive: true });
    await fs.mkdir(MEDIA_TMP_DIR, { recursive: true });

    let files: string[];
    let width = 0;
    let height = 0;
    let bytes = 0;

    if (isPdf) {
      // PDF tidak bisa disanitasi lewat re-encode; disimpan apa adanya dan
      // disajikan dengan Content-Disposition: attachment oleh route baca.
      const name = `${id}.pdf`;
      const tmp = path.join(MEDIA_TMP_DIR, `${name}.part`);
      const fh = await fs.open(tmp, "w");
      try {
        await fh.writeFile(buf);
        await fh.sync();
      } finally {
        await fh.close();
      }
      staged.push(tmp);
      files = [name];
      bytes = buf.byteLength;
    } else {
      const meta = await probeImage(buf);
      width = meta.width;
      height = meta.height;

      // Render ke staging dulu; baru dipindahkan setelah SEMUA varian jadi.
      const stageDir = path.join(MEDIA_TMP_DIR, id);
      const variants = await renderVariants(buf, stageDir, id);
      files = variants.map((v) => v.file);
      staged.push(...files.map((f) => path.join(stageDir, f)));
      bytes = variants.reduce((a, v) => a + v.bytes, 0);
    }

    // Rename dilakukan di dalam filesystem yang sama (MEDIA_TMP_DIR ada di
    // dalam MEDIA_ROOT), sehingga tidak pernah menjadi cross-device EXDEV.
    for (let i = 0; i < staged.length; i += 1) {
      const finalPath = path.join(destDir, files[i]);
      await fs.rename(staged[i], finalPath);
      committed.push(finalPath);
    }

    const urlDir = `${MEDIA_URL_PREFIX}/${relDir.split(path.sep).join("/")}`;
    const primary = isPdf ? `${id}.pdf` : variantFileName(id, "orig");

    const variantUrls: Record<string, string> = {};
    if (!isPdf) {
      for (const bucket of MEDIA_WIDTH_BUCKETS) {
        variantUrls[String(bucket)] = `${urlDir}/${variantFileName(id, bucket)}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: `${urlDir}/${primary}`,
        variants: variantUrls,
        bytes,
        mime: isPdf ? "application/pdf" : "image/webp",
        width,
        height,
        originalName: file.name,
      },
    });
  } catch (err) {
    // Bersihkan agar tidak meninggalkan unggahan separuh jadi.
    await Promise.allSettled(committed.map((p) => fs.unlink(p)));
    await Promise.allSettled(staged.map((p) => fs.unlink(p)));

    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOSPC") {
      return fail("Ruang penyimpanan server habis.", 507);
    }
    if (code === "EACCES" || code === "EPERM") {
      console.error(
        "[media] MEDIA_ROOT tidak writable — cek ownership bind mount (uid 1000):",
        err
      );
      return fail("Penyimpanan media tidak dapat ditulis.", 500);
    }

    console.error("[media] gagal memproses unggahan:", err);
    return fail("Gagal memproses berkas. Pastikan berkas berupa gambar yang valid.", 422);
  } finally {
    // Sisa direktori staging, best-effort.
    await fs.rm(path.join(MEDIA_TMP_DIR, id), { recursive: true, force: true }).catch(() => {});
  }
}
