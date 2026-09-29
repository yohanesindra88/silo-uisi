/**
 * Utilitas Tanggal & Waktu Terpusat untuk Input dan Tampilan
 * Standar format:
 * - Input (Form & Filter): "DD/MM/YYYY" (Contoh: 29/09/2026) atau "DD/MM/YYYY HH:mm" (Contoh: 29/09/2026 14:00)
 * - Teks Panjang: Bahasa Indonesia lengkap (Contoh: 29 September 2026)
 * - Teks Singkat: Bahasa Indonesia singkat (Contoh: 29 Sep 2026)
 */

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const DAY_NAMES_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Parse berbagai format tanggal menjadi objek Date yang valid:
 * - DD/MM/YYYY (29/09/2026)
 * - DD/MM/YYYY HH:mm (29/09/2026 14:00)
 * - DD/MM/YY HH:mm (29/09/26 14:00)
 * - YYYY-MM-DD (2026-09-29)
 * - YYYY-MM-DDTHH:mm (2026-09-29T14:00)
 * - ISO string: 2026-09-29T14:00:00.000Z
 */
export function parseDateInput(str: string | null | undefined): Date | null {
  if (!str || !str.trim()) return null;
  const cleaned = str.trim();

  // 1. Format DD/MM/YYYY HH:mm atau DD/MM/YY HH:mm
  const dmyTimeMatch = cleaned.match(
    /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
  );
  if (dmyTimeMatch) {
    const day = parseInt(dmyTimeMatch[1], 10);
    const month = parseInt(dmyTimeMatch[2], 10) - 1;
    let year = parseInt(dmyTimeMatch[3], 10);
    if (year < 100) year += 2000;
    const hours = parseInt(dmyTimeMatch[4], 10);
    const minutes = parseInt(dmyTimeMatch[5], 10);
    const seconds = dmyTimeMatch[6] ? parseInt(dmyTimeMatch[6], 10) : 0;

    if (
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31 ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }
    const d = new Date(year, month, day, hours, minutes, seconds, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2. Format tanggal saja: DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;

    if (month < 0 || month > 11 || day < 1 || day > 31) {
      return null;
    }
    const d = new Date(year, month, day, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. Format YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  // 4. Format ISO atau tanggal JS standar
  const normalized = cleaned.includes(" ") && !cleaned.includes("T")
    ? cleaned.replace(" ", "T")
    : cleaned;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

// Alias untuk backwards compatibility
export const parseDateTimeInput = parseDateInput;

/**
 * Format tanggal untuk INPUT / FORM / FILTER: "DD/MM/YYYY" (Contoh: 29/09/2026)
 */
export function formatDateInput(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "";

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format tanggal & waktu untuk INPUT / FORM / FILTER: "DD/MM/YYYY HH:mm" (Contoh: 29/09/2026 14:00)
 */
export function formatDateTimeInput(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "";

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format teks panjang bahasa Indonesia: "29 September 2026"
 * Jika withTime = true: "29 September 2026, 14:00 WIB"
 * Jika withDay = true: "Rabu, 29 September 2026"
 */
export function formatDateLong(
  val: Date | string | null | undefined,
  options?: { withTime?: boolean; withDay?: boolean; withWib?: boolean }
): string {
  if (!val) return "-";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "-";

  const dayName = DAY_NAMES_ID[d.getDay()];
  const day = d.getDate();
  const monthName = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  let result = `${day} ${monthName} ${year}`;
  if (options?.withDay) {
    result = `${dayName}, ${result}`;
  }
  if (options?.withTime) {
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const suffix = options?.withWib !== false ? " WIB" : "";
    result = `${result}, ${hours}:${minutes}${suffix}`;
  }

  return result;
}

/**
 * Format teks singkat bahasa Indonesia: "29 Sep 2026"
 * Jika withTime = true: "29 Sep 2026, 14:00 WIB"
 */
export function formatDateShort(
  val: Date | string | null | undefined,
  options?: { withTime?: boolean; withWib?: boolean }
): string {
  if (!val) return "-";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return typeof val === "string" ? val : "-";

  const day = d.getDate();
  const monthShort = MONTH_SHORT_ID[d.getMonth()];
  const year = d.getFullYear();

  let result = `${day} ${monthShort} ${year}`;
  if (options?.withTime) {
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const suffix = options?.withWib !== false ? " WIB" : "";
    result = `${result}, ${hours}:${minutes}${suffix}`;
  }

  return result;
}

/**
 * Konversi Date atau string ke format native input tanggal: "YYYY-MM-DD"
 */
export function toDateInputValue(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());

  return `${year}-${month}-${day}`;
}

/**
 * Konversi Date atau string ke format native input datetime-local: "YYYY-MM-DDTHH:mm"
 */
export function toDateTimeLocalValue(val: Date | string | null | undefined): string {
  if (!val) return "";
  const d = typeof val === "string" ? parseDateInput(val) : val;
  if (!d || isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
