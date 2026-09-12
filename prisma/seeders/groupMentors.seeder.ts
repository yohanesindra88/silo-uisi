import { PrismaClient } from "@prisma/client";

export async function seedGroupMentors(prisma: PrismaClient) {
  console.log("  🤝 Seeding groups_mentors (Dynamic Mentor-Group assignment)...");

  // Cari mentor dan groups yang ada
  const mentors = await prisma.user.findMany({
    where: { role: "mentor", deletedAt: null },
  });

  const groups = await prisma.group.findMany({
    where: { deletedAt: null },
  });

  if (mentors.length === 0 || groups.length === 0) {
    console.log("     ℹ️ Mentor atau kelompok belum tersedia, dilewati.");
    return;
  }

  let assignedCount = 0;
  for (const mentor of mentors) {
    // Cari group yang sesuai: prioritaskan mGroupsId mentor, atau match keyword nama
    let matchedGroup = groups.find((g) => g.id === mentor.mGroupsId);
    if (!matchedGroup) {
      if (mentor.nama.toLowerCase().includes("sirius")) {
        matchedGroup = groups.find((g) => g.name.toLowerCase().includes("sirius"));
      } else if (mentor.nama.toLowerCase().includes("vega")) {
        matchedGroup = groups.find((g) => g.name.toLowerCase().includes("vega"));
      } else if (mentor.nama.toLowerCase().includes("canopus")) {
        matchedGroup = groups.find((g) => g.name.toLowerCase().includes("canopus"));
      }
    }

    const targetGroup = matchedGroup || groups[0];

    const existing = await prisma.groupMentor.findFirst({
      where: {
        mUsersId: mentor.id,
        mGroupsId: targetGroup.id,
      },
    });

    if (!existing) {
      await prisma.groupMentor.create({
        data: {
          mUsersId: mentor.id,
          mGroupsId: targetGroup.id,
        },
      });
      assignedCount++;
    }
  }

  console.log(`     ✅ Berhasil menghubungkan ${assignedCount} relasi mentor-kelompok.`);
}
