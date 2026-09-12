import { prisma } from "@/utils/prisma";
import type { GroupMentor } from "@prisma/client";

export class GroupMentorModel {
  /**
   * Menugaskan mentor ke kelompok tertentu
   */
  static async assignMentor(mGroupsId: number, mUsersId: number): Promise<GroupMentor> {
    return prisma.groupMentor.upsert({
      where: {
        mGroupsId_mUsersId: {
          mGroupsId,
          mUsersId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        mGroupsId,
        mUsersId,
      },
    });
  }

  /**
   * Soft delete penugasan mentor dari kelompok
   */
  static async removeMentor(mGroupsId: number, mUsersId: number): Promise<GroupMentor> {
    return prisma.groupMentor.update({
      where: {
        mGroupsId_mUsersId: {
          mGroupsId,
          mUsersId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore relasi mentor kelompok yang terhapus
   */
  static async restoreMentor(mGroupsId: number, mUsersId: number): Promise<GroupMentor> {
    return prisma.groupMentor.update({
      where: {
        mGroupsId_mUsersId: {
          mGroupsId,
          mUsersId,
        },
      },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Hard delete relasi mentor kelompok
   */
  static async hardDelete(mGroupsId: number, mUsersId: number): Promise<GroupMentor> {
    return prisma.groupMentor.delete({
      where: {
        mGroupsId_mUsersId: {
          mGroupsId,
          mUsersId,
        },
      },
    });
  }

  /**
   * Mengambil semua mentor aktif untuk suatu kelompok
   */
  static async getMentorsByGroup(mGroupsId: number) {
    return prisma.groupMentor.findMany({
      where: { mGroupsId, deletedAt: null },
      include: {
        user: true,
      },
    });
  }

  /**
   * Mengambil semua kelompok aktif yang dimentori oleh seorang user
   */
  static async getGroupsByMentor(mUsersId: number) {
    return prisma.groupMentor.findMany({
      where: { mUsersId, deletedAt: null },
      include: {
        group: true,
      },
    });
  }
}
