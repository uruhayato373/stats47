import { CITY_TOP_BAND, selectCityHighlights } from "@stats47/area-profile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components/atoms/ui/table";
import { hrefFor } from "@stats47/data-configs/content/href";
import { listCityDatabookThemes } from "@stats47/data-configs/geo-scope";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import {
  prefectureInsideLabel,
  type CityDatabookMetric,
  type CityDatabookSnapshot,
} from "@stats47/ranking";
import { TrendingUp } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { PanelGrid } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { SectionCard } from "@/components/surface";

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

/**
 * 表の行ごとに同じ class を繰り返さず、表に 1 回だけ書く (市区町村ページは 200 行を超え、HTML と RSC の
 * 両方に class が載るため。2026-10-22 に札幌市のページが 954KB でページの重さの予算 900KB を超えた)。
 * 2 列目以降は右寄せの数値、`<small>` は補足、1 列目のリンクは指標名。
 */
const DATABOOK_TABLE_CLASS =
  "[&_td+td]:whitespace-nowrap [&_td+td]:text-right [&_td+td]:tabular-nums " +
  "[&_small]:text-[11px] [&_small]:text-muted-foreground " +
  "[&_td>a]:font-medium [&_td>a]:text-foreground [&_td>a:hover]:text-primary [&_td>a:hover]:underline";

/**
 * 分野へのリンクを outline の小ボタン (buttonVariants outline sm と同じ見た目) で並べる。
 * 30 件前後並ぶので、DATABOOK_TABLE_CLASS と同じくクラスは親に 1 回だけ書く (ページの重さの予算)。
 */
const FIELD_LINKS_CLASS =
  "flex flex-wrap gap-1.5 " +
  "[&>a]:inline-flex [&>a]:h-7 [&>a]:items-center [&>a]:rounded-md [&>a]:border [&>a]:border-border " +
  "[&>a]:bg-background [&>a]:px-2.5 [&>a]:text-xs [&>a]:font-medium [&>a]:text-foreground [&>a]:transition-colors " +
  "[&>a:hover]:bg-muted [&>a:focus-visible]:outline-hidden [&>a:focus-visible]:ring-2 [&>a:focus-visible]:ring-ring/50";

/** 市区町村の指標は全国の市区町村ランキングへつなぐ (県内の位置は表の県内順位で読める)。 */
function metricHref(metric: CityDatabookMetric): string {
  return hrefFor("municipality-ranking", { rankingKey: metric.rankingKey });
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
  // データブックに節の無い市区町村テーマ (載せる指標を絞った拡充分のテーマなど) へも行けるようにする
  const shownThemes = new Set(databook.sections.map((section) => section.themeSlug));
  const otherThemes = listCityDatabookThemes().filter((theme) => !shownThemes.has(theme.slug));
  const prefectureCount = headline[0]?.prefectureCount;
  const inside = prefectureInsideLabel(prefName);

  return (
    <>
      <PanelGrid as="section" aria-labelledby="city-headline">
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
              // 市区町村の指標は極性を焼き込んでいないので、順位の位置で色を変えない (特徴の一覧と同じ neutral)
              badge: { rank: metric.prefectureRank, tone: "neutral" },
              detail: ` ・ ${nationalRankText(metric)}`,
            },
          }))}
        />
      </PanelGrid>

      {highlights.length > 0 && (
        <PanelGrid as="section" aria-labelledby="city-highlights">
          <SectionHeader
            title={<span id="city-highlights">{cityShortName}の特徴</span>}
            description={`${inside}で${CITY_TOP_BAND}位以内に入る、人口あたり・割合などの指標`}
          />
          {/* 県ページの「特徴」と同じカードに入れる。市区町村の指標は極性を焼き込んでいないので色を付けない (neutral) */}
          <SectionCard
            title={`${cityShortName}が${inside}で上位`}
            icon={<TrendingUp />}
            className="gap-0!"
            bodyClassName="pt-3"
          >
          <AreaHighlightList
            columns={3}
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
          </SectionCard>
        </PanelGrid>
      )}

      <section aria-labelledby="city-sections">
        <SectionHeader
          title={<span id="city-sections">分野別のデータ</span>}
          description={`${Object.keys(metrics).length}指標。指標名から全国の市区町村ランキングへ移れます`}
        />
        <nav aria-label="分野" className={FIELD_LINKS_CLASS}>
          {databook.sections.map((section) => (
            <a key={section.themeSlug} href={`#${section.themeSlug}`}>
              {section.title}
            </a>
          ))}
        </nav>
        <div className="mt-6 space-y-6" {...navSurfaceProps("area_databook")}>
          {databook.sections.map((section) => (
            <section key={section.themeSlug} id={section.themeSlug} className="scroll-mt-20">
              <SectionHeader
                as="h3"
                title={section.title}
                action={
                  <Link
                    href={hrefFor("municipality-theme", { themeSlug: section.themeSlug })}
                    data-nav-label={`theme:${section.themeSlug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    市区町村を比べる ›
                  </Link>
                }
              />
              <div className="overflow-x-auto border border-border">
                <Table className={DATABOOK_TABLE_CLASS}>
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
                            <Link href={metricHref(metric)} data-nav-label={key}>
                              {metric.label}
                            </Link>
                            <small className="block">{metric.yearName}</small>
                          </TableCell>
                          <TableCell>
                            {formatValue(metric.value)}
                            <small className="ml-0.5">{formatUnitForDisplay(metric.unit)}</small>
                          </TableCell>
                          <TableCell>
                            {`${metric.prefectureRank}位`}
                            <small>{`/${metric.prefectureCount}`}</small>
                          </TableCell>
                          <TableCell>
                            {`${metric.nationalRank.toLocaleString("ja-JP")}位`}
                            <small>{`/${metric.nationalCount.toLocaleString("ja-JP")}`}</small>
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
        {otherThemes.length > 0 && (
          <nav aria-label="ほかの分野" className="mt-6 text-sm" {...navSurfaceProps("area_databook")}>
            <p className="text-muted-foreground">
              この表に載せていない分野も、市区町村どうしで比べられます。
            </p>
            <div className={`mt-2 ${FIELD_LINKS_CLASS}`}>
              {otherThemes.map((theme) => (
                <Link
                  key={theme.slug}
                  href={hrefFor("municipality-theme", { themeSlug: theme.slug })}
                  data-nav-label={`theme:${theme.slug}`}
                >
                  {theme.title}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </section>
    </>
  );
}
