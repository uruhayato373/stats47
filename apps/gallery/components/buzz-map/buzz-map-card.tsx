"use client";

import { useState } from "react";

import { Badge, Button, cn } from "@stats47/components";

import { apiSend, ApiError } from "@/lib/client/api-client";
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
  onChanged,
  onJobStarted,
}: {
  entry: BuzzMapEntryDTO;
  onChanged: () => void;
  onJobStarted: (jobId: string, title: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const ideaId = entry.ideaId;
  const disabledNoIdea = !ideaId;

  const mediaCandidates = entry.r2AssetBaseUrl
    ? [
        { url: `${entry.r2AssetBaseUrl}/x/stills/${ideaId}-45.png`, source: "r2-x" },
        {
          url: `${entry.r2AssetBaseUrl}/instagram/stills/slide-1-cover-1080x1350.png`,
          source: "r2-instagram",
        },
      ]
    : [];

  const runAction = async (
    path: string,
    body: Record<string, unknown>,
    title: string,
    expectsJob = true,
  ) => {
    setBusy(true);
    setError(null);
    try {
      const r = await apiSend<{ id?: string | number; reasons?: string[] }>(path, "POST", body);
      if (expectsJob && r.id !== undefined) {
        onJobStarted(String(r.id), title);
      } else {
        onChanged();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

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

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={busy}
            onClick={() =>
              void runAction(
                "/api/buzz-map/actions/route-landing",
                {},
                "buzz-map: landing 再判定 (catalog rebuild)",
              )
            }
          >
            landing 再判定
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled
            title="Phase 3 で配線予定"
          >
            blog draft 生成 (Phase 3)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled
            title="Phase 3 で配線予定"
          >
            theme 拡張計画 (Phase 3)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() => {
              const helper = window.prompt(
                "spec helper (estat | ksj | gsi | merge):",
                entry.sourceKind === "estat"
                  ? "estat"
                  : entry.sourceKind === "ksj" || entry.sourceKind === "mlit-dpf"
                    ? "ksj"
                    : entry.sourceKind === "gsi"
                      ? "gsi"
                      : "estat",
              );
              if (!helper) return;
              void runAction(
                "/api/buzz-map/actions/generate-spec",
                { ideaId, helper },
                `buzz-map: generate-spec (${ideaId})`,
              );
            }}
          >
            spec 生成
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() =>
              void runAction(
                "/api/buzz-map/actions/render",
                { ideaId, kind: "still" },
                `buzz-map: render still (${ideaId})`,
              )
            }
          >
            静止画生成
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() =>
              void runAction(
                "/api/buzz-map/actions/render",
                { ideaId, kind: "preview" },
                `buzz-map: render preview (${ideaId})`,
              )
            }
          >
            動画preview
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() => {
              if (!window.confirm(`本尺動画をレンダします (時間がかかります): ${ideaId}`)) return;
              void runAction(
                "/api/buzz-map/actions/render",
                { ideaId, kind: "full" },
                `buzz-map: render full (${ideaId})`,
              );
            }}
          >
            本尺動画生成
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() => {
              if (!window.confirm(`R2 へ push します: sns/buzz-map/${ideaId}`)) return;
              void runAction(
                "/api/buzz-map/actions/push-r2",
                { ideaId, confirm: true },
                `buzz-map: push-r2 (${ideaId})`,
              );
            }}
          >
            R2 push
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={busy || disabledNoIdea}
            onClick={() => {
              const channel = window.prompt("投稿チャネル (x | instagram):", "x");
              if (channel !== "x" && channel !== "instagram") return;
              if (!window.confirm(`draft 登録します: ${channel} / ${ideaId}`)) return;
              void runAction(
                "/api/buzz-map/actions/register-draft",
                { ideaId, channel, confirm: true },
                "",
                false,
              );
            }}
          >
            draft 登録
          </Button>
        </div>

        {error ? <p className="text-[11px] text-console-bad">{error}</p> : null}
      </div>
    </div>
  );
}
