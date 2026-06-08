// ── ROBUST DATE UTILITIES ──
// Internal format: ISO YYYY-MM-DD
// Display format: dd/mm/yyyy

/** Check if string is valid dd/mm/yyyy with full 4-digit year */
export function isValidDateString(str: string): boolean {
  if (!str) return false;
  const parts = str.split(/[\/\-.]/);
  if (parts.length !== 3) return false;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const y = parseInt(parts[2]);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  // Require full 4-digit year — prevents "08/06/2" from being treated as valid
  if (y < 1000) return false;
  return true;
}

/** Parse dd/mm/yyyy, yyyy-mm-dd, or dd-mm-yyyy → Date object (local midnight) */
export function parseDateToObject(str: string): Date | null {
  if (!str) return null;

  // ISO: 2026-06-03
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const parts = str.split(/[\/\-.]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0]);
    const m = parseInt(parts[1]) - 1;
    let y = parseInt(parts[2]);
    // Only auto-correct exactly 2-digit years (e.g. "26" → 2026)
    if (y < 100 && parts[2].length === 2) y += 2000;
    const date = new Date(y, m, d);
    if (date.getDate() === d && date.getMonth() === m && date.getFullYear() === y) {
      return date;
    }
  }

  return null;
}

/** Convert any date format to ISO YYYY-MM-DD */
export function formatDateISO(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? parseDateToObject(date) : date;
  if (!d) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert any date format to dd/mm/yyyy display */
export function formatDateDisplay(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseDateToObject(date) : date;
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Compare two dates (any format) — returns true if a ≤ b */
export function isDateBeforeOrEqual(a?: string, b?: string): boolean {
  if (!a || !b) return true;
  const da = parseDateToObject(a);
  const db = parseDateToObject(b);
  if (!da || !db) return true;
  return da.getTime() <= db.getTime();
}

// ═════════════════════════════════════════════════════════════════════════════
//  BACKWARD-COMPATIBLE ALIASES (from v1)
// ═════════════════════════════════════════════════════════════════════════════

/** @deprecated Use parseDateToObject() instead */
export function parseDate(dateStr: string | undefined): Date | null {
  return parseDateToObject(dateStr || "");
}

/** @deprecated Use formatDateDisplay() instead */
export function formatDate(date: Date): string {
  return formatDateDisplay(date);
}

/** @deprecated Use formatDateDisplay(new Date()) instead */
export function getTodayString(): string {
  return formatDateDisplay(new Date());
}