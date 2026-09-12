# Deployment Produksi — SILO UISI (Docker + Cloudflare Tunnel)

Stack self-managed: seluruh aplikasi berjalan di server Anda sendiri, dan
satu-satunya jalan masuk dari internet adalah Cloudflare Tunnel.

```
Internet ──> Cloudflare DNS (proxied / orange cloud)
                   │
                   ▼
            Cloudflare Edge
                   ▲
                   │ koneksi keluar (QUIC/443) — dimulai dari server Anda
          ┌────────┴─────────────────────────────────────┐
          │  cloudflared        network: edge            │
          │       │                                      │
          │       └── http://app:3000                    │
          │              app (Next.js standalone)        │
          │                   │      network: internal   │
          │                   └── postgres  (no internet)│
          └──────────────────────────────────────────────┘
                        Server / VPS Anda
```

Tidak ada port yang dipublikasikan ke host. Tidak perlu membuka firewall,
port forwarding, IP publik, atau sertifikat TLS di server — TLS diterminasi di
edge Cloudflare.

---

## 1. Prasyarat

- Docker Engine 24+ dan Docker Compose v2
- Domain yang nameserver-nya sudah diarahkan ke Cloudflare
- Akses ke Cloudflare Zero Trust Dashboard

---

## 2. Membuat Cloudflare Tunnel

1. Buka **Cloudflare Zero Trust → Networks → Tunnels → Create a tunnel**.
2. Pilih konektor **Cloudflared**, beri nama (mis. `silo-uisi-prod`), lalu **Save**.
3. Pada halaman instalasi, pilih tab **Docker**. Salin string panjang yang
   berada setelah flag `--token` — itulah `CLOUDFLARE_TUNNEL_TOKEN`.
   (Jangan salin seluruh perintah `docker run`; compose di repo ini sudah
   menjalankan cloudflared untuk Anda.)
4. Lanjut ke tab **Public Hostname**, lalu tambahkan:

   | Field      | Nilai                         |
   | ---------- | ----------------------------- |
   | Subdomain  | `silo` (atau kosong untuk apex) |
   | Domain     | `domainanda.ac.id`            |
   | Type       | `HTTP`                        |
   | URL        | `app:3000`                    |

   `app` adalah nama service di `docker-compose.yml`; cloudflared me-resolve-nya
   lewat DNS internal Docker. Gunakan **HTTP**, bukan HTTPS — hop ini berada di
   dalam jaringan Docker dan sudah terenkripsi ujung-ke-ujung oleh tunnel.

5. Cloudflare otomatis membuat record DNS `CNAME` yang **proxied** (awan oranye).
   Tidak ada record A/AAAA yang perlu dibuat manual.

---

## 2b. Menyiapkan direktori media (WAJIB sebelum `up` pertama)

Berkas yang diunggah pengguna disimpan di direktori host, bukan di dalam
container, supaya selamat dari rebuild dan mudah di-backup dengan rsync/tar.

```bash
sudo mkdir -p /srv/silo/media/uploads /srv/silo/media/.tmp
sudo chown -R 1000:1000 /srv/silo/media
sudo chmod -R 750 /srv/silo/media
```

**`chown 1000:1000` itu wajib, bukan saran.** Container berjalan sebagai user
non-root `node` (uid 1000), dan bind mount meneruskan uid secara numerik tanpa
remapping. Kalau direktori dimiliki root, situs tetap tampil normal tetapi
setiap unggahan gagal dengan 500 (EACCES) — gejala yang membingungkan karena
tidak ada yang terlihat rusak sampai ada yang mencoba mengunggah.

> Di mesin pengembangan, uid 1000 biasanya user Anda sendiri sehingga semuanya
> "kebetulan jalan". Di server, user deploy sering uid 1001+ atau direktori
> dibuat root lewat systemd. Jangan lewati langkah ini di sana.

Pada host SELinux (RHEL/Fedora/Rocky) tambahkan opsi `:z` pada mount.

