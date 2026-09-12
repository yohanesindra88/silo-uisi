import { NextRequest, NextResponse } from "next/server";
import { AttendanceModel } from "@/models";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/utils/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionsId = searchParams.get("sessionId");
    const groupsId = searchParams.get("groupId");
    const mabaId = searchParams.get("mabaId");
    const scannedBy = searchParams.get("scannedBy");
    const status = searchParams.get("status");

    const attendances = await AttendanceModel.getAll({
      sessionsId: sessionsId ? Number(sessionsId) : undefined,
      groupsId: groupsId ? Number(groupsId) : undefined,
      mabaId: mabaId ? Number(mabaId) : undefined,
      scannedBy: scannedBy ? Number(scannedBy) : undefined,
      status: status || undefined,
    });

    const summary = {
      total: attendances.length,
      hadir: attendances.filter((a) => a.status === "Hadir").length,
      terlambat: attendances.filter((a) => a.status === "Terlambat").length,
      izin: attendances.filter((a) => a.status === "Izin").length,
      sakit: attendances.filter((a) => a.status === "Sakit").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      data: attendances,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data riwayat presensi.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const qrToken = body.qrToken || body.qr_token;
    const sessionId = body.sessionId || body.session_id;
    let scannedBy = body.scannedBy || body.scanned_by;
    const allowOutsideSchedule = body.allowOutsideSchedule ?? body.allow_outside_schedule ?? false;

    if (!qrToken || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "Data tidak lengkap: QR Token dan ID Sesi wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!scannedBy) {
      try {
        const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
        if (token) {
          const decoded = await verifyJwt(token);
          if (decoded && decoded.id) {
            scannedBy = decoded.id;
          }
        }
      } catch {}
    }

    const result = await AttendanceModel.scanAndRecord({
      qrToken: String(qrToken).trim(),
      sessionId: Number(sessionId),
      scannedBy: scannedBy ? Number(scannedBy) : undefined,
      allowOutsideSchedule: Boolean(allowOutsideSchedule),
    });

    if (!result.success) {
      const statusMap: Record<string, number> = {
        USER_NOT_FOUND: 404,
        SESSION_NOT_FOUND: 404,
        SESSION_NOT_STARTED: 400,
        SESSION_ENDED: 400,
        ALREADY_ATTENDED: 409,
      };

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          message: result.message,
          data: result.data,
        },
        { status: statusMap[result.code] || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        code: result.code,
        message: result.message,
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error pada POST /api/attendance:", error);
    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",
        message: "Terjadi kesalahan internal server saat memproses presensi.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
