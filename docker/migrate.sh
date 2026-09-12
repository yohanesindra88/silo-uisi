#!/bin/sh
# =============================================================================
# Entrypoint service "migrate" — dijalankan sekali setiap `docker compose up`,
# sebelum container aplikasi boleh start.
#
# Env:
#   DATABASE_URL   (wajib)  connection string Postgres
#   RUN_SEED       (opsional) "true" untuk menjalankan `prisma db seed`
#   DB_WAIT_LIMIT  (opsional) detik maksimum menunggu database, default 60
# =============================================================================
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL belum di-set." >&2
  exit 1
fi

echo "==> Menunggu database siap menerima koneksi..."
WAIT_LIMIT="${DB_WAIT_LIMIT:-60}"
elapsed=0
until echo "SELECT 1;" | npx --no-install prisma db execute --url "$DATABASE_URL" --stdin >/dev/null 2>&1; do
  if [ "$elapsed" -ge "$WAIT_LIMIT" ]; then
    echo "FATAL: database tidak merespons setelah ${WAIT_LIMIT}s." >&2
    exit 1
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done
echo "==> Database siap (setelah ${elapsed}s)."

# Migrasi versioned adalah jalur yang benar untuk produksi. Proyek ini belum
# punya prisma/migrations, jadi kita fallback ke `db push` agar deploy pertama
# tetap jalan. Begitu Anda membuat migrasi (`npm run db:migrate`), cabang
# pertama yang akan dipakai secara otomatis.
if [ -d /app/prisma/migrations ] && [ -n "$(ls -A /app/prisma/migrations 2>/dev/null)" ]; then
  echo "==> Menjalankan prisma migrate deploy..."
  npx --no-install prisma migrate deploy
else
  echo "==> PERINGATAN: prisma/migrations tidak ditemukan."
  echo "    Fallback ke 'prisma db push' (sinkronisasi schema tanpa histori migrasi)."
  echo "    Untuk produksi jangka panjang, buat migrasi dengan: npm run db:migrate"
  npx --no-install prisma db push --skip-generate
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "==> RUN_SEED=true, menjalankan seeder..."
  npx --no-install prisma db seed
else
  echo "==> Seeding dilewati (set RUN_SEED=true untuk menjalankannya)."
fi

echo "==> Migrasi selesai."
