import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Data seeder untuk tabel: m_groups (mendukung mekanisme insert or update)
 * Silakan tambahkan data kelompok pada array di bawah ini.
 *
 * Contoh:
 * {
 *   name: "Kelompok 01",
 *   description: "Cluster Andromeda",
 * }
 */
export const groupsData: Prisma.GroupCreateInput[] = [
  { name: "Kelompok 01 - Sirius", description: "Cluster Gugus Bintang Sirius" },
  { name: "Kelompok 02 - Vega", description: "Cluster Gugus Bintang Vega" },
  { name: "Kelompok 03 - Canopus", description: "Cluster Gugus Bintang Canopus" },
];


export async function seedGroups(prisma: PrismaClient) {
  console.log("  📦 Seeding m_groups (Insert or Update)...");

  if (groupsData.length === 0) {
    console.log("     ℹ️ Data m_groups masih kosong, dilewati.");
    return;
  }

  for (const item of groupsData) {
    // Cek apakah kelompok dengan nama ini sudah ada
    const existing = await prisma.group.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      // UPDATE jika sudah ada
      await prisma.group.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          deletedAt: null,
        },
      });
    } else {
      // INSERT jika belum ada
      await prisma.group.create({
        data: item,
      });
    }
  }

  console.log(`✅ Berhasil memproses ${groupsData.length} data ke m_groups (insert/update).`);
}
