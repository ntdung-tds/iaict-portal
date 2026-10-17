/** GitHub Pages serves static UI; published data remains on the CMS host. */
export function publicApiUrl(path: string): string {
  const cms = process.env.NEXT_PUBLIC_CMS_URL;
  return process.env.NEXT_PUBLIC_STATIC_PREVIEW === 'true' && cms
    ? new URL(path, new URL(cms).origin).href : path;
}
export function publicContentUrl(path: string): string {
  return path.startsWith('/') && !path.startsWith('//') ? publicApiUrl(path) : path;
}
