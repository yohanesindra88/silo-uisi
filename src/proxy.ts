import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/utils/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Verifikasi JWT token
  const user = token ? await verifyJwt(token) : null;

  // 1. Logika untuk halaman /login
  if (pathname === "/login") {
    if (user) {
      // Jika sudah login, redirect ke halaman dashboard sesuai role masing-masing
      if (user.role === "admin" || user.role === "panitia") {
        return NextResponse.redirect(new URL("/admin", req.url));
      } else if (user.role === "mentor") {
        return NextResponse.redirect(new URL("/mentor", req.url));
      } else if (user.role === "maba") {
        return NextResponse.redirect(new URL("/maba", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 2. Tentukan aturan proteksi route RBAC
  const isAdminRoute = pathname.startsWith("/admin");
  const isMentorRoute = pathname.startsWith("/mentor");
  const isMabaRoute = pathname.startsWith("/maba");

  // Jika bukan route terproteksi, lanjutkan request
  if (!isAdminRoute && !isMentorRoute && !isMabaRoute) {
    return NextResponse.next();
  }

  // 3. Jika belum terautentikasi, redirect ke /login
  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Validasi Role-Based Access Control (RBAC)
  if (isAdminRoute) {
    // /admin/* hanya dapat diakses oleh role 'admin' atau 'panitia'
    if (user.role !== "admin" && user.role !== "panitia") {
      return redirectToUserHome(user.role, req);
    }
  }

  if (isMentorRoute) {
    // /mentor/* hanya dapat diakses oleh role 'mentor'
    if (user.role !== "mentor") {
      return redirectToUserHome(user.role, req);
    }
  }

  if (isMabaRoute) {
    // /maba/* hanya dapat diakses oleh role 'maba'
    if (user.role !== "maba") {
      return redirectToUserHome(user.role, req);
    }
  }

  // Set user headers agar Server Components dapat membaca info auth dengan mudah
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(user.id));
  requestHeaders.set("x-user-role", user.role);
  requestHeaders.set("x-user-name", encodeURIComponent(user.nama));
  if (user.m_groups_id) {
    requestHeaders.set("x-user-group-id", String(user.m_groups_id));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Helper redirect user yang tidak memiliki otorisasi ke halaman dashboard role-nya
 */
function redirectToUserHome(role: string, req: NextRequest) {
  if (role === "admin" || role === "panitia") {
    return NextResponse.redirect(new URL("/admin", req.url));
  } else if (role === "mentor") {
    return NextResponse.redirect(new URL("/mentor", req.url));
  } else if (role === "maba") {
    return NextResponse.redirect(new URL("/maba", req.url));
  }
  return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/mentor/:path*",
    "/mentor",
    "/maba/:path*",
    "/maba",
    "/login",
  ],
};
