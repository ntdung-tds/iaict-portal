import {
  DEFAULT_NEWS_SOURCES,
  DEFAULT_NEWS_WORKFLOW_SETTINGS,
  getNewsWorkflowPolicy,
} from "@/lib/news-workflow";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      version: "v16-news-workflow-2",
      policy: getNewsWorkflowPolicy(),
      defaultSettings: DEFAULT_NEWS_WORKFLOW_SETTINGS,
      cmsControls: {
        globalAutoPublishToggle: true,
        perSourcePublicationMode: ["inherit", "manual", "auto"],
        defaultMode: "manual",
        guardrails: [
          "source-active",
          "trust-threshold",
          "dedupe-pass",
          "valid-title",
          "valid-canonical-url",
          "source-attribution",
        ],
      },
      sources: DEFAULT_NEWS_SOURCES.map((source) => ({
        id: source.id,
        name: source.name,
        homepageUrl: source.homepageUrl,
        entryUrl: source.entryUrl,
        fetchStrategy: source.fetchStrategy,
        trustLevel: source.trustLevel,
        publicationMode: source.publicationMode,
        requiresEditorialWorkflow: source.requiresEditorialWorkflow,
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
