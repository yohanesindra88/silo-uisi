import { NextResponse } from "next/server";
import { ImportController } from "@/controllers/import.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const buffer = ImportController.generateGroupsTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template_kelompok_silo.xlsx"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal membuat template Excel kelompok.";
    console.error("Error generating groups template:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat template Excel kelompok.",
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
