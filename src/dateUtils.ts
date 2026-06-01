// Date parsing and formatting utilities (dd/mm/yyyy format)

/**
 * Parse a date string in dd/mm/yyyy format
 * Returns null if invalid
 */
export function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  
  const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  
  const date = new Date(yyyy, mm - 1, dd);
  return date;
}

/**
 * Format a date to dd/mm/yyyy string
 */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Get today's date in dd/mm/yyyy format
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * Check if a date string is valid dd/mm/yyyy
 */
export function isValidDateString(dateStr: string): boolean {
  return parseDate(dateStr) !== null;
}

/**
 * Check if a task is overdue
 * Overdue = today > estEnd AND task is not completed/cancelled
 */
export function isTaskOverdue(
  estEnd: string | undefined,
  done: boolean,
  cancelledReason: string | undefined
): boolean {
  if (!estEnd || done || cancelledReason) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = parseDate(estEnd);
  if (!end) return false;
  end.setHours(0, 0, 0, 0);
  
  return today > end;
}

/**
 * Get task status (auto-derived)
 * Priority: cancelled > completed > inprogress > pending
 */
export function getTaskStatus(
  done: boolean,
  cancelledReason: string | undefined,
  actStart: string | undefined
): 'cancelled' | 'completed' | 'inprogress' | 'pending' {
  if (cancelledReason) return 'cancelled';
  if (done) return 'completed';
  if (actStart) return 'inprogress';
  return 'pending';
}

/**
 * Days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
}