Verifikasi setelah stack berjalan:

```bash
docker compose exec app sh -c 'id && touch /app/storage/media/.wtest && rm /app/storage/media/.wtest && echo WRITABLE'
# harus: uid=1000(node) ... WRITABLE
```

---

## 3. Konfigurasi environment

```bash
cp .env.example .env
chmod 600 .env

# Bangkitkan secret yang kuat
openssl rand -base64 32   # -> POSTGRES_PASSWORD
openssl rand -base64 48   # -> JWT_SECRET
```

Isi `.env`, minimal: `POSTGRES_PASSWORD`, `JWT_SECRET`,
`CLOUDFLARE_TUNNEL_TOKEN`, dan kredensial `CLOUDINARY_*`.

> **Penting:** `src/utils/jwt.ts` memiliki fallback secret yang di-hardcode.
> Selama `JWT_SECRET` tidak di-set, siapa pun yang bisa membaca source code
> dapat menempa token login untuk role `admin`. Secret ini wajib diisi, dan
> sebaiknya baris fallback tersebut dihapus dari kode.

---

## 4. Menjalankan stack

```bash
docker compose up -d --build
```

Urutan startup dijamin oleh compose:

1. `postgres` start → tunggu sampai `pg_isready` lolos
2. `migrate` jalan sekali → sinkronisasi schema → exit 0
3. `app` start → tunggu `HEALTHCHECK` lolos
4. `cloudflared` start → tunnel terhubung

Jika `migrate` gagal, `app` tidak akan pernah start — schema yang rusak tidak
akan pernah dilayani ke pengguna.

Cek status:

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f cloudflared   # cari "Registered tunnel connection"
```

### Mengisi data awal (sekali saja)

```bash
RUN_SEED=true docker compose up migrate
```

Seeder bersifat destruktif terhadap sebagian data. Jangan biarkan
`RUN_SEED=true` di `.env` untuk lingkungan produksi.

---

## 5. Operasional harian

```bash
# Deploy versi baru setelah git pull
docker compose up -d --build

# Rolling restart aplikasi saja
docker compose restart app

# Log
docker compose logs -f --tail=100 app

# Health check manual
docker compose exec app curl -s localhost:3000/backoffice/api/health

# Prisma Studio sementara (jangan biarkan terbuka)
docker compose run --rm -p 127.0.0.1:5555:5555 migrate \
  sh -c 'npx prisma studio --hostname 0.0.0.0'
```

### Backup database

Direktori `./backups` sudah di-mount ke container postgres.

```bash
# Backup
docker compose exec postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /backups/silo-$(date +%F-%H%M).dump'

