'use client';

import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

// 型サブパスから読む。registry (index) を値 import すると 20 テーマ分のカタログが
// client bundle に載る (types.ts は型 import しか持たないので何も引き連れない)
import { normalizeUnitForAxis } from '@stats47/data-configs/theme-catalog/types';
import { Check } from 'lucide-react';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { getChartColor } from '@/components/charts/ChartPalette';
import { ChartPanel } from '@/components/charts/ChartPanel';
import type { LineChartData } from '@/components/stat-charts/types/visualization';

import { trackNavClick } from '@/lib/analytics/events';

import {
  fetchMetricTimeseriesAction,
  type MetricTimeseriesResult,
} from '../actions';

import { ChartEmptyState, ChartLoading } from './ChartState';
import { ScrollableRow } from './ScrollableRow';

import type { MetricKpi } from './metric-kpi';

const LineChartClient = dynamic(
  () =>
    import('@/components/stat-charts/components/charts/LineChart/LineChartClient').then(
      (mod) => mod.LineChartClient
    ),
  { ssr: false, loading: () => <ChartLoading height={250} /> }
);

const NATIONAL_CODE = '00000';
/** 比較系列 (全国) の線種。主系列と色だけで区別しないための破線 */
const COMPARISON_DASH = '6,4';

interface MetricSwitcherPanelProps {
  /** カード見出し (複数指標を束ねるグループ名。未指定なら見出しを表示しない) */
  title?: string;
  /** このカードに並べる KPI 群 (タイルの中身・表示順) */
  metrics: MetricKpi[];
  /** rankingKey → 短ラベル (tabIndicators の tabLabel)。無ければ title を使う */
  tabLabels: Record<string, string>;
  /** 選択中の都道府県コード (null = 47都道府県・未選択) */
  selectedPrefectureCode: string | null;
  /** 表示名 ("47都道府県" or 県名) */
  areaName: string;
  /** 初期チェックする指標。metrics に無いキーは無視し、全滅したら先頭 1 件に倒す */
  defaultCheckedKeys?: string[];
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
  | { kind: 'chart'; data: LineChartData; hasComparison: boolean }
  | { kind: 'single-year'; yearName: string }
  | { kind: 'none' }
  | { kind: 'select-prefecture' };

/**
 * 比較系列の凡例名。
 *
 * ★47 県平均を「全国」と称してはならない (総人口のような実数系は全国値の 1/47 になる)。
 * 判定は action が返す source 申告に従う。正典は aggregate-metric-timeseries.ts。
 * 平均のときは「都道府県平均」と呼び、「全国」の字を含めない
 * (docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md §3.1)。
 */
function nationalSeriesName(
  result: MetricTimeseriesResult | undefined
): string {
  return result?.source === 'national' ? '全国' : '都道府県平均';
}

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
  /** 軸を分ける判定キー。`%` と `％` を別物にしない (正典は normalizeUnitForAxis) */
  const keyOf = (m: MetricKpi) => normalizeUnitForAxis(m.unit);
  const units: string[] = [];
  const labels = new Map<string, string>();
  for (const m of checked) {
    const key = keyOf(m);
    if (!units.includes(key)) {
      units.push(key);
      // 軸頭には config の表記をそのまま出す (正規化は比較のためだけ)
      labels.set(key, m.unit);
    }
  }
  const axisOf = new Map<string, 'left' | 'right'>();
  for (const m of checked) {
    axisOf.set(m.metricKey, keyOf(m) === units[1] ? 'right' : 'left');
  }
  return {
    axisOf,
    leftUnit: units[0] ? (labels.get(units[0]) ?? '') : '',
    rightUnit: units[1] ? labels.get(units[1]) : undefined,
  };
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
  if (state.kind === 'select-prefecture') {
    return '都道府県を選択すると、その県の推移が表示されます';
  }
  return '推移データがありません';
}

/**
 * 指標カード 1 枚 — 値付きタイル群 (横スクロール) + チェックで重ねる折れ線。
 *
 * GA4 のスコアカードと GSC のチェックボックス折れ線の良いとこ取り。1 グループ = 1 枚で、
 * 1 ページに複数枚が並ぶ (編成は ThemeCatalog.metricGroups が SSOT)。
 *
 * 設計上の約束と理由:
 * - タイルにミニチャートを置かない。トレンドは下の折れ線が担うので、同じ事実を
 *   2 か所に描かない (theme-catalog-standards.md の重複禁止を構造で守る)
 * - チェックされた指標だけを遅延取得する。タイルの値・順位は indicatorDataMap 由来で
 *   即座に出るので初期表示は速い
 * - 単位が 2 種のときは左右 Y 軸に分ける。1 種なら従来どおり単軸
 * - 県選択かつチェック 1 本のときだけ「実線=その県 / 破線=全国」を重ねる。
 *   2 本以上のときは破線を出さない (系列が増えすぎて読めなくなる)
 */
