"use client";

import { SITE } from "@stats47/types";

import { StatusBadge, type Tone } from "@/components/admin-ui";
import { MediaPreview } from "@/components/media-preview";
import { Card, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@stats47/components";
import type { BuzzMapEntryDTO } from "@/lib/contracts/types";

const READINESS_TONE: Record<string, Tone> = {
  live: "good",
  ready: "good",
  "review-passed": "good",
  "needs-content": "warn",
  "publish-pending": "warn",
  blocked: "bad",
};

function fmtScoreBreakdown(breakdown: Record<string, number> | undefined): string {
  if (!breakdown) return "";
  return Object.entries(breakdown)
    .map(([k, v]) => `${k}:${v}`)
    .join(" / ");
}

export function BuzzMapCard({ entry }: { entry: BuzzMapEntryDTO }) {
  const ideaId = entry.ideaId;

  const mediaCandidates = entry.r2AssetBaseUrl
    ? [
        { url: `${entry.r2AssetBaseUrl}/x/stills/${ideaId}-45.png`, source: "r2-x" },
        {
          url: `${entry.r2AssetBaseUrl}/instagram/stills/slide-1-cover-1080x1350.png`,
          source: "r2-instagram",
        },
      ]
    : [];

  const primaryUrl = entry.primaryUrl
    ? entry.primaryUrl.startsWith("http")
      ? entry.primaryUrl
      : `${SITE.origin}${entry.primaryUrl}`
    : null;

  return (
    <Card className="flex-col gap-0 overflow-hidden py-0">
      <div className="relative">
        <MediaPreview candidates={mediaCandidates} aspectClassName="aspect-16/10" />
        <span className="absolute left-1.5 top-1.5 z-10">
          <StatusBadge tone={READINESS_TONE[entry.landingReadiness ?? ""] ?? "neutral"}>
            {entry.landingStrategy ?? "-"} / {entry.landingReadiness ?? "-"}
          </StatusBadge>
        </span>
        {entry.priority ? (
          <span className="absolute right-1.5 top-1.5 z-10">
            <StatusBadge tone="info">{entry.priority}</StatusBadge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 text-xs">
        <div className="text-sm font-semibold">
          {entry.title}
          <span className="ml-1.5 font-normal text-muted-foreground">score {entry.score}</span>
        </div>
        {entry.subtitle ? <div className="text-muted-foreground">{entry.subtitle}</div> : null}

        <div className="flex flex-wrap gap-2 text-muted-foreground">
          <span>{entry.category || "-"}</span>
          <span>{entry.recommendedType ? `型${entry.recommendedType}` : ""}</span>
          <span>{entry.sourceKind || ""}</span>
          <span>{entry.feasibility || ""}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <StatusBadge tone={entry.commercialUse === "allowed" ? "good" : entry.commercialUse === "blocked" ? "bad" : "warn"}>
            license: {entry.commercialUse || "-"}
          </StatusBadge>
          {entry.sensitivity ? (
            <StatusBadge tone={entry.sensitivity === "high" ? "bad" : "neutral"}>sensitivity: {entry.sensitivity}</StatusBadge>
          ) : null}
          <StatusBadge tone={entry.eligible ? "good" : "bad"}>{entry.eligible ? "eligible" : "not-eligible"}</StatusBadge>
        </div>

        {entry.gateReasons && entry.gateReasons.length > 0 ? (
          <div className="rounded-md bg-negative/10 px-2 py-1 text-xs text-negative">{entry.gateReasons.join(" / ")}</div>
        ) : null}

        <Collapsible>
          <CollapsibleTrigger className="w-fit text-xs text-muted-foreground hover:text-foreground">score breakdown</CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-1 text-xs text-muted-foreground">{fmtScoreBreakdown(entry.breakdown)}</div>
          </CollapsibleContent>
        </Collapsible>

        {primaryUrl ? (
          <a href={primaryUrl} target="_blank" rel="noreferrer" className="break-all font-medium underline-offset-4 hover:underline">
            landing: {entry.primaryUrl} ↗
          </a>
        ) : (
          <span className="text-muted-foreground">landing 未確定</span>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>spec: {entry.assets?.hasSpec ? "✓" : "-"}</span>
          <span>素材: {entry.assets?.hasLocalAssets ? "✓" : "-"}</span>
          <span>posts.json: {entry.post?.status ? `${entry.post.status} (#${entry.post.postId})` : "未登録"}</span>
        </div>

        <div className="rounded-md border bg-muted px-2 py-1.5 text-xs text-muted-foreground">
          spec生成・render・R2反映・draft登録は担当agent/skillから実行します。
        </div>
      </div>
    </Card>
  );
}
