import { PrismaClient } from "@prisma/client";

export async function seedAttendances(prisma: PrismaClient) {
  console.log("  📝 Seeding t_attendances (Dynamic Attendance Linking)...");

  // 1. Bersihkan record presensi dari sesi yang sudah di-soft-delete atau usang
  await prisma.attendance.deleteMany({
    where: {
      session: {
        deletedAt: { not: null },
      },
    },
  });

  // 2. Cari sesi resmi kegiatan
  const sesi1 = await prisma.session.findFirst({
    where: { name: "Sesi 1: Apel Pagi & Cek Atribut", deletedAt: null },
  });
  const sesi2 = await prisma.session.findFirst({
    where: { name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)", deletedAt: null },
  });

  if (!sesi1 || !sesi2) {
    console.log("     ℹ️ Sesi kegiatan belum tersedia, lewati seeding presensi.");
    return;
  }

  // Cari maba dan mentor
  const mabaAditia = await prisma.user.findFirst({ where: { username: "302261001" } });
  const mabaNabila = await prisma.user.findFirst({ where: { username: "302261002" } });
  const mabaBagus = await prisma.user.findFirst({ where: { username: "302261006" } });

  const mabaRizky = await prisma.user.findFirst({ where: { username: "302261003" } });
  const mabaFajar = await prisma.user.findFirst({ where: { username: "302261005" } });
  const mabaSiti = await prisma.user.findFirst({ where: { username: "302261007" } });

  const mabaDewi = await prisma.user.findFirst({ where: { username: "302261004" } });
  const mabaAndi = await prisma.user.findFirst({ where: { username: "302261008" } });
  const mabaTri = await prisma.user.findFirst({ where: { username: "302261009" } });

  const mentorSarah = await prisma.user.findFirst({ where: { username: "mentor01" } });
  const mentorDimas = await prisma.user.findFirst({ where: { username: "mentor02" } });
  const mentorPutri = await prisma.user.findFirst({ where: { username: "mentor03" } });

  const attendances = [
    // === SESI 1: APEL PAGI & CEK ATRIBUT (SEMUA 9 MABA HADIR/TERLAMBAT) ===
    // Kelompok Sirius (Mentor Sarah)
    mabaAditia && {
      mabaId: mabaAditia.id,
      scannedBy: mentorSarah?.id,
      sessionsId: sesi1.id,
      groupsId: mabaAditia.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:45:00.000+07:00"),
    },
    mabaNabila && {
      mabaId: mabaNabila.id,
      scannedBy: mentorSarah?.id,
      sessionsId: sesi1.id,
      groupsId: mabaNabila.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:50:00.000+07:00"),
    },
    mabaBagus && {
      mabaId: mabaBagus.id,
      scannedBy: mentorSarah?.id,
      sessionsId: sesi1.id,
      groupsId: mabaBagus.mGroupsId,
      status: "Terlambat",
      scannedAt: new Date("2026-09-11T07:20:00.000+07:00"),
    },

    // Kelompok Vega (Mentor Dimas)
    mabaRizky && {
      mabaId: mabaRizky.id,
      scannedBy: mentorDimas?.id,
      sessionsId: sesi1.id,
      groupsId: mabaRizky.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:40:00.000+07:00"),
    },
    mabaFajar && {
      mabaId: mabaFajar.id,
      scannedBy: mentorDimas?.id,
      sessionsId: sesi1.id,
      groupsId: mabaFajar.mGroupsId,
      status: "Terlambat",
      scannedAt: new Date("2026-09-11T07:18:00.000+07:00"),
    },
    mabaSiti && {
      mabaId: mabaSiti.id,
      scannedBy: mentorDimas?.id,
      sessionsId: sesi1.id,
      groupsId: mabaSiti.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:55:00.000+07:00"),
    },

    // Kelompok Canopus (Mentor Putri)
    mabaDewi && {
      mabaId: mabaDewi.id,
      scannedBy: mentorPutri?.id,
      sessionsId: sesi1.id,
      groupsId: mabaDewi.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:42:00.000+07:00"),
    },
    mabaAndi && {
      mabaId: mabaAndi.id,
      scannedBy: mentorPutri?.id,
      sessionsId: sesi1.id,
      groupsId: mabaAndi.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:48:00.000+07:00"),
    },
    mabaTri && {
      mabaId: mabaTri.id,
      scannedBy: mentorPutri?.id,
      sessionsId: sesi1.id,
      groupsId: mabaTri.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T06:52:00.000+07:00"),
    },

    // === SESI 2: PENGENALAN KAMPUS (SESI AKTIF HARI INI) ===
    // Sirius: Aditia & Bagus sudah scan, Nabila belum scan
    mabaAditia && {
      mabaId: mabaAditia.id,
      scannedBy: mentorSarah?.id,
      sessionsId: sesi2.id,
      groupsId: mabaAditia.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:15:00.000+07:00"),
    },
    mabaBagus && {
      mabaId: mabaBagus.id,
      scannedBy: mentorSarah?.id,
      sessionsId: sesi2.id,
      groupsId: mabaBagus.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:25:00.000+07:00"),
    },

    // Vega: Rizky & Siti sudah scan, Fajar belum scan
    mabaRizky && {
      mabaId: mabaRizky.id,
      scannedBy: mentorDimas?.id,
      sessionsId: sesi2.id,
      groupsId: mabaRizky.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:10:00.000+07:00"),
    },
    mabaSiti && {
      mabaId: mabaSiti.id,
      scannedBy: mentorDimas?.id,
      sessionsId: sesi2.id,
      groupsId: mabaSiti.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:18:00.000+07:00"),
    },

    // Canopus: Dewi & Andi sudah scan, Tri belum scan
    mabaDewi && {
      mabaId: mabaDewi.id,
      scannedBy: mentorPutri?.id,
      sessionsId: sesi2.id,
      groupsId: mabaDewi.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:05:00.000+07:00"),
    },
    mabaAndi && {
      mabaId: mabaAndi.id,
      scannedBy: mentorPutri?.id,
      sessionsId: sesi2.id,
      groupsId: mabaAndi.mGroupsId,
      status: "Hadir",
      scannedAt: new Date("2026-09-11T08:12:00.000+07:00"),
    },
  ].filter(Boolean) as any[];

  let seededCount = 0;
  for (const item of attendances) {
    const existing = await prisma.attendance.findFirst({
      where: {
        mabaId: item.mabaId,
        sessionsId: item.sessionsId,
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: item.status,
          scannedBy: item.scannedBy,
          scannedAt: item.scannedAt,
        },
      });
    } else {
      await prisma.attendance.create({
        data: item,
      });
      seededCount++;
    }
  }

  console.log(`     ✅ Berhasil memproses data riwayat presensi ke t_attendances.`);
}
