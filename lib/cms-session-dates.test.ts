import { describe, expect, it } from 'vitest';
import { sessionDateInput, sessionDateIso } from './cms-session-dates';
describe('Vietnam session dates', () => {
  it('interprets timezone-less inputs as Vietnam time and stores UTC', () => {
    expect(sessionDateIso('2026-10-16T09:30')).toBe('2026-10-16T02:30:00.000Z');
    expect(sessionDateInput('2026-10-16T02:30:00Z')).toBe('2026-10-16T09:30');
    expect(sessionDateInput('2026-10-16T09:30')).toBe('2026-10-16T09:30');
  });
  it('preserves explicit offsets and crosses midnight correctly', () => {
    expect(sessionDateInput('2026-10-16T20:00:00Z')).toBe('2026-10-17T03:00');
    expect(sessionDateIso('2026-10-16T09:30:00+07:00')).toBe('2026-10-16T02:30:00.000Z');
  });
  it.each(['2026-02-30T09:30', '2026-13-01T09:30', '2026-10-16T24:00', '2026-10-16', 'invalid'])('rejects invalid calendar value %s', value => {
    expect(() => sessionDateIso(value)).toThrow('INVALID_SESSION_DATETIME');
  });
  it('allows unspecified dates', () => { expect(sessionDateIso('')).toBeNull(); expect(sessionDateInput(null)).toBe(''); });
});
