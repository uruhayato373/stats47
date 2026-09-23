import "server-only";

import { readThemeCorrelatedMetricsFromR2 } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { SectionCard } from "@/components/surface";

import { correlationColorClass, formatCorrelation } from "@/lib/correlation-display";

import { TrackedThemeLink } from "./TrackedThemeLink";

interface ThemeCorrelatedMetricsProps {
  themeKey: string;
}

/**
 * テーマ外の指標のうち、テーマ内の指標と人口補正後の順位相関が高いものへの導線。
 * 一覧は相関 workflow が事前計算した `app/correlation/by-theme/<themeKey>.json` を読むだけ。
 */
export async function ThemeCorrelatedMetrics({ themeKey }: ThemeCorrelatedMetricsProps) {
  const result = await readThemeCorrelatedMetricsFromR2(themeKey);
  if (!isOk(result) || result.data.length === 0) return null;

  return (
    <SectionCard className="mt-8" title="このテーマと関連の深い指標">
      <p className="mb-2 text-xs text-muted-foreground">
        テーマ内の指標と、人口規模の影響を除いた順位相関が高いテーマ外の指標
      </p>
      <nav aria-label="このテーマと関連の深い指標" className="flex flex-col">
        {result.data.map((item) => (
          <TrackedThemeLink
            key={item.rankingKey}
            href={`/ranking/${item.rankingKey}`}
            trackingLabel={`theme-correlated-metrics:${item.rankingKey}`}
            surface="theme_ranking"
            className="flex items-center justify-between gap-3 py-1.5 transition-colors hover:text-primary"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.via.title}との相関
              </span>
            </span>
            <span
              className={`shrink-0 font-mono text-xs tabular-nums ${correlationColorClass(item.populationAdjustedR)}`}
            >
              {formatCorrelation(item.populationAdjustedR)}
            </span>
          </TrackedThemeLink>
        ))}
      </nav>
    </SectionCard>
  );
}
