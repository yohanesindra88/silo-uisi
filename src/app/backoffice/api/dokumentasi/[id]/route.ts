/**
 * Ubah / hapus satu item galeri dokumentasi. Admin & panitia saja.
 *
 * DELETE memakai soft delete (deletedAt), konsisten dengan seluruh schema.
 * Berkas di disk TIDAK ikut dihapus — itu tugas GC yang dijalankan manual,
 * supaya kesalahan hapus tidak langsung memusnahkan berkasnya.
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

function isAllowedImageUrl(url: string): boolean {
  return (
    /^https?:\/\//i.test(url) ||
    url.startsWith("/media/uploads/") ||
    url.startsWith("/dokumentasi/")
  );
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireEditor(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Anda tidak berwenang mengubah galeri." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.imageUrl !== undefined) {
      const imageUrl = String(body.imageUrl).trim();
      if (!isAllowedImageUrl(imageUrl)) {
        return NextResponse.json(
          { success: false, message: "Format tautan gambar tidak valid." },
          { status: 400 }
        );
      }
      data.imageUrl = imageUrl;
    }
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.tag !== undefined) data.tag = String(body.tag).trim();
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada perubahan yang dikirim." },
        { status: 400 }
      );
    }

    const updated = await prisma.documentation.update({
      where: { id: numericId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Item galeri diperbarui.",
      data: updated,
    });
  } catch (error) {
    console.error("Error pada PATCH /api/dokumentasi/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui item galeri." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireEditor(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Anda tidak berwenang mengubah galeri." },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });
  }

  try {
    await prisma.documentation.update({
      where: { id: numericId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Item galeri dihapus." });
  } catch (error) {
    console.error("Error pada DELETE /api/dokumentasi/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus item galeri." },
      { status: 500 }
    );
  }
}
