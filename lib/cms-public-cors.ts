const pagesOrigin = 'https://ntdung-tds.github.io';
const publicPaths = new Set([
  '/api/public/navigation', '/api/public/cms-search', '/api/public/products',
  '/api/public/solutions', '/api/public/courses', '/api/public/projects', '/api/news/public',
]);
/** Only anonymous, published read endpoints are shared with the Pages preview. */
export function withPublicPreviewCors(request: Request, response: Response): Response {
  if (!['GET', 'HEAD'].includes(request.method) ||
      request.headers.get('Origin') !== pagesOrigin ||
      !publicPaths.has(new URL(request.url).pathname)) return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', pagesOrigin);
  headers.append('Vary', 'Origin');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
