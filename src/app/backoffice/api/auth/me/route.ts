import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/utils/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    // Ambil token dari HttpOnly Cookie atau Authorization Header
    let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan. Silakan login kembali." },
        { status: 401 }
      );
    }

    // Verifikasi token JWT
    const decoded = await verifyJwt(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    // Ambil data terbaru dari database
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        deletedAt: null,
      },
      include: {
        group: true,
        groupMentors: {
          where: { deletedAt: null },
          include: { group: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan atau sudah dinonaktifkan." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        nim: user.nim,
        fakultas: user.fakultas,
        prodi: user.prodi,
        m_groups_id: user.mGroupsId,
        qr_token: user.qrToken,
        group: user.group ? { id: user.group.id, name: user.group.name } : null,
        mentored_groups: user.groupMentors.map((gm) => ({
          group_id: gm.mGroupsId,
          group_name: gm.group.name,
        })),
      },
    });
  } catch (error) {
    console.error("Auth /me error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memverifikasi sesi." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    let token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan. Silakan login kembali." },
        { status: 401 }
      );
    }

    const decoded = await verifyJwt(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { nama, fakultas, prodi, oldPassword, newPassword } = body;

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof nama === "string" && nama.trim()) updateData.nama = nama.trim();
    if (typeof fakultas === "string") updateData.fakultas = fakultas.trim();
    if (typeof prodi === "string") updateData.prodi = prodi.trim();

    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json(
          { success: false, message: "Kata sandi lama harus dimasukkan untuk mengganti kata sandi." },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Kata sandi lama tidak cocok." },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        group: true,
        groupMentors: {
          where: { deletedAt: null },
          include: { group: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      user: {
        id: updated.id,
        username: updated.username,
        nama: updated.nama,
        role: updated.role,
        nim: updated.nim,
        fakultas: updated.fakultas,
        prodi: updated.prodi,
        m_groups_id: updated.mGroupsId,
        qr_token: updated.qrToken,
        group: updated.group ? { id: updated.group.id, name: updated.group.name } : null,
        mentored_groups: updated.groupMentors.map((gm) => ({
          group_id: gm.mGroupsId,
          group_name: gm.group.name,
        })),
      },
    });
  } catch (error) {
    console.error("Auth PUT /me error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil pengguna." },
      { status: 500 }
    );
  }
}
