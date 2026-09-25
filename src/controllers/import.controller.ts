import { prisma } from "@/utils/prisma";
import { hashPassword } from "@/utils/auth";
import * as XLSX from "xlsx";
import crypto from "crypto";

// =========================================================================
// INTERFACES & TYPES
// =========================================================================

export interface GroupImportRow {
  nama_kelompok: string;
  deskripsi?: string | null;
}

export interface UserImportRow {
  nama: string;
  nim?: string | null;
  username: string;
  role: "maba" | "mentor" | "admin" | string;
  fakultas?: string | null;
  prodi?: string | null;
  nama_kelompok?: string | null;
  password_default?: string | null;
}

export interface RowValidationResult<T> {
  rowNumber: number;
  data: T;
  isValid: boolean;
  status: "VALID" | "ERROR" | "WARNING";
  errors: string[];
  warnings: string[];
}

export interface CreatedUserCredential {
  nama: string;
  nim: string | null;
  username: string;
  passwordPlain: string;
  role: string;
  fakultas: string | null;
  prodi: string | null;
  groupName: string | null;
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Menghasilkan password acak 6 digit: 3 digit angka di depan (0-9) + 3 huruf kecil di belakang (a-z).
 * Menggunakan Set untuk menjamin keunikan password pada seluruh user dalam satu batch.
 * Contoh hasil: "482kxm", "914abc", "037zyx"
 */
export function generateUniqueUserPassword(usedPasswords: Set<string>): string {
  const digits = "0123456789";
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let password = "";

  do {
    const randBytes = crypto.randomBytes(6);
    let numPart = "";
    let charPart = "";

    // 3 digit angka di depan
    for (let i = 0; i < 3; i++) {
      numPart += digits[randBytes[i] % digits.length];
    }
    // 3 digit huruf kecil di belakang
    for (let i = 3; i < 6; i++) {
      charPart += letters[randBytes[i] % letters.length];
    }

    password = `${numPart}${charPart}`;
  } while (usedPasswords.has(password));

  usedPasswords.add(password);
  return password;
}

/**
 * Generator QR Token unik untuk mahasiswa baru (maba)
 */
export function generateMabaQrToken(nim?: string | null, username?: string): string {
  const identifier = (nim || username || "SILO").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const randomSuffix = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `QR_${identifier}_${randomSuffix}`;
}

/**
 * Helper membaca sheet pertama dari Excel Buffer menjadi JSON object array
 */
function readFirstSheetRows(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("File Excel tidak memiliki sheet yang valid.");
  }
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${firstSheetName}" kosong atau tidak dapat dibaca.`);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  // Filter baris petunjuk panduan (misal yang mengandung "(Wajib" atau baris kosong)
  return rawRows.filter((row) => {
    const values = Object.values(row).map((v) => String(v ?? "").trim());
    const isGuideRow = values.some(
      (v) => v.includes("(Wajib") || v.includes("(Opsional") || v.includes("Contoh:") || v.includes("Petunjuk:")
    );
    const isAllEmpty = values.every((v) => v === "");
    return !isGuideRow && !isAllEmpty;
  });
}

// =========================================================================
// CONTROLLER UTAMA IMPORT
// =========================================================================

export class ImportController {
  // -----------------------------------------------------------------------
  // 1. GENERATE TEMPLATE EXCEL
  // -----------------------------------------------------------------------

