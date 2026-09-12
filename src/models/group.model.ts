import { prisma } from "@/utils/prisma";
import type { Group, Prisma } from "@prisma/client";

export interface GroupUpsertInput {
  id?: number;
  name: string;
  description?: string | null;
}

export class GroupModel {
  /**
   * Mengambil semua kelompok yang aktif (belum dihapus / deletedAt: null)
   */
  static async getAll(includeRelations = false) {
    return prisma.group.findMany({
      where: { deletedAt: null },
      include: includeRelations
        ? {
            mentors: { include: { user: true } },
            users: true,
          }
        : undefined,
      orderBy: { name: "asc" },
    });
  }

  /**
   * Mengambil kelompok berdasarkan ID
   */
  static async getById(id: number, includeRelations = true) {
    return prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: includeRelations
        ? {
            mentors: { include: { user: true } },
            users: true,
          }
        : undefined,
    });
  }

  /**
   * Mengambil kelompok berdasarkan nama
   */
  static async getByName(name: string) {
    return prisma.group.findFirst({
      where: { name, deletedAt: null },
    });
  }

  /**
   * Membuat kelompok baru
   */
  static async create(data: Prisma.GroupCreateInput): Promise<Group> {
    return prisma.group.create({
      data,
    });
  }

  /**
   * Mengupdate data kelompok
   */
  static async update(id: number, data: Prisma.GroupUpdateInput): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data,
    });
  }

  /**
   * Mekanisme INSERT OR UPDATE (Upsert) untuk kelompok:
   * - Jika ada id, akan mencari berdasarkan id.
   * - Jika tanpa id, akan mencari berdasarkan name.
   * - Jika ditemukan, data diupdate dan deletedAt di-reset ke null.
   * - Jika belum ada, dibuatkan data kelompok baru.
   */
  static async upsert(data: GroupUpsertInput): Promise<Group> {
    if (data.id) {
      return prisma.group.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          description: data.description,
          deletedAt: null,
        },
        create: {
          id: data.id,
          name: data.name,
          description: data.description,
        },
      });
    }

    // Cari kelompok berdasarkan nama jika id tidak diberikan
    const existing = await prisma.group.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      return prisma.group.update({
        where: { id: existing.id },
        data: {
          description: data.description,
          deletedAt: null,
        },
      });
    }

    return prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  /**
   * Melakukan insert or update (upsert) untuk banyak data kelompok sekaligus
   */
  static async upsertMany(items: GroupUpsertInput[]): Promise<Group[]> {
    const results: Group[] = [];
    for (const item of items) {
      const saved = await this.upsert(item);
      results.push(saved);
    }
    return results;
  }

  /**
   * Soft delete kelompok (mengisi deletedAt)
   */
  static async softDelete(id: number): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Mengembalikan kelompok yang terhapus (restore)
   */
  static async restore(id: number): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Hard delete kelompok
   */
  static async delete(id: number): Promise<Group> {
    return prisma.group.delete({
      where: { id },
    });
  }
}
