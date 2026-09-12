import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

// Helper escape field CSV sesuai RFC 4180
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const groupId = searchParams.get("groupId");
    const statusFilter = searchParams.get("status");

    // 1. Ambil daftar sesi kegiatan
    const sessions = await prisma.session.findMany({
      where: {
        deletedAt: null,
        ...(sessionId ? { id: Number(sessionId) } : {}),
      },
      orderBy: { startSessions: "asc" },
    });

    // 2. Ambil seluruh data maba
    const mabaList = await prisma.user.findMany({
      where: {
        role: "maba",
        deletedAt: null,
        ...(groupId ? { mGroupsId: Number(groupId) } : {}),
      },
      include: {
        group: {
          include: {
            mentors: {
              where: { deletedAt: null },
              include: { user: true },
            },
          },
        },
        attendancesAsMaba: {
          where: {
            deletedAt: null,
            ...(sessionId ? { sessionsId: Number(sessionId) } : {}),
          },
          include: {
            session: true,
          },
        },
      },
      orderBy: [
        { mGroupsId: "asc" },
        { nama: "asc" },
      ],
    });

    // 3. Bangun baris data presensi (Cross join maba dengan sesi agar yang "Belum Hadir" tetap tercatat)
    const rows: string[] = [];

    // Header CSV
    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Program Studi",
      "Fakultas",
      "Kelompok",
      "Mentor Pendamping",
      "Sesi Kegiatan",
      "Jadwal Sesi",
      "Toleransi (Mnt)",
      "Waktu Scan Presensi",
      "Status Kehadiran",
    ];
    rows.push(headers.map(escapeCsv).join(","));

    let counter = 1;

    for (const maba of mabaList) {
      const groupName = maba.group?.name || "-";
      const mentorNames = maba.group?.mentors?.map((gm) => gm.user.nama).join("; ") || "-";

      for (const session of sessions) {
        // Cari apakah maba punya record kehadiran di sesi ini
        const attendance = maba.attendancesAsMaba.find((a) => a.sessionsId === session.id);

        const isSessionEnded = session.endSessions ? new Date() > new Date(session.endSessions) : false;
        let status = isSessionEnded ? "Tidak Hadir" : "Belum Hadir";
        let scanTime = "-";

        if (attendance) {
          status = attendance.status; // "Hadir", "Terlambat", "Izin", "Sakit"
          scanTime = new Date(attendance.createdAt).toLocaleString("id-ID", {
            dateStyle: "short",
            timeStyle: "medium",
          });
        }

        // Filter status jika diberikan
        if (statusFilter && statusFilter.toLowerCase() !== status.toLowerCase()) {
          continue;
        }

        const sessionSchedule = `${new Date(session.startSessions).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${new Date(session.endSessions).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        const row = [
          counter++,
          maba.nim || maba.username,
          maba.nama,
          maba.prodi || "-",
          maba.fakultas || "-",
          groupName,
          mentorNames,
          session.name,
          sessionSchedule,
          session.toleransi,
          scanTime,
          status,
        ];

        rows.push(row.map(escapeCsv).join(","));
      }
    }

    // 4. Buat output CSV dengan UTF-8 BOM (\uFEFF) agar Microsoft Excel langsung mengenali karakter UTF-8
    const csvContent = "\uFEFF" + rows.join("\r\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `rekap_presensi_silo_2026_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Export Attendance Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor data presensi.", error: error.message },
      { status: 500 }
    );
  }
}