  /**
   * Menghasilkan Buffer Excel Template Master Kelompok
   */
  static generateGroupsTemplate(): Buffer {
    const wb = XLSX.utils.book_new();

    const sampleData = [
      {
        nama_kelompok: "Kelompok 01 - Sirius",
        deskripsi: "Gugus Bintang Sirius - Kelompok Integritas & Kepemimpinan",
      },
      {
        nama_kelompok: "Kelompok 02 - Vega",
        deskripsi: "Gugus Bintang Vega - Kelompok Inovasi & Kolaborasi",
      },
      {
        nama_kelompok: "Kelompok 03 - Canopus",
        deskripsi: "Gugus Bintang Canopus - Kelompok Kreativitas Mahasiswa",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, {
      header: ["nama_kelompok", "deskripsi"],
    });

    // Lebar kolom yang optimal
    ws["!cols"] = [{ wch: 30 }, { wch: 60 }];

    XLSX.utils.book_append_sheet(wb, ws, "groups");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  /**
   * Menghasilkan Buffer Excel Template Master Pengguna
   */
  static generateUsersTemplate(): Buffer {
    const wb = XLSX.utils.book_new();

    const sampleData = [
      {
        nama: "Aditia Pratama",
        nim: "302261001",
        username: "302261001",
        role: "maba",
        fakultas: "FTI",
        prodi: "Sistem Informasi",
        nama_kelompok: "Kelompok 01 - Sirius",
        password_default: "", // Kosongkan agar di-generate password acak 6 digit
      },
      {
        nama: "Nabila Rahma",
        nim: "302261002",
        username: "302261002",
        role: "maba",
        fakultas: "FTI",
        prodi: "Informatika",
        nama_kelompok: "Kelompok 01 - Sirius",
        password_default: "",
      },
      {
        nama: "Kak Sarah Maulida",
        nim: "202241001",
        username: "mentor01",
        role: "mentor",
        fakultas: "FTI",
        prodi: "Informatika",
        nama_kelompok: "Kelompok 01 - Sirius",
        password_default: "",
      },
      {
        nama: "Administrator SILO",
        nim: "",
        username: "admin_silo",
        role: "admin",
        fakultas: "FTI",
        prodi: "Informatika",
        nama_kelompok: "",
        password_default: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, {
      header: [
        "nama",
        "nim",
        "username",
        "role",
        "fakultas",
        "prodi",
        "nama_kelompok",
        "password_default",
      ],
    });

    ws["!cols"] = [
      { wch: 25 }, // nama
      { wch: 15 }, // nim
      { wch: 18 }, // username
      { wch: 12 }, // role
      { wch: 12 }, // fakultas
      { wch: 22 }, // prodi
      { wch: 25 }, // nama_kelompok
      { wch: 20 }, // password_default
    ];

    XLSX.utils.book_append_sheet(wb, ws, "users");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  /**
   * Menghasilkan Buffer Excel Rekap Kredensial Pengguna yang Baru Diimpor
   */
  static generateCredentialsExcel(users: CreatedUserCredential[]): Buffer {
    const wb = XLSX.utils.book_new();

    const formattedData = users.map((u, idx) => ({
      No: idx + 1,
      Nama: u.nama,
      NIM: u.nim || "-",
      Username: u.username,
      "Password Sementara": u.passwordPlain,
      Role: u.role.toUpperCase(),
      Fakultas: u.fakultas || "-",
      Prodi: u.prodi || "-",
      Kelompok: u.groupName || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);

    ws["!cols"] = [
      { wch: 6 },  // No
      { wch: 26 }, // Nama
      { wch: 16 }, // NIM
      { wch: 18 }, // Username
      { wch: 22 }, // Password Sementara
      { wch: 12 }, // Role
      { wch: 14 }, // Fakultas
      { wch: 24 }, // Prodi
      { wch: 26 }, // Kelompok
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Akun");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  // -----------------------------------------------------------------------
  // 2. PARSING & VALIDASI PREVIEW (DRY-RUN)
  // -----------------------------------------------------------------------

  /**
   * Parse dan validasi preview file Excel Kelompok
   */
  static async previewGroups(buffer: Buffer) {
    const rawRows = readFirstSheetRows(buffer);

    if (rawRows.length === 0) {
      throw new Error("File Excel tidak memiliki data baris kelompok untuk diproses.");
    }

    // Ambil data kelompok yang sudah ada di DB
    const existingGroups = await prisma.group.findMany({
      where: { deletedAt: null },
      select: { name: true },
    });
    const existingGroupNames = new Set(existingGroups.map((g) => g.name.toLowerCase().trim()));

    const seenInFile = new Set<string>();
    const validatedRows: RowValidationResult<GroupImportRow>[] = [];

    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // Asumsi header di row 1
      const namaKelompok = String(row.nama_kelompok || row.name || row.nama || "").trim();
      const deskripsi = String(row.deskripsi || row.description || "").trim() || null;

      const errors: string[] = [];
      const warnings: string[] = [];
      const normalizedName = namaKelompok.toLowerCase();

      if (!namaKelompok) {
        errors.push("Nama kelompok wajib diisi.");
      } else if (namaKelompok.length > 45) {
        errors.push("Nama kelompok maksimal 45 karakter.");
      }

      if (namaKelompok) {
        if (seenInFile.has(normalizedName)) {
          errors.push(`Nama kelompok "${namaKelompok}" duplikat di dalam file ini.`);
        } else {
          seenInFile.add(normalizedName);
        }

        if (existingGroupNames.has(normalizedName)) {
          warnings.push(`Kelompok "${namaKelompok}" sudah ada di database (akan diperbarui).`);
        }
      }

      const isValid = errors.length === 0;
      let status: "VALID" | "ERROR" | "WARNING" = "VALID";
      if (!isValid) {
        status = "ERROR";
        errorCount++;
      } else if (warnings.length > 0) {
        status = "WARNING";
        warningCount++;
        validCount++;
      } else {
        validCount++;
      }

      validatedRows.push({
        rowNumber,
        data: {
          nama_kelompok: namaKelompok,
          deskripsi,
        },
        isValid,
        status,
        errors,
        warnings,
      });
    });

    return {
      type: "groups",
      summary: {
        totalRows: rawRows.length,
        validCount,
        errorCount,
        warningCount,
      },
      rows: validatedRows,
    };
  }

  /**
   * Parse dan validasi preview file Excel Pengguna (Maba/Mentor/Admin)
   */
  static async previewUsers(buffer: Buffer) {
    const rawRows = readFirstSheetRows(buffer);

    if (rawRows.length === 0) {
      throw new Error("File Excel tidak memiliki data baris pengguna untuk diproses.");
    }

    // Ambil data username & NIM yang sudah ada di database
    const existingUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { username: true, nim: true },
    });
    const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase().trim()));
    const existingNims = new Set(
      existingUsers.filter((u) => u.nim).map((u) => u.nim!.toLowerCase().trim())
    );

    // Ambil daftar kelompok aktif di DB
    const existingGroups = await prisma.group.findMany({
      where: { deletedAt: null },
      select: { name: true },
    });
    const dbGroupNames = new Set(existingGroups.map((g) => g.name.toLowerCase().trim()));

    const seenUsernames = new Set<string>();
    const seenNims = new Set<string>();

    const validatedRows: RowValidationResult<UserImportRow>[] = [];
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      const nama = String(row.nama || row.name || "").trim();
      const rawNim = String(row.nim || "").trim();
      const nim = rawNim ? rawNim : null;
      const username = String(row.username || rawNim || "").trim();
      const rawRole = String(row.role || "maba").trim().toLowerCase();
      const role = ["maba", "mentor", "admin"].includes(rawRole) ? rawRole : "maba";

      const fakultas = String(row.fakultas || "").trim() || null;
      const prodi = String(row.prodi || "").trim() || null;
      const namaKelompok = String(row.nama_kelompok || row.kelompok || row.group_name || "").trim() || null;
      const passwordDefault = String(row.password_default || row.password || "").trim() || null;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validasi Wajib
      if (!nama) {
        errors.push("Nama lengkap wajib diisi.");
      } else if (nama.length > 45) {
        errors.push("Nama lengkap maksimal 45 karakter.");
      }

      if (!username) {
        errors.push("Username wajib diisi (atau isi NIM sebagai username).");
      } else if (username.length > 45) {
        errors.push("Username maksimal 45 karakter.");
      }

      if (!["maba", "mentor", "admin"].includes(rawRole)) {
        errors.push(`Role "${rawRole}" tidak valid. Pilihan: maba, mentor, admin.`);
      }

      // Validasi Duplikasi di Dalam File
      const lowerUsername = username.toLowerCase();
      if (username) {
        if (seenUsernames.has(lowerUsername)) {
          errors.push(`Username "${username}" duplikat di dalam file ini.`);
        } else {
          seenUsernames.add(lowerUsername);
        }

        if (existingUsernames.has(lowerUsername)) {
          warnings.push(`Username "${username}" sudah ada di database (data akan di-update).`);
        }
      }

      if (nim) {
        const lowerNim = nim.toLowerCase();
        if (seenNims.has(lowerNim)) {
          errors.push(`NIM "${nim}" duplikat di dalam file ini.`);
        } else {
          seenNims.add(lowerNim);
        }

        if (existingNims.has(lowerNim)) {
          warnings.push(`NIM "${nim}" sudah terdaftar pada pengguna lain di database.`);
        }
      }

      // Info Auto-resolve Kelompok
      if (namaKelompok && !dbGroupNames.has(namaKelompok.toLowerCase())) {
        warnings.push(`Kelompok "${namaKelompok}" belum ada di database, kelompok baru akan dibuat otomatis.`);
      }

      const isValid = errors.length === 0;
      let status: "VALID" | "ERROR" | "WARNING" = "VALID";
      if (!isValid) {
        status = "ERROR";
        errorCount++;
      } else if (warnings.length > 0) {
        status = "WARNING";
        warningCount++;
        validCount++;
      } else {
        validCount++;
      }

      validatedRows.push({
        rowNumber,
        data: {
          nama,
          nim,
          username,
          role,
          fakultas,
          prodi,
          nama_kelompok: namaKelompok,
          password_default: passwordDefault,
        },
        isValid,
        status,
        errors,
        warnings,
      });
    });

    return {
      type: "users",
      summary: {
        totalRows: rawRows.length,
        validCount,
        errorCount,
        warningCount,
      },
      rows: validatedRows,
    };
  }

