import type { BuzzMapCatalogResponse } from "@/lib/contracts/types";

/** 集計ヘッダ: 総候補、eligible、blocked、landing-ready、generated、draft、posted。 */
export function BuzzMapSummary({ summary }: { summary: BuzzMapCatalogResponse["summary"] }) {
  const { aggregate, generatedAt } = summary;
  const items: Array<[string, number]> = [
    ["総候補", aggregate.total],
    ["eligible", aggregate.eligible],
    ["blocked", aggregate.blocked],
    ["landing-ready", aggregate.landingReady],
    ["generated", aggregate.generated],
    ["draft", aggregate.draft],
    ["posted", aggregate.posted],
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-console-border bg-console-card px-3 py-2">
      {items.map(([label, value]) => (
        <span
          key={label}
          className="rounded-md border border-console-border bg-console-bg px-2.5 py-1 text-xs text-console-fg"
        >
          {label}: <b>{value}</b>
        </span>
      ))}
      {generatedAt ? (
        <span className="ml-auto text-[11px] text-console-muted">
          catalog 更新: {generatedAt}
        </span>
      ) : null}
    </div>
  );
}
