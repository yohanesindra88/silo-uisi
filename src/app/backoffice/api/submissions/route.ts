import { NextResponse } from "next/server";
import { SubmissionModel } from "@/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const mabaId = searchParams.get("mabaId");
    const groupId = searchParams.get("groupId");
    const mentorId = searchParams.get("mentorId");
    const status = searchParams.get("status");

    let submissions;

    if (mentorId) {
      // Jika mentor merequest, ambil khusus maba sekelompok mentor tersebut
      submissions = await SubmissionModel.getSubmissionsForMentor(
        Number(mentorId),
        assignmentId ? Number(assignmentId) : undefined
      );
    } else {
      submissions = await SubmissionModel.getAll({
        assignmentId: assignmentId ? Number(assignmentId) : undefined,
        mabaId: mabaId ? Number(mabaId) : undefined,
        groupId: groupId ? Number(groupId) : undefined,
        status: status || undefined,
      });
    }

    const summary = {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === "submitted").length,
      late: submissions.filter((s) => s.status === "late").length,
      graded: submissions.filter((s) => s.status === "graded").length,
      resubmit: submissions.filter((s) => s.status === "resubmit").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      data: submissions,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/submissions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengumpulan tugas.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignmentId, mabaId, fileUrl, notes } = body;

    if (!assignmentId || !mabaId || !fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak lengkap: assignmentId, mabaId, dan fileUrl wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Nilai ini nantinya dirender mentor/admin ke dalam <a href>. Tanpa
    // pembatasan skema, tautan "javascript:" atau "data:text/html" yang
    // dikirim seorang maba menjadi stored XSS terhadap sesi admin. Validasi
    // type="url" di sisi klien bisa dilewati dengan satu baris fetch.
    const trimmedFileUrl = String(fileUrl).trim();
    const isAllowedUrl =
      /^https?:\/\//i.test(trimmedFileUrl) || /^\/media\/uploads\//.test(trimmedFileUrl);

    if (!isAllowedUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Format tautan tidak valid. Gunakan tautan http(s) atau unggah berkas.",
        },
        { status: 400 }
      );
    }

    const result = await SubmissionModel.submitWithDeadlineCheck({
      assignmentId: Number(assignmentId),
      mabaId: Number(mabaId),
      fileUrl: trimmedFileUrl,
      notes: notes ? String(notes).trim() : null,
    });

    const statusMessage = result.isLate
      ? "Tugas berhasil dikumpulkan, namun tercatat TERLAMBAT (melewati batas waktu due_date)."
      : "Tugas berhasil dikumpulkan tepat waktu.";

    return NextResponse.json(
      {
        success: true,
        message: statusMessage,
        isLate: result.isLate,
        status: result.status,
        data: result.submission,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error pada POST /api/submissions:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal mengumpulkan tugas.",
      },
      { status: 400 }
    );
  }
}
