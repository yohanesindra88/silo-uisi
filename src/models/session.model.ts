import { prisma } from "@/utils/prisma";
import type { Session, Prisma } from "@prisma/client";

export class SessionModel {
  /**
   * Mengambil semua sesi absensi/kegiatan yang aktif (deletedAt: null)
   */
  static async getAll() {
    return prisma.session.findMany({
      where: { deletedAt: null },
      orderBy: { startSessions: "asc" },
      include: {
        _count: {
          select: {
            attendances: {
              where: {
                deletedAt: null,
                maba: { deletedAt: null },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mengambil sesi yang sedang berlangsung atau belum berakhir
   */
  static async getActiveSessions(now: Date = new Date()) {
    return prisma.session.findMany({
      where: {
        deletedAt: null,
        endSessions: { gte: now },
      },
      orderBy: { startSessions: "asc" },
      include: {
        _count: {
          select: {
            attendances: {
              where: {
                deletedAt: null,
                maba: { deletedAt: null },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mengambil sesi berdasarkan ID
   */
  static async getById(id: number) {
    return prisma.session.findFirst({
      where: { id, deletedAt: null },
      include: {
        attendances: {
          where: { deletedAt: null },
          include: { maba: true },
        },
      },
    });
  }

  /**
   * Membuat sesi kegiatan baru
   */
  static async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return prisma.session.create({
      data,
    });
  }

  /**
   * Mengupdate sesi kegiatan
   */
  static async update(id: number, data: Prisma.SessionUpdateInput): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data,
    });
  }

  /**
   * Upsert sesi kegiatan (berdasarkan id jika ada, atau name)
   */
  static async upsert(data: {
    id?: number;
    name: string;
    startSessions: Date;
    endSessions: Date;
    toleransi?: number;
  }): Promise<Session> {
    if (data.id) {
      return prisma.session.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          startSessions: data.startSessions,
          endSessions: data.endSessions,
          toleransi: data.toleransi ?? 0,
          deletedAt: null,
        },
        create: {
          id: data.id,
          name: data.name,
          startSessions: data.startSessions,
          endSessions: data.endSessions,
          toleransi: data.toleransi ?? 0,
        },
      });
    }

    const existing = await prisma.session.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      return prisma.session.update({
        where: { id: existing.id },
        data: {
          startSessions: data.startSessions,
          endSessions: data.endSessions,
          toleransi: data.toleransi ?? 0,
          deletedAt: null,
        },
      });
    }

    return prisma.session.create({
      data: {
        name: data.name,
        startSessions: data.startSessions,
        endSessions: data.endSessions,
        toleransi: data.toleransi ?? 0,
      },
    });
  }

  /**
   * Soft delete sesi kegiatan
   */
  static async softDelete(id: number): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore sesi kegiatan yang terhapus
   */
  static async restore(id: number): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Menghapus permanen sesi kegiatan
   */
  static async delete(id: number): Promise<Session> {
    return prisma.session.delete({
      where: { id },
    });
  }
}
