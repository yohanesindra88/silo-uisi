import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

/**
 * Script untuk men-generate:
 * 1. template_seeder_silo.xlsx (Template kosong dengan header & petunjuk pengisian)
 * 2. contoh_seeder_silo.xlsx   (Contoh file Excel yang sudah terisi data lengkap)
 */

const EXCEL_DIR = path.resolve(process.cwd(), "prisma", "excel");

// Pastikan direktori prisma/excel ada
if (!fs.existsSync(EXCEL_DIR)) {
  fs.mkdirSync(EXCEL_DIR, { recursive: true });
}

// =========================================================================
// DEFINISI DATA CONTOH UNTUK SETIAP SHEET
// =========================================================================

// 1. Sheet: groups (Kelompok Binaan)
const groupsExample = [
  {
    name: "Kelompok 01 - Sirius",
    description: "Gugus Bintang Sirius - Kelompok Pembinaan Karakter dan Integritas Kampus",
  },
  {
    name: "Kelompok 02 - Vega",
    description: "Gugus Bintang Vega - Kelompok Inovasi dan Kepemimpinan Unggul",
  },
  {
    name: "Kelompok 03 - Canopus",
    description: "Gugus Bintang Canopus - Kelompok Kreativitas dan Prestasi Mahasiswa",
  },
];

const groupsTemplate = [
  {
    name: "Nama Kelompok (Wajib, maks 45 karakter)",
    description: "Deskripsi Kelompok (Opsional)",
  },
];

// 2. Sheet: sessions (Sesi Kegiatan Absensi)
const sessionsExample = [
  {
    name: "Sesi 1: Apel Pagi & Cek Atribut",
    start_sessions: "2026-09-11 06:30:00",
    end_sessions: "2026-09-11 08:30:00",
    toleransi: 15,
  },
  {
    name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    start_sessions: "2026-09-11 08:00:00",
    end_sessions: "2026-09-11 20:00:00",
    toleransi: 15,
  },
  {
    name: "Sesi 3: Refleksi & Evaluasi",
    start_sessions: "2026-09-11 20:00:00",
    end_sessions: "2026-09-11 22:00:00",
    toleransi: 15,
  },
];

const sessionsTemplate = [
  {
    name: "Nama Sesi (Wajib, maks 45 karakter)",
    start_sessions: "Waktu Mulai YYYY-MM-DD HH:mm:ss (Wajib)",
    end_sessions: "Waktu Selesai YYYY-MM-DD HH:mm:ss (Wajib)",
    toleransi: "Toleransi Menit Keterlambatan (Angka, default 15)",
  },
];

