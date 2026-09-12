import { prisma } from "@/utils/prisma";
import type { Attendance, Prisma } from "@prisma/client";

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
    | "ERROR";
  message: string;
  data?: any;
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
   * Logika Inti: Scan QR Token Maba oleh Mentor
   * - Memvalidasi token maba (mendukung qrToken, NIM, atau username)
   * - Memvalidasi sesi aktif (mendukung sesi uji coba & bypass jadwal untuk pengujian)
   * - Menghitung keterlambatan berdasarkan endSessions + toleransi (menit)
   * - Memvalidasi jadwal sesi kegiatansi di sesi yang sama
   * - Mencatat data ke t_attendances
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

    // 4. Cek apakah sudah pernah presensi di sesi ini
    const existing = await this.checkAlreadyAttended(maba.id, session.id);
    if (existing) {
      const timeStr = existing.scannedAt
        ? new Date(existing.scannedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-";
      return {
        success: false,
        code: "ALREADY_ATTENDED",
        message: `Mahasiswa ${maba.nama} (${maba.nim || maba.username}) sudah tercatat presensi pada pukul ${timeStr} WIB (${existing.status}).`,
        data: existing,
      };
    }

    // 5. Hitung Batas Waktu Keterlambatan Presensi
    // Mahasiswa tercatat "Hadir" (Tepat Waktu) jika presensi sebelum/hingga waktu selesai sesi + toleransi
    const toleranceMs = (session.toleransi ?? 0) * 60 * 1000;
    const maxOnTime = new Date(session.endSessions.getTime() + toleranceMs);
    const status = isTestSession || scanTime <= maxOnTime ? "Hadir" : "Terlambat";

    // 6. Simpan ke database
    const attendance = await prisma.attendance.create({
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

    const lateNotice = status === "Terlambat" ? " (Terlambat - Melebihi batas toleransi)" : " (Hadir - Tepat Waktu)";

    return {
      success: true,
      code: "SUCCESS",
      message: `Presensi berhasil dicatat: ${maba.nama}${lateNotice}.`,
      data: attendance,
    };
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
