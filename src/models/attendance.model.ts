import { prisma } from "@/utils/prisma";
import type { Attendance, Prisma } from "@prisma/client";
import { canMentorScanProdi, getAllowedProdisForMentor, isProdiAttendanceType } from "@/config/attendance";

export interface ScanAttendanceParams {
  qrToken: string;
  sessionId: number;
  scannedBy?: number;
  scanTime?: Date;
  allowOutsideSchedule?: boolean;
}

export interface ScanAttendanceResult {
  success: boolean;
  code:
    | "SUCCESS"
    | "USER_NOT_FOUND"
    | "SESSION_NOT_FOUND"
    | "SESSION_NOT_STARTED"
    | "SESSION_ENDED"
    | "ALREADY_ATTENDED"
    | "UNAUTHORIZED_GROUP"
    | "UNAUTHORIZED_PRODI"
    | "UNAUTHORIZED_SCANNER"
    | "ERROR";
  message: string;
  data?: unknown;
}

export class AttendanceModel {
  /**
   * Mencatat kehadiran / presensi baru
   */
  static async record(data: Prisma.AttendanceCreateInput): Promise<Attendance> {
    return prisma.attendance.create({
      data,
    });
  }

  /**
   * Cek apakah mahasiswa sudah presensi pada suatu sesi
   */
  static async checkAlreadyAttended(mabaId: number, sessionsId: number) {
    return prisma.attendance.findFirst({
      where: {
        mabaId,
        sessionsId,
        deletedAt: null,
      },
      include: {
        session: true,
        scanner: true,
      },
    });
  }