// 3. Sheet: users (Data Akun Pengguna)
const usersExample = [
  // Admin & Panitia
  {
    username: "admin",
    nim: "",
    nama: "Super Admin SILO",
    fakultas: "FTI",
    prodi: "Informatika",
    password: "admin123",
    role: "admin",
    qr_token: "",
    group_name: "",
  },
  {
    username: "panitia01",
    nim: "",
    nama: "Bima Arya (Ketua Panitia)",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
    password: "admin123",
    role: "panitia",
    qr_token: "",
    group_name: "",
  },
  // Mentor
  {
    username: "mentor01",
    nim: "202241001",
    nama: "Kak Sarah Maulida",
    fakultas: "FTI",
    prodi: "Informatika",
    password: "mentor123",
    role: "mentor",
    qr_token: "",
    group_name: "Kelompok 01 - Sirius",
  },
  {
    username: "mentor02",
    nim: "202241002",
    nama: "Kak Dimas Pratama",
    fakultas: "FEB",
    prodi: "Manajemen Rekayasa",
    password: "mentor123",
    role: "mentor",
    qr_token: "",
    group_name: "Kelompok 02 - Vega",
  },
  {
    username: "mentor03",
    nim: "202241003",
    nama: "Kak Putri Anggraini",
    fakultas: "FEB",
    prodi: "Manajemen",
    password: "mentor123",
    role: "mentor",
    qr_token: "",
    group_name: "Kelompok 03 - Canopus",
  },
  // Mahasiswa Baru (Maba)
  {
    username: "302261001",
    nim: "302261001",
    nama: "Aditia Pratama",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261001_SIRIUS",
    group_name: "Kelompok 01 - Sirius",
  },
  {
    username: "302261002",
    nim: "302261002",
    nama: "Nabila Rahma",
    fakultas: "FTI",
    prodi: "Informatika",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261002_SIRIUS",
    group_name: "Kelompok 01 - Sirius",
  },
  {
    username: "302261006",
    nim: "302261006",
    nama: "Bagus Setiawan",
    fakultas: "FTI",
    prodi: "Teknik Logistik",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261006_SIRIUS",
    group_name: "Kelompok 01 - Sirius",
  },
  {
    username: "302261003",
    nim: "302261003",
    nama: "Rizky Firmansyah",
    fakultas: "FEB",
    prodi: "Akuntansi",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261003_VEGA",
    group_name: "Kelompok 02 - Vega",
  },
  {
    username: "302261005",
    nim: "302261005",
    nama: "Fajar Nugraha",
    fakultas: "FTI",
    prodi: "Teknik Logistik",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261005_VEGA",
    group_name: "Kelompok 02 - Vega",
  },
  {
    username: "302261007",
    nim: "302261007",
    nama: "Siti Aisyah",
    fakultas: "FEB",
    prodi: "Manajemen",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261007_VEGA",
    group_name: "Kelompok 02 - Vega",
  },
  {
    username: "302261004",
    nim: "302261004",
    nama: "Dewi Lestari",
    fakultas: "FEB",
    prodi: "Manajemen",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261004_CANOPUS",
    group_name: "Kelompok 03 - Canopus",
  },
  {
    username: "302261008",
    nim: "302261008",
    nama: "Andi Wijaya",
    fakultas: "FTI",
    prodi: "Informatika",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261008_CANOPUS",
    group_name: "Kelompok 03 - Canopus",
  },
  {
    username: "302261009",
    nim: "302261009",
    nama: "Tri Kurniawan",
    fakultas: "FTI",
    prodi: "Sistem Informasi",
    password: "maba123",
    role: "maba",
    qr_token: "QR_302261009_CANOPUS",
    group_name: "Kelompok 03 - Canopus",
  },
];

const usersTemplate = [
  {
    username: "Username unik (Wajib)",
    nim: "NIM Mahasiswa/Mentor (Opsional)",
    nama: "Nama Lengkap (Wajib)",
    fakultas: "Fakultas (Contoh: FTI / FEB)",
    prodi: "Program Studi",
    password: "Password Akun (Teks biasa, otomatis di-hash bcrypt)",
    role: "Pilihan: admin / panitia / mentor / maba (Wajib)",
    qr_token: "Token QR unik maba (Opsional, di-generate jika kosong)",
    group_name: "Nama Kelompok sesuai sheet groups (Opsional)",
  },
];

// 4. Sheet: group_mentors (Penugasan Mentor ke Kelompok)
const groupMentorsExample = [
  { mentor_username: "mentor01", group_name: "Kelompok 01 - Sirius" },
  { mentor_username: "mentor02", group_name: "Kelompok 02 - Vega" },
  { mentor_username: "mentor03", group_name: "Kelompok 03 - Canopus" },
];

const groupMentorsTemplate = [
  {
    mentor_username: "Username Mentor dari sheet users (Wajib)",
    group_name: "Nama Kelompok dari sheet groups (Wajib)",
  },
];

