import { getDatabaseBinding } from "@/lib/cloudflare-db";
import { getPublicNavigation } from "@/lib/cms-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDatabaseBinding();
    const items = await getPublicNavigation(db);
    return Response.json({ ok: true, items }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ ok: false, items: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
