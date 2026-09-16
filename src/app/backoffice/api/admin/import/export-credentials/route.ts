import { NextRequest, NextResponse } from "next/server";
import { ImportController, CreatedUserCredential } from "@/controllers/import.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const users: CreatedUserCredential[] = body.users || [];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data kredensial untuk diunduh." },
        { status: 400 }
      );
    }

    const buffer = ImportController.generateCredentialsExcel(users);
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rekap_akun_silo_${timestamp}.xlsx"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal membuat file rekap akun Excel.";
    console.error("Error exporting credentials:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 500 }
    );
  }
}
