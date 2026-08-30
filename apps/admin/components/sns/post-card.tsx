"use client";

import { useState } from "react";

import { Badge, cn } from "@stats47/components";

import { MediaPreview } from "@/components/media-preview";
import type { PostDTO } from "@/lib/contracts/types";

type ExtraItem = Record<string, unknown> & {
  id?: null;
  platform: string;
  domain?: string | null;
  content_key?: string | null;
  post_type?: string | null;
  caption?: string | null;
  media_candidates?: Array<{ url: string | null; source: string }>;
  status?: string;
  scheduled_at?: string | null;
  utm_url?: string | null;
  _source?: string;
  geo_role?: string | null;
  analysis_ids?: string | null;
  claim_metric_key?: string | null;
};

type GalleryItem = PostDTO | ExtraItem;

const DOMAIN_CONTRACT: Record<string, string> = {
  ranking: "単一指標の47都道府県比較",
  theme: "複数指標を同じ主題で横断",
  area: "1県のデータブック",
  geo: "複数GISレイヤー×空間演算",
  "buzz-map": "地理分布を一目で比較",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  posted: "border-green-500/50 bg-green-500/10 text-console-good",
  scheduled: "border-amber-500/50 bg-amber-500/10 text-console-warn",
  draft: "border-console-accent/50 bg-console-accent/10 text-console-accent",
};

function statusBadgeClass(status: string | undefined) {
  return (
    STATUS_BADGE_CLASS[status ?? ""] ??
    "border-console-border bg-console-border/30 text-console-muted"
  );
}

function hasId(item: GalleryItem): item is PostDTO {
  return item.id !== null && item.id !== undefined;
}

export function PostCard({ item }: { item: GalleryItem }) {
  const [captionOpen, setCaptionOpen] = useState(false);
  const usesMapFeedAspect =
    item.platform === "x" && (item.domain === "geo" || item.domain === "buzz-map");
  const isSquareRankingMap =
    item.domain === "ranking" && String(item.media_path || "").includes("choropleth-map");
  const mediaAspect = usesMapFeedAspect
    ? "aspect-[4/5]"
    : isSquareRankingMap
      ? "aspect-square"
      : item.domain === "ranking"
        ? "aspect-[240/101]"
        : "aspect-[40/21]";
  const mediaCandidates = ((item.media_candidates ?? []) as Array<{
    url: string | null;
    source: string;
  }>)
    .filter((candidate): candidate is { url: string; source: string } =>
      Boolean(candidate.url),
    )
    .map((candidate) => ({ url: candidate.url, source: candidate.source }));
  const postUrl = hasId(item) && typeof item.post_url === "string" ? item.post_url : null;
  const landingUrl = typeof item.utm_url === "string" ? item.utm_url : null;
  const engagement =
    hasId(item) && item.impressions && item.impressions > 0
      ? (
          (((item.likes || 0) + (item.reposts || 0) + (item.replies || 0)) /
            item.impressions) *
          100
        ).toFixed(1) + "%"
      : "-";

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-console-border bg-console-card">
      <div className="relative">
        <MediaPreview
          candidates={mediaCandidates}
          aspectClassName={mediaAspect}
        />
        <Badge
          variant="outline"
          className={cn(
            "absolute left-1.5 top-1.5 z-10 text-[10px]",
            statusBadgeClass(item.status),
          )}
        >
          {item.status || "未登録"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 text-xs">
        <div className="break-all text-[13px] font-semibold text-console-fg">
          {item.content_key || "(no key)"}
        </div>
        <div className="flex flex-wrap gap-2 text-console-muted">
          <span>{item.platform}</span>
          <span>{item.domain || "domain未設定"}</span>
          <span>{item.post_type || ""}</span>
          {item._source ? <span>{String(item._source)}</span> : null}
        </div>

        {item.domain ? (
          <p className="border-l-2 border-console-accent pl-2 text-[11px] text-console-muted">
            {DOMAIN_CONTRACT[item.domain] ?? "ドメイン契約未定義"}
          </p>
        ) : null}

        {item.domain === "geo" ? (
          <div className="rounded-md border border-console-good/30 bg-console-good/5 px-2 py-1.5 text-[11px] text-console-muted">
            <div><b className="text-console-good">{String(item.geo_role || "Geo")}</b> · {String(item.claim_metric_key || "metric未同期")}</div>
            {item.analysis_ids ? <div className="mt-0.5 break-all">analysis: {String(item.analysis_ids)}</div> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-console-muted">
          {item.scheduled_at ? (
            <span>予定 <b className="text-console-fg">{item.scheduled_at}</b></span>
          ) : null}
          {hasId(item) && item.posted_at ? (
            <span>投稿 <b className="text-console-fg">{item.posted_at}</b></span>
          ) : null}
          {hasId(item) && item.status === "posted" ? (
            <>
              <span>👁 <b className="text-console-fg">{item.impressions ?? "-"}</b></span>
              <span>eng <b className="text-console-fg">{engagement}</b></span>
            </>
          ) : null}
        </div>

        {postUrl ? (
          <a
            href={postUrl}
            target="_blank"
            rel="noreferrer"
            className="text-console-accent hover:underline"
          >
            投稿を見る ↗
          </a>
        ) : null}

        {landingUrl ? (
          <a
            href={landingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-console-accent hover:underline"
          >
            着地ページを見る ↗
          </a>
        ) : null}

        {item.caption ? (
          <div>
            <button
              type="button"
              onClick={() => setCaptionOpen((open) => !open)}
              className="cursor-pointer text-console-muted hover:text-console-fg"
            >
              caption {captionOpen ? "▲" : "▼"}
            </button>
            {captionOpen ? (
              <div className="mt-1.5 whitespace-pre-wrap text-console-fg">{item.caption}</div>
            ) : null}
          </div>
        ) : null}

        {!hasId(item) ? (
          <p className="rounded-md border border-console-border bg-console-bg px-2 py-1.5 text-[11px] text-console-muted">
            台帳未登録の素材です。登録・生成は担当agent/skillから実行します。
          </p>
        ) : null}
      </div>
    </article>
  );
}
