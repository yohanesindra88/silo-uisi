import { NextResponse } from "next/server";
import { AttributeModel } from "@/models/attribute.model";
import { verifyJwt, AUTH_COOKIE_NAME, AuthUserPayload } from "@/utils/auth";
import { getTodayDateString } from "@/scripts/seed-attributes";
import { prisma } from "@/utils/prisma";

/**
 * Helper untuk mengambil data sesi user yang sedang login dari request cookie/header
 */
export async function getAuthUser(req: Request): Promise<AuthUserPayload | null> {
  try {
    // 1. Cek header Cookie
    const cookieHeader = req.headers.get("cookie");
    let token: string | undefined;

    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
      if (match) {
        token = match.split("=")[1];
      }
    }

    // 2. Cek Authorization Header
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const user = await verifyJwt(token);
      if (user) return user;
    }

    // 3. Fallback ke header x-user-* yang diset oleh proxy/middleware
    const userIdHeader = req.headers.get("x-user-id");
    const userRoleHeader = req.headers.get("x-user-role");
    const userNameHeader = req.headers.get("x-user-name");
    const userGroupHeader = req.headers.get("x-user-group-id");

    if (userIdHeader && userRoleHeader) {
      return {
        id: Number(userIdHeader),
        nama: userNameHeader ? decodeURIComponent(userNameHeader) : "",
        role: userRoleHeader,
        m_groups_id: userGroupHeader ? Number(userGroupHeader) : null,
        qr_token: null,
      };
    }

    return null;
  } catch (err) {
    console.error("Gagal membaca auth user:", err);
    return null;
  }
}

export class AttributeController {
  /**
   * GET /api/attributes
   * Mengambil atribut berdasarkan target_date dan tipe
   */
  static async getAttributes(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const targetDate = searchParams.get("target_date") || searchParams.get("targetDate") || undefined;
      const type = searchParams.get("type") || undefined;

      const attributes = await AttributeModel.getAll({
        targetDate,
        type,
      });

      return NextResponse.json({
        success: true,
        data: attributes,
      });
    } catch (error: any) {
      console.error("Error GET /api/attributes:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil daftar atribut.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/attributes
   * Admin membuat master atribut baru
   */
  static async createAttribute(req: Request) {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Sesi tidak valid. Silakan login kembali." },
          { status: 401 }
        );
      }

      if (user.role !== "admin" && user.role !== "panitia") {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Hanya Admin/Panitia yang dapat membuat atribut." },
          { status: 403 }
        );
      }

      const body = await req.json();
      const name = body.name ? String(body.name).trim() : "";
      const description = body.description ? String(body.description).trim() : null;
      const targetDate = body.target_date || body.targetDate;
      const type = body.type ? String(body.type).trim().toLowerCase() : "individu";

      if (!name) {
        return NextResponse.json(
          { success: false, message: "Nama atribut wajib diisi." },
          { status: 400 }
        );
      }

      if (!targetDate) {
        return NextResponse.json(
          { success: false, message: "Tanggal target (target_date) wajib diisi." },
          { status: 400 }
        );
      }

      if (type !== "individu" && type !== "kelompok") {
        return NextResponse.json(
          { success: false, message: "Tipe atribut harus 'individu' atau 'kelompok'." },
          { status: 400 }
        );
      }

