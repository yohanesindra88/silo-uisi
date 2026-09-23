import { NextResponse } from "next/server";
import { AssignmentModel } from "@/models";
import { requireAdmin } from "@/utils/api-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignment = await AssignmentModel.getById(Number(id), true);

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Penugasan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada GET /api/assignments/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data penugasan.", error: errorMessage },
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
    const { title, description, attachmentUrl, dueDate, attachment_url, due_date } = body;
    const finalAttachment = attachmentUrl !== undefined ? attachmentUrl : attachment_url;
    const finalDueDate = dueDate || due_date;

    const existing = await AssignmentModel.getById(Number(id), false);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Penugasan tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await AssignmentModel.update(Number(id), {
      ...(title ? { title: String(title).trim() } : {}),
      ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
      ...(finalAttachment !== undefined ? { attachmentUrl: finalAttachment ? String(finalAttachment).trim() : null } : {}),
      ...(finalDueDate ? { dueDate: new Date(finalDueDate) } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Penugasan berhasil diperbarui.",
      data: updated,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada PUT /api/assignments/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui penugasan.", error: errorMessage },
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
    const existing = await AssignmentModel.getById(Number(id), false);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Penugasan tidak ditemukan." },
        { status: 404 }
      );
    }

    await AssignmentModel.softDelete(Number(id));

    return NextResponse.json({
      success: true,
      message: "Penugasan berhasil dinonaktifkan (soft delete).",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Error pada DELETE /api/assignments/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus penugasan.", error: errorMessage },
      { status: 500 }
    );
  }
}
