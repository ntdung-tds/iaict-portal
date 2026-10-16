// Shared by the editor and API so guidance and validation agree.
export function expertFieldsError(data: Record<string, unknown>): string | null {
  const parse = (value: unknown, fallback: unknown) => value == null || value === '' ? fallback : typeof value === 'string' ? JSON.parse(value) : value;
  try {
    const expertise = parse(data.expertise_json, []);
    if (!Array.isArray(expertise) || expertise.some(item => typeof item !== 'string' || !item.trim())) return 'EXPERT_EXPERTISE';
    const contacts = parse(data.public_contacts_json, {});
    if (!contacts || typeof contacts !== 'object' || Array.isArray(contacts) || Object.values(contacts).some(value => typeof value !== 'string' || !value.trim())) return 'EXPERT_CONTACTS';
    if (contacts.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacts.email)) return 'EXPERT_EMAIL';
    if (contacts.website) {
      try { if (new URL(contacts.website).protocol !== 'https:') return 'EXPERT_WEBSITE'; }
      catch { return 'EXPERT_WEBSITE'; }
    }
  } catch { return 'EXPERT_JSON'; }
  return null;
}
