import { NextResponse } from "next/server";
import { SessionModel } from "@/models";
import { normalizeAttendanceType, getAttendanceTypeLabel } from "@/config/attendance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    const sessions = onlyActive
      ? await SessionModel.getActiveSessions()
      : await SessionModel.getAll();

    const now = new Date();
    const normalizedSessions = sessions.map((s) => {
      const type = s.attendanceType === "prodi" ? "prodi" : "grup";
      const keterangan = type === "prodi" ? "Prodi" : "Kelompok";
      return {
        ...s,
        attendanceType: type,
        attendance_type: type,
        keterangan,
        startSessions: s.startSessions,
        start_sessions: s.startSessions ? new Date(s.startSessions).toISOString() : null,
        endSessions: s.endSessions,
        end_sessions: s.endSessions ? new Date(s.endSessions).toISOString() : null,
        is_active:
          s.startSessions && s.endSessions
            ? now >= new Date(s.startSessions) && now <= new Date(s.endSessions)
            : false,
      };
    });

    const finalSessions = onlyActive
      ? normalizedSessions.filter((s) => s.is_active)
      : normalizedSessions;

    return NextResponse.json({
      success: true,
      data: finalSessions,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada GET /api/sessions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar sesi kegiatan.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, toleransi } = body;
    const startSessions = body.startSessions || body.start_sessions;
    const endSessions = body.endSessions || body.end_sessions;

    if (!name || !startSessions || !endSessions) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak lengkap: name, startSessions, dan endSessions wajib diisi.",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startSessions);
    const endDate = new Date(endSessions);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Format tanggal atau waktu sesi tidak valid.",
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Waktu akhir sesi (endSessions) harus setelah waktu mulai (startSessions).",
        },
        { status: 400 }
      );
    }

    const rawType = body.attendance_type || body.attendanceType;
    const attendanceType = rawType === "prodi" ? "prodi" : "grup";

    const newSession = await SessionModel.create({
      name: String(name).trim(),
      attendanceType,
      startSessions: startDate,
      endSessions: endDate,
      toleransi: toleransi ? Number(toleransi) : 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Sesi kegiatan berhasil dibuat.",
        data: newSession,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada POST /api/sessions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat sesi kegiatan.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
