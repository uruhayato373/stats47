import { BookOpen } from "lucide-react";


import { ChartPanel } from "@/components/charts/ChartPanel";
import { DashboardComponentRenderer } from "@/components/stat-charts/server";
import { resolveChartSourceLinks } from "@/components/stat-charts/utils/resolveChartSourceLinks";
import { getSurfaceCardClassName } from "@/components/surface";

import { AreaChartSection } from "@/features/area-profile";

import { getAreaDatabook, type AreaDatabookViewData } from "../server/get-area-databook";

import { DatabookToc } from "./DatabookToc";
import { GenderPairedKpiGrid } from "./GenderPairedKpiGrid";
import { PrefSymbolPanel } from "./PrefSymbolPanel";
import { RankedKpiGrid } from "./RankedKpiGrid";
import { SpecialtyList } from "./SpecialtyList";

import type {
  DatabookBlock,
  DatabookSection as DatabookSectionType,
} from "@stats47/data-configs";

interface Props {
  areaCode: string;
  areaName: string;
}

/** editorial 依存ブロック (symbol/specialty) しか無く editorial が無いセクションは隠す。 */
function sectionHasContent(
  section: DatabookSectionType,
  data: AreaDatabookViewData,
): boolean {
  return section.blocks.some((block) => {
    switch (block.blockType) {
      case "symbol-card":
      case "specialty-list":
        return data.editorial !== null && data.editorial.specialties.length >= 0;
      case "agri-top10":
        return (data.databook?.agriTop10.length ?? 0) > 0;
      default:
        return true; // ranked-kpi / gender-paired / chart は databook 前提で常に描画
    }
  });
}

function renderBlock(
  block: DatabookBlock,
  data: AreaDatabookViewData,
  areaCode: string,
  areaName: string,
) {
  switch (block.blockType) {
    case "ranked-kpi-grid":
      return (
        <RankedKpiGrid
          key={block.blockKey}
          metrics={block.metrics}
          databook={data.databook}
          columns={block.columns}
        />
      );
    case "gender-paired-kpi":
      return (
        <GenderPairedKpiGrid
          key={block.blockKey}
          pairs={block.pairs}
          databook={data.databook}
        />
      );
    case "specialty-list":
      return <SpecialtyList key={block.blockKey} editorial={data.editorial} />;
    case "symbol-card":
      return <PrefSymbolPanel key={block.blockKey} editorial={data.editorial} />;
    case "agri-top10":
      if (!data.databook || data.databook.agriTop10.length === 0) return null;
      return (
        <ul key={block.blockKey} className="grid grid-cols-2 gap-1.5 @container @sm:grid-cols-3">
          {data.databook.agriTop10.map((it, i) => (
            <li
              key={it.name}
              className={getSurfaceCardClassName({
                className: "flex items-baseline justify-between px-2.5 py-1.5 text-sm",
              })}
            >
              <span className="text-muted-foreground">
                {i + 1}. {it.name}
              </span>
              <span className="font-bold tabular-nums">
                {it.value.toLocaleString("ja-JP")}
                <span className="ml-0.5 text-[11px] text-muted-foreground">{it.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      );
    case "chart": {
      const chart = block.chart;
      return (
        <div key={chart.componentKey}>
          <DashboardComponentRenderer
            component={{
              id: chart.componentKey,
              componentType: chart.componentType,
              componentProps: JSON.stringify({
                ...chart.componentProps,
                sourceLinks: resolveChartSourceLinks({
                  rankingLink: chart.rankingLink,
                  rankingLinks: chart.componentProps.rankingLinks,
                  relatedRankingKeys: chart.relatedRankingKeys,
                }),
              }),
              title: chart.title,
              sortOrder: chart.sortOrder,
              gridColumnSpan: chart.gridColumnSpan ?? 12,
              gridColumnSpanTablet: null,
              gridColumnSpanSm: null,
              gridColumnSpanMobile: null,
              sourceName: chart.sourceName ?? null,
              sourceLink: chart.sourceLink ?? null,
              rankingLink: chart.rankingLink ?? null,
              dataSource: null,
            }}
            area={{ areaCode, areaName, areaType: "prefecture" }}
          />
        </div>
      );
    }
    default:
      return null;
  }
}

/**
 * 県データブックセクション (書籍「都道府県 Data Book」型の高密度ダッシュボード)。
 *
 * - 値+全国順位は R2 databook.json (1 read)、特産品・シンボルは git TS editorial。
 * - 推移チャートは既存 estatParams ライブ経路 (DashboardComponentRenderer)。
 * - databook 未生成 (本番で exporter 未反映) の県は従来チャート表示にフォールバックする
 *   (段階展開の安全弁)。正典: .claude/rules/area-databook-standards.md
 */
export async function AreaDatabookSection({ areaCode, areaName }: Props) {
  const data = await getAreaDatabook(areaCode);

  // databook 未生成 → 従来のチャートセクションにフォールバック (無挙動変化)
  if (!data.databook) {
    return <AreaChartSection areaCode={areaCode} areaName={areaName} />;
  }

  const sections = [...data.template.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((s) => sectionHasContent(s, data));

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{areaName}のデータブック</h2>
      </div>

      <DatabookToc
        items={sections.map((s) => ({ sectionKey: s.sectionKey, title: s.title }))}
      />

      {sections.map((section) => (
        <div
          key={section.sectionKey}
          id={`databook-${section.sectionKey}`}
          className="scroll-mt-24"
        >
          <ChartPanel
            title={section.title}
            titleClassName="text-base"
            description={section.description}
            contentClassName="space-y-4"
          >
            {section.blocks.map((block) =>
              renderBlock(block, data, areaCode, areaName),
            )}
          </ChartPanel>
        </div>
      ))}
    </section>
  );
}
