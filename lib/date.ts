/**
 * Date utility functions for timezone handling and formatting
 */

/**
 * Convert a Date to UTC ISO string
 */
export function toUTCISO(date: Date): string {
  return date.toISOString();
}

/**
 * Convert UTC ISO string to local Date
 */
export function toLocal(utcISO: string): Date {
  return new Date(utcISO);
}

/**
 * Generate date key in YYYY-MM-DD format in local timezone
 */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Round a date to the nearest half hour
 */
export function nearestHalfHour(date: Date = new Date()): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();

  if (minutes < 15) {
    rounded.setMinutes(0);
  } else if (minutes < 45) {
    rounded.setMinutes(30);
  } else {
    rounded.setMinutes(0);
    rounded.setHours(rounded.getHours() + 1);
  }

  rounded.setSeconds(0);
  rounded.setMilliseconds(0);

  return rounded;
}

/**
 * Get start and end dates for a month with padding
 */
export function getMonthRange(year: number, month: number, weeksPadding: number = 2) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  // Add padding weeks
  const paddingDays = weeksPadding * 7;
  const start = new Date(startOfMonth);
  start.setDate(start.getDate() - paddingDays);

  const end = new Date(endOfMonth);
  end.setDate(end.getDate() + paddingDays);

  return {
    startISO: toUTCISO(start),
    endISO: toUTCISO(end)
  };
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Format time in 12-hour format
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return dateKey(date) === dateKey(today);
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Get week dates for weekly repeat
 */
export function getWeeklyRepeatDates(
  startDate: Date,
  weeks: number
): Date[] {
  const dates: Date[] = [];
  for (let i = 1; i <= weeks; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 7));
    dates.push(date);
  }
  return dates;
}