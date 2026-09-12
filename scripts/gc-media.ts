/**
 * Pembersih berkas media yatim.
 *
 *   npx tsx scripts/gc-media.ts              -> dry run (default, aman)
 *   npx tsx scripts/gc-media.ts --delete     -> benar-benar menghapus
 *
 * Berkas yatim muncul ketika user mengunggah lalu meninggalkan formulir tanpa
 * menekan simpan: berkasnya ada di disk, tapi tidak ada baris database yang
 * menunjuknya.
 *
 * SENGAJA manual dan dry-run secara default. Bug pada GC yang berjalan otomatis
 * bisa memakan berkas tugas pada malam sebelum tenggat, dan itu tidak bisa
 * dipulihkan.
 */

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

const MEDIA_ROOT = path.resolve(
  process.env.MEDIA_ROOT || path.join(process.cwd(), "storage", "media")
);
const UPLOADS_DIR = path.join(MEDIA_ROOT, "uploads");

/** Berkas yang lebih muda dari ini dilewati — mungkin sedang dalam proses pengisian form. */
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

const DO_DELETE = process.argv.includes("--delete");

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs)));
    else if (entry.isFile()) out.push(abs);
  }
  return out;
}

/** "3f1c….w600.webp" dan "3f1c….orig.webp" berbagi id yang sama. */
function idOf(fileName: string): string {
  return fileName.replace(/\.(w\d+|orig)\.webp$/i, "").replace(/\.pdf$/i, "");
}

async function main(): Promise<void> {
  const files = await walk(UPLOADS_DIR);
  if (files.length === 0) {
    console.log(`Tidak ada berkas di ${UPLOADS_DIR}.`);
    return;
  }

  // Kumpulkan seluruh id yang masih dirujuk database.
  const referenced = new Set<string>();

  const submissions = await prisma.submission.findMany({ select: { fileUrl: true } });
  for (const row of submissions) {
    if (row.fileUrl?.startsWith("/media/")) referenced.add(idOf(path.basename(row.fileUrl)));
  }

  const assignments = await prisma.assignment.findMany({ select: { attachmentUrl: true } });
  for (const row of assignments) {
    if (row.attachmentUrl?.startsWith("/media/")) {
      referenced.add(idOf(path.basename(row.attachmentUrl)));
    }
  }

  const docs = await prisma.documentation.findMany({ select: { imageUrl: true } });
  for (const row of docs) {
    if (row.imageUrl?.startsWith("/media/")) referenced.add(idOf(path.basename(row.imageUrl)));
  }

  const now = Date.now();
  const orphans: string[] = [];
  let orphanBytes = 0;

  for (const abs of files) {
    const id = idOf(path.basename(abs));
    if (referenced.has(id)) continue;

    const st = await fs.stat(abs);
    if (now - st.mtimeMs < MIN_AGE_MS) continue;

    orphans.push(abs);
    orphanBytes += st.size;
  }

  console.log(`Total berkas   : ${files.length}`);
  console.log(`Dirujuk DB     : ${referenced.size} id`);
  console.log(`Yatim (>24 jam): ${orphans.length} berkas, ${(orphanBytes / 1024 / 1024).toFixed(1)} MB`);

  if (orphans.length === 0) return;

  for (const abs of orphans.slice(0, 20)) {
    console.log(`   ${path.relative(MEDIA_ROOT, abs)}`);
  }
  if (orphans.length > 20) console.log(`   … dan ${orphans.length - 20} lainnya`);

  if (!DO_DELETE) {
    console.log(`\nDRY RUN — tidak ada yang dihapus. Jalankan dengan --delete untuk menghapus.`);
    return;
  }

  for (const abs of orphans) await fs.unlink(abs);
  console.log(`\n✓ ${orphans.length} berkas yatim dihapus.`);
}

main()
  .catch((err) => {
    console.error("gc-media gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
