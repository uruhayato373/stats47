'use client';

import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

// 型サブパスから読む。registry (index) を値 import すると 20 テーマ分のカタログが
// client bundle に載る (types.ts は型 import しか持たないので何も引き連れない)
import { NATIONAL_AREA_CODE } from '@stats47/area';
import { ChartPanel } from '@stats47/components';
import { hrefFor } from "@stats47/data-configs/content/href";
import { normalizeUnitForAxis } from '@stats47/data-configs/theme-catalog/types';
import { classifyUnitComparability } from '@stats47/data-configs/unit';
import { X } from 'lucide-react';

import { getChartColor } from '@/components/charts/ChartPalette';
import { ChartLoading } from '@/components/charts/ChartState';
import { SourcesSheet } from '@/components/charts/SourcesSheet';
import { PanelGrid } from '@/components/layout';
import type { LineChartData } from '@/components/stat-charts/types/visualization';
import { StatTileGrid } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';
import {selectMetricDomainPolicy,metricSeriesDomain} from '@/lib/metric-presentation';

import { type MetricTimeseriesResult } from '../actions';
import { fetchMetricTimeseriesBatched } from '../lib/batched-metric-timeseries';
import { metricSourceGroups } from '../lib/metric-source-groups';
import { nationalSeriesName } from '../lib/metric-trend';

import { MetricStatTile } from './MetricStatTile';
import { useThemePrefecture } from './ThemePrefectureContext';

import type { MetricKpi, MultiMetricGroup } from './metric-kpi';

const CHART_HEIGHT = 250;

const LineChartClient = dynamic(
  () =>
    import('@/components/stat-charts/components/charts/LineChart/LineChartClient').then(
      (mod) => mod.LineChartClient
    ),
  { ssr: false, loading: () => <ChartLoading height={CHART_HEIGHT} /> }
);

/** 比較系列 (全国) の線種。主系列と色だけで区別しないための破線 */
const COMPARISON_DASH = '6,4';

interface MetricSwitcherPanelProps {
  /** SSRとクライアントで同じ見出しIDを使うための固定キー (ChartPanel の useId フォールバック回避) */
  id?: string;
  /** カード見出し (複数指標を束ねるグループ名。未指定なら見出しを表示しない) */
  title?: string;
  /** 同じ章に系列の詳細図がある場合は、値を重複描画しない。 */
  summaryOnly?: boolean;
  /**
   * このカードに並べる KPI 群 (タイルの中身・表示順)。
   * ★2 件以上専用。1 件のグループは選択 UI を持たない `SingleMetricCard` が描く
   *   (件数は観測不足で落とした後の実件数。ThemeMetricsDashboard が振り分ける)。
   */
  metrics: MultiMetricGroup;
  /** rankingKey → 短ラベル (tabIndicators の tabLabel)。無ければ title を使う */
  tabLabels: Record<string, string>;
  /** 選択中の都道府県コード (null = 47都道府県・未選択) */
  selectedPrefectureCode: string | null;
  /** 表示名 ("47都道府県" or 県名) */
  areaName: string;
  /** 初期チェックする指標。metrics に無いキーは無視し、全滅したら先頭 1 件に倒す */
  defaultCheckedKeys?: string[];
  /** チャートの誤読防止の注記 (同じ指標を描いていた章のチャートをこのカードに寄せたとき、その注記を引き継ぐ) */
  annotation?: string;
}

/** 系列キャッシュのキー。指標×地域で一意にする */
const cacheKey = (metricKey: string, areaCode: string) =>
  `${metricKey}:${areaCode}`;

/**
 * チャート領域に何を出すか。
 *
 * 「描けない」を 1 つの `null` にまとめると、読者には全部「推移データがありません」に
 * 見えてしまう。だが単年しか調査されていない指標 (鉄道駅数=2024年のみ 等) は
 * データが欠けているのではなく**そもそも推移が存在しない**ので、そう書いた方が正しい。
 * `select-prefecture` は 47都道府県 (未選択) 表示のときの状態で、そもそも fetch しない
 * (GEO-SCOPE-SEPARATION-01 WP2)。
 */
type ChartState =
  | { kind: 'chart'; data: LineChartData; leftDomain?: [number,number]; rightDomain?: [number,number]; hasComparison: boolean }
  | { kind: 'single-year'; yearName: string }
  | { kind: 'none' };


