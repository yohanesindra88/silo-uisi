import { PrismaClient, Prisma } from "@prisma/client";

export interface SubmissionSeedItem {
  id?: number;
  assignmentId: number; // ID tugas dari tabel m_assignments
  mabaId: number;       // ID mahasiswa (role maba) dari tabel m_users
  fileUrl: string;      // URL file / link Drive / Docs
  notes?: string | null;
  status?: "submitted" | "late" | "graded" | "resubmit" | string;
  score?: number | Prisma.Decimal | null;
  feedback?: string | null;
  reviewedBy?: number | null; // ID user (mentor/panitia penilai)
  reviewedAt?: Date | null;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const submissionsData: SubmissionSeedItem[] = [];

export async function seedSubmissions(prisma: PrismaClient) {
  console.log("  📤 Seeding t_submissions (Insert or Update)...");

  // Cari tugas dan maba secara dinamis
  const tugas1 = await prisma.assignment.findFirst({ where: { title: { contains: "Resume" } } });
  const tugas2 = await prisma.assignment.findFirst({ where: { title: { contains: "Mind Mapping" } } });
  const tugas3 = await prisma.assignment.findFirst({ where: { title: { contains: "Twibbon" } } });

  const mabaAditia = await prisma.user.findFirst({ where: { username: "302261001" } });
  const mabaNabila = await prisma.user.findFirst({ where: { username: "302261002" } });
  const mabaRizky = await prisma.user.findFirst({ where: { username: "302261003" } });
  const mabaDewi = await prisma.user.findFirst({ where: { username: "302261004" } });
  const mabaFajar = await prisma.user.findFirst({ where: { username: "302261005" } });
  const mabaBagus = await prisma.user.findFirst({ where: { username: "302261006" } });
  const mabaSiti = await prisma.user.findFirst({ where: { username: "302261007" } });
  const mabaAndi = await prisma.user.findFirst({ where: { username: "302261008" } });
  const mabaTri = await prisma.user.findFirst({ where: { username: "302261009" } });

  const mentorSarah = await prisma.user.findFirst({ where: { username: "mentor01" } });
  const mentorDimas = await prisma.user.findFirst({ where: { username: "mentor02" } });
  const mentorPutri = await prisma.user.findFirst({ where: { username: "mentor03" } });

  const dynamicItems: SubmissionSeedItem[] = [];

  // 1. TUGAS 1 - Resume Nilai-Nilai SILO UISI
  if (tugas1) {
    if (mabaAditia) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaAditia.id,
        fileUrl: "https://docs.google.com/document/d/1Aditia-Pratama-Resume-SILO-2026",
        notes: "Berikut resume materi nilai-nilai orientasi kampus UISI oleh Aditia Pratama.",
        status: "graded",
        score: 92,
        feedback: "Pemahaman materi nilai-nilai SILO sangat komprehensif, runtut, dan aplikatif. Pertahankan prestasinya!",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-08T14:30:00.000Z"),
        submittedAt: new Date("2026-09-07T10:15:00.000Z"),
      });
    }

    if (mabaNabila) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaNabila.id,
        fileUrl: "https://docs.google.com/document/d/1Nabila-Rahma-Resume-SILO-2026",
        notes: "Tugas resume nilai kampus UISI sudah selesai disusun.",
        status: "graded",
        score: 88,
        feedback: "Resume disusun dengan rapi dan mendalam. Contoh implementasi nilai integritas di dunia perkuliahan sangat kontekstual.",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-08T15:00:00.000Z"),
        submittedAt: new Date("2026-09-07T11:45:00.000Z"),
      });
    }

    if (mabaBagus) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaBagus.id,
        fileUrl: "https://drive.google.com/file/d/1Bagus-Setiawan-Resume-Sirius",
        notes: "Resume materi orientasi dan budaya integritas UISI.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-08T11:30:00.000Z"),
      });
    }

    if (mabaRizky) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaRizky.id,
        fileUrl: "https://drive.google.com/file/d/1Rizky-Firmansyah-Resume",
        notes: "Mohon maaf terlambat mengumpulkan karena kendala teknis jaringan.",
        status: "graded",
        score: 80,
        feedback: "Analisis nilai kearifan lokal UISI sudah bagus. Catatan: perhatikan ketepatan waktu pengumpulan ke depannya.",
        reviewedBy: mentorDimas?.id || null,
        reviewedAt: new Date("2026-09-08T16:15:00.000Z"),
        submittedAt: new Date("2026-09-08T09:20:00.000Z"),
      });
    }

    if (mabaFajar) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaFajar.id,
        fileUrl: "https://drive.google.com/file/d/1Fajar-Nugraha-Resume-Vega",
        notes: "Pengumpulan tugas resume nilai orientasi SILO 2026 oleh Fajar Nugraha (Kelompok Vega).",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-07T14:10:00.000Z"),
      });
    }

    if (mabaSiti) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaSiti.id,
        fileUrl: "https://docs.google.com/document/d/1Siti-Aisyah-Resume-Vega",
        notes: "Resume materi kepemimpinan dan integritas UISI 2026.",
        status: "graded",
        score: 90,
        feedback: "Kajian nilai-nilai SILO sangat baik dan ditulis dengan sistematis.",
        reviewedBy: mentorDimas?.id || null,
        reviewedAt: new Date("2026-09-08T17:00:00.000Z"),
        submittedAt: new Date("2026-09-07T16:20:00.000Z"),
      });
    }

    if (mabaAndi) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaAndi.id,
        fileUrl: "https://drive.google.com/file/d/1Andi-Wijaya-Resume-Canopus",
        notes: "Tugas 1 resume nilai-nilai SILO UISI.",
        status: "graded",
        score: 85,
        feedback: "Penjelasan nilai integritas sangat jelas dan relevan.",
        reviewedBy: mentorPutri?.id || null,
        reviewedAt: new Date("2026-09-08T18:00:00.000Z"),
        submittedAt: new Date("2026-09-07T15:00:00.000Z"),
      });
    }

    if (mabaTri) {
      dynamicItems.push({
        assignmentId: tugas1.id,
        mabaId: mabaTri.id,
        fileUrl: "https://docs.google.com/document/d/1Tri-Kurniawan-Resume-Canopus",
        notes: "Resume lengkap materi pengenalan nilai dan budaya kampus.",
        status: "graded",
        score: 92,
        feedback: "Analisis nilai kepemimpinan dan budaya inovasi UISI sangat mendalam.",
        reviewedBy: mentorPutri?.id || null,
        reviewedAt: new Date("2026-09-08T18:30:00.000Z"),
        submittedAt: new Date("2026-09-07T12:00:00.000Z"),
      });
    }
  }

  // 2. TUGAS 2 - Mind Mapping Rencana Studi & Karir Unggul
  if (tugas2) {
    if (mabaAditia) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaAditia.id,
        fileUrl: "https://drive.google.com/file/d/1Aditia-MindMap-Karir-SILO",
        notes: "Mind map rencana studi 8 semester dan rencana karier di bidang Sistem Informasi.",
        status: "graded",
        score: 95,
        feedback: "Visualisasi peta pemikiran luar biasa kreatif dan terstruktur! Roadmap target semester dan karier unggul sangat jelas.",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-09T10:00:00.000Z"),
        submittedAt: new Date("2026-09-08T13:00:00.000Z"),
      });
    }

    if (mabaNabila) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaNabila.id,
        fileUrl: "https://drive.google.com/file/d/1Nabila-MindMap-Informatika",
        notes: "Rencana studi 4 tahun dan target karir Software Engineer.",
        status: "graded",
        score: 88,
        feedback: "Rencana studi 4 tahun tertata rapi dan sasaran sertifikasi sangat relevan.",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-09T10:30:00.000Z"),
        submittedAt: new Date("2026-09-08T14:00:00.000Z"),
      });
    }

    if (mabaBagus) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaBagus.id,
        fileUrl: "https://drive.google.com/file/d/1Bagus-MindMap-Logistik",
        notes: "Mind map rencana studi Teknik Logistik UISI.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-08T16:00:00.000Z"),
      });
    }

    if (mabaRizky) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaRizky.id,
        fileUrl: "https://drive.google.com/file/d/1Rizky-MindMap-Akuntansi-SILO",
        notes: "Rancangan target akademik dan karier profesi Akuntan Publik.",
        status: "graded",
        score: 85,
        feedback: "Rencana studi 4 tahun tersusun rapi dengan target sertifikasi profesi bidang akuntansi & manajemen keuangan.",
        reviewedBy: mentorDimas?.id || null,
        reviewedAt: new Date("2026-09-09T11:20:00.000Z"),
        submittedAt: new Date("2026-09-08T15:30:00.000Z"),
      });
    }

    if (mabaDewi) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaDewi.id,
        fileUrl: "https://drive.google.com/file/d/1Dewi-Canopus-MindMap-SILO",
        notes: "Berikut rancangan rencana studi 4 tahun di Manajemen UISI oleh Dewi Lestari.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-08T18:00:00.000Z"),
      });
    }

    if (mabaAndi) {
      dynamicItems.push({
        assignmentId: tugas2.id,
        mabaId: mabaAndi.id,
        fileUrl: "https://drive.google.com/file/d/1Andi-MindMap-Canopus",
        notes: "Mind map masa studi dan karir Teknik Informatika.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-08T19:00:00.000Z"),
      });
    }
  }

  // 3. TUGAS 3 - Twibbon & Video Perkenalan Diri SILO 2026
  if (tugas3) {
    if (mabaAditia) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaAditia.id,
        fileUrl: "https://www.instagram.com/reel/aditia_silo2026",
        notes: "Postingan twibbon dan video perkenalan Gugus Sirius.",
        status: "graded",
        score: 90,
        feedback: "Video perkenalan diri sangat komunikatif, enerjik, dan pemakaian atribut twibbon sesuai panduan panitia.",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-07T16:45:00.000Z"),
        submittedAt: new Date("2026-09-06T13:00:00.000Z"),
      });
    }

    if (mabaNabila) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaNabila.id,
        fileUrl: "https://www.instagram.com/p/nabila_silo2026",
        notes: "Twibbon dan video perkenalan Gugus Sirius - Nabila Rahma.",
        status: "graded",
        score: 92,
        feedback: "Twibbon dan video perkenalan sangat kreatif dan sesuai format resmi panitia.",
        reviewedBy: mentorSarah?.id || null,
        reviewedAt: new Date("2026-09-07T17:15:00.000Z"),
        submittedAt: new Date("2026-09-06T14:30:00.000Z"),
      });
    }

    if (mabaRizky) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaRizky.id,
        fileUrl: "https://www.instagram.com/reel/rizky_silo2026",
        notes: "Postingan video perkenalan Gugus Vega.",
        status: "graded",
        score: 88,
        feedback: "Video perkenalan informatif dan antusias.",
        reviewedBy: mentorDimas?.id || null,
        reviewedAt: new Date("2026-09-07T18:00:00.000Z"),
        submittedAt: new Date("2026-09-06T15:00:00.000Z"),
      });
    }

    if (mabaDewi) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaDewi.id,
        fileUrl: "https://www.instagram.com/p/dewi_canopus_silo2026",
        notes: "Twibbon resmi kelompok Canopus - Dewi Lestari.",
        status: "late",
        score: 76,
        feedback: "Twibbon sudah terpasang dengan baik. Pengumpulan terlambat dari batas waktu yang ditetapkan panitia.",
        reviewedBy: mentorPutri?.id || null,
        reviewedAt: new Date("2026-09-09T09:00:00.000Z"),
        submittedAt: new Date("2026-09-08T16:00:00.000Z"),
      });
    }

    if (mabaFajar) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaFajar.id,
        fileUrl: "https://www.tiktok.com/@fajar_silo2026/video/intro",
        notes: "Video perkenalan diri dan motivasi kuliah di Teknik Logistik UISI.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-07T08:30:00.000Z"),
      });
    }

    if (mabaSiti) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaSiti.id,
        fileUrl: "https://www.instagram.com/p/siti_silo2026",
        notes: "Video perkenalan dan twibbon resmi SILO 2026 oleh Siti Aisyah.",
        status: "graded",
        score: 88,
        feedback: "Konten video menarik dan penggunaan twibbon rapi.",
        reviewedBy: mentorDimas?.id || null,
        reviewedAt: new Date("2026-09-07T19:00:00.000Z"),
        submittedAt: new Date("2026-09-06T16:00:00.000Z"),
      });
    }

    if (mabaTri) {
      dynamicItems.push({
        assignmentId: tugas3.id,
        mabaId: mabaTri.id,
        fileUrl: "https://www.instagram.com/reel/tri_canopus_silo2026",
        notes: "Video perkenalan diri SILO 2026 Gugus Canopus.",
        status: "submitted",
        score: null,
        feedback: null,
        submittedAt: new Date("2026-09-07T17:00:00.000Z"),
      });
    }
  }

  for (const item of dynamicItems) {
    await prisma.submission.upsert({
      where: {
        assignmentId_mabaId: {
          assignmentId: item.assignmentId,
          mabaId: item.mabaId,
        },
      },
      update: {
        fileUrl: item.fileUrl,
        notes: item.notes,
        status: item.status || "submitted",
        score: item.score,
        feedback: item.feedback,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt,
        deletedAt: null,
      },
      create: {
        assignmentId: item.assignmentId,
        mabaId: item.mabaId,
        fileUrl: item.fileUrl,
        notes: item.notes,
        status: item.status || "submitted",
        score: item.score,
        feedback: item.feedback,
        reviewedBy: item.reviewedBy,
        reviewedAt: item.reviewedAt,
        submittedAt: item.submittedAt ?? new Date(),
      },
    });
  }

  console.log(`     ✅ Berhasil memproses ${dynamicItems.length} data pengumpulan tugas ke t_submissions.`);
}
