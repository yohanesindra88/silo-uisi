import { NextResponse } from "next/server";
import { UserModel } from "@/models";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const groupId = searchParams.get("groupId");

    const users = await UserModel.getAll({
      role,
      mGroupsId: groupId ? Number(groupId) : undefined,
    });

    // Sanitasi: Jangan kirim hash password
    const safeUsers = users.map((u) => {
      const { password, ...safe } = u as any;
      return safe;
    });

    return NextResponse.json({
      success: true,
      data: safeUsers,
    });
  } catch (error: any) {
    console.error("Error pada GET /api/users:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data pengguna.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
