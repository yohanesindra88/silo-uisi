import { NextRequest, NextResponse } from "next/server";
import { ImportController, GroupImportRow } from "@/controllers/import.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let groups: GroupImportRow[] = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      groups = body.groups || [];
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: "File Excel wajib diunggah." },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const preview = await ImportController.previewGroups(buffer);
      groups = preview.rows.filter((r) => r.isValid).map((r) => r.data);
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada baris data kelompok yang valid untuk diimpor." },
        { status: 400 }
      );
    }

    const result = await ImportController.executeImportGroups(groups);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${result.total} kelompok (${result.createdCount} baru, ${result.updatedCount} diperbarui).`,
      data: result,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal menyimpan data kelompok ke database.";
    console.error("Error executing groups import:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 500 }
    );
  }
}