  // -----------------------------------------------------------------------
  // 3. EKSEKUSI DATABASE IMPORT (TRANSAKSI ATOMIC)
  // -----------------------------------------------------------------------

  /**
   * Eksekusi import master kelompok
   */
  static async executeImportGroups(groups: GroupImportRow[]) {
    if (!groups || groups.length === 0) {
      throw new Error("Tidak ada data kelompok valid untuk diimpor.");
    }

    return prisma.$transaction(
      async (tx) => {
        let createdCount = 0;
        let updatedCount = 0;

        const cleanNames = groups.map((g) => g.nama_kelompok.trim()).filter(Boolean);
        const existingGroups = await tx.group.findMany({
          where: { name: { in: cleanNames } },
        });
        const existingMap = new Map(existingGroups.map((g) => [g.name.toLowerCase().trim(), g]));

        for (const item of groups) {
          const name = item.nama_kelompok.trim();
          if (!name) continue;

          const description = item.deskripsi ? item.deskripsi.trim() : null;
          const existing = existingMap.get(name.toLowerCase());

          if (existing) {
            await tx.group.update({
              where: { id: existing.id },
              data: {
                description: description || existing.description,
                deletedAt: null,
              },
            });
            updatedCount++;
          } else {
            const created = await tx.group.create({
              data: {
                name,
                description,
              },
            });
            existingMap.set(name.toLowerCase(), created);
            createdCount++;
          }
        }

        return {
          success: true,
          total: groups.length,
          createdCount,
          updatedCount,
        };
      },
      {
        maxWait: 15000,
        timeout: 60000,
      }
    );
  }

