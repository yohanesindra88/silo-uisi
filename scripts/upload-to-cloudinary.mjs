import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'Aethera SILO UISI 2026';

let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  // Parse cloudinary://key:secret@cloudname
  try {
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      apiKey = match[1];
      apiSecret = match[2];
      cloudName = match[3];
    }
  } catch (e) {}
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('\n❌ ERROR: Kredensial Cloudinary belum lengkap!');
  console.error('Harap pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET diisi.\n');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.webp', '.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext)) {
        const relativePath = path.relative(baseDir, fullPath);
        results.push({ fullPath, relativePath });
      }
    }
  });
  
  return results;
}

async function uploadImages() {
  console.log(`🚀 Mengunggah ke Cloud Name: "${cloudName}"...`);
  console.log(`📁 Folder Target: "${CLOUDINARY_FOLDER}"`);
  const files = getFilesRecursively(PUBLIC_DIR);
  console.log(`📋 Ditemukan ${files.length} file gambar untuk diunggah.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const { fullPath, relativePath } of files) {
    const pathNoExt = relativePath.replace(/\.[^/.]+$/, '');
    const publicId = `${CLOUDINARY_FOLDER}/${pathNoExt.replace(/\\/g, '/')}`;

    try {
      console.log(`⏳ Uploading [${relativePath}] -> public_id: "${publicId}"...`);
      const result = await cloudinary.uploader.upload(fullPath, {
        public_id: publicId,
        overwrite: true,
        resource_type: 'auto'
      });
      console.log(`  ✅ Sukses: ${result.secure_url}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Gagal mengunggah ${relativePath}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n🎉 Upload selesai! Sukses: ${successCount}, Gagal: ${failCount}`);
}

uploadImages();
