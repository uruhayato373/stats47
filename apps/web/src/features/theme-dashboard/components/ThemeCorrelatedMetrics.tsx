import "server-only";

import { readThemeCorrelatedMetricsFromR2 } from "@stats47/correlation/server";
import { hrefFor } from "@stats47/data-configs/content/href";
import { isOk } from "@stats47/types";

import { PanelGrid } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { ValueTable } from "@/components/surface";

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

  // 指標・相関の相手・順位相関の 3 つを行ごとに比べて読む表なので、共通の静的な表 (ValueTable) で描く (2026-11-03。旧: リンクの一覧)。
  // 枠は隣の節 (白書・統計から見る論点) と同じ線の格子の節
  return (
    <PanelGrid as="section" id="theme-correlated-metrics" aria-label="このテーマと関連の深い指標">
      <SectionHeader
        title="このテーマと関連の深い指標"
        description="テーマ内の指標と、人口規模の影響を除いた順位相関が高いテーマ外の指標"
        hideRule
      />
      <ValueTable
        ariaLabel="このテーマと関連の深い指標"
        columns={[
          // スマホ幅では 2 列とも折り返す。相手の列を 1 行に保つと、指標の列が 2〜3 文字ごとに折り返して読めない
          // (2026-11-14 の計測で全 56 テーマが該当)。指標の列は 1 行 8 文字ぶんの幅を下限にする
          { key: "metric", header: "指標", rowHeader: true, className: "min-w-32" },
          { key: "via", header: "相関の相手 (テーマ内の指標)", align: "left", className: "whitespace-normal!" },
          { key: "r", header: "順位相関" },
        ]}
        rows={result.data.map((item) => ({
          key: item.rankingKey,
          cells: [
            <TrackedThemeLink
              key="link"
              href={hrefFor("ranking", { rankingKey: item.rankingKey })}
              trackingLabel={`theme-correlated-metrics:${item.rankingKey}`}
              surface="theme_ranking"
            >
              {item.title}
            </TrackedThemeLink>,
            item.via.title,
            <span key="r" className={correlationColorClass(item.populationAdjustedR)}>
              {formatCorrelation(item.populationAdjustedR)}
            </span>,
          ],
        }))}
      />
    </PanelGrid>
  );
}
