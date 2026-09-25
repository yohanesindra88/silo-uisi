import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { requireAdmin } from "@/utils/api-guard";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/master-data/[type]/[id]
 * Memperbarui data pengguna atau kelompok tertentu berdasarkan ID.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;

    const { type, id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, message: "ID data tidak valid." },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (type === "groups") {
      const existing = await prisma.group.findUnique({
        where: { id: numericId },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: `Kelompok dengan ID ${numericId} tidak ditemukan.` },
          { status: 404 }
        );
      }

      const newName = body.name ? String(body.name).trim() : existing.name;
      const newDesc =
        body.description !== undefined
          ? body.description
            ? String(body.description).trim()
            : null
          : existing.description;

      const updated = await prisma.group.update({
        where: { id: numericId },
        data: {
          name: newName,
          description: newDesc,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Kelompok "${updated.name}" berhasil diperbarui.`,
        data: updated,
      });
    } else if (type === "users") {
      const existing = await prisma.user.findUnique({
        where: { id: numericId },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: `Pengguna dengan ID ${numericId} tidak ditemukan.` },
          { status: 404 }
        );
      }

      const newNama = body.nama ? String(body.nama).trim() : existing.nama;
      const newNim =
        body.nim !== undefined
          ? body.nim
            ? String(body.nim).trim()
            : null
          : existing.nim;
      const newUsername = body.username ? String(body.username).trim() : existing.username;
      const newRole = body.role ? String(body.role).trim().toLowerCase() : existing.role;
      const newFakultas =
        body.fakultas !== undefined
          ? body.fakultas
            ? String(body.fakultas).trim()
            : null
          : existing.fakultas;
      const newProdi =
        body.prodi !== undefined
          ? body.prodi
            ? String(body.prodi).trim()
            : null
          : existing.prodi;

      let mGroupsId = existing.mGroupsId;
      if (body.mGroupsId !== undefined) {
        mGroupsId = body.mGroupsId ? Number(body.mGroupsId) : null;
      } else if (body.nama_kelompok || body.kelompok) {
        const groupStr = String(body.nama_kelompok || body.kelompok).trim();
        const targetGroup = await prisma.group.findFirst({
          where: { name: { equals: groupStr, mode: "insensitive" } },
        });
        if (targetGroup) {
          mGroupsId = targetGroup.id;
        } else if (groupStr) {
          const createdGroup = await prisma.group.create({
            data: { name: groupStr },
          });
          mGroupsId = createdGroup.id;
        }
      }

      const updated = await prisma.$transaction(
        async (tx) => {
          const userRec = await tx.user.update({
            where: { id: numericId },
            data: {
              nama: newNama,
              nim: newNim,
              username: newUsername,
              role: newRole,
              fakultas: newFakultas,
              prodi: newProdi,
              mGroupsId,
            },
          });

          // Sinkronisasi tabel pivot groups_mentors jika perannya adalah mentor
          if (newRole === "mentor") {
            if (mGroupsId) {
              // Hapus keterikatan dengan kelompok lama agar mentor tidak dobel atau salah negara
              await tx.groupMentor.deleteMany({
                where: {
                  mUsersId: numericId,
                  mGroupsId: { not: mGroupsId },
                },
              });

              await tx.groupMentor.upsert({
                where: {
                  mGroupsId_mUsersId: {
                    mGroupsId,
                    mUsersId: numericId,
                  },
                },
                create: {
                  mGroupsId,
                  mUsersId: numericId,
                },
                update: {
                  deletedAt: null,
                },
              });
            } else {
              // Jika kelompok dihapus, lepas dari seluruh kelompok
              await tx.groupMentor.deleteMany({
                where: { mUsersId: numericId },
              });
            }
          } else {
            // Jika role diubah menjadi non-mentor, bersihkan relasi mentor
            await tx.groupMentor.deleteMany({
              where: { mUsersId: numericId },
            });
          }

          return userRec;
        },
        { maxWait: 10000, timeout: 30000 }
      );

      const safeUser = { ...updated };
      delete (safeUser as { password?: string }).password;

      return NextResponse.json({
        success: true,
        message: `Pengguna "${safeUser.nama}" (${safeUser.username}) berhasil diperbarui.`,
        data: safeUser,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe "${type}" tidak didukung.` },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error pada PUT /api/admin/master-data/[type]/[id]:", error);
    const errMessage =
      error instanceof Error ? error.message : "Gagal memperbarui data di database.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/master-data/[type]/[id]
 * Menghapus data pengguna atau kelompok tertentu berdasarkan ID.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;

    const { type, id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json(
        { success: false, message: "ID data tidak valid." },
        { status: 400 }
      );
    }

    if (type === "groups") {
      const existing = await prisma.group.findUnique({
        where: { id: numericId },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: `Kelompok dengan ID ${numericId} tidak ditemukan.` },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Lepas user (maba/anggota) dari kelompok ini agar akun maba TETAP DIPERTAHANKAN
        await tx.user.updateMany({
          where: { mGroupsId: numericId },
          data: { mGroupsId: null },
        });

        // 2. Hapus pivot mentor kelompok
        await tx.groupMentor.deleteMany({
          where: { mGroupsId: numericId },
        });

        // 3. Hapus data presensi kelompok
        await tx.attendance.deleteMany({
          where: { groupsId: numericId },
        });

        // 4. Hapus data cek atribut kelompok
        await tx.attributeCheck.deleteMany({
          where: { groupId: numericId },
        });

        // 5. Hapus kelompok
        await tx.group.delete({
          where: { id: numericId },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Kelompok "${existing.name}" berhasil dihapus dari database. Data maba tetap dipertahankan.`,
      });
    } else if (type === "users") {
      if (numericId === auth.user.id) {
        return NextResponse.json(
          { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({
        where: { id: numericId },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, message: `Pengguna dengan ID ${numericId} tidak ditemukan.` },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Hapus relasi mentor kelompok jika user adalah mentor
        await tx.groupMentor.deleteMany({
          where: { mUsersId: numericId },
        });

        // 2. Hapus data presensi maba
        await tx.attendance.deleteMany({
          where: { mabaId: numericId },
        });

        // 3. Jika user pernah scan presensi (panitia/mentor), set scannedBy ke null agar riwayat kehadiran maba lain tetap terjaga
        await tx.attendance.updateMany({
          where: { scannedBy: numericId },
          data: { scannedBy: null },
        });

        // 4. Hapus data pengumpulan tugas maba (submissions)
        await tx.submission.deleteMany({
          where: { mabaId: numericId },
        });

        // 5. Jika user pernah mereview tugas, set reviewedBy ke null agar riwayat penilaian maba lain tidak terhapus
        await tx.submission.updateMany({
          where: { reviewedBy: numericId },
          data: { reviewedBy: null },
        });

        // 6. Hapus data cek atribut (baik sebagai maba maupun sebagai pemeriksa)
        await tx.attributeCheck.deleteMany({
          where: {
            OR: [{ mabaId: numericId }, { checkedBy: numericId }],
          },
        });

        // 7. Jika user adalah pembuat tugas atau atribut, set createdBy ke null
        await tx.assignment.updateMany({
          where: { createdBy: numericId },
          data: { createdBy: null },
        });

        await tx.attribute.updateMany({
          where: { createdBy: numericId },
          data: { createdBy: null },
        });

        // 8. Hapus data pengguna
        await tx.user.delete({
          where: { id: numericId },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Pengguna "${existing.nama}" (${existing.username}) dan seluruh data terkait berhasil dihapus dari database.`,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe "${type}" tidak didukung.` },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error pada DELETE /api/admin/master-data/[type]/[id]:", error);
    const errMessage =
      error instanceof Error ? error.message : "Gagal menghapus data dari database.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
