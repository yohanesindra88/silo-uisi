import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { requireAdmin } from "@/utils/api-guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/master-data/bulk-delete
 * Menghapus banyak data sekaligus (users atau groups).
 * Dilindungi khusus role 'admin'.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (auth.response) return auth.response;

    const body = await req.json();
    const { type, ids } = body as {
      type?: "users" | "groups";
      ids?: number[];
    };

    if (!type || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Parameter 'type' dan daftar 'ids' wajib diisi." },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "ID data yang dikirim tidak valid." },
        { status: 400 }
      );
    }

    if (type === "groups") {
      // Eksekusi transaksi atomik pelepasan relasi dan penghapusan kelompok
      const deletedCount = await prisma.$transaction(async (tx) => {
        // 1. Lepaskan seluruh user (maba/anggota) dari kelompok-kelompok ini (maba TETAP DIPERTAHANKAN)
        await tx.user.updateMany({
          where: { mGroupsId: { in: numericIds } },
          data: { mGroupsId: null },
        });

        // 2. Hapus pivot mentor kelompok
        await tx.groupMentor.deleteMany({
          where: { mGroupsId: { in: numericIds } },
        });

        // 3. Hapus data presensi kelompok
        await tx.attendance.deleteMany({
          where: { groupsId: { in: numericIds } },
        });

        // 4. Hapus data cek atribut kelompok
        await tx.attributeCheck.deleteMany({
          where: { groupId: { in: numericIds } },
        });

        // 5. Hapus kelompok
        const res = await tx.group.deleteMany({
          where: { id: { in: numericIds } },
        });

        return res.count;
      }, { maxWait: 10000, timeout: 30000 });

      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus ${deletedCount} kelompok dari database. Seluruh data maba tetap dipertahankan.`,
        count: deletedCount,
      });
    } else if (type === "users") {
      // Cegah admin menghapus dirinya sendiri
      const currentAdminId = auth.user.id;
      const targetIds = numericIds.filter((id) => id !== currentAdminId);

      if (targetIds.length === 0) {
        return NextResponse.json(
          { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." },
          { status: 400 }
        );
      }

      const deletedCount = await prisma.$transaction(async (tx) => {
        // 1. Hapus relasi mentor kelompok jika user adalah mentor
        await tx.groupMentor.deleteMany({
          where: { mUsersId: { in: targetIds } },
        });

        // 2. Hapus data presensi maba
        await tx.attendance.deleteMany({
          where: { mabaId: { in: targetIds } },
        });

        // 3. Jika user pernah scan presensi, set scannedBy ke null agar riwayat maba lain tetap terjaga
        await tx.attendance.updateMany({
          where: { scannedBy: { in: targetIds } },
          data: { scannedBy: null },
        });

        // 4. Hapus data pengumpulan tugas maba (submissions)
        await tx.submission.deleteMany({
          where: { mabaId: { in: targetIds } },
        });

        // 5. Jika user pernah mereview tugas, set reviewedBy ke null
        await tx.submission.updateMany({
          where: { reviewedBy: { in: targetIds } },
          data: { reviewedBy: null },
        });

        // 6. Hapus data pengecekan atribut (baik sebagai maba maupun checker)
        await tx.attributeCheck.deleteMany({
          where: {
            OR: [
              { mabaId: { in: targetIds } },
              { checkedBy: { in: targetIds } },
            ],
          },
        });

        // 7. Jika user adalah pembuat tugas atau atribut, set createdBy ke null
        await tx.assignment.updateMany({
          where: { createdBy: { in: targetIds } },
          data: { createdBy: null },
        });

        await tx.attribute.updateMany({
          where: { createdBy: { in: targetIds } },
          data: { createdBy: null },
        });

        // 8. Hapus user
        const res = await tx.user.deleteMany({
          where: { id: { in: targetIds } },
        });

        return res.count;
      }, { maxWait: 10000, timeout: 30000 });

      return NextResponse.json({
        success: true,
        message: `Berhasil menghapus ${deletedCount} pengguna dan seluruh riwayat data terkait dari database.`,
        count: deletedCount,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe "${type}" tidak didukung. Gunakan "users" atau "groups".` },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error pada POST /api/admin/master-data/bulk-delete:", error);
    const errMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan internal saat menghapus data massal.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