// 5. Sheet: assignments (Daftar Penugasan)
const assignmentsExample = [
  {
    title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    description: "Tulis rangkuman esai 500 kata mengenai nilai-nilai kepemimpinan dan integritas UISI.",
    attachment_url: "https://drive.google.com/templates/panduan-resume-silo-2026",
    due_date: "2026-09-15 23:59:00",
    created_by_username: "admin",
  },
  {
    title: "Tugas 2 - Mind Mapping Rencana Studi & Karir Unggul",
    description: "Rancang bagan mind mapping 4 tahun masa studi di UISI beserta target akademik dan karir.",
    attachment_url: "https://drive.google.com/templates/mindmap-karir-uisi",
    due_date: "2026-09-18 23:59:00",
    created_by_username: "admin",
  },
  {
    title: "Tugas 3 - Twibbon & Video Perkenalan Diri SILO 2026",
    description: "Unggah video perkenalan dan twibbon ke media sosial dengan tagar resmi SILO UISI.",
    attachment_url: "https://twibbonize.com/silo-uisi-2026",
    due_date: "2026-09-12 23:59:00",
    created_by_username: "admin",
  },
];

const assignmentsTemplate = [
  {
    title: "Judul Tugas (Wajib)",
    description: "Deskripsi dan Petunjuk Penugasan (Opsional)",
    attachment_url: "URL Panduan/Template Google Drive (Opsional)",
    due_date: "Batas Waktu YYYY-MM-DD HH:mm:ss (Wajib)",
    created_by_username: "Username Admin/Panitia pembuat tugas (Opsional)",
  },
];

// 6. Sheet: attendances (Riwayat Presensi Mahasiswa)
const attendancesExample = [
  // Sesi 1: Apel Pagi
  {
    maba_username: "302261001",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor01",
    status: "Hadir",
    scanned_at: "2026-09-11 06:45:00",
  },
  {
    maba_username: "302261002",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor01",
    status: "Hadir",
    scanned_at: "2026-09-11 06:50:00",
  },
  {
    maba_username: "302261006",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor01",
    status: "Terlambat",
    scanned_at: "2026-09-11 07:20:00",
  },
  {
    maba_username: "302261003",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor02",
    status: "Hadir",
    scanned_at: "2026-09-11 06:40:00",
  },
  {
    maba_username: "302261005",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor02",
    status: "Terlambat",
    scanned_at: "2026-09-11 07:18:00",
  },
  {
    maba_username: "302261007",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor02",
    status: "Hadir",
    scanned_at: "2026-09-11 06:55:00",
  },
  {
    maba_username: "302261004",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor03",
    status: "Hadir",
    scanned_at: "2026-09-11 06:42:00",
  },
  {
    maba_username: "302261008",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor03",
    status: "Hadir",
    scanned_at: "2026-09-11 06:48:00",
  },
  {
    maba_username: "302261009",
    session_name: "Sesi 1: Apel Pagi & Cek Atribut",
    scanned_by_username: "mentor03",
    status: "Hadir",
    scanned_at: "2026-09-11 06:52:00",
  },
  // Sesi 2: Pengenalan Kampus
  {
    maba_username: "302261001",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor01",
    status: "Hadir",
    scanned_at: "2026-09-11 08:15:00",
  },
  {
    maba_username: "302261006",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor01",
    status: "Hadir",
    scanned_at: "2026-09-11 08:25:00",
  },
  {
    maba_username: "302261003",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor02",
    status: "Hadir",
    scanned_at: "2026-09-11 08:10:00",
  },
  {
    maba_username: "302261007",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor02",
    status: "Hadir",
    scanned_at: "2026-09-11 08:18:00",
  },
  {
    maba_username: "302261004",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor03",
    status: "Hadir",
    scanned_at: "2026-09-11 08:05:00",
  },
  {
    maba_username: "302261008",
    session_name: "Sesi 2: Pengenalan Kampus (Sesi Aktif)",
    scanned_by_username: "mentor03",
    status: "Hadir",
    scanned_at: "2026-09-11 08:12:00",
  },
];

const attendancesTemplate = [
  {
    maba_username: "Username/NIM Maba dari sheet users (Wajib)",
    session_name: "Nama Sesi dari sheet sessions (Wajib)",
    scanned_by_username: "Username Mentor pemeriksa (Opsional)",
    status: "Pilihan: Hadir / Terlambat / Izin / Sakit (Wajib)",
    scanned_at: "Waktu Scan YYYY-MM-DD HH:mm:ss (Opsional)",
  },
];

