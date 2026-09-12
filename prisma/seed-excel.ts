import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper parsing tanggal aman dari Excel (string, number serial, atau Date)
function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "number") {
    // Serial date number Excel
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, Math.floor(d.S)));
    }
  }
  const str = String(val).trim();
  if (!str) return null;
  const parsed = new Date(str.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper parsing boolean aman
function parseExcelBool(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    return s === "true" || s === "1" || s === "ya" || s === "y" || s === "bawa";
  }
  return false;
}

// Helper membaca data sheet ke JSON array yang dibersihkan
function readSheetData(workbook: XLSX.WorkBook, sheetNames: string[]): any[] {
  let foundName = "";
  for (const name of sheetNames) {
    const matched = workbook.SheetNames.find(
      (s) => s.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (matched) {
      foundName = matched;
      break;
    }
  }

  if (!foundName) return [];
  const ws = workbook.Sheets[foundName];
  if (!ws) return [];

  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // Bersihkan whitespace dan filter baris petunjuk/template
  return rawRows.filter((row) => {
    // Jika semua kolom berisi teks panduan seperti "(Wajib" atau "(Opsional", lewati
    const values = Object.values(row).map((v) => String(v).trim());
    const isGuideRow = values.some((v) => v.includes("(Wajib") || v.includes("(Opsional") || v.includes("Contoh:"));
    const isAllEmpty = values.every((v) => v === "");
    return !isGuideRow && !isAllEmpty;
  });
}

export async function importFromExcel(filePath?: string) {
  const targetPath = filePath
    ? path.resolve(process.cwd(), filePath)
    : path.resolve(process.cwd(), "prisma", "excel", "contoh_seeder_silo.xlsx");

  console.log("📥 ========================================================");
  console.log("   MEMULAI IMPORT SEEDER DARI FILE EXCEL SILO 2026");
  console.log("============================================================");
  console.log(`📁 File Target: ${targetPath}`);

  if (!fs.existsSync(targetPath)) {
    console.error(`❌ File Excel tidak ditemukan di: ${targetPath}`);
    console.log("💡 Tips: Anda dapat membuat file template dengan perintah:");
    console.log("   npm run excel:generate");
    process.exit(1);
  }

  const wb = XLSX.readFile(targetPath, { cellDates: true });
  console.log(`📑 Daftar Sheet Terdeteksi: ${wb.SheetNames.join(", ")}`);

  const summary = {
    groups: 0,
    sessions: 0,
    users: 0,
    groupMentors: 0,
    assignments: 0,
    attendances: 0,
    submissions: 0,
    attributes: 0,
    attributeChecks: 0,
  };

  // -------------------------------------------------------------------------
  // 1. IMPORT SHEET: groups (m_groups)
  // -------------------------------------------------------------------------
  const groupRows = readSheetData(wb, ["groups", "m_groups", "kelompok"]);
  console.log(`\n🏢 [1/9] Memproses ${groupRows.length} baris kelompok (m_groups)...`);
  for (const row of groupRows) {
    const name = String(row.name || row.nama || row.group_name || "").trim();
    if (!name) continue;
    const description = String(row.description || row.deskripsi || "").trim() || null;

    const existing = await prisma.group.findFirst({ where: { name } });
    if (existing) {
      await prisma.group.update({
        where: { id: existing.id },
        data: { description, deletedAt: null },
      });
    } else {
      await prisma.group.create({
        data: { name, description },
      });
    }
    summary.groups++;
  }
  console.log(`   ✅ Selesai: ${summary.groups} kelompok berhasil disimpan/diperbarui.`);

  // -------------------------------------------------------------------------
  // 2. IMPORT SHEET: sessions (m_sessions)
  // -------------------------------------------------------------------------
  const sessionRows = readSheetData(wb, ["sessions", "m_sessions", "sesi"]);
  console.log(`\n🕒 [2/9] Memproses ${sessionRows.length} baris sesi kegiatan (m_sessions)...`);
  for (const row of sessionRows) {
    const name = String(row.name || row.nama || row.session_name || "").trim();
    if (!name) continue;

    const startDate = parseExcelDate(row.start_sessions || row.startSessions || row.mulai);
    const endDate = parseExcelDate(row.end_sessions || row.endSessions || row.selesai);
    const toleransi = parseInt(String(row.toleransi || "15"), 10) || 15;

    if (!startDate || !endDate) {
      console.warn(`   ⚠️ Sesi "${name}" dilewati: Format tanggal mulai/selesai tidak valid.`);
      continue;
    }

    const existing = await prisma.session.findFirst({ where: { name } });
    if (existing) {
      await prisma.session.update({
        where: { id: existing.id },
        data: {
          startSessions: startDate,
          endSessions: endDate,
          toleransi,
          deletedAt: null,
        },
      });
    } else {
      await prisma.session.create({
        data: {
          name,
          startSessions: startDate,
          endSessions: endDate,
          toleransi,
        },
      });
    }
    summary.sessions++;
  }
  console.log(`   ✅ Selesai: ${summary.sessions} sesi kegiatan berhasil disimpan/diperbarui.`);

  // -------------------------------------------------------------------------
  // 3. IMPORT SHEET: users (m_users)
  // -------------------------------------------------------------------------
  const userRows = readSheetData(wb, ["users", "m_users", "pengguna"]);
  console.log(`\n👤 [3/9] Memproses ${userRows.length} baris akun pengguna (m_users)...`);

  // Cache groups untuk pencocokan nama kelompok
  const allDbGroups = await prisma.group.findMany({ where: { deletedAt: null } });
  const groupMapByName: Record<string, number> = {};
  for (const g of allDbGroups) {
    groupMapByName[g.name.toLowerCase().trim()] = g.id;
  }

  for (const row of userRows) {
    const username = String(row.username || row.nim || "").trim();
    const nama = String(row.nama || row.name || "").trim();
    if (!username || !nama) continue;

    const nim = String(row.nim || "").trim() || null;
    const fakultas = String(row.fakultas || "").trim() || null;
    const prodi = String(row.prodi || "").trim() || null;
    const role = String(row.role || "maba").trim().toLowerCase();
    const rawPass = String(row.password || "silo2026").trim();

    // Enkripsi bcrypt jika masih plaintext
    const hashedPassword = rawPass.startsWith("$2a$") || rawPass.startsWith("$2b$")
      ? rawPass
      : await bcrypt.hash(rawPass, 10);

    // Cari ID Kelompok jika group_name diisi
    let mGroupsId: number | null = null;
    const rawGroupName = String(row.group_name || row.kelompok || "").trim().toLowerCase();
    if (rawGroupName) {
      // Pencocokan eksak atau parsial (misal: 'Sirius' mencocokkan 'Kelompok 01 - Sirius')
      for (const [gNameLower, gId] of Object.entries(groupMapByName)) {
        if (gNameLower === rawGroupName || gNameLower.includes(rawGroupName)) {
          mGroupsId = gId;
          break;
        }
      }
    }

    // QR Token maba
    let qrToken = String(row.qr_token || "").trim() || null;
    if (!qrToken && role === "maba") {
      qrToken = `QR_${nim || username}_${mGroupsId || "SILO"}`;
    }

    await prisma.user.upsert({
      where: { username },
      create: {
        username,
        nim,
        nama,
        fakultas,
        prodi,
        password: hashedPassword,
        role,
        qrToken,
        mGroupsId,
      },
      update: {
        nim,
        nama,
        fakultas,
        prodi,
        password: hashedPassword,
        role,
        qrToken: qrToken || undefined,
        mGroupsId,
        deletedAt: null,
      },
    });
    summary.users++;
  }
  console.log(`   ✅ Selesai: ${summary.users} akun pengguna berhasil disimpan/diperbarui.`);

  // -------------------------------------------------------------------------
  // 4. IMPORT SHEET: group_mentors (groups_mentors)
  // -------------------------------------------------------------------------
  const gmRows = readSheetData(wb, ["group_mentors", "groups_mentors", "mentor_kelompok"]);
  console.log(`\n🤝 [4/9] Memproses ${gmRows.length} baris relasi mentor-kelompok (groups_mentors)...`);
  for (const row of gmRows) {
    const mentorUsername = String(row.mentor_username || row.username || "").trim();
    const groupName = String(row.group_name || row.kelompok || "").trim().toLowerCase();
    if (!mentorUsername || !groupName) continue;

    const mentorUser = await prisma.user.findFirst({
      where: { username: mentorUsername, deletedAt: null },
    });
    if (!mentorUser) {
      console.warn(`   ⚠️ Mentor "${mentorUsername}" tidak ditemukan di database.`);
      continue;
    }

    let targetGroupId: number | null = null;
    for (const [gNameLower, gId] of Object.entries(groupMapByName)) {
      if (gNameLower === groupName || gNameLower.includes(groupName)) {
        targetGroupId = gId;
        break;
      }
    }

    if (!targetGroupId) {
      console.warn(`   ⚠️ Kelompok "${groupName}" tidak ditemukan di database.`);
      continue;
    }

    await prisma.groupMentor.upsert({
      where: {
        mGroupsId_mUsersId: {
          mGroupsId: targetGroupId,
          mUsersId: mentorUser.id,
        },
      },
      create: {
        mGroupsId: targetGroupId,
        mUsersId: mentorUser.id,
      },
      update: {
        deletedAt: null,
      },
    });
    summary.groupMentors++;
  }
  console.log(`   ✅ Selesai: ${summary.groupMentors} relasi mentor-kelompok berhasil dihubungkan.`);

  // -------------------------------------------------------------------------
  // 5. IMPORT SHEET: assignments (m_assignments)
  // -------------------------------------------------------------------------
  const assignRows = readSheetData(wb, ["assignments", "m_assignments", "tugas"]);
  console.log(`\n📋 [5/9] Memproses ${assignRows.length} baris penugasan (m_assignments)...`);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["admin", "panitia"] }, deletedAt: null },
  });

  for (const row of assignRows) {
    const title = String(row.title || row.judul || "").trim();
    if (!title) continue;

    const description = String(row.description || row.deskripsi || "").trim() || null;
    const attachmentUrl = String(row.attachment_url || row.link || "").trim() || null;
    const dueDate = parseExcelDate(row.due_date || row.deadline) || new Date(Date.now() + 7 * 86400000);

    let createdBy = adminUser?.id || null;
    const creatorUname = String(row.created_by_username || "").trim();
    if (creatorUname) {
      const u = await prisma.user.findFirst({ where: { username: creatorUname } });
      if (u) createdBy = u.id;
    }

    const existing = await prisma.assignment.findFirst({ where: { title } });
    if (existing) {
      await prisma.assignment.update({
        where: { id: existing.id },
        data: {
          description,
          attachmentUrl,
          dueDate,
          createdBy,
          deletedAt: null,
        },
      });
    } else {
      await prisma.assignment.create({
        data: {
          title,
          description,
          attachmentUrl,
          dueDate,
          createdBy,
        },
      });
    }
    summary.assignments++;
  }
  console.log(`   ✅ Selesai: ${summary.assignments} penugasan berhasil disimpan/diperbarui.`);

  // -------------------------------------------------------------------------
  // 6. IMPORT SHEET: attendances (t_attendances)
  // -------------------------------------------------------------------------
  const attRows = readSheetData(wb, ["attendances", "t_attendances", "presensi"]);
  console.log(`\n📝 [6/9] Memproses ${attRows.length} baris riwayat presensi (t_attendances)...`);

  for (const row of attRows) {
    const mabaIdentifier = String(row.maba_username || row.maba_nim || row.nim || row.username || "").trim();
    const sessionName = String(row.session_name || row.sesi || "").trim().toLowerCase();
    if (!mabaIdentifier || !sessionName) continue;

    const mabaUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: mabaIdentifier }, { nim: mabaIdentifier }],
        deletedAt: null,
      },
    });
    if (!mabaUser) continue;

    const allSessions = await prisma.session.findMany({ where: { deletedAt: null } });
    const targetSession = allSessions.find(
      (s) => s.name.toLowerCase() === sessionName || s.name.toLowerCase().includes(sessionName)
    );
    if (!targetSession) continue;

    // Status presensi standar: Hadir, Terlambat, Izin, Sakit
    const rawStatus = String(row.status || "Hadir").trim();
    const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

    // Scanner
    let scannedBy: number | null = null;
    const scannerUname = String(row.scanned_by_username || "").trim();
    if (scannerUname) {
      const sc = await prisma.user.findFirst({ where: { username: scannerUname } });
      if (sc) scannedBy = sc.id;
    }

    const scannedAt = parseExcelDate(row.scanned_at) || new Date();

    const existing = await prisma.attendance.findFirst({
      where: {
        mabaId: mabaUser.id,
        sessionsId: targetSession.id,
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          scannedBy: scannedBy ?? undefined,
          scannedAt,
          groupsId: mabaUser.mGroupsId,
          deletedAt: null,
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          mabaId: mabaUser.id,
          sessionsId: targetSession.id,
          groupsId: mabaUser.mGroupsId,
          scannedBy,
          status,
          scannedAt,
        },
      });
    }
    summary.attendances++;
  }
  console.log(`   ✅ Selesai: ${summary.attendances} record presensi berhasil disimpan.`);

  // -------------------------------------------------------------------------
  // 7. IMPORT SHEET: submissions (t_submissions)
  // -------------------------------------------------------------------------
  const subRows = readSheetData(wb, ["submissions", "t_submissions", "pengumpulan"]);
  console.log(`\n📤 [7/9] Memproses ${subRows.length} baris pengumpulan tugas (t_submissions)...`);

  for (const row of subRows) {
    const assignTitle = String(row.assignment_title || row.tugas || "").trim().toLowerCase();
    const mabaIdentifier = String(row.maba_username || row.maba_nim || row.nim || row.username || "").trim();
    if (!assignTitle || !mabaIdentifier) continue;

    const allAssignments = await prisma.assignment.findMany({ where: { deletedAt: null } });
    const assignment = allAssignments.find(
      (a) => a.title.toLowerCase() === assignTitle || a.title.toLowerCase().includes(assignTitle)
    );
    if (!assignment) continue;

    const mabaUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: mabaIdentifier }, { nim: mabaIdentifier }],
        deletedAt: null,
      },
    });
    if (!mabaUser) continue;

    const fileUrl = String(row.file_url || row.link || "https://drive.google.com/submission").trim();
    const notes = String(row.notes || row.catatan || "").trim() || null;
    const status = String(row.status || "submitted").trim().toLowerCase();

    let score: number | null = null;
    if (row.score !== "" && row.score !== null && row.score !== undefined) {
      const num = parseFloat(String(row.score));
      if (!isNaN(num)) score = num;
    }

    const feedback = String(row.feedback || row.ulasan || "").trim() || null;

    let reviewedBy: number | null = null;
    const revUname = String(row.reviewed_by_username || "").trim();
    if (revUname) {
      const ru = await prisma.user.findFirst({ where: { username: revUname } });
      if (ru) reviewedBy = ru.id;
    }

    const submittedAt = parseExcelDate(row.submitted_at) || new Date();
    const reviewedAt = parseExcelDate(row.reviewed_at) || (score !== null ? new Date() : null);

    await prisma.submission.upsert({
      where: {
        assignmentId_mabaId: {
          assignmentId: assignment.id,
          mabaId: mabaUser.id,
        },
      },
      create: {
        assignmentId: assignment.id,
        mabaId: mabaUser.id,
        fileUrl,
        notes,
        status,
        score,
        feedback,
        reviewedBy,
        submittedAt,
        reviewedAt,
      },
      update: {
        fileUrl,
        notes,
        status,
        score,
        feedback,
        reviewedBy,
        reviewedAt,
        deletedAt: null,
      },
    });
    summary.submissions++;
  }
  console.log(`   ✅ Selesai: ${summary.submissions} pengumpulan tugas berhasil disimpan.`);

  // -------------------------------------------------------------------------
  // 8. IMPORT SHEET: attributes (m_attributes)
  // -------------------------------------------------------------------------
  const attrRows = readSheetData(wb, ["attributes", "m_attributes", "atribut"]);
  console.log(`\n📦 [8/9] Memproses ${attrRows.length} baris master atribut (m_attributes)...`);

  for (const row of attrRows) {
    const name = String(row.name || row.nama || "").trim();
    if (!name) continue;

    const description = String(row.description || row.deskripsi || "").trim() || null;
    const type = String(row.type || "individu").trim().toLowerCase();
    const targetDate = parseExcelDate(row.target_date || row.tanggal) || new Date();

    let createdBy = adminUser?.id || null;
    const crUname = String(row.created_by_username || "").trim();
    if (crUname) {
      const cu = await prisma.user.findFirst({ where: { username: crUname } });
      if (cu) createdBy = cu.id;
    }

    const existing = await prisma.attribute.findFirst({
      where: {
        name,
        targetDate,
        deletedAt: null,
      },
    });

    if (existing) {
      await prisma.attribute.update({
        where: { id: existing.id },
        data: {
          description,
          type,
          createdBy,
        },
      });
    } else {
      await prisma.attribute.create({
        data: {
          name,
          description,
          targetDate,
          type,
          createdBy,
        },
      });
    }
    summary.attributes++;
  }
  console.log(`   ✅ Selesai: ${summary.attributes} master atribut berhasil disimpan.`);

  // -------------------------------------------------------------------------
  // 9. IMPORT SHEET: attribute_checks (t_attribute_checks)
  // -------------------------------------------------------------------------
  const checkRows = readSheetData(wb, ["attribute_checks", "t_attribute_checks", "cek_atribut"]);
  console.log(`\n📋 [9/9] Memproses ${checkRows.length} baris hasil verifikasi atribut (t_attribute_checks)...`);

  const allAttributes = await prisma.attribute.findMany({ where: { deletedAt: null } });

  for (const row of checkRows) {
    const attrName = String(row.attribute_name || row.atribut || "").trim().toLowerCase();
    if (!attrName) continue;

    const targetDate = parseExcelDate(row.target_date || row.tanggal);
    const matchedAttr = allAttributes.find((a) => {
      const nameMatch = a.name.toLowerCase() === attrName || a.name.toLowerCase().includes(attrName);
      if (!nameMatch) return false;
      if (targetDate) {
        return a.targetDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10);
      }
      return true;
    });

    if (!matchedAttr) continue;

    const isBrought = parseExcelBool(row.is_brought !== undefined ? row.is_brought : true);
    const notes = String(row.notes || row.catatan || "").trim() || null;
    const checkedAt = parseExcelDate(row.checked_at) || new Date();

    // Pemeriksa (Mentor)
    let checkedBy: number | null = null;
    const chkUname = String(row.checked_by_username || "mentor01").trim();
    const cu = await prisma.user.findFirst({ where: { username: chkUname, deletedAt: null } });
    if (cu) checkedBy = cu.id;
    if (!checkedBy && adminUser) checkedBy = adminUser.id;
    if (!checkedBy) continue;

    // Atribut Individu -> Cocokkan Maba
    const mabaIdentifier = String(row.maba_username || row.maba_nim || row.nim || row.username || "").trim();
    if (matchedAttr.type === "individu" && mabaIdentifier) {
      const maba = await prisma.user.findFirst({
        where: {
          OR: [{ username: mabaIdentifier }, { nim: mabaIdentifier }],
          deletedAt: null,
        },
      });
      if (maba) {
        await prisma.attributeCheck.upsert({
          where: {
            attributeId_mabaId: {
              attributeId: matchedAttr.id,
              mabaId: maba.id,
            },
          },
          create: {
            attributeId: matchedAttr.id,
            mabaId: maba.id,
            groupId: null,
            checkedBy,
            isBrought,
            notes,
            checkedAt,
          },
          update: {
            checkedBy,
            isBrought,
            notes,
            checkedAt,
          },
        });
        summary.attributeChecks++;
      }
    } else if (matchedAttr.type === "kelompok") {
      // Atribut Kelompok -> Cocokkan Kelompok
      const rawGrp = String(row.group_name || row.kelompok || "").trim().toLowerCase();
      let targetGroupId: number | null = null;
      for (const [gNameLower, gId] of Object.entries(groupMapByName)) {
        if (gNameLower === rawGrp || gNameLower.includes(rawGrp)) {
          targetGroupId = gId;
          break;
        }
      }

      if (targetGroupId) {
        await prisma.attributeCheck.upsert({
          where: {
            attributeId_groupId: {
              attributeId: matchedAttr.id,
              groupId: targetGroupId,
            },
          },
          create: {
            attributeId: matchedAttr.id,
            mabaId: null,
            groupId: targetGroupId,
            checkedBy,
            isBrought,
            notes,
            checkedAt,
          },
          update: {
            checkedBy,
            isBrought,
            notes,
            checkedAt,
          },
        });
        summary.attributeChecks++;
      }
    }
  }
  console.log(`   ✅ Selesai: ${summary.attributeChecks} hasil checklist atribut berhasil disimpan.`);

  // -------------------------------------------------------------------------
  // RINGKASAN AKHIR
  // -------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log("🎉 SEEDER IMPORT DARI EXCEL BERHASIL SELESAI!");
  console.log("============================================================");
  console.log(`🏢 Kelompok (m_groups)             : ${summary.groups}`);
  console.log(`🕒 Sesi Kegiatan (m_sessions)       : ${summary.sessions}`);
  console.log(`👤 Pengguna (m_users)              : ${summary.users}`);
  console.log(`🤝 Mentor Kelompok (groups_mentors) : ${summary.groupMentors}`);
  console.log(`📋 Penugasan (m_assignments)        : ${summary.assignments}`);
  console.log(`📝 Riwayat Presensi (t_attendances) : ${summary.attendances}`);
  console.log(`📤 Pengumpulan Tugas (t_submissions): ${summary.submissions}`);
  console.log(`📦 Master Atribut (m_attributes)    : ${summary.attributes}`);
  console.log(`✅ Checklist Atribut (t_attribute_checks): ${summary.attributeChecks}`);
  console.log("============================================================\n");
}

async function main() {
  const customFilePath = process.argv[2];
  try {
    await importFromExcel(customFilePath);
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat mengimpor data dari Excel:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
