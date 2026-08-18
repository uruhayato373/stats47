"use client";

import { cn } from "@stats47/components";

import type { AssetEntryDTO, AssetImageDTO } from "@/lib/contracts/types";

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(url);
}

function MediaCell({
  image,
  checkStatus,
}: {
  image: AssetImageDTO;
  checkStatus?: boolean;
}) {
  const showVariantTag = image.variant !== "single" && image.variant !== "image";
  const url = image.url;

  return (
    <div
      className={cn(
        "relative flex min-h-[80px] flex-1 items-center justify-center overflow-hidden rounded",
        image.variant === "light" ? "bg-white" : image.variant === "dark" ? "bg-console-bg" : "bg-console-bg",
      )}
    >
      {showVariantTag ? (
        <span className="absolute left-1 top-1 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
          {image.variant}
        </span>
      ) : null}
      {!url ? (
        <span className="text-xs text-console-muted">URLなし</span>
      ) : checkStatus === false ? (
        <div className="flex min-h-[80px] w-full items-center justify-center opacity-20">
          {isVideoUrl(url) ? (
            <video src={url} muted className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ) : isVideoUrl(url) ? (
        <video src={url} controls preload="metadata" muted className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export type AssetCheckState = "ok" | "missing" | null;

export function AssetCard({
  entry,
  checkState,
  imageCheckResult,
}: {
  entry: AssetEntryDTO;
  checkState: AssetCheckState;
  /** url -> ok/false。欠落チェック未実行時は undefined。 */
  imageCheckResult?: Record<string, boolean>;
}) {
  return (
    <figure
      className={cn(
        "rounded-lg border bg-console-card p-2",
        checkState === "missing" ? "border-yellow-500/70" : "border-console-border",
      )}
    >
      <div className="flex gap-1.5">
        {entry.images.map((image, idx) => (
          <MediaCell
            key={`${image.variant}-${idx}`}
            image={image}
            checkStatus={
              imageCheckResult && image.url ? imageCheckResult[image.url] : undefined
            }
          />
        ))}
      </div>
      <figcaption className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <code className="break-all text-xs text-console-fg">
          {entry.label || entry.key}
        </code>
        {entry.pageUrl ? (
          <a
            href={entry.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-console-accent"
          >
            ↗
          </a>
        ) : null}
        {checkState === "missing" ? (
          <span className="rounded bg-console-bad/15 px-1.5 py-0.5 text-[10px] text-console-bad">
            ✗ 欠落
          </span>
        ) : checkState === "ok" ? (
          <span className="rounded bg-console-good/15 px-1.5 py-0.5 text-[10px] text-console-good">
            ✓
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
