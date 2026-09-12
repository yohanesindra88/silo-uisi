import { NextResponse } from "next/server";
import { AssignmentModel } from "@/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeSubmissions = searchParams.get("includeSubmissions") === "true";

    const assignments = await AssignmentModel.getAll(includeSubmissions);

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/assignments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar penugasan.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, attachmentUrl, dueDate, createdBy } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak lengkap: title dan dueDate wajib diisi.",
        },
        { status: 400 }
      );
    }

    const newAssignment = await AssignmentModel.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      attachmentUrl: attachmentUrl ? String(attachmentUrl).trim() : null,
      dueDate: new Date(dueDate),
      creator: createdBy ? { connect: { id: Number(createdBy) } } : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Penugasan baru berhasil dibuat.",
        data: newAssignment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error pada POST /api/assignments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat penugasan.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
