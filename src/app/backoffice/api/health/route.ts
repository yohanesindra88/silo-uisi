import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health probe untuk Docker HEALTHCHECK dan Cloudflare Tunnel.
 *
 * Endpoint ini selalu membalas 200 selama proses Next.js masih hidup dan mampu
 * melayani request. Status database dilaporkan sebagai field terpisah, bukan
 * sebagai kegagalan probe: jika Postgres sedang restart kita tidak ingin Docker
 * ikut me-restart container aplikasi (dan memutus tunnel) padahal aplikasinya sehat.
 */
export async function GET() {
  let database: "up" | "down" = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  return NextResponse.json(
    {
      status: "ok",
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
