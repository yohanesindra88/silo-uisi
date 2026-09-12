# syntax=docker/dockerfile:1.7

# =============================================================================
# SILO UISI — Next.js 16 + Prisma 6 production image
#
# Stage layout:
#   base     -> runtime OS deps yang dipakai bersama semua stage
#   deps     -> npm ci (termasuk devDependencies, dibutuhkan untuk build)
#   builder  -> next build  => .next/standalone
#   migrator -> Prisma CLI + seeder (dipakai oleh service "migrate" sekali jalan)
#   runner   -> image akhir: hanya standalone server + aset statis, non-root
# =============================================================================

ARG NODE_IMAGE=node:24.21-alpine3.23

# -----------------------------------------------------------------------------
# base
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base

# openssl + libc6-compat: dibutuhkan oleh query engine Prisma di Alpina (musl).
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

# -----------------------------------------------------------------------------
# deps — install dependency lengkap (dev + prod)
# -----------------------------------------------------------------------------
FROM base AS deps

# Schema disalin lebih dulu karena "postinstall": "prisma generate" membutuhkannya.
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --include=dev

# -----------------------------------------------------------------------------
# builder — next build (menghasilkan .next/standalone)
# -----------------------------------------------------------------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabel NEXT_PUBLIC_* di-inline ke bundle browser saat build, jadi harus
# tersedia di sini — bukan saat runtime.
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
ARG NEXT_PUBLIC_CLOUDINARY_FOLDER=""
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME} \
    NEXT_PUBLIC_CLOUDINARY_FOLDER=${NEXT_PUBLIC_CLOUDINARY_FOLDER}

# PrismaClient di src/utils/prisma.ts diinstansiasi saat modul di-import, dan
# Next mengimpor setiap route handler ketika mengumpulkan metadata build.
# URL placeholder ini hanya memuaskan validasi konstruktor — tidak ada koneksi
# database yang dibuka selama build.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    NODE_ENV=production

RUN npx prisma generate && npm run build

# -----------------------------------------------------------------------------
# migrator — one-shot: prisma migrate deploy / db push (+ seed opsional)
# -----------------------------------------------------------------------------
FROM base AS migrator

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
# Seeder mengimpor ../../src/utils/jwt dan ../../src/scripts/seed-attributes.
COPY src ./src
# scripts/ dipakai untuk perawatan manual, mis. GC berkas media yatim:
#   docker compose run --rm --entrypoint sh migrate -c 'npx tsx scripts/gc-media.ts'
COPY scripts ./scripts
COPY docker/migrate.sh /usr/local/bin/migrate

RUN chmod +x /usr/local/bin/migrate && chown -R node:node /app
USER node

ENTRYPOINT ["/usr/local/bin/migrate"]

# -----------------------------------------------------------------------------
# runner — image produksi
# -----------------------------------------------------------------------------
FROM base AS runner

RUN apk add --no-cache curl tini

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# next build --output standalone sudah memuat node_modules minimal + server.js.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Jaring pengaman: file tracing Next kadang melewatkan query engine Prisma
# (.so.node) karena di-resolve secara dinamis.
# sharp dan @img TIDAK perlu di-copy — sudah diverifikasi ikut ter-trace ke
# dalam .next/standalone; menyalinnya ulang hanya menambah layer duplikat.
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# npm memasang prebuilt libvips untuk glibc DAN musl. Image ini Alpine, jadi
# hanya varian musl yang pernah dimuat — yang glibc murni pemborosan ~16 MB.
# Kalau base image suatu saat pindah ke Debian/glibc, hapus baris ini.
RUN rm -rf ./node_modules/@img/sharp-libvips-linux-x64 \
           ./node_modules/@img/sharp-linux-x64

# Direktori cache ISR/Image Optimization dan titik mount media harus writable
# oleh user non-root. Membuat /app/storage/media di sini berarti container tetap
# start walau bind mount terlupa — assertWritable() yang akan berteriak.
RUN mkdir -p .next/cache /app/storage/media \
    && chown -R node:node .next /app/storage

USER node

EXPOSE 3000

# Probe menembak path asli; rewrite /api/* -> /backoffice/api/* tidak diandalkan.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/backoffice/api/health || exit 1

# tini sebagai PID 1 supaya SIGTERM dari `docker stop` diteruskan ke Node
# dan zombie process ter-reap.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
