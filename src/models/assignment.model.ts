import { prisma } from "@/utils/prisma";
import type { Assignment, Prisma } from "@prisma/client";

export interface AssignmentUpsertInput {
  id?: number;
  title: string;
  description?: string | null;
  attachmentUrl?: string | null;
  dueDate: Date;
  createdBy?: number | null;
}

export class AssignmentModel {
  /**
   * Mengambil semua tugas yang aktif (belum dihapus / deletedAt: null)
   */
  static async getAll(includeSubmissions = false) {
    return prisma.assignment.findMany({
      where: { deletedAt: null },
      include: {
        creator: true,
        submissions: includeSubmissions ? { where: { deletedAt: null } } : false,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });
  }

  /**
   * Mengambil tugas berdasarkan ID
   */
  static async getById(id: number, includeSubmissions = true) {
    return prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: true,
        submissions: includeSubmissions
          ? {
              where: { deletedAt: null },
              include: { maba: true, reviewer: true },
            }
          : false,
      },
    });
  }

  /**
   * Membuat tugas baru
   */
  static async create(data: Prisma.AssignmentCreateInput): Promise<Assignment> {
    return prisma.assignment.create({
      data,
    });
  }

  /**
   * Mengupdate data tugas
   */
  static async update(id: number, data: Prisma.AssignmentUpdateInput): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data,
    });
  }

  /**
   * Mekanisme INSERT OR UPDATE (Upsert) untuk tugas:
   * - Jika ada id, mencari berdasarkan id.
   * - Jika tanpa id, mencari berdasarkan judul (title).
   * - Jika sudah ada, data diperbarui (update).
   * - Jika belum ada, dibuatkan tugas baru (create).
   */
  static async upsert(data: AssignmentUpsertInput): Promise<Assignment> {
    if (data.id) {
      return prisma.assignment.upsert({
        where: { id: data.id },
        update: {
          title: data.title,
          description: data.description,
          attachmentUrl: data.attachmentUrl,
          dueDate: data.dueDate,
          createdBy: data.createdBy,
          deletedAt: null,
        },
        create: {
          id: data.id,
          title: data.title,
          description: data.description,
          attachmentUrl: data.attachmentUrl,
          dueDate: data.dueDate,
          createdBy: data.createdBy,
        },
      });
    }

    const existing = await prisma.assignment.findFirst({
      where: { title: data.title },
    });

    if (existing) {
      return prisma.assignment.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          attachmentUrl: data.attachmentUrl,
          dueDate: data.dueDate,
          createdBy: data.createdBy,
          deletedAt: null,
        },
      });
    }

    return prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        attachmentUrl: data.attachmentUrl,
        dueDate: data.dueDate,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * Bulk Upsert: Banyak tugas sekaligus
   */
  static async upsertMany(items: AssignmentUpsertInput[]): Promise<Assignment[]> {
    const results: Assignment[] = [];
    for (const item of items) {
      const saved = await this.upsert(item);
      results.push(saved);
    }
    return results;
  }

  /**
   * Soft delete tugas
   */
  static async softDelete(id: number): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore tugas yang terhapus
   */
  static async restore(id: number): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Hard delete tugas
   */
  static async delete(id: number): Promise<Assignment> {
    return prisma.assignment.delete({
      where: { id },
    });
  }
}
