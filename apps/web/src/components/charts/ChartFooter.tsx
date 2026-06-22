import { SourceAttribution } from "@/components/molecules/SourceAttribution";

import type { SourceAttribution as SourceAttributionData } from "@stats47/data-configs";

export interface ChartFooterLink {
  label: string;
  url: string;
}

export interface ChartFooterProps {
  source?: string;
  sourceLink?: string | null;
  sourceDetail?: string;
  attribution?: SourceAttributionData | null;
  annotation?: string;
  rankingLink?: string | null;
  rankingLabel?: string;
  rankingLinks?: ChartFooterLink[];
}

export function ChartFooter({
  source,
  sourceLink,
  sourceDetail,
  attribution,
  annotation,
  rankingLink,
  rankingLabel = "関連ランキング",
  rankingLinks,
}: ChartFooterProps) {
  const links = [
    ...(rankingLink ? [{ label: rankingLabel, url: rankingLink }] : []),
    ...(rankingLinks ?? []),
  ];
  const hasSource = attribution || source;

  if (!hasSource && !annotation && links.length === 0) return null;

  return (
    <div className="space-y-1 text-right">
      {attribution ? (
        <div>
          <SourceAttribution attribution={attribution} />
          {sourceDetail ? ` (${sourceDetail})` : ""}
        </div>
      ) : source ? (
        <div>
          出典:{" "}
          {sourceLink ? (
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {source}
            </a>
          ) : (
            source
          )}
          {sourceDetail ? ` (${sourceDetail})` : ""}
        </div>
      ) : null}
      {annotation && <div>{annotation}</div>}
      {links.length > 0 && (
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
          {links.map((link) => (
            <a key={link.url} href={link.url} className="text-primary hover:underline">
              {link.label} →
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
