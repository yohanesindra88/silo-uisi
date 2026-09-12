import { NextResponse } from "next/server";
import { SessionModel } from "@/models";

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

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data sesi.", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const updated = await SessionModel.update(Number(id), {
      ...(name ? { name: String(name).trim() } : {}),
      ...(startSessions ? { startSessions: new Date(startSessions) } : {}),
      ...(endSessions ? { endSessions: new Date(endSessions) } : {}),
      ...(toleransi !== undefined ? { toleransi: Number(toleransi) } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Sesi kegiatan berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error pada PUT /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui sesi kegiatan.", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error: any) {
    console.error("Error pada DELETE /api/sessions/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus sesi kegiatan.", error: error.message },
      { status: 500 }
    );
  }
}
