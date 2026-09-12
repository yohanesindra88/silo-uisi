import { PrismaClient } from "@prisma/client";
import { seedAttributes } from "../../src/scripts/seed-attributes";

export async function seedAttributesRunner(prisma: PrismaClient) {
  console.log("  📦 Seeding m_attributes (Insert or Update)...");
  await seedAttributes();
}
