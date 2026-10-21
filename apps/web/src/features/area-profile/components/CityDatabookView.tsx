import { CITY_TOP_BAND, selectCityHighlights } from "@stats47/area-profile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components/atoms/ui/table";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import {
  prefectureInsideLabel,
  type CityDatabookMetric,
  type CityDatabookSnapshot,
} from "@stats47/ranking";

import { rankToneByPosition } from "@/components/atoms/RankBadge";
import Link from "@/components/atoms/SiteLink";
import { SectionHeader } from "@/components/section";

import { RankedValueGrid } from "@/features/area-databook";

import { navSurfaceProps } from "@/lib/analytics/events";

import { AreaHighlightList } from "./AreaHighlightList";

interface Props {
  databook: CityDatabookSnapshot;
  cityShortName: string;
  prefName: string;
}

/** 「特徴」一覧の件数。 */
const CITY_HIGHLIGHTS_LIMIT = 8;

/** 市区町村の指標は全国の市区町村ランキングへつなぐ (県内の位置は表の県内順位で読める)。 */
function metricHref(metric: CityDatabookMetric): string {
  return `/municipalities/ranking/${metric.rankingKey}`;
}

function formatValue(value: number): string {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

function nationalRankText(metric: CityDatabookMetric): string {
  return `全国 ${metric.nationalRank.toLocaleString("ja-JP")}位/${metric.nationalCount.toLocaleString("ja-JP")}`;
}

/**
 * 市区町村ページの本文 (見出しの指標・特徴・分野別の全指標)。値と順位はデータブックの焼き込みだけを使う。
 * 分野は市区町村テーマ、並びと見出しの指標は CITY_DATABOOK_LAYOUT (生成時に決まる)。
 */
export function CityDatabookView({ databook, cityShortName, prefName }: Props) {
  const metrics = databook.metrics;
  const headline = databook.headlineKeys.flatMap((key) => (metrics[key] ? [metrics[key]] : []));
  const highlights = selectCityHighlights(Object.values(metrics), { limit: CITY_HIGHLIGHTS_LIMIT });
  const prefectureCount = headline[0]?.prefectureCount;
  const inside = prefectureInsideLabel(prefName);

  return (
    <>
      <section aria-labelledby="city-headline">
        <SectionHeader
          title={<span id="city-headline">{cityShortName}の主な指標</span>}
          description={
            prefectureCount
              ? `バッジは${prefName}の${prefectureCount}市区町村の中の順位`
              : undefined
          }
        />
        <RankedValueGrid
          navSurface="area_databook"
          columns={3}
          items={headline.map((metric) => ({
            key: metric.rankingKey,
            label: metric.label,
            href: metricHref(metric),
            value: {
              value: metric.value,
              unit: metric.unit,
              year: metric.yearName,
              badge: {
                rank: metric.prefectureRank,
                tone: rankToneByPosition(metric.prefectureRank, metric.prefectureCount),
              },
              detail: ` ・ ${nationalRankText(metric)}`,
            },
          }))}
        />
      </section>

      {highlights.length > 0 && (
        <section aria-labelledby="city-highlights">
          <SectionHeader
            title={<span id="city-highlights">{cityShortName}の特徴</span>}
            description={`${inside}で${CITY_TOP_BAND}位以内に入る、人口あたり・割合などの指標`}
          />
          {/* 市区町村の指標は極性を焼き込んでいないので色を付けない (neutral) */}
          <AreaHighlightList
            rankScope={`${inside}順位`}
            items={highlights.map((metric) => ({
              rankingKey: metric.rankingKey,
              href: metricHref(metric),
              label: metric.label,
              rank: metric.prefectureRank,
              value: metric.value,
              unit: metric.unit,
              year: metric.yearName,
              detail: nationalRankText(metric),
              tone: "neutral",
            }))}
          />
        </section>
      )}

      <section aria-labelledby="city-sections">
        <SectionHeader
          title={<span id="city-sections">分野別のデータ</span>}
          description={`${Object.keys(metrics).length}指標。指標名から全国の市区町村ランキングへ移れます`}
        />
        <nav aria-label="分野" className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {databook.sections.map((section) => (
            <a key={section.themeSlug} href={`#${section.themeSlug}`} className="text-primary hover:underline">
              {section.title}
            </a>
          ))}
        </nav>
        <div className="mt-6 space-y-8" {...navSurfaceProps("area_databook")}>
          {databook.sections.map((section) => (
            <section key={section.themeSlug} id={section.themeSlug} className="scroll-mt-20">
              <SectionHeader
                as="h3"
                title={section.title}
                action={
                  <Link
                    href={`/municipalities/themes/${section.themeSlug}`}
                    data-nav-label={`theme:${section.themeSlug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    市区町村を比べる ›
                  </Link>
                }
              />
              <div className="overflow-x-auto border border-border">
                <Table>
                  <TableHeader className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <TableRow>
                      <TableHead>指標</TableHead>
                      <TableHead className="text-right">値</TableHead>
                      <TableHead className="text-right">{inside}</TableHead>
                      <TableHead className="text-right">全国</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.metricKeys.map((key) => {
                      const metric = metrics[key]!;
                      return (
                        <TableRow key={key}>
                          <TableCell className="min-w-40">
                            <Link
                              href={metricHref(metric)}
                              data-nav-label={key}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {metric.label}
                            </Link>
                            <span className="block text-[11px] text-muted-foreground">{metric.yearName}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatValue(metric.value)}
                            <span className="ml-0.5 text-[11px] text-muted-foreground">
                              {formatUnitForDisplay(metric.unit)}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {metric.prefectureRank}位
                            <span className="text-[11px] text-muted-foreground">/{metric.prefectureCount}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {metric.nationalRank.toLocaleString("ja-JP")}位
                            <span className="text-[11px] text-muted-foreground">
                              /{metric.nationalCount.toLocaleString("ja-JP")}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
