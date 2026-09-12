import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { comparePassword, hashPassword, signJwt, AUTH_COOKIE_NAME } from "@/utils/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { 
        username,
        deletedAt: null,
      },
      include: { group: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Username atau password tidak sesuai." },
        { status: 401 }
      );
    }

    // Validasi kata sandi (mendukung bcrypt hash dan auto-upgrade dari plaintext)
    let isPasswordValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      isPasswordValid = user.password === password;
      if (isPasswordValid) {
        // Auto-upgrade password lama ke bcrypt hash
        const newHashedPassword = await hashPassword(password);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHashedPassword },
        });
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Username atau password tidak sesuai." },
        { status: 401 }
      );
    }

    // Buat JWT Token sesuai spesifikasi: id, nama, role, m_groups_id, qr_token
    const payload = {
      id: user.id,
      nama: user.nama,
      role: user.role,
      m_groups_id: user.mGroupsId,
      qr_token: user.qrToken,
      username: user.username,
      nim: user.nim,
    };

    const token = await signJwt(payload, "1d");

    // Siapkan response dengan data user dan token
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      token,
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
      },
    });

    // Simpan token dalam HttpOnly cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 hari
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