/**
 * 全国比較の破線を出しても意味がない指標か。
 *
 * 消費者物価の地域差指数のような「全国=100」の指数は、定義上どの年も全国が 100 なので
 * 比較線が情報ゼロの水平線になり、むしろ縦軸を潰して県の変化を読みにくくする。
 * 該当: consumer-prices の全指標 / laspeyres-index-prefecture など。
 */
function isNationalBaselineIndex(unit: string): boolean {
  return unit.includes('全国=100') || unit.includes('全国＝100');
}

/**
 * チェックされた指標の単位から左右 Y 軸を割り当てる。
 *
 * 軸は 2 本しかないので単位も 2 種まで (3 種以上はカタログ validator が定義時に弾く)。
 * 割当は「表示順に出てきた 1 個目の単位 = 左、2 個目 = 右」で決定的に決まる。
 *
 * ★判定材料は **チェック中の指標だけ**。グループ全体で見てしまうと、右軸の指標を 1 本だけ
 * 残したときに左軸が空のまま目盛りだけ残り読めなくなる。単位が 1 種に絞られたら
 * その系列は左軸 = 単軸表示に戻すのが読者にとって自然。
 */
function assignAxes(checked: MetricKpi[]): {
  axisOf: Map<string, 'left' | 'right'>;
  leftUnit: string;
  rightUnit?: string;
} {
  /** 倍率1の同一単位だけを同じ軸へ載せる。換算可能でも値を変換していない系列は分ける。 */
  const sharesAxis = (a: string, b: string) =>
    normalizeUnitForAxis(a) === normalizeUnitForAxis(b) ||
    classifyUnitComparability(a, b).verdict === 'same';
  const units: string[] = [];
  for (const m of checked) {
    if (!units.some((unit) => sharesAxis(unit, m.unit))) units.push(m.unit);
  }
  const axisOf = new Map<string, 'left' | 'right'>();
  for (const m of checked) {
    axisOf.set(
      m.metricKey,
      units[1] && sharesAxis(units[1], m.unit) ? 'right' : 'left'
    );
  }
  return {
    axisOf,
    leftUnit: units[0] ?? '',
    rightUnit: units[1],
  };
}

/** Same-scale units only; never force a third unit onto the left axis. */
function withinTwoAxes(metrics: MetricKpi[]): MetricKpi[] {
  const units: string[] = [];
  return metrics.filter((metric) => {
    if (
      units.some(
        (unit) =>
          normalizeUnitForAxis(unit) === normalizeUnitForAxis(metric.unit) ||
          classifyUnitComparability(unit, metric.unit).verdict === 'same'
      )
    )
      return true;
    if (units.length >= 2) return false;
    units.push(metric.unit);
    return true;
  });
}

/**
 * チャートを描けないときの文面。
 *
 * 「データがありません」で済ませると、読者には取得失敗との区別が付かない。
 * 単年しか調査されていない指標はそう明示して、タイルの値・順位と
 * ランキング導線の方に目を向けてもらう。47都道府県 (未選択) はエラーではなく
 * 選択を促す案内にする (GEO-SCOPE-SEPARATION-01 WP2)。
 */
function emptyMessage(state: ChartState): string {
  if (state.kind === 'single-year') {
    return `${state.yearName}の単年データのため、推移グラフはありません`;
  }
  return '推移データがありません';
}

/**
 * 指標カード 1 枚 — 指標ごとの数値タイル (StatTile の格子) + 凡例で系列を選ぶ折れ線のパネル。
 *
 * 2026-10-29 に、値を見せる役割と系列を選ぶ役割を分けた (旧: 値付きタイル自体がチェックボックス)。値は
 * テーマ全体で同じ数値タイル (MetricStatTile)、選択はチャートの凡例 (ChartLegend の切り替え) が持つ。
 * 1 グループ = 1 枚で、1 ページに複数枚が並ぶ (編成は ThemeCatalog.metricGroups が SSOT)。
 *
 * ★有効指標が 2 件以上のグループ専用 (2026-09-17)。1 件しか残らないグループは
 *   選択の凡例を持たない `SingleMetricCard` が描く。ここでは「最後の 1 本を外せない」
 *   ロックは残す (2 件以上から 1 本に絞った状態の話であり、1 件グループとは別)。
 *
 * 設計上の約束と理由:
 * - 数値タイルにミニチャートを置かない。トレンドは下の折れ線が担うので、同じ事実を
 *   2 か所に描かない (theme-catalog-standards.md の重複禁止を構造で守る)
 * - チェックされた指標だけを遅延取得する。タイルの値・順位は indicatorDataMap 由来で
 *   即座に出るので初期表示は速い
 * - 単位が 2 種のときは左右 Y 軸に分ける。1 種なら従来どおり単軸
 * - 県選択かつチェック 1 本のときだけ「実線=その県 / 破線=全国」を重ねる。
 *   2 本以上のときは破線を出さない (系列が増えすぎて読めなくなる)
 */
