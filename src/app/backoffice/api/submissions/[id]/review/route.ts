import { NextResponse } from "next/server";
import { SubmissionModel } from "@/models";
import { prisma } from "@/utils/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { score, feedback, reviewedBy } = body;

    if (score === undefined || score === null || !reviewedBy) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak lengkap: score dan reviewedBy wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Validasi wewenang: Penilaian dan review tugas hanya boleh dilakukan oleh Admin / Panitia
    const reviewerUser = await prisma.user.findFirst({
      where: { id: Number(reviewedBy), deletedAt: null },
    });

    if (reviewerUser && reviewerUser.role === "mentor") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak: Penilaian dan review tugas hanya dapat dilakukan oleh Admin. Mentor hanya memiliki akses monitoring.",
        },
        { status: 403 }
      );
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Nilai (score) harus berupa angka antara 0 hingga 100.",
        },
        { status: 400 }
      );
    }

    const gradedSubmission = await SubmissionModel.gradeSubmission(Number(id), {
      score: numScore,
      feedback: feedback ? String(feedback).trim() : null,
      reviewedBy: Number(reviewedBy),
    });

    return NextResponse.json({
      success: true,
      message: `Tugas berhasil dinilai dengan skor ${numScore}.`,
      data: gradedSubmission,
    });
  } catch (error: any) {
    console.error("Error pada PATCH /api/submissions/[id]/review:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal menyimpan review/nilai tugas.",
      },
      { status: 400 }
    );
  }
}
