"use client";

import { useState } from "react";

import { Badge, cn } from "@stats47/components";

import { MediaPreview } from "@/components/media-preview";
import type { BuzzMapEntryDTO } from "@/lib/contracts/types";

const READINESS_BADGE: Record<string, string> = {
  live: "border-green-500/50 bg-green-500/10 text-console-good",
  ready: "border-green-500/50 bg-green-500/10 text-console-good",
  "review-passed": "border-green-500/50 bg-green-500/10 text-console-good",
  "needs-content": "border-amber-500/50 bg-amber-500/10 text-console-warn",
  "publish-pending": "border-amber-500/50 bg-amber-500/10 text-console-warn",
  blocked: "border-red-500/50 bg-red-500/10 text-console-bad",
};

function readinessBadgeClass(r: string | undefined) {
  return (
    READINESS_BADGE[r ?? ""] ?? "border-console-border bg-console-border/30 text-console-muted"
  );
}

function fmtScoreBreakdown(breakdown: Record<string, number> | undefined): string {
  if (!breakdown) return "";
  return Object.entries(breakdown)
    .map(([k, v]) => `${k}:${v}`)
    .join(" / ");
}

export function BuzzMapCard({
  entry,
}: {
  entry: BuzzMapEntryDTO;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

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
      : `https://stats47.jp${entry.primaryUrl}`
    : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-console-border bg-console-card">
      <div className="relative">
        <MediaPreview candidates={mediaCandidates} aspectClassName="aspect-[16/10]" />
        <Badge
          variant="outline"
          className={cn(
            "absolute left-1.5 top-1.5 z-10 text-[10px]",
            readinessBadgeClass(entry.landingReadiness),
          )}
        >
          {entry.landingStrategy ?? "-"} / {entry.landingReadiness ?? "-"}
        </Badge>
        {entry.priority ? (
          <Badge
            variant="outline"
            className="absolute right-1.5 top-1.5 z-10 border-console-accent/50 bg-console-accent/10 text-[10px] text-console-accent"
          >
            {entry.priority}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 text-xs">
        <div className="text-[13px] font-semibold text-console-fg">
          {entry.title}
          <span className="ml-1.5 font-normal text-console-muted">score {entry.score}</span>
        </div>
        {entry.subtitle ? <div className="text-console-muted">{entry.subtitle}</div> : null}

        <div className="flex flex-wrap gap-2 text-console-muted">
          <span>{entry.category || "-"}</span>
          <span>{entry.recommendedType ? `型${entry.recommendedType}` : ""}</span>
          <span>{entry.sourceKind || ""}</span>
          <span>{entry.feasibility || ""}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              entry.commercialUse === "allowed"
                ? "border-green-500/50 text-console-good"
                : entry.commercialUse === "blocked"
                  ? "border-red-500/50 text-console-bad"
                  : "border-amber-500/50 text-console-warn",
            )}
          >
            license: {entry.commercialUse || "-"}
          </Badge>
          {entry.sensitivity ? (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                entry.sensitivity === "high"
                  ? "border-red-500/50 text-console-bad"
                  : "border-console-border text-console-muted",
              )}
            >
              sensitivity: {entry.sensitivity}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              entry.eligible
                ? "border-green-500/50 text-console-good"
                : "border-red-500/50 text-console-bad",
            )}
          >
            {entry.eligible ? "eligible" : "not-eligible"}
          </Badge>
        </div>

        {entry.gateReasons && entry.gateReasons.length > 0 ? (
          <div className="rounded-md bg-console-bad/10 px-2 py-1 text-[11px] text-console-bad">
            {entry.gateReasons.join(" / ")}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="w-fit text-[11px] text-console-muted hover:text-console-fg"
        >
          score breakdown {showBreakdown ? "▲" : "▼"}
        </button>
        {showBreakdown ? (
          <div className="text-[11px] text-console-muted">{fmtScoreBreakdown(entry.breakdown)}</div>
        ) : null}

        {primaryUrl ? (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noreferrer"
            className="text-console-accent hover:underline"
          >
            landing: {entry.primaryUrl} ↗
          </a>
        ) : (
          <span className="text-console-muted">landing 未確定</span>
        )}

        <div className="flex flex-wrap gap-2 text-[11px] text-console-muted">
          <span>spec: {entry.assets?.hasSpec ? "✓" : "-"}</span>
          <span>素材: {entry.assets?.hasLocalAssets ? "✓" : "-"}</span>
          <span>
            posts.json:{" "}
            {entry.post?.status ? `${entry.post.status} (#${entry.post.postId})` : "未登録"}
          </span>
        </div>

        <div className="rounded-md border border-console-border bg-console-bg px-2 py-1.5 text-[11px] text-console-muted">
          spec生成・render・R2反映・draft登録は担当agent/skillから実行します。
        </div>
      </div>
    </div>
  );
}
