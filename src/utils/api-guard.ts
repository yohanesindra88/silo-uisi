import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, AUTH_COOKIE_NAME, AuthUserPayload } from "@/utils/auth";

/**
 * Helper otentikasi ketat khusus role 'admin'.
 * Memeriksa token dari cookie ataupun Authorization Bearer header.
 */
export async function requireAdmin(
  req: Request | NextRequest
): Promise<{ user: AuthUserPayload; response?: undefined } | { user?: undefined; response: NextResponse }> {
  let token: string | null = null;

  // Coba ambil dari NextRequest cookies jika ada
  if ("cookies" in req && typeof (req as unknown as { cookies?: { get?: (name: string) => { value?: string } } }).cookies?.get === "function") {
    token = (req as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value || null;
  }

  // Coba ambil dari Authorization header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Coba ambil dari string cookie header manual jika Request standar
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    return {
      response: NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    return {
      response: NextResponse.json(
        { success: false, message: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      ),
    };
  }

  if (payload.role !== "admin") {
    return {
      response: NextResponse.json(
        { success: false, message: "Akses ditolak. Fitur ini hanya dapat diakses oleh administrator." },
        { status: 403 }
      ),
    };
  }

  return { user: payload };
}