// 7. Sheet: submissions (Pengumpulan & Penilaian Tugas)
const submissionsExample = [
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261001",
    file_url: "https://docs.google.com/document/d/1Aditia-Pratama-Resume-SILO-2026",
    notes: "Resume materi nilai orientasi kampus UISI.",
    status: "graded",
    score: 92,
    feedback: "Pemahaman materi sangat komprehensif dan aplikatif.",
    reviewed_by_username: "mentor01",
    submitted_at: "2026-09-07 10:15:00",
    reviewed_at: "2026-09-08 14:30:00",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261002",
    file_url: "https://docs.google.com/document/d/1Nabila-Rahma-Resume-SILO-2026",
    notes: "Tugas resume nilai kampus UISI sudah selesai disusun.",
    status: "graded",
    score: 88,
    feedback: "Resume disusun dengan rapi dan kontekstual.",
    reviewed_by_username: "mentor01",
    submitted_at: "2026-09-07 11:45:00",
    reviewed_at: "2026-09-08 15:00:00",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261006",
    file_url: "https://drive.google.com/file/d/1Bagus-Setiawan-Resume-Sirius",
    notes: "Resume materi orientasi dan budaya integritas UISI.",
    status: "submitted",
    score: "",
    feedback: "",
    reviewed_by_username: "",
    submitted_at: "2026-09-08 11:30:00",
    reviewed_at: "",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261003",
    file_url: "https://drive.google.com/file/d/1Rizky-Firmansyah-Resume",
    notes: "Mohon maaf terlambat mengumpulkan karena kendala teknis.",
    status: "graded",
    score: 80,
    feedback: "Analisis nilai sudah baik, perhatikan ketepatan waktu.",
    reviewed_by_username: "mentor02",
    submitted_at: "2026-09-08 09:20:00",
    reviewed_at: "2026-09-08 16:15:00",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261005",
    file_url: "https://drive.google.com/file/d/1Fajar-Nugraha-Resume-Vega",
    notes: "Tugas resume orientasi SILO 2026 oleh Fajar Nugraha.",
    status: "submitted",
    score: "",
    feedback: "",
    reviewed_by_username: "",
    submitted_at: "2026-09-07 14:10:00",
    reviewed_at: "",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261007",
    file_url: "https://docs.google.com/document/d/1Siti-Aisyah-Resume-Vega",
    notes: "Resume kepemimpinan dan integritas UISI.",
    status: "graded",
    score: 90,
    feedback: "Kajian nilai-nilai SILO sangat baik dan terstruktur.",
    reviewed_by_username: "mentor02",
    submitted_at: "2026-09-07 16:20:00",
    reviewed_at: "2026-09-08 17:00:00",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261004",
    file_url: "https://drive.google.com/file/d/1Dewi-Canopus-Resume",
    notes: "Resume nilai-nilai orientasi kampus Dewi Lestari.",
    status: "submitted",
    score: "",
    feedback: "",
    reviewed_by_username: "",
    submitted_at: "2026-09-07 15:00:00",
    reviewed_at: "",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261008",
    file_url: "https://drive.google.com/file/d/1Andi-Wijaya-Resume-Canopus",
    notes: "Tugas resume nilai kampus.",
    status: "graded",
    score: 85,
    feedback: "Penjelasan nilai integritas jelas dan aplikatif.",
    reviewed_by_username: "mentor03",
    submitted_at: "2026-09-07 15:00:00",
    reviewed_at: "2026-09-08 18:00:00",
  },
  {
    assignment_title: "Tugas 1 - Resume Materi Nilai-Nilai SILO UISI",
    maba_username: "302261009",
    file_url: "https://docs.google.com/document/d/1Tri-Kurniawan-Resume-Canopus",
    notes: "Resume lengkap materi pengenalan nilai kampus.",
    status: "graded",
    score: 92,
    feedback: "Analisis nilai kepemimpinan sangat mendalam.",
    reviewed_by_username: "mentor03",
    submitted_at: "2026-09-07 12:00:00",
    reviewed_at: "2026-09-08 18:30:00",
  },
];

