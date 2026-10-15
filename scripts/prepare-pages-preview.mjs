// Runs only in the disposable GitHub Pages build checkout.
import { readdir, rm, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
if (process.env.GITHUB_PAGES !== 'true') throw new Error('Pages preparation requires GITHUB_PAGES=true');
const origin = new URL(process.env.NEXT_PUBLIC_CMS_URL).origin;
if (process.argv[2] === '--artifact') {
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="robots" content="noindex"><title>IAICT</title><p>Đang mở nội dung IAICT…</p><a href="${origin}">Mở hệ thống IAICT</a><script>const p=location.pathname.replace(/^\\/iaict-portal(?=\\/|$)/,'');const allowed=/^\\/(admin|chuyen-gia|doi-tac|su-kien|tin-tuc|dao-tao-tap-huan|du-an|giai-phap-dich-vu|noi-dung|san-pham-nen-tang)(\\/|$)/;if(allowed.test(p))location.replace(${JSON.stringify(origin)}+p+location.search+location.hash);</script></html>`;
  await writeFile(path.join(process.argv[3], '404.html'), html);
  process.exit(0);
}
function redirectPage(route) {
  const url = `${origin}${route}`;
  return `export default function Page(){return <main style={{padding:40}}><meta httpEquiv="refresh" content=${JSON.stringify(`0;url=${url}`)}/><h1>IAICT</h1><a href=${JSON.stringify(url)}>Mở trang trên hệ thống IAICT →</a></main>;}`;
}
async function removeDynamicRoutes(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    if (!entry.isDirectory()) continue;
    const next = path.join(dir, entry.name);
    if (entry.name.startsWith('[')) await rm(next,{recursive:true,force:true});
    else await removeDynamicRoutes(next);
  }
}
await removeDynamicRoutes('app');
await rm('app/api',{recursive:true,force:true});
await rm('app/admin',{recursive:true,force:true});
for (const route of ['/admin','/chuyen-gia','/doi-tac','/su-kien']) {
  const dir = route === '/admin' ? 'app/admin' : `app/(public)${route}`;
  await mkdir(dir,{recursive:true});
  await writeFile(`${dir}/page.tsx`,redirectPage(route));
}
