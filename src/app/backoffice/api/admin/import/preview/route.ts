import { NextRequest, NextResponse } from "next/server";
import { ImportController } from "@/controllers/import.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "users";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File Excel wajib diunggah." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (type === "groups") {
      const result = await ImportController.previewGroups(buffer);
      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      const result = await ImportController.previewUsers(buffer);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Gagal memproses preview file Excel.";
    console.error("Error preview import:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 400 }
    );
  }
}
