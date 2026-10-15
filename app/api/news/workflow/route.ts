import {
  DEFAULT_NEWS_SOURCES,
  getNewsWorkflowPolicy,
} from "@/lib/news-workflow";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      version: "v16-news-workflow-1",
      policy: getNewsWorkflowPolicy(),
      sources: DEFAULT_NEWS_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        homepageUrl: source.homepageUrl,
        entryUrl: source.entryUrl,
        fetchStrategy: source.fetchStrategy,
        trustLevel: source.trustLevel,
        requiresEditorialReview: source.requiresEditorialReview,
        attributionMode: source.attributionMode,
        enabledByDefault: source.enabledByDefault,
      })),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
