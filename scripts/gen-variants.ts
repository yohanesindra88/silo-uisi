/**
 * Pembangkit varian gambar untuk aset situs di public/.
 *
 *   npm run media:variants   -> bangkitkan/segarkan public/_m/
 *   npm run media:check      -> tanpa menulis, gagal bila ada yang kurang
 *
 * Dijalankan otomatis lewat "prebuild"/"predev", sehingga `next build` di stage
 * builder Dockerfile ikut membangkitkannya tanpa perubahan Dockerfile.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  VARIANT_DIR_NAME,
  variantBasePath,
} from "../src/utils/media-path";
import {
  expectedVariantFiles,
  renderVariants,
} from "../src/utils/media-variants";
import { REQUIRED_ASSETS } from "./media-manifest";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
const VARIANT_DIR = path.join(PUBLIC_DIR, VARIANT_DIR_NAME);

/** Ekstensi yang diberi varian. .svg sengaja tidak ada di sini. */
const RASTER_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif", ".tif", ".tiff"]);

/** Direktori di dalam public/ yang tidak ikut dipindai. */
const SKIP_DIRS = new Set([VARIANT_DIR_NAME, "textures"]);

const CHECK_MODE = process.argv.includes("--check");

interface SourceFile {
  /** Path absolut di disk. */
  abs: string;
  /** Path relatif terhadap public/, dengan "/" di depan. */
  rel: string;
}

async function walk(dir: string, relBase = ""): Promise<SourceFile[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const found: SourceFile[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const abs = path.join(dir, entry.name);
    const rel = `${relBase}/${entry.name}`;

    if (entry.isDirectory()) {
      if (relBase === "" && SKIP_DIRS.has(entry.name)) continue;
      found.push(...(await walk(abs, rel)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!RASTER_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    found.push({ abs, rel });
  }

  return found;
}

/**
 * Slugging bersifat lossy: "A&B.jpg" dan "A-B.png" sama-sama jadi "a-b".
 * Tabrakan senyap berarti potret satu orang tertimpa orang lain, jadi ini
 * digagalkan keras alih-alih dibiarkan.
 */
function assertNoCollision(
  seen: Map<string, string>,
  base: string,
  rel: string
): void {
  const previous = seen.get(base);
  if (previous && previous !== rel) {
    throw new Error(
      `Tabrakan slug pada "${base}":\n` +
        `  - ${previous}\n` +
        `  - ${rel}\n` +
        `Ganti nama salah satu berkas sumber.`
    );
  }
  seen.set(base, rel);
}

async function needsRebuild(srcAbs: string, outAbs: string): Promise<boolean> {
  try {
    const [src, out] = await Promise.all([fs.stat(srcAbs), fs.stat(outAbs)]);
    return src.mtimeMs > out.mtimeMs;
  } catch {
    return true;
  }
}

function formatBytes(n: number): string {
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function main(): Promise<void> {
  // 1. Pastikan 34 aset yang dulu hanya ada di Cloudinary sudah di-drop.
  const missing: string[] = [];
  for (const rel of REQUIRED_ASSETS) {
    try {
      await fs.access(path.join(PUBLIC_DIR, rel.replace(/^\//, "")));
    } catch {
      missing.push(rel);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n✗ ${missing.length} aset wajib belum ada di public/:\n` +
        missing.map((m) => `    ${m}`).join("\n") +
        `\n\n  Aset ini dulu hanya hidup di Cloudinary. Salin berkas originalnya\n` +
        `  ke path di atas sebelum melanjutkan, kalau tidak gambar-gambar itu\n` +
        `  akan rusak di situs publik.\n`
    );
    process.exit(1);
  }

  // 2. Pindai seluruh sumber raster di public/.
  const sources = await walk(PUBLIC_DIR);
  const seen = new Map<string, string>();

  let rendered = 0;
  let skipped = 0;
  let sourceBytes = 0;
  let variantBytes = 0;
  const manifest: Record<string, unknown> = {};
  const incomplete: string[] = [];

  for (const src of sources) {
    const base = variantBasePath(src.rel);
    if (!base) continue;
    assertNoCollision(seen, base, src.rel);

    const outDir = path.join(VARIANT_DIR, path.dirname(base));
    const files = expectedVariantFiles(path.basename(base));
    const firstOut = path.join(outDir, files[0]);

    const srcStat = await fs.stat(src.abs);
    sourceBytes += srcStat.size;

    // Mode --check: hanya pastikan semua varian ada.
    if (CHECK_MODE) {
      for (const f of files) {
        try {
          const st = await fs.stat(path.join(outDir, f));
          variantBytes += st.size;
        } catch {
          incomplete.push(`${src.rel} -> ${VARIANT_DIR_NAME}/${path.dirname(base)}/${f}`);
        }
      }
      continue;
    }

    if (!(await needsRebuild(src.abs, firstOut))) {
      skipped += 1;
      for (const f of files) {
        try {
          variantBytes += (await fs.stat(path.join(outDir, f))).size;
        } catch {
          /* akan dibangun ulang di run berikutnya */
        }
      }
      continue;
    }

    const buf = await fs.readFile(src.abs);
    try {
      const variants = await renderVariants(buf, outDir, path.basename(base));
      rendered += 1;
      variantBytes += variants.reduce((a, v) => a + v.bytes, 0);
      manifest[src.rel] = variants.map((v) => ({
        bucket: v.bucket,
        url: `/${VARIANT_DIR_NAME}/${path.dirname(base)}/${v.file}`.replace("/./", "/"),
        width: v.width,
        height: v.height,
        bytes: v.bytes,
      }));
    } catch (err) {
      throw new Error(`Gagal memproses "${src.rel}": ${err instanceof Error ? err.message : err}`);
    }
  }

  if (CHECK_MODE) {
    if (incomplete.length > 0) {
      console.error(
        `\n✗ ${incomplete.length} varian belum dibangkitkan:\n` +
          incomplete.slice(0, 20).map((m) => `    ${m}`).join("\n") +
          (incomplete.length > 20 ? `\n    … dan ${incomplete.length - 20} lainnya` : "") +
          `\n\n  Jalankan: npm run media:variants\n`
      );
      process.exit(1);
    }
    console.log(
      `✓ ${sources.length} sumber, ${sources.length * 3} varian lengkap, ` +
        `${REQUIRED_ASSETS.length}/${REQUIRED_ASSETS.length} aset wajib ada.`
    );
    return;
  }

  if (Object.keys(manifest).length > 0) {
    await fs.mkdir(VARIANT_DIR, { recursive: true });
    const manifestPath = path.join(VARIANT_DIR, "manifest.json");
    let merged = manifest;
    try {
      const existing = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      merged = { ...existing, ...manifest };
    } catch {
      /* manifest pertama */
    }
    await fs.writeFile(manifestPath, JSON.stringify(merged, null, 2));
  }

  console.log(
    `✓ ${sources.length} sumber (${rendered} dibangkitkan, ${skipped} dilewati) ` +
      `-> ${sources.length * 3} varian. ${formatBytes(sourceBytes)} -> ${formatBytes(variantBytes)}`
  );
}

main().catch((err) => {
  console.error(`\n✗ gen-variants gagal: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
