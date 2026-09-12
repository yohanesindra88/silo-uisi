import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/utils/auth";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });

    // Hapus HttpOnly auth cookie
    response.cookies.delete(AUTH_COOKIE_NAME);
    // Tambahan perlindungan kompatibilitas browser
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses logout." },
      { status: 500 }
    );
  }
}
