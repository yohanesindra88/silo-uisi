import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

// Helper escape field CSV sesuai RFC 4180
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const groupId = searchParams.get("groupId");
    const statusFilter = searchParams.get("status");

    // 1. Ambil daftar tugas aktif
    const assignments = await prisma.assignment.findMany({
      where: {
        deletedAt: null,
        ...(assignmentId ? { id: Number(assignmentId) } : {}),
      },
      orderBy: { dueDate: "asc" },
    });

    // 2. Ambil seluruh mahasiswa baru
    const mabaList = await prisma.user.findMany({
      where: {
        role: "maba",
        deletedAt: null,
        ...(groupId ? { mGroupsId: Number(groupId) } : {}),
      },
      include: {
        group: true,
        submissionsAsMaba: {
          where: {
            deletedAt: null,
            ...(assignmentId ? { assignmentId: Number(assignmentId) } : {}),
          },
          include: {
            reviewer: true,
          },
        },
      },
      orderBy: [
        { mGroupsId: "asc" },
        { nama: "asc" },
      ],
    });

    // 3. Bangun baris CSV
    const rows: string[] = [];

    // Header CSV
    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Program Studi",
      "Kelompok",
      "Judul Tugas",
      "Batas Waktu (Due Date)",
      "Waktu Pengumpulan",
      "Status Pengumpulan",
      "Tautan Berkas (Link File)",
      "Catatan Mahasiswa",
      "Nilai Skor (0-100)",
      "Catatan Review / Feedback",
      "Petugas Penilai",
    ];
    rows.push(headers.map(escapeCsv).join(","));

    let counter = 1;

    for (const maba of mabaList) {
      const groupName = maba.group?.name || "-";

      for (const assignment of assignments) {
        const sub = maba.submissionsAsMaba.find((s) => s.assignmentId === assignment.id);

        let statusText = "Belum Mengumpulkan";
        let submitTime = "-";
        let fileUrl = "-";
        let notes = "-";
        let scoreText = "-";
        let feedbackText = "-";
        let reviewerName = "-";

        if (sub) {
          submitTime = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleString("id-ID", {
                dateStyle: "short",
                timeStyle: "medium",
              })
            : "-";
          fileUrl = sub.fileUrl;
          notes = sub.notes || "-";

          if (sub.status === "graded") {
            statusText = "Selesai Dinilai";
            scoreText = sub.score !== null ? String(sub.score) : "-";
            feedbackText = sub.feedback || "-";
            reviewerName = sub.reviewer?.nama || "Admin";
          } else if (sub.status === "late") {
            statusText = "Terlambat";
          } else {
            statusText = "Tepat Waktu";
          }
        }

        // Filter status jika parameter diberikan
        if (statusFilter && statusFilter.toLowerCase() !== statusText.toLowerCase()) {
          continue;
        }

        const dueFormatted = new Date(assignment.dueDate).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        });

        const row = [
          counter++,
          maba.nim || maba.username,
          maba.nama,
          maba.prodi || "-",
          groupName,
          assignment.title,
          dueFormatted,
          submitTime,
          statusText,
          fileUrl,
          notes,
          scoreText,
          feedbackText,
          reviewerName,
        ];

        rows.push(row.map(escapeCsv).join(","));
      }
    }

    // 4. Output CSV dengan UTF-8 BOM
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `rekap_nilai_tugas_silo_2026_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Export Assignments Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor data rekap nilai penugasan.", error: error.message },
      { status: 500 }
    );
  }
}
