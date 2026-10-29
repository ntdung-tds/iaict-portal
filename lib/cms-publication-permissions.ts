/**
 * CMS publication permission gate.
 *
 * Editors can prepare drafts and submit content for review, but only an
 * administrator may create, change, unpublish, or directly edit a live item.
 * This is intentionally a backend rule; hiding the UI control is insufficient.
 */
export const PUBLICATION_MODULES = new Set([
  "pages",
  "products",
  "solutions",
  "courses",
  "projects",
  "experts",
  "partners",
  "events",
]);

export function canMutatePublication(
  actorRoles: readonly string[],
  currentStatus: unknown,
  nextStatus: unknown,
): boolean {
  if (actorRoles.includes("admin")) return true;
  return currentStatus !== "published" && nextStatus !== "published";
}
