/**
 * Pengambilan data galeri dokumentasi untuk server component. SERVER-ONLY.
 *
 * Dipanggil langsung lewat Prisma (bukan fetch ke API sendiri) supaya halaman
 * tidak perlu round-trip HTTP ke dirinya sendiri dan tidak ada kedipan loading.
 */

import prisma from "./prisma";
import type { DocItem } from "@/app/components/DokumentasiGallery";

export async function getDocumentationItems(): Promise<DocItem[]> {
  try {
    const rows = await prisma.documentation.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return rows.map((row) => ({
      id: String(row.id),
      src: row.imageUrl,
      title: row.title,
      tag: row.tag,
    }));
  } catch (error) {
    // Galeri adalah konten marketing — database bermasalah tidak boleh
    // menjatuhkan seluruh halaman. Komponen akan memakai data cadangan.
    console.error("[dokumentasi] gagal memuat galeri, memakai data cadangan:", error);
    return [];
  }
}