export function MetricSwitcherPanel({
  title,
  metrics,
  tabLabels,
  selectedPrefectureCode,
  areaName,
  defaultCheckedKeys,
}: MetricSwitcherPanelProps) {
  const areaCode = selectedPrefectureCode ?? NATIONAL_CODE;

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
    return kept.length > 0 ? kept : metrics.slice(0, 1);
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
    if (!selectedPrefectureCode) return;
    const keys = checkedKeysKey ? checkedKeysKey.split(',') : [];
    if (keys.length === 0) return;
    const wanted = [areaCode, NATIONAL_CODE];
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
        const result = await fetchMetricTimeseriesAction(key, code).catch(
          () => null
        );
        return [cacheKey(key, code), result] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setSeriesCache((prev) => {
        const next = { ...prev };
        for (const [key, result] of entries) {
          if (result) next[key] = result;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [checkedKeysKey, areaCode, selectedPrefectureCode, seriesCache]);

  // 1 本でも描ければ描く。全滅のときだけローディング (取得は指標ごとに独立)。
  // 47都道府県 (未選択) では何も fetch しないので、ローディングにはならない。
  const isLoadingSeries =
    !!selectedPrefectureCode &&
    checkedMetrics.every((m) => !seriesCache[cacheKey(m.metricKey, areaCode)]);

  const chartState: ChartState = useMemo(() => {
    if (!selectedPrefectureCode) return { kind: 'select-prefecture' };
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
    const put = (year: string, yearName: string, key: string, value: number) => {
      const yk = year.slice(0, 4);
      if (!labelOfYear.has(yk)) labelOfYear.set(yk, yearName);
      const row = rows.get(yk) ?? {};
      row[key] = value;
      rows.set(yk, row);
    };

    const lines: LineChartData['lines'] = [];
    const single = checkedMetrics.length === 1 ? checkedMetrics[0] : null;
    let maxPoints = 0;
    let loneYear = '';

    for (const metric of checkedMetrics) {
      const key = metric.metricKey;
      const label = tabLabels[key] ?? metric.title;
      const areaResult = seriesCache[cacheKey(key, areaCode)];
      const nationalResult = seriesCache[cacheKey(key, NATIONAL_CODE)];
      const areaPoints = areaResult?.points ?? [];

      /** この系列の実データと凡例名。県系列が空なら全国 → R2 47 県平均へ退避する */
      let points: { year: string; yearName: string; value: number }[] = [];
      let name = label;

      if (selectedPrefectureCode && areaPoints.length > 0) {
        points = areaPoints;
        // 1 本だけのときは従来どおり「地域名」を凡例にする (破線の全国と対になる)。
        // 複数本のときは地域が共通なので指標名で区別する (地域は見出し側が言う)。
        name = single ? areaName : label;
      } else {
        // 県を選んでいてもその県の系列が取れない指標 (この時点で selectedPrefectureCode は
        // 必ず設定されている。47都道府県・未選択は chartState が手前で select-prefecture を
        // 返して抜けている)。国土数値情報など e-Stat パラメータを持たない external 種で起きる
        // (action が resolveEstatParams で null になり空を返す)。
        const nationalPoints = nationalResult?.points ?? [];
        if (nationalPoints.length > 0) {
          points = nationalPoints;
          name = single ? nationalSeriesName(nationalResult) : label;
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
      if (points.length === 1) loneYear = points[0].yearName;

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
    if (single && selectedPrefectureCode) {
      const areaResult = seriesCache[cacheKey(single.metricKey, areaCode)];
      const nationalResult =
        seriesCache[cacheKey(single.metricKey, NATIONAL_CODE)];
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
    if (maxPoints === 1) return { kind: 'single-year', yearName: loneYear };
    if (data.length === 0) return { kind: 'none' };
    return {
      kind: 'chart',
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
    selectedPrefectureCode,
    seriesCache,
    areaCode,
    areaName,
    tabLabels,
    colorOf,
  ]);

  if (metrics.length === 0) return null;

  const toggle = (key: string, next: boolean) => {
    // 最後の 1 本は外せない。0 本になるとチャートが消え、
    // 「壊れた」のか「自分で消した」のか読者に判別できなくなる。
    if (!next && checkedMetrics.length <= 1) return;
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
        href: `/ranking/${key}`,
        surface: 'theme_kpi_switcher',
      });
    }
  };

  const checkedSet = new Set(checkedMetrics.map((m) => m.metricKey));
  const isLastChecked = checkedMetrics.length <= 1;
  /** フッターのランキング導線。複数チェック時は先頭 (= 編成順で最初) を代表にする */
  const representative = checkedMetrics[0] ?? metrics[0];

  return (
    <ChartPanel
      title={title}
      titleClassName="text-base"
      footer={
        representative ? (
          <ChartFooter
            rankingLink={`/ranking/${representative.metricKey}`}
            rankingLabel="ランキングを見る"
          />
        ) : undefined
      }
    >
      {!title && representative ? (
        <h3 className="sr-only">{representative.title}</h3>
      ) : null}
      <div className="mb-3">
        <ScrollableRow className="snap-x snap-mandatory">
          <div className="inline-flex w-max gap-2">
            {metrics.map((m) => {
              const label = tabLabels[m.metricKey] ?? m.title;
              const checked = checkedSet.has(m.metricKey);
              const lockedOn = checked && isLastChecked;
              const color = colorOf.get(m.metricKey) ?? getChartColor(0);
              return (
                /* タイル全体で 1 つのチェックボックス。
                     Radix の Checkbox (button) を <label> で包むと、ラベル経由の
                     activation と直接クリックが二重に発火しうる。入れ子にせず
                     button 自体を role="checkbox" にして 1 コントロールに保つ。 */
                <button
                  key={m.metricKey}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={`${label}をグラフに表示`}
                  aria-disabled={lockedOn || undefined}
                  onClick={() => toggle(m.metricKey, !checked)}
                  title={
                    lockedOn
                      ? '最後の 1 指標は外せません（別の指標を選ぶと外せます）'
                      : // タイル幅に収まらないラベルを hover で読めるようにする
                        label
                  }
                  className={`snap-start flex w-36 shrink-0 flex-col items-start gap-1 rounded-none border-0 border-b-2 bg-transparent px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    checked
                      ? 'bg-accent/40'
                      : 'border-b-border hover:bg-accent/30'
                  } ${lockedOn ? 'cursor-default' : 'cursor-pointer'}`}
                  style={checked ? { borderBottomColor: color } : undefined}
                >
                  <span className="flex w-full items-center gap-1.5">
                    {/* チェック状態と系列色を 1 つの箱で示す (色ドットを別に置かない) */}
                    <span
                      aria-hidden
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border"
                      style={
                        checked
                          ? { backgroundColor: color, borderColor: color }
                          : undefined
                      }
                    >
                      {checked ? (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      ) : null}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {label}
                    </span>
                  </span>
                  {selectedPrefectureCode ? (
                    <>
                      <span className="w-full truncate text-base font-bold tabular-nums text-foreground">
                        {m.value !== null
                          ? m.value.toLocaleString('ja-JP', {
                              maximumFractionDigits: 2,
                            })
                          : '—'}
                        {m.unit ? (
                          <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
                            {m.unit}
                          </span>
                        ) : null}
                      </span>
                      {m.rank !== null ? (
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {m.rank}位 / {m.total}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    /* 47都道府県 (未選択): 実在する1位県の値をそのまま出す
                       (47県平均でも全国値でもない。GEO-SCOPE-SEPARATION-01 WP2) */
                    <>
                      <span className="w-full truncate text-base font-bold tabular-nums text-foreground">
                        {m.topRanked !== null
                          ? m.topRanked.value.toLocaleString('ja-JP', {
                              maximumFractionDigits: 2,
                            })
                          : '—'}
                        {m.unit ? (
                          <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
                            {m.unit}
                          </span>
                        ) : null}
                      </span>
                      {m.topRanked !== null ? (
                        <span className="truncate text-[10px] tabular-nums text-muted-foreground">
                          1位: {m.topRanked.areaName}
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollableRow>
      </div>
      {isLoadingSeries ? (
        <ChartLoading height={250} />
      ) : chartState.kind === 'chart' ? (
        <LineChartClient chartData={chartState.data} />
      ) : (
        <ChartEmptyState message={emptyMessage(chartState)} height={250} />
      )}
    </ChartPanel>
  );
}