  /**
   * Logika Inti: Scan QR Token Maba oleh Mentor / Panitia / Admin
   * - Memvalidasi token maba (mendukung qrToken, NIM, atau username)
   * - Memvalidasi sesi aktif (mendukung sesi uji coba & bypass jadwal untuk pengujian)
   * - Validasi Otorisasi Scanner:
   *   * Panitia & Admin: Bypass penuh (universal scanner)
   *   * Mentor + Sesi GROUP: Validasi Negara via groups_mentors
   *   * Mentor + Sesi PRODI: Validasi prodi mentor vs maba via PRODI_SCAN_PERMISSIONS
   * - Menghitung keterlambatan berdasarkan endSessions + toleransi (menit)
   * - Mencegah duplikasi dengan unique constraint (maba_id, sessions_id)
   * - Mencatat data ke t_attendances dengan groups_id merujuk ke kelompok asal maba
   */
  static async scanAndRecord(params: ScanAttendanceParams): Promise<ScanAttendanceResult> {
    const { qrToken, sessionId, scannedBy, scanTime = new Date(), allowOutsideSchedule = false } = params;

    const cleanToken = String(qrToken || "").trim();
    if (!cleanToken) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: "Token QR atau NIM kosong. Silakan arahkan kamera ke QR Code maba.",
      };
    }

    // 1. Cari Mahasiswa berdasarkan qrToken, NIM, atau username
    const maba = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { qrToken: cleanToken },
          { nim: cleanToken },
          { username: cleanToken },
        ],
      },
      include: {
        group: true,
      },
    });

    if (!maba) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: `Mahasiswa dengan data QR / NIM "${cleanToken}" tidak ditemukan di sistem. Pastikan QR code milik mahasiswa baru aktif.`,
      };
    }

    // 2. Cari Sesi berdasarkan sessionId
    const session = await prisma.session.findFirst({
      where: {
        id: Number(sessionId),
        deletedAt: null,
      },
    });

    if (!session) {
      return {
        success: false,
        code: "SESSION_NOT_FOUND",
        message: `Sesi kegiatan (ID: ${sessionId}) tidak ditemukan atau sudah dinonaktifkan.`,
      };
    }

    // 3. Validasi Waktu Sesi
    // Sesi Uji Coba atau flag allowOutsideSchedule dapat discan kapan saja tanpa batasan tanggal
    const isTestSession =
      session.name.toLowerCase().includes("uji coba") ||
      session.name.toLowerCase().includes("test") ||
      session.name.toLowerCase().includes("trial");

    const bypassSchedule = isTestSession || allowOutsideSchedule;

    if (!bypassSchedule) {
      // Jika scan dilakukan jauh sebelum sesi dimulai (> 4 jam)
      if (scanTime < session.startSessions) {
        const diffMs = session.startSessions.getTime() - scanTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 4) {
          const formattedDate = session.startSessions.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          });
          const formattedTime = session.startSessions.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            success: false,
            code: "SESSION_NOT_STARTED",
            message: `Sesi "${session.name}" dijadwalkan pada ${formattedDate} pukul ${formattedTime} WIB. Waktu presensi belum dibuka. Silakan pilih "Sesi Uji Coba" untuk melakukan pengujian scan.`,
          };
        }
      }

      // Jika scan dilakukan jauh setelah sesi berakhir (> 2 jam)
      if (scanTime > session.endSessions) {
        const diffMs = scanTime.getTime() - session.endSessions.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 2) {
          const formattedTime = session.endSessions.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            success: false,
            code: "SESSION_ENDED",
            message: `Sesi "${session.name}" sudah ditutup pada pukul ${formattedTime} WIB. Presensi untuk sesi ini telah berakhir.`,
          };
        }
      }
    }

    // 4. Validasi Kewenangan Scanner (Panitia & Admin vs Mentor)
    if (scannedBy) {
      const scanner = await prisma.user.findFirst({
        where: { id: Number(scannedBy), deletedAt: null },
        include: {
          groupMentors: {
            where: { deletedAt: null },
            include: { group: true },
          },
        },
      });

      if (!scanner) {
        return {
          success: false,
          code: "UNAUTHORIZED_SCANNER",
          message: "Data akun pemindai tidak valid atau sudah dinonaktifkan.",
        };
      }

      const isSupervisor = scanner.role === "admin" || scanner.role === "panitia";

      if (!isSupervisor) {
        // Scanner adalah mentor -> validasi berdasarkan tipe sesi (prodi vs grup)
        if (session.attendanceType?.toLowerCase() === "prodi") {
          // A. Sesi Berbasis Prodi (Pengambilan Atribut Kampus & Foto KTM)
          const isAllowedProdi = canMentorScanProdi(scanner.prodi, maba.prodi);
          if (!isAllowedProdi) {
            const allowedProdis = getAllowedProdisForMentor(scanner.prodi);
            return {
              success: false,
              code: "UNAUTHORIZED_PRODI",
              message: `Akses ditolak: Mahasiswa ${maba.nama} (${maba.nim || maba.username}) berasal dari prodi ${maba.prodi || "Tidak Diketahui"}. Sebagai mentor ${scanner.prodi || "Tidak Diketahui"}, Anda hanya berwenang memindai: ${allowedProdis.join(", ")}.`,
              data: {
                maba: {
                  id: maba.id,
                  nama: maba.nama,
                  nim: maba.nim,
                  prodi: maba.prodi,
                  group: maba.group ? { id: maba.group.id, name: maba.group.name } : null,
                },
                allowedProdis,
                scannerProdi: scanner.prodi,
              },
            };
          }
        } else {
          // B. Sesi Reguler Berbasis Kelompok (GROUP)
          const isMentorOfGroup = scanner.groupMentors.some(
            (gm) => gm.mGroupsId === maba.mGroupsId
          );

          if (!isMentorOfGroup) {
            const mentoredNames = scanner.groupMentors.map((gm) => gm.group.name);
            return {
              success: false,
              code: "UNAUTHORIZED_GROUP",
              message: `Akses ditolak: Mahasiswa ${maba.nama} (${maba.nim || maba.username}) terdaftar di kelompok "${maba.group?.name || "Tanpa Kelompok"}". Anda hanya berhak memindai mahasiswa Negara Anda (${mentoredNames.length > 0 ? mentoredNames.join(", ") : "Tidak ada Negara aktif"}).`,
              data: {
                maba: {
                  id: maba.id,
                  nama: maba.nama,
                  nim: maba.nim,
                  prodi: maba.prodi,
                  group: maba.group ? { id: maba.group.id, name: maba.group.name } : null,
                },
                mentoredGroups: mentoredNames,
              },
            };
          }
        }
      }
    }

    // 5. Cek data presensi di sesi ini (cek apakah ada record aktif atau soft-deleted)
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        mabaId: maba.id,
        sessionsId: session.id,
      },
      include: {
        session: true,
        scanner: true,
      },
    });

    // Jika record ADA dan masih AKTIF (deletedAt === null), tolak dengan ALREADY_ATTENDED
    if (existingRecord && existingRecord.deletedAt === null) {
      const timeStr = existingRecord.scannedAt
        ? new Date(existingRecord.scannedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-";
      return {
        success: false,
        code: "ALREADY_ATTENDED",
        message: `Mahasiswa ${maba.nama} (${maba.nim || maba.username}) sudah tercatat presensi pada pukul ${timeStr} WIB (${existingRecord.status}).`,
        data: {
          ...existingRecord,
          maba: {
            id: maba.id,
            nama: maba.nama,
            nim: maba.nim,
            prodi: maba.prodi,
            group: maba.group ? { id: maba.group.id, name: maba.group.name } : null,
          },
        },
      };
    }

    // 6. Hitung Batas Waktu Keterlambatan Presensi
    // Mahasiswa tercatat "Hadir" (Tepat Waktu) jika presensi sebelum/hingga waktu selesai sesi + toleransi
    const toleranceMs = (session.toleransi ?? 0) * 60 * 1000;
    const maxOnTime = new Date(session.endSessions.getTime() + toleranceMs);
    const status = isTestSession || scanTime <= maxOnTime ? "Hadir" : "Terlambat";

    // 7. Simpan atau Pulihkan (Restore) ke database
    // Jika record sebelumnya berstatus soft-deleted (deletedAt !== null), pulihkan (restore/update) record tersebut
    // agar data presensi baru tercatat dan tidak melanggar unique constraint (mabaId, sessionsId) di tabel t_attendances.
    try {
      let attendance;
      if (existingRecord) {
        attendance = await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            deletedAt: null,
            scannedAt: scanTime,
            scannedBy: scannedBy ?? null,
            groupsId: maba.mGroupsId,
            status,
          },
          include: {
            maba: {
              select: {
                id: true,
                nama: true,
                nim: true,
                prodi: true,
                group: true,
              },
            },
            session: true,
            scanner: {
              select: {
                id: true,
                nama: true,
                role: true,
              },
            },
          },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            mabaId: maba.id,
            scannedBy: scannedBy ?? null,
            sessionsId: session.id,
            groupsId: maba.mGroupsId,
            scannedAt: scanTime,
            status,
          },
          include: {
            maba: {
              select: {
                id: true,
                nama: true,
                nim: true,
                prodi: true,
                group: true,
              },
            },
            session: true,
            scanner: {
              select: {
                id: true,
                nama: true,
                role: true,
              },
            },
          },
        });
      }

      const lateNotice = status === "Terlambat" ? " (Terlambat - Melebihi batas toleransi)" : " (Hadir - Tepat Waktu)";

      return {
        success: true,
        code: "SUCCESS",
        message: `Presensi berhasil dicatat: ${maba.nama}${lateNotice}.`,
        data: attendance,
      };
    } catch (err: unknown) {
      // Tangani Prisma Unique Constraint Violation (P2002) untuk kondisi balapan / race condition
      const prismaError = err as { code?: string };
      if (prismaError?.code === "P2002") {
        const doubleCheck = await prisma.attendance.findFirst({
          where: { mabaId: maba.id, sessionsId: session.id },
          include: {
            session: true,
            scanner: true,
          },
        });

        // Jika doubleCheck ternyata soft-deleted, lakukan update restore
        if (doubleCheck && doubleCheck.deletedAt !== null) {
          const restored = await prisma.attendance.update({
            where: { id: doubleCheck.id },
            data: {
              deletedAt: null,
              scannedAt: scanTime,
              scannedBy: scannedBy ?? null,
              groupsId: maba.mGroupsId,
              status,
            },
            include: {
              maba: {
                select: {
                  id: true,
                  nama: true,
                  nim: true,
                  prodi: true,
                  group: true,
                },
              },
              session: true,
              scanner: {
                select: {
                  id: true,
                  nama: true,
                  role: true,
                },
              },
            },
          });
          const lateNotice = status === "Terlambat" ? " (Terlambat - Melebihi batas toleransi)" : " (Hadir - Tepat Waktu)";
          return {
            success: true,
            code: "SUCCESS",
            message: `Presensi berhasil dicatat: ${maba.nama}${lateNotice}.`,
            data: restored,
          };
        }

        const timeStr = doubleCheck?.scannedAt
          ? new Date(doubleCheck.scannedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "-";

        return {
          success: false,
          code: "ALREADY_ATTENDED",
          message: `Mahasiswa ${maba.nama} (${maba.nim || maba.username}) sudah tercatat presensi pada sesi ini.`,
          data: {
            ...doubleCheck,
            maba: {
              id: maba.id,
              nama: maba.nama,
              nim: maba.nim,
              prodi: maba.prodi,
              group: maba.group ? { id: maba.group.id, name: maba.group.name } : null,
            },
          },
        };
      }
      throw err;
    }
  }

  /**
   * Mengambil presensi berdasarkan ID (hanya yang aktif)
   */
  static async getById(id: number) {
    return prisma.attendance.findFirst({
      where: {
        id,
        deletedAt: null,
        maba: { deletedAt: null },
        session: { deletedAt: null },
      },
      include: {
        maba: true,
        scanner: true,
        session: true,
        group: true,
      },
    });
  }

  /**
   * Mengambil semua presensi aktif dengan filter dinamis
   */
  static async getAll(filter?: {
    sessionsId?: number;
    groupsId?: number;
    mabaId?: number;
    scannedBy?: number;
    status?: string;
  }) {
    return prisma.attendance.findMany({
      where: {
        deletedAt: null,
        maba: { deletedAt: null },
        session: { deletedAt: null },
        ...(filter?.sessionsId ? { sessionsId: filter.sessionsId } : {}),
        ...(filter?.groupsId ? { groupsId: filter.groupsId } : {}),
        ...(filter?.mabaId ? { mabaId: filter.mabaId } : {}),
        ...(filter?.scannedBy ? { scannedBy: filter.scannedBy } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      include: {
        maba: {
          select: {
            id: true,
            nama: true,
            nim: true,
            prodi: true,
            group: true,
          },
        },
        session: true,
        scanner: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
      orderBy: { scannedAt: "desc" },
    });
  }

  /**
   * Mengubah status presensi
   */
  static async updateStatus(id: number, status: string): Promise<Attendance> {
    return prisma.attendance.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Soft delete presensi (mengisi deletedAt)
   */
  static async softDelete(id: number): Promise<Attendance> {
    return prisma.attendance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore data presensi yang terhapus
   */
  static async restore(id: number): Promise<Attendance> {
    return prisma.attendance.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  /**
   * Hard delete log presensi
   */
  static async delete(id: number): Promise<Attendance> {
    return prisma.attendance.delete({
      where: { id },
    });
  }
}