const submissionsTemplate = [
  {
    assignment_title: "Judul Tugas dari sheet assignments (Wajib)",
    maba_username: "Username/NIM Maba dari sheet users (Wajib)",
    file_url: "Link Dokumen / Google Drive Tugas (Wajib)",
    notes: "Catatan pengumpulan dari mahasiswa (Opsional)",
    status: "Pilihan: submitted / graded / late / resubmit (Wajib)",
    score: "Nilai Angka 0 - 100 (Wajib jika status graded)",
    feedback: "Ulasan dan evaluasi dari mentor (Opsional)",
    reviewed_by_username: "Username Mentor penilai (Opsional)",
    submitted_at: "Waktu Pengumpulan YYYY-MM-DD HH:mm:ss (Opsional)",
    reviewed_at: "Waktu Penilaian YYYY-MM-DD HH:mm:ss (Opsional)",
  },
];

// 8. Sheet: attributes (Master Atribut & Barang Bawaan Harian)
const attributesExample = [
  {
    name: "Name Tag Resmi Ukuran B2",
    description: "Wajib dikalungkan di leher dengan lanyard resmi SILO UISI 2026.",
    target_date: "2026-09-11",
    type: "individu",
    created_by_username: "admin",
  },
  {
    name: "Buku Penugasan Angkatan",
    description: "Buku tulis bersampul cokelat rapi bertuliskan identitas diri dan gugus kelompok.",
    target_date: "2026-09-11",
    type: "individu",
    created_by_username: "admin",
  },
  {
    name: "Pita Warna Kelompok",
    description: "Pita satin terikat di lengan kanan sesuai warna identitas gugus.",
    target_date: "2026-09-11",
    type: "individu",
    created_by_username: "admin",
  },
  {
    name: "Trash Bag / Kantong Sampah Mini",
    description: "Minimal 2 lembar kantong sampah ukuran sedang per kelompok untuk operasi kebersihan.",
    target_date: "2026-09-11",
    type: "kelompok",
    created_by_username: "admin",
  },
  {
    name: "Banner Nama Kelompok",
    description: "Banner kain atau karton nama gugus untuk penanda barisan dan identitas kelompok.",
    target_date: "2026-09-11",
    type: "kelompok",
    created_by_username: "admin",
  },
];

const attributesTemplate = [
  {
    name: "Nama Barang Bawaan / Atribut (Wajib)",
    description: "Keterangan spesifikasi atribut (Opsional)",
    target_date: "Tanggal Pengecekan YYYY-MM-DD (Wajib)",
    type: "Pilihan: individu atau kelompok (Wajib)",
    created_by_username: "Username Admin pembuat atribut (Opsional)",
  },
];

// 9. Sheet: attribute_checks (Checklist Hasil Verifikasi Mentor)
const attributeChecksExample = [
  // Cek Atribut Individu
  {
    attribute_name: "Name Tag Resmi Ukuran B2",
    target_date: "2026-09-11",
    maba_username: "302261001",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:00:00",
  },
  {
    attribute_name: "Buku Penugasan Angkatan",
    target_date: "2026-09-11",
    maba_username: "302261001",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:00:00",
  },
  {
    attribute_name: "Pita Warna Kelompok",
    target_date: "2026-09-11",
    maba_username: "302261001",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:00:00",
  },
  {
    attribute_name: "Name Tag Resmi Ukuran B2",
    target_date: "2026-09-11",
    maba_username: "302261006",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:05:00",
  },
  {
    attribute_name: "Buku Penugasan Angkatan",
    target_date: "2026-09-11",
    maba_username: "302261006",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "FALSE",
    notes: "Ketinggalan di kosan, diminta bawa besok",
    checked_at: "2026-09-11 07:05:00",
  },
  {
    attribute_name: "Pita Warna Kelompok",
    target_date: "2026-09-11",
    maba_username: "302261006",
    group_name: "",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:05:00",
  },
  // Cek Atribut Kelompok
  {
    attribute_name: "Trash Bag / Kantong Sampah Mini",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 01 - Sirius",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:10:00",
  },
  {
    attribute_name: "Banner Nama Kelompok",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 01 - Sirius",
    checked_by_username: "mentor01",
    is_brought: "TRUE",
    notes: "Banner rapi dan lengkap",
    checked_at: "2026-09-11 07:10:00",
  },
  {
    attribute_name: "Trash Bag / Kantong Sampah Mini",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 02 - Vega",
    checked_by_username: "mentor02",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:10:00",
  },
  {
    attribute_name: "Banner Nama Kelompok",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 02 - Vega",
    checked_by_username: "mentor02",
    is_brought: "TRUE",
    notes: "Banner kreatif",
    checked_at: "2026-09-11 07:10:00",
  },
  {
    attribute_name: "Trash Bag / Kantong Sampah Mini",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 03 - Canopus",
    checked_by_username: "mentor03",
    is_brought: "TRUE",
    notes: "",
    checked_at: "2026-09-11 07:10:00",
  },
  {
    attribute_name: "Banner Nama Kelompok",
    target_date: "2026-09-11",
    maba_username: "",
    group_name: "Kelompok 03 - Canopus",
    checked_by_username: "mentor03",
    is_brought: "TRUE",
    notes: "Banner rapi dan lengkap",
    checked_at: "2026-09-11 07:10:00",
  },
];

