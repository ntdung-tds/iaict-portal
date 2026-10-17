import { isNavigationHref } from './cms-navigation-link';

export function isRedirectSource(path: string): boolean {
  if (!path.startsWith('/') || !isNavigationHref(path) || /[?#]/.test(path)) return false;
  if (/^\/(?:admin|api|_next|cdn-cgi)(?:\/|$)/i.test(path)) return false;
  try { return new URL(path, 'https://redirect.invalid').pathname === path; } catch { return false; }
}

export function redirectFieldsError(source: string, destination: string): string | null {
  if (!isRedirectSource(source)) return 'REDIRECT_SOURCE_PATH';
  if (!isNavigationHref(destination)) return 'REDIRECT_DESTINATION_PATH';
  if (destination.startsWith('/') && new URL(destination, 'https://redirect.invalid').pathname === source) return 'REDIRECT_LOOP';
  return null;
}
