import { prisma } from "@/utils/prisma";
import type { Submission, Prisma } from "@prisma/client";

export interface SubmissionUpsertInput {
  id?: number;
  assignmentId: number;
  mabaId: number;
  fileUrl: string;
  notes?: string | null;
  status?: "submitted" | "late" | "graded" | "resubmit" | string;
  score?: number | Prisma.Decimal | null;
  feedback?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: Date | null;
}

export interface SubmitAssignmentParams {
  assignmentId: number;
  mabaId: number;
  fileUrl: string;
  notes?: string | null;
  submitTime?: Date;
}

export interface GradeSubmissionParams {
  score: number;
  feedback?: string | null;
  reviewedBy: number;
}

export class SubmissionModel {
  /**
   * Mengambil semua pengumpulan tugas (filter opsional)
   */
  static async getAll(filter?: {
    assignmentId?: number;
    mabaId?: number;
    status?: string;
    groupId?: number;
  }) {
    return prisma.submission.findMany({
      where: {
        deletedAt: null,
        assignment: { deletedAt: null },
        maba: {
          deletedAt: null,
          ...(filter?.groupId ? { mGroupsId: filter.groupId } : {}),
        },
        ...(filter?.assignmentId ? { assignmentId: filter.assignmentId } : {}),
        ...(filter?.mabaId ? { mabaId: filter.mabaId } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      include: {
        assignment: true,
        maba: {
          select: {
            id: true,
            nama: true,
            nim: true,
            prodi: true,
            group: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * Mengambil submission berdasarkan ID
   */
  static async getById(id: number) {
    return prisma.submission.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignment: true,
        maba: {
          select: {
            id: true,
            nama: true,
            nim: true,
            prodi: true,
            group: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Mengambil submission berdasarkan Tugas dan Mahasiswa
   */
  static async getByAssignmentAndMaba(assignmentId: number, mabaId: number) {
    return prisma.submission.findFirst({
      where: {
        assignmentId,
        mabaId,
        deletedAt: null,
      },
      include: {
        assignment: true,
        reviewer: true,
      },
    });
  }

  /**
   * Logika Inti Submit Tugas Maba:
   * - Otomatis mendeteksi keterlambatan terhadap due_date
   * - Melakukan UPSERT (mencegah duplikasi data tugas)
   */
  static async submitWithDeadlineCheck(params: SubmitAssignmentParams) {
    const { assignmentId, mabaId, fileUrl, notes, submitTime = new Date() } = params;

    // 1. Cek keberadaan tugas
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, deletedAt: null },
    });

    if (!assignment) {
      throw new Error("Penugasan tidak ditemukan atau telah dihapus.");
    }

    // 2. Hitung keterlambatan
    const isLate = submitTime > assignment.dueDate;
    const status = isLate ? "late" : "submitted";

    // 3. Upsert ke t_submissions
    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_mabaId: {
          assignmentId,
          mabaId,
        },
      },
      update: {
        fileUrl,
        notes: notes ?? null,
        status,
        submittedAt: submitTime,
        deletedAt: null,
      },
      create: {
        assignmentId,
        mabaId,
        fileUrl,
        notes: notes ?? null,
        status,
        submittedAt: submitTime,
      },
      include: {
        assignment: true,
        maba: {
          select: {
            id: true,
            nama: true,
            nim: true,
            prodi: true,
            group: true,
          },
        },
      },
    });

    return {
      submission,
      isLate,
      status,
    };
  }

  /**
   * Logika Inti Penilaian & Review oleh Mentor/Admin
   */
  static async gradeSubmission(id: number, params: GradeSubmissionParams): Promise<Submission> {
    const { score, feedback, reviewedBy } = params;

    if (score < 0 || score > 100) {
      throw new Error("Nilai (score) harus berada dalam rentang 0 hingga 100.");
    }

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Data pengumpulan tugas (submission) tidak ditemukan.");
    }

    return prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback: feedback ?? null,
        reviewedBy,
        reviewedAt: new Date(),
        status: "graded",
      },
      include: {
        assignment: true,
        maba: true,
        reviewer: true,
      },
    });
  }

  /**
   * Mengambil daftar tugas mahasiswa binaan seorang mentor
   */
  static async getSubmissionsForMentor(mentorUserId: number, assignmentId?: number) {
    // 1. Dapatkan semua kelompok yang dibimbing mentor ini
    const mentorGroups = await prisma.groupMentor.findMany({
      where: {
        mUsersId: mentorUserId,
        deletedAt: null,
      },
      select: {
        mGroupsId: true,
      },
    });

    const groupIds = mentorGroups.map((g) => g.mGroupsId);

    const mentorUser = await prisma.user.findUnique({
      where: { id: mentorUserId },
      select: { mGroupsId: true },
    });
    if (mentorUser?.mGroupsId && !groupIds.includes(mentorUser.mGroupsId)) {
      groupIds.push(mentorUser.mGroupsId);
    }

    // 2. Ambil pengumpulan tugas maba dalam kelompok-kelompok tersebut
    return prisma.submission.findMany({
      where: {
        deletedAt: null,
        assignment: { deletedAt: null },
        maba: {
          deletedAt: null,
          mGroupsId: { in: groupIds },
        },
        ...(assignmentId ? { assignmentId } : {}),
      },
      include: {
        assignment: true,
        maba: {
          select: {
            id: true,
            nama: true,
            nim: true,
            prodi: true,
            group: true,
          },
        },
        reviewer: true,
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * Soft delete submission
   */
  static async softDelete(id: number): Promise<Submission> {
    return prisma.submission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore submission
   */
  static async restore(id: number): Promise<Submission> {
    return prisma.submission.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Hard delete submission
   */
  static async delete(id: number): Promise<Submission> {
    return prisma.submission.delete({
      where: { id },
    });
  }
}