const attributeChecksTemplate = [
  {
    attribute_name: "Nama Atribut dari sheet attributes (Wajib)",
    target_date: "Tanggal Target YYYY-MM-DD (Wajib)",
    maba_username: "Username/NIM Maba (Wajib jika atribut tipe individu, kosongkan jika kelompok)",
    group_name: "Nama Kelompok (Wajib jika atribut tipe kelompok, kosongkan jika individu)",
    checked_by_username: "Username Mentor pemeriksa (Wajib)",
    is_brought: "TRUE jika membawa, FALSE jika tidak membawa (Wajib)",
    notes: "Catatan hasil pemeriksaan mentor (Opsional)",
    checked_at: "Waktu Periksa YYYY-MM-DD HH:mm:ss (Opsional)",
  },
];

// =========================================================================
// BUILD WORKBOOK DAN SIMPAN FILE
// =========================================================================

function buildWorkbook(sheets: Record<string, any[]>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const [sheetName, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  return wb;
}

export async function generateExcelFiles() {
  console.log("📊 Memulai pembuatan template dan contoh file Excel seeder...");

  // 1. Buat File CONTOH (Terisi Data Lengkap)
  const exampleSheets = {
    groups: groupsExample,
    sessions: sessionsExample,
    users: usersExample,
    group_mentors: groupMentorsExample,
    assignments: assignmentsExample,
    attendances: attendancesExample,
    submissions: submissionsExample,
    attributes: attributesExample,
    attribute_checks: attributeChecksExample,
  };

  const exampleWb = buildWorkbook(exampleSheets);
  const examplePath = path.join(EXCEL_DIR, "contoh_seeder_silo.xlsx");
  XLSX.writeFile(exampleWb, examplePath);
  console.log(`  ✅ File Contoh Berhasil Dibuat: ${examplePath}`);

  // 2. Buat File TEMPLATE (Format Kolom Kosong Siap Diisi)
  const templateSheets = {
    groups: groupsTemplate,
    sessions: sessionsTemplate,
    users: usersTemplate,
    group_mentors: groupMentorsTemplate,
    assignments: assignmentsTemplate,
    attendances: attendancesTemplate,
    submissions: submissionsTemplate,
    attributes: attributesTemplate,
    attribute_checks: attributeChecksTemplate,
  };

  const templateWb = buildWorkbook(templateSheets);
  const templatePath = path.join(EXCEL_DIR, "template_seeder_silo.xlsx");
  XLSX.writeFile(templateWb, templatePath);
  console.log(`  ✅ File Template Berhasil Dibuat: ${templatePath}`);

  console.log("🎉 Pembuatan seluruh file template Excel seeder selesai!");
}

if (require.main === module) {
  generateExcelFiles().catch((err) => {
    console.error("Gagal membuat file template Excel:", err);
    process.exit(1);
  });
}
