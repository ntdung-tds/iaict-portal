import { get } from "@vercel/blob";

const SAFE_ID = /^[a-f0-9-]{36}$/i;
const SAFE_FILENAME = /^[a-z0-9][a-z0-9._-]{0,120}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await context.params;
  if (!SAFE_ID.test(id) || !SAFE_FILENAME.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const result = await get(`media/${id}/${filename}`, { access: "private" });
    if (!result?.stream) return new Response("Not found", { status: 404 });

    const headers = new Headers({
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    if (result.blob.etag) headers.set("ETag", result.blob.etag);

    return new Response(result.stream, { status: 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
