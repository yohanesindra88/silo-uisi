import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signJwt } from "../../src/utils/jwt";

export interface UserSeedItem {
  username: string;
  nim?: string;
  nama: string;
  fakultas?: string;
  prodi?: string;
  password: string; // Plaintext (akan otomatis di-hash bcrypt) atau hash string $2a$/$2b$
  role: "maba" | "mentor" | "panitia" | "admin" | string;
  qrToken?: string;
  groupKeyword?: string; // Keyword nama kelompok: 'Sirius', 'Vega', 'Canopus'
  mGroupsId?: number; // ID kelompok dari tabel m_groups (opsional fallback)
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Data seeder untuk tabel: m_users (otomatis dienkripsi bcrypt & role siap pakai)
 * Catatan Akun Default:
 * - Admin/Panitia: username "admin" / "panitia01", password "admin123"
 * - Mentor: username "mentor01" / "mentor02", password "mentor123"
 * - Maba: username "302261001" s/d "302261005", password "maba123"
 */
export const usersData: UserSeedItem[] = [
  {
    username: "admin",
    nama: "Super Admin SILO",
    password: "admin123",
    role: "admin",
    fakultas: "FTI",
    prodi: "Informatika",
  },
  {
    username: "panitia01",
    nama: "Bima Arya (Ketua Panitia)",
    password: "admin123",
    role: "panitia",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
  },
  {
    username: "mentor01",
    nim: "202241001",
    nama: "Kak Sarah Maulida (Mentor Sirius)",
    password: "mentor123",
    role: "mentor",
    fakultas: "FTI",
    prodi: "Informatika",
    groupKeyword: "Sirius",
  },
  {
    username: "mentor02",
    nim: "202241002",
    nama: "Kak Dimas Pratama (Mentor Vega)",
    password: "mentor123",
    role: "mentor",
    fakultas: "FEB",
    prodi: "Manajemen Rekayasa",
    groupKeyword: "Vega",
  },
  {
    username: "mentor03",
    nim: "202241003",
    nama: "Kak Putri Anggraini (Mentor Canopus)",
    password: "mentor123",
    role: "mentor",
    fakultas: "FEB",
    prodi: "Manajemen",
    groupKeyword: "Canopus",
  },
  {
    username: "302261001",
    nim: "302261001",
    nama: "Aditia Pratama (Maba Sirius)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
    qrToken: "QR_302261001_SIRIUS",
    groupKeyword: "Sirius",
  },
  {
    username: "302261002",
    nim: "302261002",
    nama: "Nabila Rahma (Maba Sirius)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Informatika",
    qrToken: "QR_302261002_SIRIUS",
    groupKeyword: "Sirius",
  },
  {
    username: "302261006",
    nim: "302261006",
    nama: "Bagus Setiawan (Maba Sirius)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Teknik Logistik",
    qrToken: "QR_302261006_SIRIUS",
    groupKeyword: "Sirius",
  },
  {
    username: "302261003",
    nim: "302261003",
    nama: "Rizky Firmansyah (Maba Vega)",
    password: "maba123",
    role: "maba",
    fakultas: "FEB",
    prodi: "Akuntansi",
    qrToken: "QR_302261003_VEGA",
    groupKeyword: "Vega",
  },
  {
    username: "302261005",
    nim: "302261005",
    nama: "Fajar Nugraha (Maba Vega)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Teknik Logistik",
    qrToken: "QR_302261005_VEGA",
    groupKeyword: "Vega",
  },
  {
    username: "302261007",
    nim: "302261007",
    nama: "Siti Aisyah (Maba Vega)",
    password: "maba123",
    role: "maba",
    fakultas: "FEB",
    prodi: "Manajemen",
    qrToken: "QR_302261007_VEGA",
    groupKeyword: "Vega",
  },
  {
    username: "302261004",
    nim: "302261004",
    nama: "Dewi Lestari (Maba Canopus)",
    password: "maba123",
    role: "maba",
    fakultas: "FEB",
    prodi: "Manajemen",
    qrToken: "QR_302261004_CANOPUS",
    groupKeyword: "Canopus",
  },
  {
    username: "302261008",
    nim: "302261008",
    nama: "Andi Wijaya (Maba Canopus)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Informatika",
    qrToken: "QR_302261008_CANOPUS",
    groupKeyword: "Canopus",
  },
  {
    username: "302261009",
    nim: "302261009",
    nama: "Tri Kurniawan (Maba Canopus)",
    password: "maba123",
    role: "maba",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
    qrToken: "QR_302261009_CANOPUS",
    groupKeyword: "Canopus",
  },
];

export async function seedUsers(prisma: PrismaClient) {
  console.log("  👤 Seeding m_users (Bcrypt Encrypted & Dynamic Group Linking)...");

  if (usersData.length === 0) {
    console.log("     ℹ️ Data m_users masih kosong, dilewati.");
    return;
  }

  // Ambil grup-grup aktif dari database
  const allActiveGroups = await prisma.group.findMany({
    where: { deletedAt: null },
  });

  const firstGroup = allActiveGroups[0];
  const defaultGroupId = firstGroup?.id;

  for (const item of usersData) {
    // 1. Enkripsi password jika belum berbentuk hash bcrypt ($2a$ atau $2b$)
    let hashedPassword = item.password;
    if (!item.password.startsWith("$2a$") && !item.password.startsWith("$2b$")) {
      hashedPassword = bcrypt.hashSync(item.password, 10);
    }

    // 2. Hubungkan kelompok secara dinamis berdasarkan keyword
    let assignedGroupId: number | null = null;
    if (item.groupKeyword) {
      const matched = allActiveGroups.find((g) =>
        g.name.toLowerCase().includes(item.groupKeyword!.toLowerCase())
      );
      if (matched) {
        assignedGroupId = matched.id;
      }
    }

    if (!assignedGroupId && item.mGroupsId) {
      assignedGroupId = item.mGroupsId;
    }

    if (!assignedGroupId && item.role === "maba") {
      assignedGroupId = defaultGroupId || null;
    }

    // 3. Insert or update user dengan password yang telah dienkripsi bcrypt
    const user = await prisma.user.upsert({
      where: { username: item.username },
      update: {
        nim: item.nim,
        nama: item.nama,
        fakultas: item.fakultas,
        prodi: item.prodi,
        password: hashedPassword,
        role: item.role,
        qrToken: item.qrToken,
        mGroupsId: assignedGroupId,
        deletedAt: null,
      },
      create: {
        username: item.username,
        nim: item.nim,
        nama: item.nama,
        fakultas: item.fakultas,
        prodi: item.prodi,
        password: hashedPassword,
        role: item.role,
        qrToken: item.qrToken,
        mGroupsId: assignedGroupId,
      },
    });

    // 4. Generate contoh JWT token dengan payload lengkap
    const jwtExample = await signJwt({
      id: user.id,
      nama: user.nama,
      role: user.role,
      m_groups_id: user.mGroupsId,
      qr_token: user.qrToken,
      username: user.username,
      nim: user.nim,
    }, "7d");

    console.log(`     🔑 User: [${user.role.toUpperCase()}] ${user.username} (${user.nama}) -> Group ID: ${user.mGroupsId}`);
  }

  console.log(`     ✅ Berhasil memproses ${usersData.length} data m_users.`);
}
