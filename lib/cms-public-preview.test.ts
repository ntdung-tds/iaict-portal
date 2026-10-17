import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicApiUrl, publicContentUrl } from './public-preview';
import { withPublicPreviewCors } from './cms-public-cors';
afterEach(()=>vi.unstubAllEnvs());
describe('Pages published data connection',()=>{
 it('uses CMS origin in preview, retaining query and escaping detail paths',()=>{
  vi.stubEnv('NEXT_PUBLIC_STATIC_PREVIEW','true');
  vi.stubEnv('NEXT_PUBLIC_CMS_URL','https://cms.example/admin');
  expect(publicApiUrl('/api/news/public?limit=12')).toBe('https://cms.example/api/news/public?limit=12');
  expect(publicContentUrl('/du-an/test')).toBe('https://cms.example/du-an/test');
  expect(publicContentUrl('https://example.org')).toBe('https://example.org');
 });
 it('keeps same-origin APIs outside preview',()=>{
  vi.stubEnv('NEXT_PUBLIC_STATIC_PREVIEW','false');
  expect(publicApiUrl('/api/public/products')).toBe('/api/public/products');
 });
 it('allows Pages to read published endpoints including errors without credentials',()=>{
  const req=new Request('https://cms.example/api/public/products',{headers:{Origin:'https://ntdung-tds.github.io'}});
  const result=withPublicPreviewCors(req,Response.json({error:'unavailable'},{status:503}));
  expect(result.status).toBe(503);
  expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://ntdung-tds.github.io');
  expect(result.headers.get('Vary')).toContain('Origin');
  expect(result.headers.has('Access-Control-Allow-Credentials')).toBe(false);
 });
 it.each([
  ['/api/admin/cms/collection','GET','https://ntdung-tds.github.io'],
  ['/api/public/products','POST','https://ntdung-tds.github.io'],
  ['/api/public/products','GET','https://other.example'],
 ])('does not share %s %s for %s',(path,method,origin)=>{
  const req=new Request(`https://cms.example${path}`,{method,headers:{Origin:origin}});
  expect(withPublicPreviewCors(req,Response.json({})).headers.has('Access-Control-Allow-Origin')).toBe(false);
 });
});
