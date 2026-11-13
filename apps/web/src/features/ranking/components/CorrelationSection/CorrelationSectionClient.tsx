"use client";

import { cn } from "@stats47/components";
import { CORRELATION_DIRECTIONS, CORRELATION_SELECTION_POLICY, type CorrelatedItem, type CorrelationGroups } from "@stats47/correlation";
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";
import { SectionCard, ValueTable } from "@/components/surface";

import { navSurfaceProps } from "@/lib/analytics/events";
import { correlationColorClass, formatCorrelation } from "@/lib/correlation-display";

export type CorrelationListItem = Pick<CorrelatedItem, "rankingKey" | "title" | "populationAdjustedR">;

export function CorrelationSectionClient({ groups }: { groups: CorrelationGroups<CorrelationListItem> }) {
  const directions = CORRELATION_DIRECTIONS.filter(direction => groups[direction].length > 0);
  if (directions.length === 0) return null;

  return (
    <SectionCard title="相関が高い指標">
      <p className="mb-2 text-xs text-muted-foreground">
        人口規模の影響を除いた順位相関（1県の極端な値に左右されにくい）
      </p>
      <div {...navSurfaceProps("ranking_correlation")} className="@container">
        <div className={cn("grid grid-cols-1 gap-6", directions.length > 1 && "@md:grid-cols-2")}>
          {directions.map(direction => (
            <section key={direction} aria-label={CORRELATION_SELECTION_POLICY.groups[direction].label} className="min-w-0">
              <h3 className="mb-2 text-sm font-medium">{CORRELATION_SELECTION_POLICY.groups[direction].label}</h3>
              <ValueTable
                ariaLabel={CORRELATION_SELECTION_POLICY.groups[direction].label}
                columns={[
                  { key: "metric", header: "指標", rowHeader: true },
                  { key: "r", header: "順位相関", className: "w-20 whitespace-nowrap" },
                ]}
                rows={groups[direction].map(item => ({
                  key: item.rankingKey,
                  cells: [
                    <Link key="metric" href={hrefFor("ranking", { rankingKey: item.rankingKey })}>{item.title}</Link>,
                    <span key="r" className={correlationColorClass(item.populationAdjustedR)}>{formatCorrelation(item.populationAdjustedR)}</span>,
                  ],
                }))}
              />
            </section>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
