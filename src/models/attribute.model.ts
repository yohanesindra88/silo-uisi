import { prisma } from "@/utils/prisma";
import type { Attribute, AttributeCheck, Prisma } from "@prisma/client";

export interface AttributeFilterInput {
  targetDate?: string | Date;
  type?: "individu" | "kelompok" | string;
}

export interface AttributeCheckBatchItem {
  attributeId: number;
  mabaId?: number | null;
  groupId?: number | null;
  isBrought: boolean;
  notes?: string | null;
}

export class AttributeModel {
  /**
   * Helper parsing string YYYY-MM-DD menjadi objek Date murni (UTC midnight)
   */
  static parseTargetDate(dateInput?: string | Date): Date | undefined {
    if (!dateInput) return undefined;
    if (dateInput instanceof Date) return dateInput;

    const trimmed = String(dateInput).trim();
    if (!trimmed) return undefined;

    // Format YYYY-MM-DD
    const parts = trimmed.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0));
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  /**
   * Mengambil semua master atribut yang belum dihapus (deletedAt: null)
   */
  static async getAll(filter?: AttributeFilterInput) {
    const where: Prisma.AttributeWhereInput = {
      deletedAt: null,
    };

    if (filter?.targetDate) {
      const parsedDate = this.parseTargetDate(filter.targetDate);
      if (parsedDate) {
        where.targetDate = parsedDate;
      }
    }

    if (filter?.type && filter.type !== "all") {
      where.type = filter.type;
    }

    return prisma.attribute.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
      orderBy: [
        { targetDate: "asc" },
        { type: "asc" },
        { id: "asc" },
      ],
    });
  }

  /**
   * Mengambil detail atribut berdasarkan ID
   */
  static async getById(id: number) {
    return prisma.attribute.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: {
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
   * Membuat master atribut baru
   */
  static async create(data: {
    name: string;
    description?: string | null;
    targetDate: string | Date;
    type: string;
    createdBy?: number | null;
  }): Promise<Attribute> {
    const parsedDate = this.parseTargetDate(data.targetDate) || new Date();

    return prisma.attribute.create({
      data: {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        targetDate: parsedDate,
        type: data.type || "individu",
        createdBy: data.createdBy || null,
      },
    });
  }

  /**
   * Memperbarui master atribut
   */
  static async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      targetDate?: string | Date;
      type?: string;
    }
  ): Promise<Attribute> {
    const updateData: Prisma.AttributeUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }
    if (data.targetDate !== undefined) {
      const parsed = this.parseTargetDate(data.targetDate);
      if (parsed) updateData.targetDate = parsed;
    }
    if (data.type !== undefined) updateData.type = data.type;

    return prisma.attribute.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Menghapus master atribut (soft delete)
   */
  static async delete(id: number, hardDelete = false) {
    if (hardDelete) {
      return prisma.attribute.delete({
        where: { id },
      });
    }
    return prisma.attribute.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Mentor mengambil data mahasiswa binaan dan status checklist atribut pada tanggal yang dipilih
   */
  static async getMentorCheckData(
    mentorId: number,
    targetDateStr: string,
    filterGroupId?: number,
    userRole: string = "mentor"
  ) {
    const parsedDate = this.parseTargetDate(targetDateStr) || new Date();

    // 1. Ambil kelompok-kelompok yang dimentori oleh user ini
    const mentorGroups = await prisma.groupMentor.findMany({
      where: {
        mUsersId: mentorId,
        deletedAt: null,
      },
      include: {
        group: true,
      },
      orderBy: {
        group: { name: "asc" },
      },
    });

    let groupIds = mentorGroups.map((mg) => mg.mGroupsId);

    // Jika Admin/Panitia mengakses fitur ini, tampilkan seluruh kelompok
    if (userRole === "admin" || userRole === "panitia") {
      const allGroups = await prisma.group.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });
      groupIds = allGroups.map((g) => g.id);
    } else {
      // Jika Mentor tetapi belum memiliki kelompok binaan yang ditugaskan
      if (groupIds.length === 0) {
        return {
          targetDate: targetDateStr,
          groups: [],
          selectedGroupId: null,
          attributes: {
            all: [],
            individu: [],
            kelompok: [],
          },
          mabaList: [],
          groupChecks: [],
        };
      }
    }

    // Jika difilter spesifik satu kelompok (hanya jika ada di groupIds yang diizinkan)
    const targetGroupIds = filterGroupId && groupIds.includes(filterGroupId)
      ? [filterGroupId]
      : groupIds;

    // 2. Ambil seluruh maba pada kelompok tersebut
    const mabaList = await prisma.user.findMany({
      where: {
        mGroupsId: { in: targetGroupIds },
        role: "maba",
        deletedAt: null,
      },
      select: {
        id: true,
        nama: true,
        nim: true,
        username: true,
        mGroupsId: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { mGroupsId: "asc" },
        { nama: "asc" },
      ],
    });

    // 3. Ambil master atribut untuk targetDate ini
    const attributes = await prisma.attribute.findMany({
      where: {
        targetDate: parsedDate,
        deletedAt: null,
      },
      orderBy: [
        { type: "asc" },
        { id: "asc" },
      ],
    });

    const individuAttrs = attributes.filter((a: Attribute) => a.type === "individu");
    const kelompokAttrs = attributes.filter((a: Attribute) => a.type === "kelompok");
    const allAttrIds = attributes.map((a: Attribute) => a.id);

    // 4. Ambil catatan pengecekan yang sudah ada di t_attribute_checks (hanya yang diperiksa mentor/admin/panitia)
    let existingChecks: AttributeCheck[] = [];
    if (allAttrIds.length > 0 && (mabaList.length > 0 || targetGroupIds.length > 0)) {
      existingChecks = await prisma.attributeCheck.findMany({
        where: {
          attributeId: { in: allAttrIds },
          checker: {
            role: { in: ["mentor", "admin", "panitia"] },
          },
          OR: [
            { mabaId: { in: mabaList.map((m) => m.id) } },
            { groupId: { in: targetGroupIds } },
          ],
        },
      });
    }

    // Buat map pencarian untuk individu: checkMap[mabaId][attributeId]
    const mabaCheckMap: Record<number, Record<number, {
      id: number;
      isBrought: boolean;
      notes: string | null;
      checkedAt: Date;
      checkedBy: number;
    }>> = {};

    // Buat map pencarian untuk kelompok: groupCheckMap[groupId][attributeId]
    const groupCheckMap: Record<number, Record<number, {
      id: number;
      isBrought: boolean;
      notes: string | null;
      checkedAt: Date;
      checkedBy: number;
    }>> = {};

    for (const check of existingChecks) {
      if (check.mabaId) {
        if (!mabaCheckMap[check.mabaId]) {
          mabaCheckMap[check.mabaId] = {};
        }
        mabaCheckMap[check.mabaId][check.attributeId] = {
          id: check.id,
          isBrought: check.isBrought,
          notes: check.notes,
          checkedAt: check.checkedAt,
          checkedBy: check.checkedBy,
        };
      } else if (check.groupId) {
        if (!groupCheckMap[check.groupId]) {
          groupCheckMap[check.groupId] = {};
        }
        groupCheckMap[check.groupId][check.attributeId] = {
          id: check.id,
          isBrought: check.isBrought,
          notes: check.notes,
          checkedAt: check.checkedAt,
          checkedBy: check.checkedBy,
        };
      }
    }

    // 5. Susun struktur hasil maba dengan default is_brought = true
    const mabaResults = mabaList.map((maba) => {
      const checks: Record<number, {
        isBrought: boolean;
        notes: string | null;
        isSaved: boolean;
        checkId?: number;
      }> = {};

      for (const attr of individuAttrs) {
        const saved = mabaCheckMap[maba.id]?.[attr.id];
        if (saved) {
          checks[attr.id] = {
            isBrought: saved.isBrought,
            notes: saved.notes,
            isSaved: true,
            checkId: saved.id,
          };
        } else {
          // Aturan default: diasumsikan membawa (is_brought = true)
          checks[attr.id] = {
            isBrought: true,
            notes: null,
            isSaved: false,
          };
        }
      }

      return {
        id: maba.id,
        nama: maba.nama,
        nim: maba.nim || maba.username,
        groupId: maba.mGroupsId,
        groupName: maba.group?.name || "-",
        checks,
      };
    });

    // 6. Susun struktur hasil pengecekan kelompok dengan default is_brought = true
    const groupsData = await prisma.group.findMany({
      where: { id: { in: targetGroupIds } },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });

    const groupResults = groupsData.map((grp) => {
      const checks: Record<number, {
        isBrought: boolean;
        notes: string | null;
        isSaved: boolean;
        checkId?: number;
      }> = {};

      for (const attr of kelompokAttrs) {
        const saved = groupCheckMap[grp.id]?.[attr.id];
        if (saved) {
          checks[attr.id] = {
            isBrought: saved.isBrought,
            notes: saved.notes,
            isSaved: true,
            checkId: saved.id,
          };
        } else {
          // Default kelompok: membawa (true)
          checks[attr.id] = {
            isBrought: true,
            notes: null,
            isSaved: false,
          };
        }
      }

      return {
        groupId: grp.id,
        groupName: grp.name,
        checks,
      };
    });

    const allAllowedGroups = (userRole === "admin" || userRole === "panitia")
      ? await prisma.group.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } })
      : mentorGroups.map((mg) => mg.group);

    return {
      targetDate: targetDateStr,
      groups: allAllowedGroups,
      selectedGroupId: targetGroupIds.length === 1 ? targetGroupIds[0] : null,
      attributes: {
        all: attributes,
        individu: individuAttrs,
        kelompok: kelompokAttrs,
      },
      mabaList: mabaResults,
      groupChecks: groupResults,
    };
  }

  /**
   * Batch upsert ke t_attribute_checks untuk menyimpan hasil pengecekan mentor
   */
  static async batchUpsertChecks(
    mentorId: number,
    checks: AttributeCheckBatchItem[]
  ) {
    if (!checks || checks.length === 0) {
      return { count: 0 };
    }

    const operations = checks.map((item) => {
      if (item.mabaId) {
        return prisma.attributeCheck.upsert({
          where: {
            attributeId_mabaId: {
              attributeId: item.attributeId,
              mabaId: item.mabaId,
            },
          },
          create: {
            attributeId: item.attributeId,
            mabaId: item.mabaId,
            groupId: null,
            checkedBy: mentorId,
            isBrought: item.isBrought,
            notes: item.notes ? item.notes.trim() : null,
          },
          update: {
            checkedBy: mentorId,
            isBrought: item.isBrought,
            notes: item.notes ? item.notes.trim() : null,
            checkedAt: new Date(),
          },
        });
      } else if (item.groupId) {
        return prisma.attributeCheck.upsert({
          where: {
            attributeId_groupId: {
              attributeId: item.attributeId,
              groupId: item.groupId,
            },
          },
          create: {
            attributeId: item.attributeId,
            mabaId: null,
            groupId: item.groupId,
            checkedBy: mentorId,
            isBrought: item.isBrought,
            notes: item.notes ? item.notes.trim() : null,
          },
          update: {
            checkedBy: mentorId,
            isBrought: item.isBrought,
            notes: item.notes ? item.notes.trim() : null,
            checkedAt: new Date(),
          },
        });
      } else {
        throw new Error("Pengecekan harus menyertakan mabaId atau groupId.");
      }
    });

    const results = await prisma.$transaction(operations);
    return { count: results.length, data: results };
  }

  /**
   * Maba mengambil status kelengkapan atribut pribadinya dan kelompoknya untuk tanggal tertentu
   */
  static async getMabaAttributeStatus(mabaId: number, targetDateStr: string) {
    const parsedDate = this.parseTargetDate(targetDateStr) || new Date();

    const maba = await prisma.user.findFirst({
      where: { id: mabaId, deletedAt: null },
      include: { group: true },
    });

    if (!maba) {
      throw new Error("Data mahasiswa tidak ditemukan.");
    }

    const attributes = await prisma.attribute.findMany({
      where: {
        targetDate: parsedDate,
        deletedAt: null,
      },
      orderBy: [
        { type: "asc" },
        { id: "asc" },
      ],
    });

    const individuAttrs = attributes.filter((a: Attribute) => a.type === "individu");
    const kelompokAttrs = attributes.filter((a: Attribute) => a.type === "kelompok");
    const attrIds = attributes.map((a: Attribute) => a.id);

    type AttributeCheckWithChecker = Prisma.AttributeCheckGetPayload<{
      include: {
        checker: {
          select: {
            id: true;
            nama: true;
            role: true;
          };
        };
      };
    }>;

    let checks: AttributeCheckWithChecker[] = [];
    if (attrIds.length > 0) {
      checks = await prisma.attributeCheck.findMany({
        where: {
          attributeId: { in: attrIds },
          checker: {
            role: { in: ["mentor", "admin", "panitia"] },
          },
          OR: [
            { mabaId: maba.id },
            ...(maba.mGroupsId ? [{ groupId: maba.mGroupsId }] : []),
          ],
        },
        include: {
          checker: {
            select: {
              id: true,
              nama: true,
              role: true,
            },
          },
        },
      });
    }

    const checkMapByAttrId: Record<number, AttributeCheckWithChecker> = {};
    for (const c of checks) {
      checkMapByAttrId[c.attributeId] = c;
    }

    const individuItems = individuAttrs.map((attr) => {
      const chk = checkMapByAttrId[attr.id];
      return {
        id: attr.id,
        name: attr.name,
        description: attr.description,
        targetDate: attr.targetDate,
        type: attr.type,
        isChecked: !!chk,
        isBrought: chk ? chk.isBrought : null, // null artinya belum diperiksa mentor
        notes: chk?.notes || null,
        checkedAt: chk?.checkedAt || null,
        checkedBy: chk?.checker?.nama || null,
      };
    });

    const kelompokItems = kelompokAttrs.map((attr) => {
      const chk = checkMapByAttrId[attr.id];
      return {
        id: attr.id,
        name: attr.name,
        description: attr.description,
        targetDate: attr.targetDate,
        type: attr.type,
        isChecked: !!chk,
        isBrought: chk ? chk.isBrought : null,
        notes: chk?.notes || null,
        checkedAt: chk?.checkedAt || null,
        checkedBy: chk?.checker?.nama || null,
      };
    });

    return {
      targetDate: targetDateStr,
      maba: {
        id: maba.id,
        nama: maba.nama,
        nim: maba.nim,
        group: maba.group ? { id: maba.group.id, name: maba.group.name } : null,
      },
      individu: individuItems,
      kelompok: kelompokItems,
      summary: {
        totalIndividu: individuItems.length,
        totalKelompok: kelompokItems.length,
      },
    };
  }
}
