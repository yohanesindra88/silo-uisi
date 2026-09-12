import { PrismaClient } from "@prisma/client";

export interface AssignmentSeedItem {
  id?: number;
  title: string;
  description?: string | null;
  attachmentUrl?: string | null;
  dueDate: Date;
  createdBy?: number | null; // ID user (role admin/panitia pembuat tugas)
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Data seeder untuk tabel: m_assignments (Daftar Tugas Orientasi)
 */
export const assignmentsData: AssignmentSeedItem[] = [
  {
    title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    description: "Tulis rangkuman esai 500 kata mengenai nilai-nilai luhur kepemimpinan, integritas, dan budaya kampus Universitas Internasional Semen Indonesia (UISI).",
    attachmentUrl: "https://drive.google.com/templates/panduan-resume-silo-2026",
    dueDate: new Date("2026-09-15T23:59:00.000Z"),
  },
  {
    title: "Tugas 2 - Mind Mapping Rencana Studi & Karir Unggul",
    description: "Rancang bagan mind mapping 4 tahun masa studi di UISI beserta target akademik, organisasi, dan sertifikasi keahlian.",
    attachmentUrl: "https://drive.google.com/templates/mindmap-karir-uisi",
    dueDate: new Date("2026-09-18T23:59:00.000Z"),
  },
  {
    title: "Tugas 3 - Twibbon & Video Perkenalan Diri SILO 2026",
    description: "Unggah link postingan video perkenalan dan twibbon resmi SILO 2026 ke akun Instagram/TikTok dengan hashtag #AetheraSILO2026 #UISIBangga.",
    attachmentUrl: "https://twibbonize.com/silo-uisi-2026",
    dueDate: new Date("2026-09-12T23:59:00.000Z"),
  },
];

export async function seedAssignments(prisma: PrismaClient) {
  console.log("  📋 Seeding m_assignments (Insert or Update)...");

  if (assignmentsData.length === 0) {
    console.log("     ℹ️ Data m_assignments masih kosong, dilewati.");
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: { in: ["admin", "panitia"] }, deletedAt: null },
  });
  const creatorId = admin?.id || null;

  for (const item of assignmentsData) {
    const existing = await prisma.assignment.findFirst({
      where: { title: item.title },
    });

    if (existing) {
      await prisma.assignment.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          attachmentUrl: item.attachmentUrl,
          dueDate: item.dueDate,
          createdBy: item.createdBy || creatorId,
          deletedAt: null,
        },
      });
    } else {
      await prisma.assignment.create({
        data: {
          ...(item.id ? { id: item.id } : {}),
          title: item.title,
          description: item.description,
          attachmentUrl: item.attachmentUrl,
          dueDate: item.dueDate,
          createdBy: item.createdBy || creatorId,
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          deletedAt: item.deletedAt ?? undefined,
        },
      });
    }
  }

  console.log(`     ✅ Berhasil memproses ${assignmentsData.length} data ke m_assignments (insert/update).`);
}