# Restore
docker compose exec postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /backups/NAMA_FILE.dump'
```

Jadwalkan lewat cron host, dan salin hasilnya ke luar server.

### Backup berkas media

Database dan direktori media adalah pasangan: `Submission.fileUrl` dan
`Documentation.imageUrl` menunjuk berkas di sana. **Dump Postgres dulu, media
kedua.** Media bersifat append-only, jadi snapshot media yang diambil *setelah*
dump adalah superset (ada beberapa berkas yatim — tidak berbahaya). Urutan
terbalik menghasilkan baris yang menunjuk berkas yang tidak ikut ter-backup.

```bash
sudo tar -C /srv/silo --numeric-owner -czf /srv/backups/media-$(date +%F).tar.gz media
# atau inkremental ke luar server
rsync -aHAX --numeric-ids --delete /srv/silo/media/ backup@host:/backups/silo/media/
```

`--numeric-owner` / `--numeric-ids` esensial: mempertahankan uid 1000 supaya
restore tidak diam-diam menciptakan ulang masalah EACCES di atas.

### Membersihkan berkas yatim

Pengguna bisa mengunggah lalu meninggalkan formulir, meninggalkan berkas tanpa
baris database. Pembersihnya manual dan dry-run secara default:

```bash
# lihat saja
docker compose run --rm --entrypoint sh migrate -c 'npx tsx scripts/gc-media.ts'
# benar-benar hapus
docker compose run --rm --entrypoint sh migrate -c 'npx tsx scripts/gc-media.ts --delete'
```

Berkas yang lebih muda dari 24 jam selalu dilewati. Sengaja tidak otomatis:
bug pada GC yang berjalan sendiri bisa memakan berkas tugas pada malam sebelum
tenggat, dan itu tidak bisa dipulihkan.

---

## 6. Migrasi database

Saat ini repo belum punya direktori `prisma/migrations`, sehingga service
`migrate` melakukan fallback ke `prisma db push`. Itu cukup untuk deploy
pertama, tapi **tidak punya histori dan tidak bisa di-rollback**.

Sebelum rilis serius, buat migrasi versioned di mesin development:

```bash
npm run db:migrate -- --name init
git add prisma/migrations && git commit -m "chore: initial prisma migration"
```

Begitu direktori itu ada, `docker/migrate.sh` otomatis beralih ke
`prisma migrate deploy` — tanpa perubahan konfigurasi apa pun.

---

## 6b. Media & gambar

Aplikasi ini tidak lagi memakai Cloudinary. Ada **dua jenis media** dengan
mekanisme berbeda — perbedaan ini penting saat menambah aset baru:

| | Aset situs | Unggahan pengguna |
|---|---|---|
| Contoh | logo sponsor, foto panitia, `public/fotoAnggota/` | bukti tugas, foto galeri dari admin |
| Sumber kebenaran | git | disk host (`/srv/silo/media`) |
| Lokasi | `public/`, varian di `public/_m/` | bind mount |
| Disajikan oleh | static handler Next | route `/media/[...path]` |
| Perlu backup | tidak (git) | **ya** |

### Menambah aset situs baru

Taruh berkasnya di `public/`, lalu build ulang. Varian `.webp` dibangkitkan
otomatis oleh `prebuild`:

```bash
npm run media:variants   # bangkitkan varian
npm run media:check      # pastikan lengkap; dipakai sebagai gerbang sebelum deploy
```

Ukuran yang tersedia: `w600`, `w1000`, dan `orig` (dibatasi 2000px). Komponen
memilihnya lewat `getMediaUrl(path, lebar)`.

> **Berkas SVG disajikan apa adanya**, tanpa varian — aman karena berasal dari
> repo. Unggahan SVG dari pengguna **selalu ditolak**: SVG bisa memuat
> `<script>`, dan menyajikannya dari origin sendiri berarti memberi eksekusi
> skrip same-origin. Batas ini ditegakkan di dua tempat: tabel magic byte pada
> route unggah, dan daftar ekstensi pada route `/media/*`.

### Galeri dokumentasi

Galeri kini dikelola dari **Admin → Dokumentasi** (`/admin/dokumentasi`), bukan
dari array hardcoded. Admin/panitia mengunggah gambar dan perubahannya langsung
tampil di `/` dan `/galeri`. Array lama di `DokumentasiGallery.tsx` tetap ada
sebagai data cadangan bila database belum di-seed.

### Batas unggahan

Format: JPG, PNG, WebP, dan PDF (PDF hanya untuk pengumpulan tugas).
Maksimum 8 MB per berkas (`MEDIA_MAX_BYTES`), 20 unggahan per jam per pengguna.
Setiap gambar di-encode ulang lewat sharp — itu sekaligus membuang metadata
EXIF, termasuk koordinat GPS yang menempel pada foto dari HP.

---

## 7. Catatan arsitektur

**Kenapa tidak ada `ports:` di service `app`?**
Aplikasi hanya dijangkau cloudflared melalui network Docker. Mempublikasikan
port ke host akan membuka jalur yang melewati Cloudflare (bypass WAF, rate
limit, dan Access policy). Untuk debug lokal, buka sementara dan batasi ke
loopback:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

**Kenapa network dipisah `internal` dan `edge`?**
Network `internal` dideklarasikan `internal: true`, artinya tidak punya rute ke
internet sama sekali. Postgres hanya berada di sana — tidak bisa dihubungi dari
luar, dan tidak bisa menghubungi luar. `cloudflared` hanya berada di `edge`,
sehingga proses yang terekspos ke internet tidak punya jalur jaringan apa pun
ke database. Hanya `app` yang berada di kedua network.

**Kenapa `NEXT_PUBLIC_*` jadi build arg, bukan environment runtime?**
Next.js meng-inline variabel `NEXT_PUBLIC_*` ke dalam bundle JavaScript browser
pada saat `next build`. Menaruhnya di `environment:` tidak akan berefek pada
kode yang berjalan di browser. Setiap perubahan nilainya mengharuskan rebuild:
`docker compose up -d --build app`.

**Kenapa healthcheck tetap 200 saat database mati?**
Agar Docker tidak me-restart container aplikasi (dan memutus tunnel) ketika
yang bermasalah sebenarnya Postgres. Status database dilaporkan sebagai field
`database` di body respons — pantau field itu, bukan status container.

**Versi image di-pin.** `node:24.21-alpine3.23`, `postgres:17.11-alpine3.23`,
dan `cloudflare/cloudflared:2026.9.1`. Perbarui secara sadar, jangan lewat
`latest` yang berubah diam-diam. cloudflared dijalankan dengan
`--no-autoupdate` agar versi yang berjalan selalu sama dengan versi image.

---

## 8. Hardening opsional di Cloudflare

Setelah tunnel berjalan, aktifkan di dashboard Cloudflare:

- **SSL/TLS → Overview**: mode **Full (strict)**
- **SSL/TLS → Edge Certificates**: Always Use HTTPS, HSTS, Minimum TLS 1.2
- **Security → WAF**: aktifkan Managed Ruleset
- **Security → Bots**: Bot Fight Mode
- **Rate limiting**: batasi `/backoffice/api/auth/login` untuk meredam brute force
- **Zero Trust → Access**: pertimbangkan proteksi tambahan di depan `/admin`

---

## 9. Troubleshooting

| Gejala | Penyebab umum |
| --- | --- |
| `cloudflared` loop restart | `CLOUDFLARE_TUNNEL_TOKEN` salah atau tunnel sudah dihapus di dashboard |
| Error 1033 di browser | cloudflared belum connect — cek `docker compose logs cloudflared` |
| Error 502 di browser | Public Hostname tidak mengarah ke `app:3000`, atau service `app` belum healthy |
| `app` tidak pernah start | `migrate` exit non-zero — cek `docker compose logs migrate` |
| `migrate` timeout | Kredensial Postgres tidak cocok dengan volume `pgdata` yang sudah ada |
| Perubahan `NEXT_PUBLIC_*` tidak muncul | Belum rebuild: `docker compose up -d --build app` |
| Unggahan gagal 500, situs normal | `/srv/silo/media` bukan milik uid 1000 — `sudo chown -R 1000:1000 /srv/silo/media` |
| `docker compose up` menolak start | `MEDIA_HOST_DIR` belum di-set, atau direktornya belum dibuat di host |
| Build gagal "aset wajib belum ada" | Berkas di `public/dokumentasi/`, `public/sponsors/`, atau potret panitia belum disalin — lihat daftar yang dicetak |
| Gambar 404 setelah menambah aset | Varian belum dibangkitkan: `npm run media:variants` |
| Unggahan ditolak 415 | Bukan JPG/PNG/WebP/PDF. SVG memang selalu ditolak (lihat §6b) |
| Unggahan ditolak 429 | Batas 20 unggahan/jam per pengguna tercapai |

Mengganti `POSTGRES_PASSWORD` setelah volume dibuat tidak mengubah password di
database. Untuk mengubahnya:

```bash
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "ALTER USER <user> WITH PASSWORD '<password baru>';"
```

lalu perbarui `.env` dan jalankan `docker compose up -d`.