  /**
   * Eksekusi import pengguna dengan:
   * 1. Auto-generate password 6 digit (3 angka + 3 huruf) unik jika password tidak diisi.
   * 2. Hash bcrypt password sebelum disimpan ke database (dilakukan di luar transaksi DB agar tidak timeout).
   * 3. Auto-generate qr_token unik untuk maba.
   * 4. Auto-create kelompok jika belum terdaftar.
   * 5. Auto-assign mentor ke tabel pivot groups_mentors.
   * 6. Mengembalikan rekap kredensial untuk diunduh Admin dalam file Excel.
   */
  static async executeImportUsers(users: UserImportRow[]) {
    if (!users || users.length === 0) {
      throw new Error("Tidak ada data pengguna valid untuk diimpor.");
    }

    // 1. Pra-proses in-memory di luar transaksi database (CPU-intensive: bcrypt & token)
    // Menghitung hash bcrypt di luar transaksi mencegah terlampauinya batas timeout Prisma (5000ms).
    const usedPasswords = new Set<string>();

    interface PreparedUser {
      nama: string;
      username: string;
      nim: string | null;
      role: string;
      fakultas: string | null;
      prodi: string | null;
      groupName: string | null;
      plainPassword: string;
      hashedPassword: string;
      qrToken: string | null;
    }

    const preparedUsers: PreparedUser[] = [];

    for (const row of users) {
      const nama = row.nama?.trim();
      const username = row.username?.trim();
      const nim = row.nim ? row.nim.trim() : null;
      const role = (row.role || "maba").trim().toLowerCase();
      const fakultas = row.fakultas ? row.fakultas.trim() : null;
      const prodi = row.prodi ? row.prodi.trim() : null;
      const groupName = row.nama_kelompok ? row.nama_kelompok.trim() : null;

      if (!nama || !username) continue;

      // Tentukan password plain: gunakan password_default jika ada, atau generate 6 digit unik
      let plainPassword = row.password_default ? row.password_default.trim() : "";
      if (!plainPassword) {
        plainPassword = generateUniqueUserPassword(usedPasswords);
      }

      // Hash password bcrypt dilakukan di luar transaksi
      const hashedPassword = await hashPassword(plainPassword);

      // Auto-generate QR Token khusus role maba
      let qrToken: string | null = null;
      if (role === "maba") {
        qrToken = generateMabaQrToken(nim, username);
      }

      preparedUsers.push({
        nama,
        username,
        nim,
        role,
        fakultas,
        prodi,
        groupName,
        plainPassword,
        hashedPassword,
        qrToken,
      });
    }

    if (preparedUsers.length === 0) {
      throw new Error("Tidak ada data pengguna valid untuk diimpor.");
    }

    // 2. Eksekusi database di dalam transaksi dengan timeout yang dinaikkan (60s) dan bulk prefetch
    return prisma.$transaction(
      async (tx) => {
        // Cache atau siapkan lookup kelompok yang ada
        const allGroups = await tx.group.findMany({ where: { deletedAt: null } });
        const groupMap = new Map<string, number>();
        for (const g of allGroups) {
          groupMap.set(g.name.toLowerCase().trim(), g.id);
        }

        // Prefetch seluruh user yang ada berdasarkan username dalam satu query bulk
        // daripada melakukan tx.user.findFirst satu per satu berulang kali
        const usernames = preparedUsers.map((u) => u.username);
        const existingUsers = await tx.user.findMany({
          where: { username: { in: usernames } },
        });
        const existingUserMap = new Map<string, (typeof existingUsers)[0]>();
        for (const u of existingUsers) {
          existingUserMap.set(u.username.toLowerCase().trim(), u);
        }

        const createdCredentials: CreatedUserCredential[] = [];

        let createdCount = 0;
        let updatedCount = 0;
        let newGroupsCreated = 0;

        for (const prep of preparedUsers) {
          const {
            nama,
            username,
            nim,
            role,
            fakultas,
            prodi,
            groupName,
            plainPassword,
            hashedPassword,
            qrToken,
          } = prep;

          // Auto-resolve atau buat kelompok jika nama_kelompok diisi
          let mGroupsId: number | null = null;
          if (groupName) {
            const lowerGroupName = groupName.toLowerCase();
            if (groupMap.has(lowerGroupName)) {
              mGroupsId = groupMap.get(lowerGroupName)!;
            } else {
              // Buat kelompok baru otomatis
              const newGroup = await tx.group.create({
                data: {
                  name: groupName,
                  description: `Dibuat otomatis saat import pengguna (${nama})`,
                },
              });
              mGroupsId = newGroup.id;
              groupMap.set(lowerGroupName, newGroup.id);
              newGroupsCreated++;
            }
          }

          // Cek apakah user sudah ada dari prefetch cache map
          const existingUser = existingUserMap.get(username.toLowerCase());
          let savedUserId: number;

          if (existingUser) {
            // Update user yang sudah ada
            const updated = await tx.user.update({
              where: { id: existingUser.id },
              data: {
                nama,
                nim: nim || existingUser.nim,
                role,
                fakultas: fakultas || existingUser.fakultas,
                prodi: prodi || existingUser.prodi,
                password: hashedPassword,
                qrToken: qrToken || existingUser.qrToken,
                mGroupsId: mGroupsId !== null ? mGroupsId : existingUser.mGroupsId,
                deletedAt: null,
              },
            });
            savedUserId = updated.id;
            existingUserMap.set(username.toLowerCase(), updated);
            updatedCount++;
          } else {
            // Buat user baru
            const created = await tx.user.create({
              data: {
                nama,
                username,
                nim,
                role,
                fakultas,
                prodi,
                password: hashedPassword,
                qrToken,
                mGroupsId: mGroupsId,
              },
            });
            savedUserId = created.id;
            existingUserMap.set(username.toLowerCase(), created);
            createdCount++;
          }

          // Sinkronisasi mentor dengan tabel pivot groups_mentors
          if (role === "mentor") {
            if (mGroupsId) {
              // Hapus keterikatan mentor dengan kelompok lama agar tidak menempel di negara lain
              await tx.groupMentor.deleteMany({
                where: {
                  mUsersId: savedUserId,
                  mGroupsId: { not: mGroupsId },
                },
              });

              await tx.groupMentor.upsert({
                where: {
                  mGroupsId_mUsersId: {
                    mGroupsId,
                    mUsersId: savedUserId,
                  },
                },
                create: {
                  mGroupsId,
                  mUsersId: savedUserId,
                },
                update: {
                  deletedAt: null,
                },
              });
            } else {
              await tx.groupMentor.deleteMany({
                where: { mUsersId: savedUserId },
              });
            }
          }

          // Catat kredensial plaintext untuk diekspor ke Excel rekap Admin
          createdCredentials.push({
            nama,
            nim,
            username,
            passwordPlain: plainPassword,
            role,
            fakultas,
            prodi,
            groupName,
          });
        }

        return {
          success: true,
          total: preparedUsers.length,
          createdCount,
          updatedCount,
          newGroupsCreated,
          credentials: createdCredentials,
        };
      },
      {
        maxWait: 15000,
        timeout: 60000,
      }
    );
  }
}