export function MetricSwitcherPanel({
  id,
  title,
  summaryOnly = false,
  annotation,
  metrics,
  tabLabels,
  selectedPrefectureCode,
  areaName,
  defaultCheckedKeys,
}: MetricSwitcherPanelProps) {
  // 推移に出す県: 選んでいる県、無ければ前に選んで覚えている県 (47 都道府県のページ。タイルは 47 都道府県のまま)。
  // どちらも無ければ全国の推移を出す (2026-10-31 オーナー決定。旧: 「都道府県を選択すると…」の空のカード)
  const { rememberedPrefecture, clearRemembered } = useThemePrefecture();
  const trendCode = selectedPrefectureCode ?? rememberedPrefecture?.areaCode ?? null;
  const trendAreaName = selectedPrefectureCode ? areaName : (rememberedPrefecture?.areaName ?? areaName);
  const showsRemembered = !selectedPrefectureCode && !!rememberedPrefecture;
  const areaCode = trendCode ?? NATIONAL_AREA_CODE;

  const [checkedKeys, setCheckedKeys] = useState<string[]>(() => {
    const known = new Set(metrics.map((m) => m.metricKey));
    const initial = (defaultCheckedKeys ?? []).filter((k) => known.has(k));
    return initial.length > 0
      ? initial
      : metrics[0]
        ? [metrics[0].metricKey]
        : [];
  });

  /**
   * 実際に描画する指標。指標が入れ替わってチェック中キーが消えたときは先頭に倒す。
   *
   * effect の中で setState して直すと連鎖レンダーになる
   * (react-hooks/set-state-in-effect)。state は「ユーザーが選んだもの」だけを持ち、
   * 現在の metrics で有効かどうかは描画時に導出する。
   * 並び順は metrics 定義順に正規化する (チェックした順ではなく編成順で読ませる)。
   */
  const checkedMetrics = useMemo(() => {
    const set = new Set(checkedKeys);
    const kept = metrics.filter((m) => set.has(m.metricKey));
    return withinTwoAxes(kept.length > 0 ? kept : metrics.slice(0, 1));
  }, [checkedKeys, metrics]);

  /** 系列色。グループ内の定義順で固定 = 他をチェックしても自分の色は変わらない */
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    metrics.forEach((m, i) => map.set(m.metricKey, getChartColor(i)));
    return map;
  }, [metrics]);

  /**
   * `${metricKey}:${areaCode}` をキーにした取得済み系列。
   *
   * キー付きなので県切替やチェック往復での競合を requestId 照合なしに扱える
   * (古い応答が届いても自分のキーに書き込むだけで、描画は現在のキーを引く)。
   */
  const [seriesCache, setSeriesCache] = useState<
    Record<string, MetricTimeseriesResult>
  >({});

  const checkedKeysKey = checkedMetrics.map((m) => m.metricKey).join(',');

  // チェック中の指標について、必要な系列 (自地域 + 全国) のうち未取得のものだけ取る。
  // 県選択時に全国も取るのは比較破線のためだけではない: 県系列を持たない指標
  // (国土数値情報など) の描画フォールバックに要る。
  //
  // ★47都道府県 (未選択) のときは何も fetch しない (GEO-SCOPE-SEPARATION-01 WP2)。
  //   タイルは indicatorDataMap 由来の topRanked (実在する1位県の事実) を即座に表示でき、
  //   時系列は「都道府県を選択すると表示されます」という案内に置き換わるため、
  //   ネットワーク往復も「全国」「都道府県平均」の値も一切必要ない。
  useEffect(() => {
    if (summaryOnly) return;
    const keys = checkedKeysKey ? checkedKeysKey.split(',') : [];
    if (keys.length === 0) return;
    const wanted = trendCode ? [areaCode, NATIONAL_AREA_CODE] : [NATIONAL_AREA_CODE];
    const missing: Array<[string, string]> = [];
    for (const key of keys) {
      for (const code of wanted) {
        if (!(cacheKey(key, code) in seriesCache)) missing.push([key, code]);
      }
    }
    if (missing.length === 0) return;

    let cancelled = false;
    void Promise.all(
      missing.map(async ([key, code]) => {
        const result = await fetchMetricTimeseriesBatched(key, code).catch(
          () => null
        );
        return [cacheKey(key, code), result] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setSeriesCache((prev) => {
        const next = { ...prev };
        for (const [key, result] of entries) {
          next[key] = result ?? { points: [], source: 'none' };
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    checkedKeysKey,
    areaCode,
    trendCode,
    seriesCache,
    summaryOnly,
  ]);

  // 1 本でも描ければ描く。全滅のときだけローディング (取得は指標ごとに独立)。
  // 47都道府県 (未選択) では何も fetch しないので、ローディングにはならない。
  const isLoadingSeries =
    !summaryOnly && checkedMetrics.every((m) => !seriesCache[cacheKey(m.metricKey, areaCode)]);

  const chartState: ChartState = useMemo(() => {
    if (checkedMetrics.length === 0) return { kind: 'none' };

    const { axisOf, leftUnit, rightUnit } = assignAxes(checkedMetrics);

    /**
     * 系列を年で突き合わせる。
     *
     * ★突合キーは **4 桁の年コード** で、表示ラベル (yearName) ではない。
     * 指標によって「2020年」と「2020年度」が混在していて、ラベルで突き合わせると
     * 同じ年が別カテゴリになり、x 軸に "2020年2020年度" と重なって出たうえ
     * 系列同士が半目盛りずれる (2026-08-06 に labor-wages の 最低賃金(年度) ×
     * 大卒初任給(年) で実際に出た)。
     *
     * 目盛りに出せるラベルは 1 年 1 つなので、**編成順で先に来た系列の表記**を採る。
     * 年度と暦年を重ねること自体の限界 (対象期間が厳密には一致しない) は残るので、
     * 期間の基準が違う指標を同じグループに入れるかはカタログ側の判断。
     */
    const rows = new Map<string, Record<string, string | number>>();
    const labelOfYear = new Map<string, string>();
    const put = (
      year: string,
      yearName: string,
      key: string,
      value: number
    ) => {
      const yk = year.slice(0, 4);
      if (!labelOfYear.has(yk)) labelOfYear.set(yk, yearName);
      const row = rows.get(yk) ?? {};
      row[key] = value;
      rows.set(yk, row);
    };

    const lines: LineChartData['lines'] = [];
    const single = checkedMetrics.length === 1 ? checkedMetrics[0] : null;
    let maxPoints = 0;
    const singleYears = new Set<string>();

    for (const metric of checkedMetrics) {
      const key = metric.metricKey;
      const label = tabLabels[key] ?? metric.title;
      const areaResult = seriesCache[cacheKey(key, areaCode)];
      const nationalResult = seriesCache[cacheKey(key, NATIONAL_AREA_CODE)];
      const areaPoints = areaResult?.points ?? [];

      /** この系列の実データと凡例名。県系列が空なら全国 → R2 47 県平均へ退避する */
      let points: { year: string; yearName: string; value: number }[] = [];
      let name = label;

      if (trendCode && areaPoints.length > 0) {
        points = areaPoints;
        // 1 本だけのときは従来どおり「地域名」を凡例にする (破線の全国と対になる)。
        // 複数本のときは地域が共通なので指標名で区別する (地域は見出し側が言う)。
        name = single ? trendAreaName : label;
      } else {
        // 県を選んでいてもその県の系列が取れない指標 (この時点で selectedPrefectureCode は
        // 必ず設定されている。47都道府県・未選択は chartState が手前で select-prefecture を
        // 返して抜けている)。国土数値情報など e-Stat パラメータを持たない external 種で起きる
        // (action が resolveEstatParams で null になり空を返す)。
        const nationalPoints = nationalResult?.points ?? [];
        if (nationalPoints.length > 0) {
          points = nationalPoints;
          name = single
            ? nationalSeriesName(nationalResult)
            : `${label}（${nationalSeriesName(nationalResult)}）`;
        } else if (metric.series.length > 0) {
          points = metric.series.map((p) => ({
            year: String(p.year),
            yearName: String(p.year),
            value: p.value,
          }));
          // 47 県平均を「全国」と称さない (実数系は全国値の 1/47 になる)
          name = single ? '都道府県平均' : `${label}（平均）`;
        }
      }

      if (points.length === 0) continue;
      for (const p of points) put(p.year, p.yearName, key, p.value);
      if (points.length > maxPoints) maxPoints = points.length;
      if (points.length === 1) singleYears.add(points[0].yearName);

      lines.push({
        dataKey: key,
        name,
        color: colorOf.get(key) ?? getChartColor(0),
        yAxis: axisOf.get(key) ?? 'left',
      });
    }

    if (lines.length === 0) return { kind: 'none' };

    // 全国比較の破線。チェック 1 本 + 県選択のときだけ出す。
    // 2 本以上に足すと系列が倍になって読めない (GSC も比較線は出さない)。
    // 「全国=100」の指数は全国が常に 100 の水平線になるので出さない。
    let hasComparison = false;
    if (single && trendCode) {
      const areaResult = seriesCache[cacheKey(single.metricKey, areaCode)];
      const nationalResult =
        seriesCache[cacheKey(single.metricKey, NATIONAL_AREA_CODE)];
      if (
        (areaResult?.points.length ?? 0) > 0 &&
        nationalResult &&
        nationalResult.points.length > 0 &&
        !isNationalBaselineIndex(single.unit)
      ) {
        for (const p of nationalResult.points)
          put(p.year, p.yearName, 'national', p.value);
        lines.push({
          dataKey: 'national',
          name: nationalSeriesName(nationalResult),
          color: 'hsl(var(--muted-foreground))',
          strokeDasharray: COMPARISON_DASH,
          hidePoints: true,
          yAxis: 'left',
        });
        hasComparison = true;
        if (nationalResult.points.length > maxPoints) {
          maxPoints = nationalResult.points.length;
        }
      }
    }

    // 4 桁年キーで昇順に並べ、x カテゴリには表示ラベルを載せる
    const data = [...rows.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yk, row]) => ({ ...row, year: labelOfYear.get(yk) ?? yk }));
    // 1 点では折れ線にならない。ただし「無い」ではなく「単年だけ」と言い分ける
    if (maxPoints === 1) return { kind: 'single-year', yearName: [...singleYears].join("・") };
    if (data.length === 0) return { kind: 'none' };
    return {
      kind: 'chart',
      leftDomain: metricSeriesDomain(data, lines.filter(line=>line.yAxis !== 'right').map(line=>line.dataKey), selectMetricDomainPolicy(checkedMetrics.filter(metric=>axisOf.get(metric.metricKey)!=='right').map(metric=>metric.trendDomain))),
      rightDomain: metricSeriesDomain(data, lines.filter(line=>line.yAxis === 'right').map(line=>line.dataKey), selectMetricDomainPolicy(checkedMetrics.filter(metric=>axisOf.get(metric.metricKey)==='right').map(metric=>metric.trendDomain))),
      hasComparison,
      data: {
        xAxisKey: 'year',
        data,
        lines,
        unit: leftUnit,
        rightUnit,
      },
    };
  }, [
    checkedMetrics,
    trendCode,
    seriesCache,
    areaCode,
    trendAreaName,
    tabLabels,
    colorOf,
  ]);

  const toggle = (key: string, next: boolean) => {
    // 最後の 1 本は外せない。0 本になるとチャートが消え、
    // 「壊れた」のか「自分で消した」のか読者に判別できなくなる。
    if (summaryOnly || (!next && checkedMetrics.length <= 1)) return;
    if (
      next &&
      withinTwoAxes([
        ...checkedMetrics,
        ...metrics.filter((m) => m.metricKey === key),
      ]).length <= checkedMetrics.length
    )
      return;
    setCheckedKeys((prev) => {
      const set = new Set(
        prev.length > 0 ? prev : checkedMetrics.map((m) => m.metricKey)
      );
      if (next) set.add(key);
      else set.delete(key);
      return metrics.map((m) => m.metricKey).filter((k) => set.has(k));
    });
    // OFF は「見るのをやめた」だけで関心の表明ではないので送らない
    if (next) {
      trackNavClick({
        label: key,
        href: hrefFor("ranking", { rankingKey: key }),
        surface: 'theme_kpi_switcher',
      });
    }
  };

  const checkedSet = new Set(checkedMetrics.map((m) => m.metricKey));
  const isLastChecked = checkedMetrics.length <= 1;
  /** 見出しを渡さないときに読み上げ用に残す代表指標 (編成順の先頭) */
  const representative = checkedMetrics[0] ?? metrics[0];
  const contractYear =
    metrics
      .flatMap((metric) =>
        metric.yearName
          ? [metric.yearName]
          : metric.series.map((point) => String(point.year))
      )
      .sort()
      .at(-1) ?? '';
  const contractUnits = [
    ...new Set(metrics.map((metric) => metric.unit).filter(Boolean)),
  ].join(' / ');
  const readyMetricCount = metrics.filter(
    (metric) =>
      metric.topRanked !== null ||
      metric.value !== null ||
      metric.series.length > 0
  ).length;

  // 押しても切り替わらない数値タイルは理由を添える: 最後の 1 本 (系列ゼロにしない) と、3 種類目の単位 (Y 軸は 2 本まで)
  const disabledReasons = new Map<string, string>();
  for (const m of metrics) {
    const checked = checkedSet.has(m.metricKey);
    if (checked && isLastChecked) {
      disabledReasons.set(m.metricKey, '最後の 1 指標は外せません（別の指標を選ぶと外せます）');
    } else if (
      !checked &&
      withinTwoAxes([...checkedMetrics, m]).length <= checkedMetrics.length
    ) {
      disabledReasons.set(
        m.metricKey,
        '同時に表示できる単位は2種類までです。他の指標を外すと選択できます'
      );
    }
  }

  return (
    <div
      id={id}
      data-theme-component-type="kpi-card"
      data-data-state={readyMetricCount > 0 ? 'ready' : 'no-data'}
      data-unit={contractUnits}
      data-year={contractYear}
      data-series-count={readyMetricCount}
    >
      {/* 見出し → 指標ごとの数値タイル → 推移のパネル を 1 本の線の格子に並べる */}
      <PanelGrid>
        {title ? (
          <h3 className="text-base leading-5.5 font-medium text-foreground">{title}</h3>
        ) : representative ? (
          <h3 data-cell="flush" className="sr-only">{representative.title}</h3>
        ) : null}
        {/* 数値タイルを押して系列を出し入れする (見本の元の shadcn「Line Chart - Interactive」。2026-10-29)。
            出典・ランキングはタイルごとに出さず、チャートの下の 1 か所 (Sheet) にまとめる。同じ章に詳細図があるとき
            (summaryOnly) はその図の下の出典が同じ指標を指すので、ここでは出さない */}
        <StatTileGrid>
          {metrics.map((m) => (
            <MetricStatTile
              key={m.metricKey}
              metric={m}
              label={tabLabels[m.metricKey] ?? m.title}
              selectedPrefectureCode={selectedPrefectureCode}
              hideSources
              toggle={
                summaryOnly
                  ? undefined
                  : {
                      pressed: checkedSet.has(m.metricKey),
                      color: colorOf.get(m.metricKey) ?? getChartColor(0),
                      disabledReason: disabledReasons.get(m.metricKey),
                      onToggle: () => toggle(m.metricKey, !checkedSet.has(m.metricKey)),
                    }
              }
            />
          ))}
        </StatTileGrid>
        {!summaryOnly && (
          <ChartPanel
            footer={
              <div className="flex flex-col gap-1">
                {annotation ? <p>{annotation}</p> : null}
                <div className="flex justify-end">
                  <SourcesSheet groups={metricSourceGroups(metrics, tabLabels)} />
                </div>
              </div>
            }
          >
            {showsRemembered && rememberedPrefecture ? (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={clearRemembered}
                  aria-label={`${rememberedPrefecture.areaName}の重ね表示を外す`}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  {rememberedPrefecture.areaName}を重ねて表示中
                  <X aria-hidden className="size-3" />
                </button>
              </div>
            ) : null}
            {isLoadingSeries ? (
              <ChartLoading height={CHART_HEIGHT} />
            ) : chartState.kind === 'chart' ? (
              <LineChartClient
                chartData={chartState.data}
                yDomain={chartState.leftDomain}
                rightYDomain={chartState.rightDomain}
                // 指標の系列の名前と色は数値タイルの色の印が示す。全国の破線を重ねるとき (県を選び 1 指標) だけ凡例で区別する
                hideLegend={!chartState.hasComparison}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {emptyMessage(chartState)}
              </p>
            )}
          </ChartPanel>
        )}
      </PanelGrid>
    </div>
  );
}
