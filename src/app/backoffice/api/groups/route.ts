import { NextResponse } from "next/server";
import { GroupModel } from "@/models";

export async function GET() {
  try {
    const groups = await GroupModel.getAll();

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/groups:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kelompok.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
