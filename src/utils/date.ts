/**
 * Utilitas Tanggal & Waktu Terpusat untuk Input dan Tampilan
 * Format standar UI: "DD/MM/YY HH:mm" (Contoh: 17/09/26 07:00)
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Parse berbagai format tanggal menjadi objek Date:
 * - DD/MM/YY HH:mm (17/09/26 07:00)
 * - DD/MM/YYYY HH:mm (17/09/2026 07:00)
 * - DD-MM-YY HH:mm / DD-MM-YYYY HH:mm
 * - ISO string: 2026-09-17T07:00:00.000Z
 * - Local ISO: 2026-09-17T07:00
 */
export function parseDateTimeInput(str: string | null | undefined): Date | null {
  if (!str || !str.trim()) return null;
  const cleaned = str.trim();

  // 1. Format DD/MM/YY HH:mm atau DD-MM-YY HH:mm
  const dmyMatch = cleaned.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\s+(\d{1,2}):(\d{1,2})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const hours = parseInt(dmyMatch[4], 10);
    const minutes = parseInt(dmyMatch[5], 10);

    if (month < 0 || month > 11 || day < 1 || day > 31 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    const d = new Date(year, month, day, hours, minutes, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2. Format ISO atau format tanggal JavaScript lainnya (misal 2026-09-17T07:00)
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format objek Date atau string tanggal menjadi format string tampilan "DD/MM/YY HH:mm"
 * Contoh: Date(2026-09-17 07:00) -> "17/09/26 07:00"
 * Contoh: "2026-09-11T13:00" -> "11/09/26 13:00"
 */
export function formatDateTimeInput(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateTimeInput(val) : val;
  if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "";

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = String(d.getFullYear()).slice(-2);
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Konversi Date atau string format "DD/MM/YY HH:mm" ke format local ISO "YYYY-MM-DDTHH:mm"
 * yang dibutuhkan oleh elemen native <input type="datetime-local" />
 */
export function toDateTimeLocalValue(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateTimeInput(val) : val;
  if (!d || isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
