import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export const dynamic = "force-dynamic";

/**
 * DELETE: Menghapus data eksisting di database (kelompok atau user)
 * Berguna saat admin melihat status UPDATE di halaman import dan ingin membersihkan data lama.
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, identifier } = body as {
      type?: "groups" | "users";
      identifier?: string;
    };

    if (!type || !identifier) {
      return NextResponse.json(
        { success: false, message: "Parameter 'type' dan 'identifier' wajib diisi." },
        { status: 400 }
      );
    }

    if (type === "groups") {
      const trimmedName = identifier.trim();
      const existingGroup = await prisma.group.findFirst({
        where: { name: { equals: trimmedName, mode: "insensitive" } },
      });

      if (!existingGroup) {
        return NextResponse.json(
          { success: false, message: `Kelompok "${trimmedName}" tidak ditemukan di database.` },
          { status: 404 }
        );
      }

      // Eksekusi transaksi pelepasan relasi dan penghapusan kelompok
      await prisma.$transaction(async (tx) => {
        // 1. Lepas user (maba/anggota) dari kelompok ini agar akun maba TETAP DIPERTAHANKAN
        await tx.user.updateMany({
          where: { mGroupsId: existingGroup.id },
          data: { mGroupsId: null },
        });

        // 2. Hapus pivot mentor kelompok
        await tx.groupMentor.deleteMany({
          where: { mGroupsId: existingGroup.id },
        });

        // 3. Hapus data presensi kelompok
        await tx.attendance.deleteMany({
          where: { groupsId: existingGroup.id },
        });

        // 4. Hapus data cek atribut kelompok
        await tx.attributeCheck.deleteMany({
          where: { groupId: existingGroup.id },
        });

        // 5. Hapus kelompok
        await tx.group.delete({
          where: { id: existingGroup.id },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Kelompok "${existingGroup.name}" berhasil dihapus dari database. Data maba tetap dipertahankan.`,
      });
    } else if (type === "users") {
      const trimmedIdentifier = identifier.trim();
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: trimmedIdentifier, mode: "insensitive" } },
            { nim: { equals: trimmedIdentifier, mode: "insensitive" } },
          ],
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: `Pengguna "${trimmedIdentifier}" tidak ditemukan di database.` },
          { status: 404 }
        );
      }

      // Hapus pengguna secara atomic dengan membersihkan seluruh relasi
      await prisma.$transaction(async (tx) => {
        // 1. Hapus relasi mentor kelompok jika user adalah mentor
        await tx.groupMentor.deleteMany({
          where: { mUsersId: existingUser.id },
        });

        // 2. Hapus data presensi maba
        await tx.attendance.deleteMany({
          where: { mabaId: existingUser.id },
        });

        // 3. Jika user pernah scan presensi, set scannedBy ke null agar riwayat maba lain tetap terjaga
        await tx.attendance.updateMany({
          where: { scannedBy: existingUser.id },
          data: { scannedBy: null },
        });

        // 4. Hapus data pengumpulan tugas maba (submissions)
        await tx.submission.deleteMany({
          where: { mabaId: existingUser.id },
        });

        // 5. Jika user pernah mereview tugas, set reviewedBy ke null
        await tx.submission.updateMany({
          where: { reviewedBy: existingUser.id },
          data: { reviewedBy: null },
        });

        // 6. Hapus data pengecekan atribut (baik sebagai maba maupun checker)
        await tx.attributeCheck.deleteMany({
          where: {
            OR: [
              { mabaId: existingUser.id },
              { checkedBy: existingUser.id },
            ],
          },
        });

        // 7. Jika user adalah pembuat tugas atau atribut, set createdBy ke null
        await tx.assignment.updateMany({
          where: { createdBy: existingUser.id },
          data: { createdBy: null },
        });

        await tx.attribute.updateMany({
          where: { createdBy: existingUser.id },
          data: { createdBy: null },
        });

        // 8. Hapus user
        await tx.user.delete({
          where: { id: existingUser.id },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Pengguna "${existingUser.nama}" (${existingUser.username}) dan seluruh riwayat data terkait berhasil dihapus dari database.`,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe "${type}" tidak didukung. Gunakan "groups" atau "users".` },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error pada DELETE /api/admin/import/manage-existing:", error);
    const errMessage =
      error instanceof Error ? error.message : "Gagal menghapus data dari database.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}

/**
 * PUT: Memperbarui data eksisting di database langsung dari panel preview import.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, identifier, data } = body as {
      type?: "groups" | "users";
      identifier?: string;
      data?: Record<string, unknown>;
    };

    if (!type || !identifier || !data) {
      return NextResponse.json(
        { success: false, message: "Parameter 'type', 'identifier', dan 'data' wajib diisi." },
        { status: 400 }
      );
    }

    if (type === "groups") {
      const trimmedName = identifier.trim();
      const existingGroup = await prisma.group.findFirst({
        where: { name: { equals: trimmedName, mode: "insensitive" } },
      });

      if (!existingGroup) {
        return NextResponse.json(
          { success: false, message: `Kelompok "${trimmedName}" tidak ditemukan di database.` },
          { status: 404 }
        );
      }

      const newName =
        String(data.nama_kelompok || data.name || "").trim() || existingGroup.name;
      const newDesc =
        data.deskripsi !== undefined
          ? data.deskripsi
            ? String(data.deskripsi).trim()
            : null
          : existingGroup.description;

      const updated = await prisma.group.update({
        where: { id: existingGroup.id },
        data: {
          name: newName,
          description: newDesc,
          deletedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Kelompok "${updated.name}" berhasil diperbarui di database.`,
        data: updated,
      });
    } else if (type === "users") {
      const trimmedIdentifier = identifier.trim();
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: trimmedIdentifier, mode: "insensitive" } },
            { nim: { equals: trimmedIdentifier, mode: "insensitive" } },
          ],
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: `Pengguna "${trimmedIdentifier}" tidak ditemukan di database.` },
          { status: 404 }
        );
      }

      const newNama = data.nama ? String(data.nama).trim() : existingUser.nama;
      const newNim =
        data.nim !== undefined
          ? data.nim
            ? String(data.nim).trim()
            : null
          : existingUser.nim;
      const newUsername = data.username ? String(data.username).trim() : existingUser.username;
      const newRole = data.role ? String(data.role).trim().toLowerCase() : existingUser.role;
      const newFakultas =
        data.fakultas !== undefined
          ? data.fakultas
            ? String(data.fakultas).trim()
            : null
          : existingUser.fakultas;
      const newProdi =
        data.prodi !== undefined
          ? data.prodi
            ? String(data.prodi).trim()
            : null
          : existingUser.prodi;

      // Handle kelompok
      let mGroupsId = existingUser.mGroupsId;
      const namaKelompok = data.nama_kelompok || data.kelompok;
      if (namaKelompok) {
        const groupStr = String(namaKelompok).trim();
        const targetGroup = await prisma.group.findFirst({
          where: { name: { equals: groupStr, mode: "insensitive" } },
        });
        if (targetGroup) {
          mGroupsId = targetGroup.id;
        } else {
          const createdGroup = await prisma.group.create({
            data: { name: groupStr },
          });
          mGroupsId = createdGroup.id;
        }
      }

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          nama: newNama,
          nim: newNim,
          username: newUsername,
          role: newRole,
          fakultas: newFakultas,
          prodi: newProdi,
          mGroupsId,
          deletedAt: null,
        },
      });

      const safeUser = { ...updated };
      delete (safeUser as { password?: string }).password;

      return NextResponse.json({
        success: true,
        message: `Pengguna "${safeUser.nama}" (${safeUser.username}) berhasil diperbarui di database.`,
        data: safeUser,
      });
    } else {
      return NextResponse.json(
        { success: false, message: `Tipe "${type}" tidak didukung.` },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error pada PUT /api/admin/import/manage-existing:", error);
    const errMessage =
      error instanceof Error ? error.message : "Gagal memperbarui data di database.";
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 });
  }
}
