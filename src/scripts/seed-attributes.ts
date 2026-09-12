import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Format Date to YYYY-MM-DD string in local/Jakarta timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTargetDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

export async function ensureAttributeTables() {
  console.log("🛠️ Memeriksa dan memastikan indeks tabel m_attributes & t_attribute_checks...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS m_attributes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        target_date DATE NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'individu',
        created_by INT REFERENCES m_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_attribute_checks (
        id SERIAL PRIMARY KEY,
        attribute_id INT NOT NULL REFERENCES m_attributes(id) ON DELETE CASCADE,
        maba_id INT NULL REFERENCES m_users(id) ON DELETE CASCADE,
        group_id INT NULL REFERENCES m_groups(id) ON DELETE CASCADE,
        checked_by INT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
        is_brought BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT NULL,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_check_individu UNIQUE (attribute_id, maba_id),
        CONSTRAINT uq_check_kelompok UNIQUE (attribute_id, group_id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_attributes_target_date ON m_attributes(target_date);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_attr_checks_maba ON t_attribute_checks(maba_id);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_attr_checks_group ON t_attribute_checks(group_id);
  `);

  console.log("✅ Tabel m_attributes & t_attribute_checks siap digunakan.");
}

export async function seedAttributes() {
  await ensureAttributeTables();

  const todayStr = getTodayDateString();
  const todayDate = parseTargetDate(todayStr);

  console.log(`🌱 Menjalankan seeder master atribut untuk tanggal: ${todayStr}...`);

  // Bersihkan data atribut uji coba/test jika ada
  await prisma.attribute.deleteMany({
    where: {
      OR: [
        { name: { contains: "E2E Test" } },
        { name: { contains: "Uji Coba" } },
      ],
    },
  });

  // Cari user admin sebagai creator
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["admin", "panitia"] }, deletedAt: null },
  });

  const dummyAttributes = [
    // 3 Atribut Individu
    {
      name: "Name Tag Resmi Ukuran B2",
      description: "Wajib dikalungkan di leher dengan lanyard resmi SILO UISI 2026.",
      targetDate: todayDate,
      type: "individu",
      createdBy: adminUser?.id || null,
    },
    {
      name: "Buku Penugasan Angkatan",
      description: "Buku tulis bersampul cokelat rapi bertuliskan identitas diri dan nama gugus kelompok.",
      targetDate: todayDate,
      type: "individu",
      createdBy: adminUser?.id || null,
    },
    {
      name: "Pita Warna Kelompok",
      description: "Pita satin terikat di lengan kanan sesuai warna penanda identitas gugus masing-masing.",
      targetDate: todayDate,
      type: "individu",
      createdBy: adminUser?.id || null,
    },
    // 2 Atribut Kelompok
    {
      name: "Trash Bag / Kantong Sampah Mini",
      description: "Minimal 2 lembar kantong sampah ukuran sedang per kelompok untuk operasi semut dan kebersihan area.",
      targetDate: todayDate,
      type: "kelompok",
      createdBy: adminUser?.id || null,
    },
    {
      name: "Banner Nama Kelompok",
      description: "Banner kain atau karton nama gugus untuk penanda barisan dan identitas kelompok saat mobilisasi.",
      targetDate: todayDate,
      type: "kelompok",
      createdBy: adminUser?.id || null,
    },
  ];

  for (const item of dummyAttributes) {
    const existing = await prisma.attribute.findFirst({
      where: {
        name: item.name,
        targetDate: item.targetDate,
        deletedAt: null,
      },
    });

    if (existing) {
      console.log(`   ℹ️ Atribut [${item.type}] "${item.name}" sudah ada (ID: ${existing.id}), memperbarui data.`);
      await prisma.attribute.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          type: item.type,
          createdBy: item.createdBy,
        },
      });
    } else {
      const created = await prisma.attribute.create({
        data: {
          name: item.name,
          description: item.description,
          targetDate: item.targetDate,
          type: item.type,
          createdBy: item.createdBy,
        },
      });
      console.log(`   ✨ Berhasil membuat atribut [${item.type}] "${created.name}" (ID: ${created.id})`);
    }
  }

  // 3. Seeding Checklist Hasil Pemeriksaan Atribut oleh Mentor
  console.log("   📋 Menjalankan seeder hasil verifikasi atribut (t_attribute_checks)...");

  // Ambil atribut yang baru saja di-seed
  const seededAttrs = await prisma.attribute.findMany({
    where: { targetDate: todayDate, deletedAt: null },
  });
  const nameTagAttr = seededAttrs.find((a) => a.name.includes("Name Tag"));
  const bukuAttr = seededAttrs.find((a) => a.name.includes("Buku Penugasan"));
  const pitaAttr = seededAttrs.find((a) => a.name.includes("Pita Warna"));
  const trashBagAttr = seededAttrs.find((a) => a.name.includes("Trash Bag"));
  const bannerAttr = seededAttrs.find((a) => a.name.includes("Banner Nama"));

  // Cari mentor dan maba
  const mentorSarah = await prisma.user.findFirst({ where: { username: "mentor01" } });
  const mentorDimas = await prisma.user.findFirst({ where: { username: "mentor02" } });
  const mentorPutri = await prisma.user.findFirst({ where: { username: "mentor03" } });

  const mabaAditia = await prisma.user.findFirst({ where: { username: "302261001" } });
  const mabaNabila = await prisma.user.findFirst({ where: { username: "302261002" } });
  const mabaBagus = await prisma.user.findFirst({ where: { username: "302261006" } });

  const mabaRizky = await prisma.user.findFirst({ where: { username: "302261003" } });
  const mabaFajar = await prisma.user.findFirst({ where: { username: "302261005" } });
  const mabaSiti = await prisma.user.findFirst({ where: { username: "302261007" } });

  const mabaDewi = await prisma.user.findFirst({ where: { username: "302261004" } });
  const mabaAndi = await prisma.user.findFirst({ where: { username: "302261008" } });
  const mabaTri = await prisma.user.findFirst({ where: { username: "302261009" } });

  const groupSirius = await prisma.group.findFirst({ where: { name: { contains: "Sirius" } } });
  const groupVega = await prisma.group.findFirst({ where: { name: { contains: "Vega" } } });
  const groupCanopus = await prisma.group.findFirst({ where: { name: { contains: "Canopus" } } });

  const individuChecks: Array<{
    attrId?: number;
    mabaId?: number;
    checkerId?: number;
    isBrought: boolean;
    notes?: string | null;
  }> = [
    // Sirius (Mentor Sarah)
    { attrId: nameTagAttr?.id, mabaId: mabaAditia?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaAditia?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaAditia?.id, checkerId: mentorSarah?.id, isBrought: true },

    { attrId: nameTagAttr?.id, mabaId: mabaNabila?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaNabila?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaNabila?.id, checkerId: mentorSarah?.id, isBrought: true },

    { attrId: nameTagAttr?.id, mabaId: mabaBagus?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaBagus?.id, checkerId: mentorSarah?.id, isBrought: false, notes: "Ketinggalan di kosan, diminta bawa besok" },
    { attrId: pitaAttr?.id, mabaId: mabaBagus?.id, checkerId: mentorSarah?.id, isBrought: true },

    // Vega (Mentor Dimas)
    { attrId: nameTagAttr?.id, mabaId: mabaRizky?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaRizky?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaRizky?.id, checkerId: mentorDimas?.id, isBrought: true },

    { attrId: nameTagAttr?.id, mabaId: mabaFajar?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaFajar?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaFajar?.id, checkerId: mentorDimas?.id, isBrought: false, notes: "Pita tertinggal di tas lain" },

    { attrId: nameTagAttr?.id, mabaId: mabaSiti?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaSiti?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaSiti?.id, checkerId: mentorDimas?.id, isBrought: true },

    // Canopus (Mentor Putri)
    { attrId: nameTagAttr?.id, mabaId: mabaDewi?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaDewi?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaDewi?.id, checkerId: mentorPutri?.id, isBrought: true },

    { attrId: nameTagAttr?.id, mabaId: mabaAndi?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaAndi?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaAndi?.id, checkerId: mentorPutri?.id, isBrought: true },

    { attrId: nameTagAttr?.id, mabaId: mabaTri?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: bukuAttr?.id, mabaId: mabaTri?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: pitaAttr?.id, mabaId: mabaTri?.id, checkerId: mentorPutri?.id, isBrought: true },
  ];

  for (const c of individuChecks) {
    if (c.attrId && c.mabaId && c.checkerId) {
      await prisma.attributeCheck.upsert({
        where: {
          attributeId_mabaId: {
            attributeId: c.attrId,
            mabaId: c.mabaId,
          },
        },
        create: {
          attributeId: c.attrId,
          mabaId: c.mabaId,
          groupId: null,
          checkedBy: c.checkerId,
          isBrought: c.isBrought,
          notes: c.notes || null,
        },
        update: {
          checkedBy: c.checkerId,
          isBrought: c.isBrought,
          notes: c.notes || null,
          checkedAt: new Date(),
        },
      });
    }
  }

  // Kelompok checks
  const kelompokChecks: Array<{
    attrId?: number;
    groupId?: number;
    checkerId?: number;
    isBrought: boolean;
    notes?: string | null;
  }> = [
    { attrId: trashBagAttr?.id, groupId: groupSirius?.id, checkerId: mentorSarah?.id, isBrought: true },
    { attrId: bannerAttr?.id, groupId: groupSirius?.id, checkerId: mentorSarah?.id, isBrought: true, notes: "Banner rapi dan lengkap" },

    { attrId: trashBagAttr?.id, groupId: groupVega?.id, checkerId: mentorDimas?.id, isBrought: true },
    { attrId: bannerAttr?.id, groupId: groupVega?.id, checkerId: mentorDimas?.id, isBrought: true, notes: "Banner kreatif" },

    { attrId: trashBagAttr?.id, groupId: groupCanopus?.id, checkerId: mentorPutri?.id, isBrought: true },
    { attrId: bannerAttr?.id, groupId: groupCanopus?.id, checkerId: mentorPutri?.id, isBrought: true, notes: "Banner rapi dan lengkap" },
  ];

  for (const kc of kelompokChecks) {
    if (kc.attrId && kc.groupId && kc.checkerId) {
      await prisma.attributeCheck.upsert({
        where: {
          attributeId_groupId: {
            attributeId: kc.attrId,
            groupId: kc.groupId,
          },
        },
        create: {
          attributeId: kc.attrId,
          mabaId: null,
          groupId: kc.groupId,
          checkedBy: kc.checkerId,
          isBrought: kc.isBrought,
          notes: kc.notes || null,
        },
        update: {
          checkedBy: kc.checkerId,
          isBrought: kc.isBrought,
          notes: kc.notes || null,
          checkedAt: new Date(),
        },
      });
    }
  }

  console.log("=================================================");
  console.log("✅ Seeder Master Atribut & Checklist Berhasil Selesai!");
  console.log("=================================================");
}

async function run() {
  try {
    await seedAttributes();
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding master atribut:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  run();
}
