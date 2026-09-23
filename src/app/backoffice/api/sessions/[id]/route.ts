import { NextResponse } from "next/server";
import { SessionModel } from "@/models";
import { requireAdmin } from "@/utils/api-guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await SessionModel.getById(Number(id));

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi kegiatan tidak ditemukan." },
        { status: 404 }
      );
    }

    const type = session.attendanceType === "prodi" ? "prodi" : "grup";
    const keterangan = type === "prodi" ? "Prodi" : "Kelompok";

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        attendanceType: type,
        attendance_type: type,
        keterangan,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada GET /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data sesi.", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { name, toleransi } = body;
    const startSessions = body.startSessions || body.start_sessions;
    const endSessions = body.endSessions || body.end_sessions;

    const existing = await SessionModel.getById(Number(id));
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Sesi kegiatan tidak ditemukan." },
        { status: 404 }
      );
    }

    const rawAttType = body.attendance_type ?? body.attendanceType;
    const attendanceType = rawAttType !== undefined ? (rawAttType === "prodi" ? "prodi" : "grup") : undefined;

    const updated = await SessionModel.update(Number(id), {
      ...(name ? { name: String(name).trim() } : {}),
      ...(attendanceType ? { attendanceType } : {}),
      ...(startSessions ? { startSessions: new Date(startSessions) } : {}),
      ...(endSessions ? { endSessions: new Date(endSessions) } : {}),
      ...(toleransi !== undefined ? { toleransi: Number(toleransi) } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Sesi kegiatan berhasil diperbarui.",
      data: updated,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada PUT /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui sesi kegiatan.", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;

    const { id } = await params;
    const existing = await SessionModel.getById(Number(id));
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Sesi kegiatan tidak ditemukan." },
        { status: 404 }
      );
    }

    await SessionModel.softDelete(Number(id));

    return NextResponse.json({
      success: true,
      message: "Sesi kegiatan berhasil dinonaktifkan (soft delete).",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada DELETE /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus sesi kegiatan.", error: errorMessage },
      { status: 500 }
    );
  }
}
