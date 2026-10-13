export type SearchEntry = { title: string; summary: string; href: string; category: string; keywords: string };
// Core search
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
export function searchPublicContent(entries: SearchEntry[], query: string, category: string = "Tất cả") {
  const normalized = normalizeSearch(query.slice(0, 120));
  const terms = [...new Set(normalized.split(" ").filter(Boolean))];
  if (query.trim() && terms.length === 0) return [];
  return entries.filter(entry => category === "Tất cả" || entry.category === category)
    .map(entry => {
      const title = normalizeSearch(entry.title);
      const titleWords = title.split(" ");
      const words = normalizeSearch(entry.title + " " + entry.summary + " " + entry.keywords).split(" ");
      const matches = terms.every(term => words.some(word => word.startsWith(term)));
      const score = (normalized && title.includes(normalized) ? 10 : 0) + terms.filter(term => titleWords.some(word => word.startsWith(term))).length;
      return { entry, matches, score };
    }).filter(result => result.matches)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "vi"))
    .map(result => result.entry);
}
