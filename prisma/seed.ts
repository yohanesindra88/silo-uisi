import { PrismaClient } from "@prisma/client";
import { seedGroups } from "./seeders/groups.seeder";
import { seedSessions } from "./seeders/sessions.seeder";
import { seedUsers } from "./seeders/users.seeder";
import { seedGroupMentors } from "./seeders/groupMentors.seeder";
import { seedAttendances } from "./seeders/attendances.seeder";
import { seedAssignments } from "./seeders/assignments.seeder";
import { seedSubmissions } from "./seeders/submissions.seeder";
import { seedAttributesRunner } from "./seeders/attributes.seeder";
import { seedDocumentations } from "./seeders/documentations.seeder";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 =====================================");
  console.log("   Memulai Proses Seeding Database");
  console.log("=========================================");

  // Eksekusi seeder berurutan sesuai relasi database
  await seedGroups(prisma);
  await seedSessions(prisma);
  await seedUsers(prisma);
  await seedGroupMentors(prisma);
  await seedAttendances(prisma);
  await seedAssignments(prisma);
  await seedSubmissions(prisma);
  await seedAttributesRunner(prisma);
  await seedDocumentations(prisma);

  console.log("=========================================");
  console.log("✅ Seluruh proses seeding selesai.");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
