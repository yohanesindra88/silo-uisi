import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Data seeder untuk tabel: m_sessions
 * Catatan: Kolom `name` bertipe VARCHAR(45), jadi panjang teks maksimal 45 karakter!
 */
export const sessionsData: Prisma.SessionCreateInput[] = [
  {
    name: "Sesi 1: Apel Pagi & Cek Atribut",
    startSessions: new Date("2026-09-11T06:30:00.000+07:00"),
    endSessions: new Date("2026-09-11T08:30:00.000+07:00"),
    toleransi: 15,
  },
  {
    name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    startSessions: new Date("2026-09-11T08:00:00.000+07:00"),
    endSessions: new Date("2026-09-11T20:00:00.000+07:00"),
    toleransi: 15,
  },
  {
    name: "Sesi 3: Refleksi & Evaluasi",
    startSessions: new Date("2026-09-11T20:00:00.000+07:00"),
    endSessions: new Date("2026-09-11T22:00:00.000+07:00"),
    toleransi: 15,
  },
];

export async function seedSessions(prisma: PrismaClient) {
  console.log("  🕒 Seeding m_sessions (Insert or Update)...");

  // 1. Soft-delete sesi usang yang tidak ada di daftar sesi resmi
  const validNames = sessionsData.map((s) => s.name);
  await prisma.session.updateMany({
    where: {
      name: { notIn: validNames },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  // 2. Upsert 3 sesi resmi kegiatan
  for (const item of sessionsData) {
    const existing = await prisma.session.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.session.update({
        where: { id: existing.id },
        data: {
          startSessions: item.startSessions,
          endSessions: item.endSessions,
          toleransi: item.toleransi,
          deletedAt: null,
        },
      });
    } else {
      await prisma.session.create({
        data: item,
      });
    }
  }

  console.log(`     ✅ Berhasil mengisi/memperbarui ${sessionsData.length} data resmi ke m_sessions.`);
}
