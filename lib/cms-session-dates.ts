// Timezone-less legacy values and datetime-local inputs represent Vietnam time.
export function sessionDateIso(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(text);
  if (!match) throw new Error('INVALID_SESSION_DATETIME');
  const [, year, month, day, hour, minute, second = '0'] = match;
  const calendar = new Date(Date.UTC(+year, +month - 1, +day));
  if (calendar.getUTCFullYear() !== +year || calendar.getUTCMonth() !== +month - 1 || calendar.getUTCDate() !== +day || +hour > 23 || +minute > 59 || +second > 59) throw new Error('INVALID_SESSION_DATETIME');
  const date = new Date(match[8] ? text : `${text}+07:00`);
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_SESSION_DATETIME');
  return date.toISOString();
}
export function sessionDateInput(value: unknown): string {
  const iso = sessionDateIso(value);
  return iso ? new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16) : '';
}
export function sessionDateLabel(value: unknown): string {
  const iso = sessionDateIso(value);
  return iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }) : 'Chưa chốt thời gian';
}
