import { NextRequest, NextResponse } from "next/server";
import { AttendanceModel } from "@/models";
import { verifyJwt, AUTH_COOKIE_NAME } from "@/utils/auth";

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

    // Ekstrak ID mentor yang memindai dari session cookie jika belum ada
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
    console.error("Error pada /api/attendance/scan:", error);
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
