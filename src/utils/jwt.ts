import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "aethera_token";
const JWT_SECRET = process.env.JWT_SECRET || "aethera_silo_uisi_2026_super_secret_jwt_key_secure";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface AuthUserPayload {
  id: number;
  nama: string;
  role: string;
  m_groups_id: number | null;
  qr_token: string | null;
  username?: string;
  nim?: string | null;
}

/**
 * Generate JWT token menggunakan JOSE (kompatibel dengan Edge & Node runtime)
 */
export async function signJwt(payload: AuthUserPayload, expiresIn: string = "1d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

/**
 * Verifikasi JWT token menggunakan JOSE (kompatibel dengan Edge & Node runtime)
 */
export async function verifyJwt(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: Number(payload.id),
      nama: String(payload.nama),
      role: String(payload.role),
      m_groups_id: payload.m_groups_id !== null && payload.m_groups_id !== undefined ? Number(payload.m_groups_id) : null,
      qr_token: payload.qr_token ? String(payload.qr_token) : null,
      username: payload.username ? String(payload.username) : undefined,
      nim: payload.nim ? String(payload.nim) : null,
    };
  } catch {
    return null;
  }
}
