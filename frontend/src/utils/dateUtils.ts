/**
 * Date formatting utilities for DuckRow.
 * Ensures consistent dd/mm/yyyy and dd/mm/yyyy HH:mm formats across all browsers/locales.
 */

/**
 * Formats an ISO date string or YYYY-MM-DD string into dd/mm/yyyy.
 * Handles YYYY-MM-DD input cleanly without timezone shift issues.
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';

  // Handle plain YYYY-MM-DD (e.g. from <input type="date">)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats an ISO date string into dd/mm/yyyy HH:mm.
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculates human-readable duration between start and end date strings.
 * e.g. "3h 15m", "1 día, 4h 30m", "2 días, 6h", "< 1 min"
 */
export function formatDuration(startDateStr?: string | null, endDateStr?: string | null, lang: string = 'es'): string | null {
  if (!startDateStr || !endDateStr) return null;
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;

  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '< 1 min';
  if (diffMins < 60) return `${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  if (diffHours < 24) return `${diffHours}h ${remMins > 0 ? `${remMins}m` : ''}`.trim();

  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  const isEs = lang.startsWith('es');
  const dayUnit = isEs ? (diffDays === 1 ? '1 día' : `${diffDays} días`) : (diffDays === 1 ? '1 day' : `${diffDays} days`);

  const timeParts: string[] = [];
  if (remHours > 0) timeParts.push(`${remHours}h`);
  if (remMins > 0) timeParts.push(`${remMins}m`);

  return timeParts.length > 0 ? `${dayUnit}, ${timeParts.join(' ')}` : dayUnit;
}

/**
 * Converts an ISO date string or Date object to local YYYY-MM-DDTHH:mm string
 * for use as value in <input type="datetime-local">.
 */
export function toLocalInputDateTime(dateStrOrObj?: string | Date | null): string {
  if (!dateStrOrObj) return '';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
