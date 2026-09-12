/**
 * Galeri dokumentasi.
 *
 *   GET  /api/dokumentasi  -> publik (dipakai halaman / dan /galeri)
 *   POST /api/dokumentasi  -> admin & panitia saja
 *
 * Seperti route media, tidak ada proteksi middleware di depan path ini —
 * src/proxy.ts tidak mencakup /api/*. Otorisasi dilakukan di sini.
 */

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyJwt } from "@/utils/auth";
import prisma from "@/utils/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITOR_ROLES = ["admin", "panitia"];

async function requireEditor(req: NextRequest) {
  let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const header = req.headers.get("authorization");
    if (header?.startsWith("Bearer ")) token = header.substring(7);
  }
  if (!token) return null;

  const user = await verifyJwt(token);
  if (!user || !EDITOR_ROLES.includes(user.role)) return null;
  return user;
}

/** Tautan yang boleh disimpan: http(s) eksternal, hasil upload, atau aset repo. */
function isAllowedImageUrl(url: string): boolean {
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith("/media/uploads/") ||
    url.startsWith("/dokumentasi/")
  );
}

export async function GET() {
  try {
    const items = await prisma.documentation.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: items.map((item) => ({
        id: String(item.id),
        src: item.imageUrl,
        title: item.title,
        tag: item.tag,
      })),
    });
  } catch (error) {
    console.error("Error pada GET /api/dokumentasi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data galeri dokumentasi." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await requireEditor(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Anda tidak berwenang mengubah galeri." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const title = String(body.title ?? "").trim();
    const tag = String(body.tag ?? "").trim();

    if (!imageUrl || !title || !tag) {
      return NextResponse.json(
        { success: false, message: "imageUrl, title, dan tag wajib diisi." },
        { status: 400 }
      );
    }
    if (!isAllowedImageUrl(imageUrl)) {
      return NextResponse.json(
        { success: false, message: "Format tautan gambar tidak valid." },
        { status: 400 }
      );
    }

    const last = await prisma.documentation.findFirst({
      where: { deletedAt: null },
      orderBy: { sortOrder: "desc" },
    });

    const created = await prisma.documentation.create({
      data: {
        imageUrl,
        title,
        tag,
        sortOrder:
          body.sortOrder !== undefined
            ? Number(body.sortOrder)
            : (last?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(
      { success: true, message: "Item galeri ditambahkan.", data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error pada POST /api/dokumentasi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan item galeri." },
      { status: 500 }
    );
  }
}
