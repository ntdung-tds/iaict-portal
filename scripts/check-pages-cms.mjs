// Test the exported artifact, not the development server.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const root = path.resolve(process.argv[2]);
const cms = 'https://iaict-portal-staging.iaict-platform.workers.dev';
const server = createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    let file = path.resolve(root,'.'+decodeURIComponent(url.pathname.replace(/^\/iaict-portal(?=\/|$)/,'')));
    if (!file.startsWith(root+path.sep) && file!==root) throw Error('Invalid path');
    if ((await stat(file)).isDirectory()) file=path.join(file,'index.html');
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404);res.end('Not found'); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const seen=new Set();
 await page.route(`${cms}/api/**`,async route=>{
  const pathname=new URL(route.request().url()).pathname;seen.add(pathname);
  let items=[];
  if(pathname==='/api/public/navigation')items=[{label:'Menu từ CMS',href:'/gioi-thieu'}];
  else if(pathname==='/api/public/cms-search')items=[{title:'Dữ liệu kiểm thử CMS',href:'/du-an/test-cms',summary:'Mô tả',category:'Dự án'}];
  else if(pathname==='/api/news/public')items=[{id:'news',title:'Tin kiểm thử CMS',slug:'test-news',excerpt:'Mô tả'}];
  else items=[{id:'catalog',title:'Danh mục kiểm thử CMS',slug:'test-cms',summary:'Mô tả'}];
  await route.fulfill({json:{ok:true,items},headers:{'Access-Control-Allow-Origin':'*'}});
 });
 const base=`http://127.0.0.1:${server.address().port}/iaict-portal`;
 for(const [route,endpoint] of [['san-pham-nen-tang','products'],['giai-phap-dich-vu','solutions'],['dao-tao-tap-huan','courses'],['du-an','projects']]){
  await page.goto(`${base}/${route}/`);
  const link=page.getByRole('link',{name:'Danh mục kiểm thử CMS',exact:true});
  await link.waitFor();assert.equal(await link.getAttribute('href'),`${cms}/${route}/test-cms`);
  assert(seen.has(`/api/public/${endpoint}`));
 }
 await page.getByRole('button',{name:'Mở điều hướng',exact:true}).click();
 await page.getByRole('link',{name:/Menu từ CMS/}).waitFor();
 await page.goto(`${base}/tim-kiem/?q=Dữ liệu kiểm thử CMS`);
 await page.getByRole('link',{name:/Dữ liệu kiểm thử CMS/}).waitFor();
 await page.goto(`${base}/tin-tuc/`);
 const news=page.getByRole('link',{name:'Tin kiểm thử CMS',exact:true});await news.waitFor();
 assert.equal(await news.getAttribute('href'),`${cms}/tin-tuc/test-news`);
 assert(seen.has('/api/public/navigation')&&seen.has('/api/public/cms-search')&&seen.has('/api/news/public'));
 console.log('Pages artifact: 4 catalogs, navigation, search and news passed');
} finally {await browser.close();server.close();}