      const newAttribute = await AttributeModel.create({
        name,
        description,
        targetDate,
        type,
        createdBy: user.id,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Master atribut berhasil dibuat.",
          data: newAttribute,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Error POST /api/attributes:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal membuat master atribut.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/attributes/[id]
   * Admin memperbarui master atribut
   */
  static async updateAttribute(req: Request, id: number) {
    try {
      const user = await getAuthUser(req);
      if (!user || (user.role !== "admin" && user.role !== "panitia")) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak." },
          { status: 403 }
        );
      }

      const body = await req.json();
      const updated = await AttributeModel.update(id, {
        name: body.name,
        description: body.description,
        targetDate: body.target_date || body.targetDate,
        type: body.type,
      });

      return NextResponse.json({
        success: true,
        message: "Atribut berhasil diperbarui.",
        data: updated,
      });
    } catch (error: any) {
      console.error(`Error PUT /api/attributes/${id}:`, error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui atribut.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/attributes/[id]
   * Admin menghapus master atribut
   */
  static async deleteAttribute(req: Request, id: number) {
    try {
      const user = await getAuthUser(req);
      if (!user || (user.role !== "admin" && user.role !== "panitia")) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak." },
          { status: 403 }
        );
      }

      await AttributeModel.delete(id);

      return NextResponse.json({
        success: true,
        message: "Atribut berhasil dihapus.",
      });
    } catch (error: any) {
      console.error(`Error DELETE /api/attributes/${id}:`, error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal menghapus atribut.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/attributes/mentor-check
   * Mentor mengambil daftar maba binaannya beserta status checklist atribut pada tanggal yang dipilih
   */
  static async getMentorCheck(req: Request) {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Sesi tidak valid. Silakan login kembali." },
          { status: 401 }
        );
      }

      // Mentor, admin, dan panitia diizinkan melihat checklist
      if (user.role !== "mentor" && user.role !== "admin" && user.role !== "panitia") {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Endpoint khusus untuk Mentor." },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const targetDate = searchParams.get("target_date") || searchParams.get("targetDate") || getTodayDateString();
      const groupIdStr = searchParams.get("group_id") || searchParams.get("groupId");
      const groupId = groupIdStr ? Number(groupIdStr) : undefined;

      const data = await AttributeModel.getMentorCheckData(user.id, targetDate, groupId, user.role);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("Error GET /api/attributes/mentor-check:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal memuat data checklist atribut mentor.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/attributes/check-batch
   * Batch upsert ke t_attribute_checks untuk menyimpan hasil pengecekan mentor
   */
  static async batchCheck(req: Request) {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Sesi tidak valid. Silakan login kembali." },
          { status: 401 }
        );
      }

      // Pastikan user ada di database dan memiliki role yang berhak memeriksa
      const dbUser = await prisma.user.findFirst({
        where: { id: user.id, deletedAt: null },
        select: { id: true, nama: true, role: true },
      });

      if (!dbUser || (dbUser.role !== "mentor" && dbUser.role !== "admin" && dbUser.role !== "panitia")) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Hanya Mentor atau Admin/Panitia yang dapat mencatat hasil pengecekan." },
          { status: 403 }
        );
      }

      const body = await req.json();
      const rawChecks = Array.isArray(body) ? body : (body.checks || []);

      if (!Array.isArray(rawChecks) || rawChecks.length === 0) {
        return NextResponse.json(
          { success: false, message: "Data checklist pemeriksaan tidak boleh kosong." },
          { status: 400 }
        );
      }

      // Validasi dan format item
      const formattedChecks = rawChecks.map((item: any) => {
        const attributeId = Number(item.attributeId || item.attribute_id);
        const mabaId = item.mabaId || item.maba_id ? Number(item.mabaId || item.maba_id) : null;
        const groupId = item.groupId || item.group_id ? Number(item.groupId || item.group_id) : null;
        const isBrought = typeof item.isBrought === "boolean"
          ? item.isBrought
          : (typeof item.is_brought === "boolean" ? item.is_brought : true);
        const notes = item.notes ? String(item.notes).trim() : null;

        if (!attributeId || (!mabaId && !groupId)) {
          throw new Error("Format checklist tidak valid: attributeId dan (mabaId atau groupId) wajib diisi.");
        }

        return {
          attributeId,
          mabaId,
          groupId,
          isBrought,
          notes,
        };
      });

      // VALIDASI OTORISASI KELOMPOK MENTOR:
      // Hanya mentor yang ditugaskan di kelompok tersebut yang dapat memeriksa maba atau kelompok binaannya.
      if (dbUser.role === "mentor") {
        const mentorGroups = await prisma.groupMentor.findMany({
          where: {
            mUsersId: dbUser.id,
            deletedAt: null,
          },
          select: { mGroupsId: true },
        });

        const allowedGroupIds = mentorGroups.map((mg) => mg.mGroupsId);

        if (allowedGroupIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Akses ditolak: Anda belum ditugaskan ke kelompok manapun sebagai mentor.",
            },
            { status: 403 }
          );
        }

        // 1. Validasi pengecekan level kelompok
        for (const item of formattedChecks) {
          if (item.groupId && !allowedGroupIds.includes(item.groupId)) {
            return NextResponse.json(
              {
                success: false,
                message: `Akses ditolak: Anda tidak berhak memeriksa kelompok ID ${item.groupId} karena bukan merupakan kelompok binaan Anda.`,
              },
              { status: 403 }
            );
          }
        }

        // 2. Validasi pengecekan level individu maba
        const mabaIds = Array.from(
          new Set(formattedChecks.map((c) => c.mabaId).filter(Boolean))
        ) as number[];

        if (mabaIds.length > 0) {
          const targetMabas = await prisma.user.findMany({
            where: {
              id: { in: mabaIds },
              role: "maba",
              deletedAt: null,
            },
            select: { id: true, nama: true, mGroupsId: true },
          });

          const mabaMap = new Map(targetMabas.map((m) => [m.id, m]));

          for (const mabaId of mabaIds) {
            const maba = mabaMap.get(mabaId);
            if (!maba) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Mahasiswa baru dengan ID ${mabaId} tidak ditemukan.`,
                },
                { status: 404 }
              );
            }

            if (!maba.mGroupsId || !allowedGroupIds.includes(maba.mGroupsId)) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Akses ditolak: Mahasiswa "${maba.nama}" bukan merupakan anggota kelompok binaan Anda. Atribut maba hanya dapat dicek oleh mentor kelompoknya.`,
                },
                { status: 403 }
              );
            }
          }
        }
      }

      const result = await AttributeModel.batchUpsertChecks(dbUser.id, formattedChecks);

      return NextResponse.json({
        success: true,
        message: `Berhasil menyimpan hasil pemeriksaan ${result.count} item atribut.`,
        count: result.count,
      });
    } catch (error: any) {
      console.error("Error POST /api/attributes/check-batch:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal menyimpan hasil pemeriksaan atribut.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/attributes/maba-status
   * Maba melihat status atribut diri & kelompoknya untuk tanggal tertentu
   */
  static async getMabaStatus(req: Request) {
    try {
      const user = await getAuthUser(req);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Sesi tidak valid. Silakan login kembali." },
          { status: 401 }
        );
      }

      const { searchParams } = new URL(req.url);
      const targetDate = searchParams.get("target_date") || searchParams.get("targetDate") || getTodayDateString();

      const data = await AttributeModel.getMabaAttributeStatus(user.id, targetDate);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("Error GET /api/attributes/maba-status:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil status atribut mahasiswa.",
          error: error.message,
        },
        { status: 500 }
      );
    }
  }
}
