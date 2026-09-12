# AETHERA - SILO UISI 2026
### Sistem Informasi & Layanan Orientasi Mahasiswa Baru
**Universitas Internasional Semen Indonesia (UISI)**

Aplikasi web modern berbasis **Next.js App Router (React 19)**, **TypeScript**, **Vanilla CSS & Design System kustom**, dan **PostgreSQL (Prisma ORM)** yang dirancang untuk mendukung operasional kegiatan orientasi mahasiswa baru (SILO UISI 2026). Sistem ini mencakup presensi berbasis QR Code, monitoring kehadiran real-time, manajemen & penilaian tugas, serta pengecekan atribut barang bawaan harian lintas 4 peran pengguna.

---

## Daftar Isi
1. [Instalasi & Deployment (Development & Production)](#1-instalasi--deployment)
2. [Migrasi & Seeding Database](#2-migrasi--seeding-database)
3. [Daftar Akun Pengguna Semua Role](#3-daftar-akun-pengguna-semua-role)
4. [Panduan Penggunaan Cepat Semua Role](#4-panduan-penggunaan-cepat-semua-role)
5. [Struktur Proyek](#5-struktur-proyek)

---

## 1. Instalasi & Deployment

### Prasyarat Sistem
- **Node.js**: Versi `v18.18.0` atau `v20.x` (LTS direkomendasikan)
- **Package Manager**: `npm` (v9+)
- **Database**: PostgreSQL (v14+)
- **Git**

---

### A. Setup Lingkungan Development (Lokal)

1. **Clone repositori:**
   ```bash
   git clone https://github.com/yanfth/Aethera-Silo-UISI-2026.git
   cd Aethera-Silo-UISI-2026
   ```

2. **Instal seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`):**
   Salin atau buat file `.env` di root direktori proyek:
   ```env
   # Koneksi Database PostgreSQL
   DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/silo_uisi_2026?schema=public"

   # Kunci Rahasia JWT untuk Autentikasi Sesi
   JWT_SECRET="kunci_rahasia_jwt_silo_uisi_2026_super_aman"

   # URL Dasar Aplikasi
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Inisialisasi Database (Push & Seed):**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

> [!TIP]
> **Testing Kamera QR Scanner di HP (HTTPS / LAN):**
> Untuk menguji fitur pemindaian kamera barcode pada perangkat HP asli melalui jaringan WiFi lokal, jalankan perintah HTTPS:
> ```bash
> npm run dev:https
> ```

---

### B. Deployment ke Production / Live Server

#### Opsi 1: Server VPS / Linux (Node.js + PM2 + Nginx Reverse Proxy)
1. **Clone dan instal dependensi di server:**
   ```bash
   git clone https://github.com/yanfth/Aethera-Silo-UISI-2026.git
   cd Aethera-Silo-UISI-2026
   npm install --production=false
   ```
2. **Setup `.env` production** (gunakan kredensial database PostgreSQL production dan `JWT_SECRET` yang kuat).
3. **Migrasi dan Seed Database:**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```
4. **Build bundle production:**
   ```bash
   npm run build
   ```
5. **Jalankan dengan PM2 Process Manager:**
   ```bash
   pm2 start npm --name "silo-uisi-2026" -- start
   pm2 save
   pm2 startup
   ```
6. **Konfigurasi Nginx Reverse Proxy** mengarah ke port `3000` dengan sertifikat SSL (Let's Encrypt / Certbot).

#### Opsi 2: Vercel Platform
1. Impor repositori ke Vercel Dashboard.
2. Tambahkan **Environment Variables**:
   - `DATABASE_URL`: Connection string PostgreSQL (misal: Supabase, Neon, atau Railway).
   - `JWT_SECRET`: String acak aman.
3. Vercel akan otomatis mendeteksi konfigurasi Next.js dan menjalankan `next build`.
4. Untuk inisialisasi awal database pada production DB, jalankan `npx prisma db push` dan `npx prisma db seed` dari terminal lokal yang terhubung ke database production.

---

## 2. Migrasi & Seeding Database

Aplikasi menggunakan **Prisma ORM (v6)** dengan database PostgreSQL. Seluruh skrip pengelolaan skema dan database tersedia di `package.json`:

| Perintah | Deskripsi & Kegunaan |
| :--- | :--- |
| `npm run db:generate` | Melakukan regenerasi client Prisma (`@prisma/client`) berdasarkan `prisma/schema.prisma`. |
| `npm run db:push` | Mendorong perubahan skema `schema.prisma` langsung ke database PostgreSQL tanpa membuat file migrasi (sangat cocok untuk development cepat). |
| `npm run db:migrate` | Membuat dan menerapkan migrasi database terkelola (`prisma migrate dev`). |
| `npm run db:seed` | Menjalankan seeder bawaan TypeScript (`prisma/seed.ts`), meliputi grup binaan, 3 sesi resmi, 14 akun pengguna terenkripsi bcrypt, relasi mentor, riwayat presensi, penugasan, pengumpulan tugas, dan atribut harian beserta checklist-nya. |
| `npm run db:seed:excel` | **Import Seeder dari Excel**: Mengimpor seluruh data tabel dari file Excel (`prisma/excel/contoh_seeder_silo.xlsx` atau file kustom) secara otomatis ke PostgreSQL. |
| `npm run excel:generate` | Menghasilkan ulang file template kosong (`template_seeder_silo.xlsx`) dan file contoh data lengkap (`contoh_seeder_silo.xlsx`). |
| `npm run db:studio` | Membuka antarmuka grafis **Prisma Studio** di browser (`http://localhost:5555`) untuk melihat dan mengedit isi tabel database secara visual. |

---

### Seeder Import dari Excel (Terpisah dari Seeder Awal)

Tersedia modul seeder khusus berbasis Excel yang terpisah dari seeder bawaan, terletak di file [`prisma/seed-excel.ts`](file:///c:/Project/Aethera-Silo-UISI-2026/prisma/seed-excel.ts).

#### 1. Lokasi Template & Contoh Excel:
Semua file lembar kerja Excel tersimpan di folder [`prisma/excel/`](file:///c:/Project/Aethera-Silo-UISI-2026/prisma/excel):
- **Template Kosong Siap Diisi**: [`prisma/excel/template_seeder_silo.xlsx`](file:///c:/Project/Aethera-Silo-UISI-2026/prisma/excel/template_seeder_silo.xlsx) &rarr; Berisi header kolom resmi dan petunjuk validasi setiap field.
- **Contoh Data Lengkap**: [`prisma/excel/contoh_seeder_silo.xlsx`](file:///c:/Project/Aethera-Silo-UISI-2026/prisma/excel/contoh_seeder_silo.xlsx) &rarr; Berisi contoh data realistis untuk 9 tabel/sheet.

#### 2. Cara Menjalankan Import Excel:
```bash
# Opsi A: Import menggunakan file contoh bawaan
npm run db:seed:excel

# Opsi B: Import menggunakan file Excel kustom buatan Anda
npx tsx prisma/seed-excel.ts "path/ke/file_data_anda.xlsx"
```

#### 3. Struktur 9 Sheet yang Didukung dalam 1 File Excel:
| No | Nama Sheet | Tabel Terkait | Kolom yang Didukung |
| :---: | :--- | :--- | :--- |
| 1 | `groups` | `m_groups` | `name`, `description` |
| 2 | `sessions` | `m_sessions` | `name`, `start_sessions`, `end_sessions`, `toleransi` |
| 3 | `users` | `m_users` | `username`, `nim`, `nama`, `fakultas`, `prodi`, `password`, `role`, `qr_token`, `group_name` |
| 4 | `group_mentors` | `groups_mentors` | `mentor_username`, `group_name` |
| 5 | `assignments` | `m_assignments` | `title`, `description`, `attachment_url`, `due_date`, `created_by_username` |
| 6 | `attendances` | `t_attendances` | `maba_username`, `session_name`, `scanned_by_username`, `status`, `scanned_at` |
| 7 | `submissions` | `t_submissions` | `assignment_title`, `maba_username`, `file_url`, `notes`, `status`, `score`, `feedback`, `reviewed_by_username`, `submitted_at`, `reviewed_at` |
| 8 | `attributes` | `m_attributes` | `name`, `description`, `target_date`, `type` (`individu`/`kelompok`), `created_by_username` |
| 9 | `attribute_checks` | `t_attribute_checks` | `attribute_name`, `target_date`, `maba_username`, `group_name`, `checked_by_username`, `is_brought` (`TRUE`/`FALSE`), `notes`, `checked_at` |

> [!NOTE]
> - Password teks biasa yang dimasukkan pada sheet `users` akan otomatis dienkripsi dengan algoritma **Bcrypt** saat diimpor.
> - Referensi antar tabel menggunakan nama/username yang mudah dibaca (misalnya `group_name` atau `mentor_username`), sehingga Anda tidak perlu menghafal integer ID database manual.

---

### Alur Singkat Reset & Sinkronisasi Ulang Database:
Jika ingin membersihkan dan menyinkronkan ulang seluruh data database agar 100% segar:
```bash
npm run db:push -- --force-reset
npm run db:seed
# Atau jika ingin menggunakan data dari Excel:
npm run db:seed:excel
```

---

## 3. Daftar Akun Pengguna Semua Role

Semua kata sandi akun bawaan seeder telah dienkripsi secara aman menggunakan **Bcrypt** (`cost factor 10`).

### A. Akun Administrator & Panitia Pelaksana
| Role | Username | Password | Nama Lengkap | Fakultas / Prodi |
| :---: | :---: | :---: | :--- | :--- |
| **Admin** | `admin` | `admin123` | **Super Admin SILO** | FTI / Teknik Informatika |
| **Panitia** | `panitia01` | `admin123` | **Bima Arya (Ketua Panitia)** | FTI / Sistem Informasi |

---

### B. Akun Mentor Pendamping Kelompok
Setiap mentor mendampingi satu gugus kelompok binaan resmi:
| Role | Username | Password | Nama Lengkap | Kelompok Binaan |
| :---: | :---: | :---: | :--- | :--- |
| **Mentor** | `mentor01` | `mentor123` | **Kak Sarah Maulida** | **Kelompok 01 - Sirius** |
| **Mentor** | `mentor02` | `mentor123` | **Kak Dimas Pratama** | **Kelompok 02 - Vega** |
| **Mentor** | `mentor03` | `mentor123` | **Kak Putri Anggraini** | **Kelompok 03 - Canopus** |

---

### C. Akun Mahasiswa Baru (Maba)
Setiap mahasiswa memiliki **NIM**, **QR Token Unik** untuk presensi, serta penempatan gugus kelompok masing-masing:

| NIM / Username | Password | Nama Mahasiswa | Kluster Kelompok | Program Studi |
| :---: | :---: | :--- | :--- | :--- |
| `302261001` | `maba123` | **Aditia Pratama** | Kelompok 01 - Sirius | S1 Sistem Informasi |
| `302261002` | `maba123` | **Nabila Rahma** | Kelompok 01 - Sirius | S1 Informatika |
| `302261006` | `maba123` | **Bagus Setiawan** | Kelompok 01 - Sirius | S1 Teknik Logistik |
| `302261003` | `maba123` | **Rizky Firmansyah** | Kelompok 02 - Vega | S1 Akuntansi |
| `302261005` | `maba123` | **Fajar Nugraha** | Kelompok 02 - Vega | S1 Teknik Logistik |
| `302261007` | `maba123` | **Siti Aisyah** | Kelompok 02 - Vega | S1 Manajemen |
| `302261004` | `maba123` | **Dewi Lestari** | Kelompok 03 - Canopus | S1 Manajemen |
| `302261008` | `maba123` | **Andi Wijaya** | Kelompok 03 - Canopus | S1 Informatika |
| `302261009` | `maba123` | **Tri Kurniawan** | Kelompok 03 - Canopus | S1 Sistem Informasi |

---

## 4. Panduan Penggunaan Cepat Semua Role

Halaman login utama dapat diakses pada rute: **`/login`**

---

### A. Role Admin (`admin`)
Akses: `/admin` atau `/admin/dashboard`
1. **Dashboard Utama (`/admin/dashboard`):**
   - Melihat statistik orientasi: Total maba, total kelompok binaan, persentase kehadiran global, dan total tugas.
   - Mengunduh laporan rekapitulasi data format CSV melalui tombol **Presensi (CSV)** dan **Nilai Tugas (CSV)**.
   - Menggunakan Floating Action Button (FAB `+`) untuk membuat sesi absensi baru atau memublikasikan tugas baru secara instan.
2. **Pusat Monitoring Kehadiran (`/admin/monitoring`):**
   - Memantau rekap absensi per sesi dan kelompok secara real time.
   - Filter data berdasarkan sesi kegiatan, gugus kelompok, status kehadiran (Hadir, Terlambat, Belum Hadir), atau pencarian nama/NIM maba.
   - Menambah atau memperbarui jadwal sesi orientasi.
3. **Manajemen Penugasan (`/admin/tugas`):**
   - Mengelola master penugasan (tambah, edit deskripsi/deadline, hapus).
   - Membuka kartu tugas untuk melihat daftar pengumpul tugas seluruh kelompok.
   - Menilai langsung pengumpulan maba (memberi skor 0-100 dan feedback evaluasi).
4. **Manajemen Atribut & Barang Bawaan (`/admin/atribut`):**
   - Menentukan perlengkapan wajib harian maba (tipe *Individu* atau *Kelompok*) untuk tanggal tertentu.
   - Memantau status keterisian checklist atribut oleh mentor.

---

### B. Role Panitia (`panitia01`)
Akses: Mengikuti alur administratif operasional orientasi.
- Memiliki hak akses koordinasi dan supervisi setara pengelola sistem untuk memantau kehadiran maba di lapangan, rekapitulasi penugasan, serta manajemen perlengkapan atribut kegiatan.

---

### C. Role Mentor (`mentor01`, `mentor02`, `mentor03`)
Akses: `/mentor` atau `/mentor/dashboard`
1. **Dashboard Mentor (`/mentor/dashboard`):**
   - Memantau statistik khusus kelompok binaan masing-masing (jumlah maba dampingan, tingkat kehadiran kelompok, dan jumlah tugas binaan).
   - Melihat sesi aktif hari ini dan pintasan cepat pemindaian QR.
2. **Pemindai Presensi QR Code (`/mentor/scan`):**
   - Membuka kamera pemindai barcode untuk memindai QR Code kartu ID maba.
   - Sistem secara otomatis mencatat waktu scan, status kehadiran (Tepat Waktu atau Terlambat berdasarkan toleransi menit), serta mencegah pemindaian ganda.
3. **Monitoring Gugus Binaan (`/mentor/monitoring`):**
   - Memeriksa daftar maba kelompoknya yang sudah scan hadir, terlambat, atau belum hadir pada sesi yang sedang berjalan.
4. **Pemeriksaan Atribut Bawaan Maba (`/mentor/atribut`):**
   - Memeriksa barang bawaan wajib hari ini untuk kelompok binaannya.
   - Melakukan checklist visual barang bawaan maba:
     - Centang **Membawa** (`✅`) atau **Tidak Membawa** (`❌`).
     - Menambahkan catatan pendamping (misal: *"Ketinggalan di kosan"*).
     - Menekan tombol **Simpan Verifikasi** untuk menyimpan status ke database.
5. **Penilaian Tugas Binaan (`/mentor/tugas`):**
   - Melihat daftar tugas yang dikumpulkan khusus oleh mahasiswa kelompoknya.
   - Membuka link dokumen/video mahasiswa, memberikan skor nilai, dan memberikan komentar evaluasi.

---

### D. Role Mahasiswa Baru / Maba (`302261001` s/d `302261009`)
Akses: `/maba` atau `/maba/dashboard`
1. **Dashboard Maba (`/maba/dashboard`):**
   - Melihat kartu sambutan dengan identitas diri, NIM, program studi, dan nama gugus kelompok binaan.
   - Memantau grafik persentase kehadiran orientasi (Tepat Waktu, Terlambat, dan Tidak Hadir).
   - Melihat ringkasan status tugas yang sudah dikumpulkan maupun yang telah dinilai mentor.
2. **Kartu Peserta Orientasi Digital & QR Presensi (`/maba/card`):**
   - Menampilkan kartu identitas digital dengan **QR Code Unik**.
   - **Fitur Balik Kartu (3D Flip):** Menampilkan identitas depan dan sisi belakang berlogo resmi Aethera SILO UISI 2026.
   - **Fitur Senter Layar Putih (Kecerahan 100%):** Memaksimalkan keterbacaan QR Code saat dipindai di ruangan redup/pagi hari.
   - **Fitur Unduh Kartu (PNG):** Menyimpan gambar ID Card resolusi tinggi ke galeri HP sebagai cadangan presensi offline.
   - **Daftar Sesi Presensi:** Melihat riwayat scan kehadiran per sesi (Hadir Tepat Waktu atau Terlambat).
3. **Pengumpulan Tugas (`/maba/tugas`):**
   - Membaca daftar penugasan aktif, tenggat waktu (deadline), dan tautan template instruksi tugas.
   - Mengumpulkan link file tugas (Google Drive / Docs / Instagram / TikTok) beserta catatan pengerjaan.
   - Melihat nilai akhir dan komentar ulasan yang diberikan oleh mentor.
4. **Perlengkapan & Atribut Wajib (`/maba/atribut`):**
   - Memeriksa daftar perlengkapan wajib hari ini, baik barang individu maupun barang kelompok.
   - Melihat status verifikasi hasil pemeriksaan visual oleh mentor (bertanda `✅ Terverifikasi Bawa` atau `❌ Tidak Membawa` lengkap dengan nama mentor pemeriksa dan catatannya).
5. **Profil Akun (`/maba/profile`):**
   - Melihat data diri terdaftar serta mengganti kata sandi akun.

---

## 5. Struktur Proyek

```text
c:\Project\Aethera-Silo-UISI-2026\
├── prisma/
│   ├── schema.prisma              # Definisi model data PostgreSQL
│   ├── seed.ts                    # Runner utama seeder database
│   └── seeders/                   # Modul seeder modular
│       ├── groups.seeder.ts       # Seeder kelompok binaan (Sirius, Vega, Canopus)
│       ├── sessions.seeder.ts     # Seeder sesi kegiatan resmi hari ini
│       ├── users.seeder.ts        # Seeder 14 akun (Admin, Panitia, Mentor, Maba)
│       ├── groupMentors.seeder.ts # Seeder penugasan mentor ke kelompok
│       ├── attendances.seeder.ts  # Seeder riwayat presensi sesi
│       ├── assignments.seeder.ts  # Seeder 3 penugasan orientasi
│       ├── submissions.seeder.ts  # Seeder pengumpulan & penilaian tugas
│       └── attributes.seeder.ts   # Seeder atribut harian & hasil verifikasi
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes (Next.js App Router)
│   │   │   ├── auth/              # Autentikasi sesi & info login user (/api/auth/me)
│   │   │   ├── attendance/        # Endpoint get presensi & scan QR code
│   │   │   ├── sessions/          # Endpoint CRUD sesi kegiatan
│   │   │   ├── assignments/       # Endpoint penugasan orientasi
│   │   │   ├── submissions/       # Endpoint pengumpulan & review nilai tugas
│   │   │   ├── attributes/        # Endpoint master atribut, checklist mentor & status maba
│   │   │   ├── groups/            # Endpoint data kelompok binaan
│   │   │   ├── users/             # Endpoint data pengguna
│   │   │   └── export/            # Endpoint ekspor CSV (presensi & nilai tugas)
│   │   ├── backoffice/            # Halaman Web UI sesuai Role
│   │   │   ├── admin/             # Dashboard, monitoring, tugas, atribut admin
│   │   │   ├── mentor/            # Dashboard, scan QR, monitoring, tugas, atribut mentor
│   │   │   ├── maba/              # Dashboard, kartu ID QR, tugas, atribut maba
│   │   │   └── login/             # Halaman login terpadu
│   │   ├── layout.tsx             # Root layout Next.js
│   │   └── globals.css            # Desain token & gaya global
│   ├── components/                # Komponen UI reusable (MobileShell, Card, QR, dll.)
│   ├── models/                    # Lapisan data model & query Prisma
│   └── utils/                     # Helper autentikasi JWT, cookie, & koneksi Prisma
├── next.config.ts                 # Konfigurasi Next.js & path rewrites
├── package.json                   # Dependensi & script eksekusi
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## 6. Lisensi & Hak Cipta
Dikembangkan untuk Panitia Pelaksana **SILO (Student Initiation Learning and Orientation) UISI 2026** - Universitas Internasional Semen Indonesia.
Hak cipta dilindungi undang-undang.
