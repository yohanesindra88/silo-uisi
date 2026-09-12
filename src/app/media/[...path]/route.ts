/**
 * Penyaji berkas media hasil upload, dibaca dari bind mount MEDIA_ROOT.
 *
 * Prefix "/media/*" dipilih karena bebas dari rewrites()/redirects() di
 * next.config.ts dan dari matcher di src/proxy.ts. Jangan pindahkan ke
 * "/api/media/*" — path itu akan ter-rewrite ke /backoffice/api/media/* dan
 * bertabrakan dengan route upload.
 *
 * INVARIANT: header Cache-Control di bawah memakai `immutable`, yang hanya aman
 * karena nama berkas berbasis UUID dan TIDAK PERNAH ditimpa di tempat. Route
 * upload wajib menjaga invariant itu; kalau suatu saat ada berkas yang bisa
 * diganti isinya dengan nama sama, `immutable` harus dicabut lebih dulu.
 */

import { createReadStream } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest } from "next/server";

import {
  CONTENT_TYPES,
  assertInsideRoot,
  isServableExtension,
  safeJoin,
} from "@/utils/media-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Di atas ambang ini berkas di-stream, bukan dibaca sekaligus ke memori. */
const STREAM_THRESHOLD_BYTES = 4 * 1024 * 1024;

function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await ctx.params;

  const abs = safeJoin(segments ?? []);
  if (!abs) return notFound();

  const ext = path.extname(abs).toLowerCase();
  if (!isServableExtension(ext)) return notFound();

  if (!(await assertInsideRoot(abs))) return notFound();

  let stat;
  try {
    stat = await fs.stat(abs);
  } catch {
    return notFound();
  }
  if (!stat.isFile()) return notFound();

  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;

  const headers = new Headers({
    "Content-Type": CONTENT_TYPES[ext],
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
    // PDF tidak bisa disanitasi lewat re-encode seperti gambar, jadi dipaksa
    // diunduh alih-alih dirender di origin kita.
    "Content-Disposition":
      ext === ".pdf"
        ? `attachment; filename="${path.basename(abs)}"`
        : `inline; filename="${path.basename(abs)}"`,
  });

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  headers.set("Content-Length", String(stat.size));

  try {
    if (stat.size <= STREAM_THRESHOLD_BYTES) {
      const buf = await fs.readFile(abs);
      return new Response(new Uint8Array(buf), { status: 200, headers });
    }

    const stream = Readable.toWeb(
      createReadStream(abs)
    ) as unknown as ReadableStream;
    return new Response(stream, { status: 200, headers });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT" || code === "ENOTDIR") return notFound();
    console.error("[media] gagal membaca berkas:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
