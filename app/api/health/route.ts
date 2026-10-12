export const dynamic = "force-dynamic";

export async function GET() {
  const body = {
    status: "ok",
    version: process.env.APP_VERSION ?? "0.1.0",
    environment: process.env.APP_ENV ?? "development",
  };

  return Response.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
