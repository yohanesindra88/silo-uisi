import bcrypt from "bcryptjs";
export * from "./jwt";

/**
 * Hash password menggunakan bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Komparasi password mentah dengan hash bcryptjs
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
