import { PrismaClient } from "@prisma/client";

/**
 * Seeder galeri dokumentasi.
 *
 * Data awal disalin persis dari array DOC_ITEMS yang dulu hardcoded di
 * src/app/components/DokumentasiGallery.tsx, supaya tampilan galeri identik
 * sebelum dan sesudah dipindah ke database.
 */
const DOC_ITEMS = [
  {
    imageUrl: "/dokumentasi/doc_1.webp",
    title: "Keseruan & Antusiasme Mahasiswa Baru SILO UISI 2025",
    tag: "Euforia Maba",
  },
  {
    imageUrl: "/dokumentasi/doc_3.webp",
    title: "Upacara Pembukaan Opening Ceremony SILO 2025",
    tag: "Upacara Utama",
  },
  {
    imageUrl: "/dokumentasi/doc_4.webp",
    title: "Penampilan Seni Budaya Reog Ponorogo",
    tag: "Seni Budaya",
  },
  {
    imageUrl: "/dokumentasi/doc_5.webp",
    title: "Partisipasi Aktif & Pembekalan Mahasiswa Baru",
    tag: "Materi Utama",
  },
  {
    imageUrl: "/dokumentasi/doc_6.webp",
    title: "Atraksi Pencak Silat & Banner Selamat Datang Maba",
    tag: "Atraksi & Seremonial",
  },
  {
    imageUrl: "/dokumentasi/doc_7.webp",
    title: "Sesi Pembagian Merchandise & Briefing Mahasiswa",
    tag: "Sesi Materi",
  },
  {
    imageUrl: "/dokumentasi/doc_8.webp",
    title: "Kebersamaan & Kekompakan Rasi Mahasiswa Baru",
    tag: "Kebersamaan Maba",
  },
  {
    imageUrl: "/dokumentasi/doc_9.webp",
    title: "Fun Games & Lempar Bola Outbound SILO 2025",
    tag: "Outbound Games",
  },
  {
    imageUrl: "/dokumentasi/doc_10.webp",
    title: "Sesi Kepemimpinan & Pengarahan Instruktur Outbound",
    tag: "Team Building",
  },
  {
    imageUrl: "/dokumentasi/doc_11.webp",
    title: "Sambutan Rektor UISI di Panggung Inagurasi Malam",
    tag: "Sambutan Rektor",
  },
  {
    imageUrl: "/dokumentasi/doc_12.webp",
    title: "Orasi & Arahan Kebangsaan Rektor UISI",
    tag: "Orasi Rektor",
  },
  {
    imageUrl: "/dokumentasi/doc_13.webp",
    title: "Simulasi & Pelatihan Lapangan Mahasiswa Baru",
    tag: "Simulasi Lapangan",
  },
];

export async function seedDocumentations(prisma: PrismaClient) {
  console.log("🖼️  Menjalankan seeder galeri dokumentasi...");

  for (const [index, item] of DOC_ITEMS.entries()) {
    const existing = await prisma.documentation.findFirst({
      where: { imageUrl: item.imageUrl },
    });

    if (existing) {
      await prisma.documentation.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          tag: item.tag,
          sortOrder: index,
          deletedAt: null,
        },
      });
      continue;
    }

    await prisma.documentation.create({
      data: { ...item, sortOrder: index },
    });
  }

  const total = await prisma.documentation.count({ where: { deletedAt: null } });
  console.log(`   ✅ Galeri dokumentasi siap (${total} item).`);
}
