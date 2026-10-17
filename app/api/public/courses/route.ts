import { listPublishedEntities } from '@/lib/cms-public';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listPublishedEntities('course', 60);
    return Response.json({items}, {headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'Chưa thể tải danh mục khóa học. Vui lòng thử lại.'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
