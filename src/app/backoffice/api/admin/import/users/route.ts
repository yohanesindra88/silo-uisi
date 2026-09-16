import { NextRequest, NextResponse } from "next/server";
import { ImportController, UserImportRow } from "@/controllers/import.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let users: UserImportRow[] = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      users = body.users || [];
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
      const preview = await ImportController.previewUsers(buffer);
      users = preview.rows.filter((r) => r.isValid).map((r) => r.data);
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada baris data pengguna yang valid untuk diimpor." },
        { status: 400 }
      );
    }

    const result = await ImportController.executeImportUsers(users);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${result.total} pengguna (${result.createdCount} baru, ${result.updatedCount} diperbarui, ${result.newGroupsCreated} kelompok baru).`,
      data: result,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal menyimpan data pengguna ke database.";
    console.error("Error executing users import:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 500 }
    );
  }
}
