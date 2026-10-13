import { z } from 'zod';
import { getMetricConfig } from '../../../../packages/data-configs/src/registry';
import { buildRecipe } from '../../../../packages/data-configs/src/recipe';
import { PREF_CAPITAL_COORDS } from '../../../../packages/migration-flow/src/lib/pref-capitals';
import {
  dataCardSchema,
  type DataCard,
} from '../../../../apps/remotion/src/features/data-cards/model';

export const RECEIPT_PARTS = [
  ['food', '食料'],
  ['housing', '住居'],
  ['utilities', '光熱・水道'],
  ['furniture-household-goods', '家具・家事用品'],
  ['clothing-footwear', '被服・履物'],
  ['healthcare', '保健医療'],
  ['transport-communication', '交通・通信'],
  ['education', '教育'],
  ['culture-recreation', '教養娯楽'],
  ['other', 'その他の消費支出'],
] as const;
export const ATLAS_METRICS = [
  ['total-population', '人口'],
  ['total-area-excluding-northern-territories-and-takeshima', '面積'],
  ['households', '世帯数'],
  ['forest-area-ratio', '森林面積割合'],
] as const;
const rowSchema = z.object({
  areaCode: z.string().regex(/^\d{2}000$/),
  areaName: z.string().min(1),
  yearCode: z.string(),
  yearName: z.string().min(1),
  value: z.number().finite(),
  unit: z.string().min(1),
  rank: z.number().int().min(1).max(47),
});
const valuesSchema = z.object({
  rankingKey: z.string(),
  areaType: z.literal('prefecture'),
  partitions: z.array(
    z.object({
      yearCode: z.string(),
      count: z.number().int(),
      values: z.array(rowSchema),
    })
  ),
});
const itemSchema = z.object({
  item: z.object({
    rankingKey: z.string(),
    areaType: z.literal('prefecture'),
    title: z.string().min(1),
    readerLabel: z.string().optional(),
    subtitle: z.string().optional(),
    unit: z.string().min(1),
    latestYear: z.object({ yearCode: z.string() }),
    valueDisplay: z.object({ conversionFactor: z.number() }),
    sourceConfig: z.object({
      recipe: z.object({ configHash: z.string() }),
      source: z.object({ name: z.string().min(1), url: z.string().url() }),
    }),
  }),
});
export type RankingRow = z.infer<typeof rowSchema>;
export type ReadJson = (key: string) => Promise<unknown>;
export interface CardRequest {
  kind: DataCard['kind'];
  area?: string;
  year?: string;
  key?: string;
  from?: string;
  to?: string;
  areas?: string[];
}
export function normalizeArea(value = ''): string {
  if (!/^(?:\d{1,2}|\d{2}000)$/.test(value))
    throw new Error('県コードは 1〜47 または5桁で指定してください');
  const number = Number(value.length === 5 ? value.slice(0, 2) : value);
  if (number < 1 || number > 47) throw new Error('県コードは 1〜47 です');
  return `${String(number).padStart(2, '0')}000`;
}
export async function loadMetric(key: string, read: ReadJson) {
  const config = getMetricConfig(key);
  if (!config || !config.isActive)
    throw new Error(`公開指標ではありません: ${key}`);
  const [rawItem, rawValues] = await Promise.all([
    read(`app/ranking/${key}/item.json`),
    read(`app/ranking/${key}/values.json`),
  ]);
  const { item } = itemSchema.parse(rawItem);
  const values = valuesSchema.parse(rawValues);
  if (
    item.rankingKey !== key ||
    values.rankingKey !== key ||
    item.unit !== config.unit ||
    item.sourceConfig.recipe.configHash !== buildRecipe(config).configHash ||
    item.valueDisplay.conversionFactor !== 1
  ) {
    throw new Error(
      `git定義とR2のキー・単位・recipe不一致、または表示換算が必要: ${key}`
    );
  }
  return { config, item, values };
}
type Metric = Awaited<ReturnType<typeof loadMetric>>;
export function getRows(metric: Metric, year: string): RankingRow[] {
  const matching = metric.values.partitions.filter((p) => p.yearCode === year);
  const part = matching[0];
  if (
    matching.length !== 1 ||
    !part ||
    part.count !== 47 ||
    part.values.length !== 47 ||
    new Set(part.values.map((row) => row.areaCode)).size !== 47
  )
    throw new Error(
      `47地域の完全な単一年データが必要: ${metric.config.key}/${year}`
    );
  for (const row of part.values) {
    normalizeArea(row.areaCode);
    if (row.yearCode !== year || row.unit !== metric.item.unit)
      throw new Error(`年・単位の混在: ${metric.config.key}/${year}`);
  }
  if (new Set(part.values.map((row) => row.yearName)).size !== 1)
    throw new Error('対象期間の表示が混在しています');
  return part.values;
}
function findArea(rows: RankingRow[], area: string): RankingRow {
  const row = rows.find((r) => r.areaCode === area);
  if (!row) throw new Error(`地域欠測: ${area}`);
  return row;
}
export function rankDirection(rows: RankingRow[]): 'ascending' | 'descending' {
  for (const direction of ['descending', 'ascending'] as const) {
    if (
      rows.every(
        (r) =>
          r.rank ===
          1 +
            rows.filter((other) =>
              direction === 'descending'
                ? other.value > r.value
                : other.value < r.value
            ).length
      )
    )
      return direction;
  }
  throw new Error('公表順位が値・同順位の規則と整合しません');
}
function sources(metrics: Metric[]) {
  const resolved = metrics.map((m) => {
    const supplemental = m.config.supplementalSources?.find((s) =>
      s.years.includes(Number(m.item.latestYear.yearCode))
    );
    if (!supplemental) return m.item.sourceConfig.source;
    if (!supplemental.source.displayName || !supplemental.source.url)
      throw new Error('補完年の出典が欠落しています');
    return {
      name: supplemental.source.displayName,
      url: supplemental.source.url,
    };
  });
  return [...new Map(resolved.map((source) => [source.url, source])).values()];
}
function cell(metric: Metric, row: RankingRow, label: string) {
  return {
    key: metric.config.key,
    label,
    value: row.value,
    unit: row.unit,
    year: row.yearName,
  };
}
export async function buildDataCard(
  request: CardRequest,
  read: ReadJson,
  shape: (area: string) => Promise<{ path: string; note: string }>
): Promise<DataCard> {
  if (request.kind === 'tile-change') {
    const contracts: Record<string, { label: string; scope: string; note: string }> = {
      'total-population': { label: '人口', scope: '全47都道府県・総人口（各年10月1日）', note: '両年の国勢調査人口を比較。2025年は2026年9月29日公表の確定値。' },
      households: { label: '世帯数', scope: '全47都道府県・総世帯数（各年10月1日）', note: '一般世帯と施設等の世帯を含む総世帯数。世帯の人数の変化ではありません。' },
      births: { label: '出生数', scope: '日本における日本人・全47都道府県の年間出生数', note: '人口動態統計の出生数を比較。出生率や合計特殊出生率ではありません。' },
    };
    const contract = contracts[request.key ?? ''];
    if (!request.key || !contract || !request.from || !request.to ||
        !/^\d{4}$/.test(request.from) || !/^\d{4}$/.test(request.to) ||
        Number(request.from) >= Number(request.to))
      throw new Error('タイル変化図は比較契約のある指標と前後の4桁年 --key / --from / --to が必要です');
    if (request.key === 'total-population' &&
        (Number(request.from) % 5 !== 0 || Number(request.to) % 5 !== 0 || request.to !== '2025'))
      throw new Error('人口の長期比較は国勢調査年同士・終年2025年に対応しています');
    const metric = await loadMetric(request.key, read);
    const before = getRows(metric, request.from);
    const after = getRows(metric, request.to);
    const rows = before.map((a) => {
      const b = findArea(after, a.areaCode);
      if (a.value <= 0 || b.value < 0 || a.areaName !== b.areaName)
        throw new Error('増減率の分母・値・地域の対応が不正です');
      return { code: a.areaCode, name: a.areaName, before: a.value, after: b.value,
        change: (b.value / a.value - 1) * 100 };
    }).sort((a, b) => a.code.localeCompare(b.code));
    const urls = [metric.item.sourceConfig.source, ...[request.from, request.to].flatMap((year) =>
      metric.config.supplementalSources?.filter((s) => s.years.includes(Number(year))).map((s) => ({
        name: s.source.displayName || '国勢調査', url: s.source.url || '',
      })) ?? [])];
    const increased = rows.filter((r) => r.after > r.before).length;
    const decreased = rows.filter((r) => r.after < r.before).length;
    const unchanged = rows.length - increased - decreased;
    return dataCardSchema.parse({
      kind: request.kind, key: `${request.key}-${request.from}-${request.to}`,
      title: `${Number(request.to) - Number(request.from)}年で、${contract.label}は\nどう変わった？`,
      scope: contract.scope, unit: metric.item.unit,
      beforeYear: request.from, afterYear: request.to, rows,
      summary: `増加 ${increased}県 ／ 減少 ${decreased}県${unchanged ? ` ／ 同数 ${unchanged}県` : ''}`,
      canonicalPath: `/ranking/${request.key}`, metricKeys: [request.key],
      sources: [...new Map(urls.map((s) => [s.url, s])).values()],
      notes: [contract.note, '増減率＝（終年の値÷始年の値−1）×100。丸める前の値で計算。',
        'タイルの大きさは同一。面積や人口規模を表しません。各年の都道府県集計値を比較。'],
    });
  }
  if (request.kind === 'household-receipt') {
    const area = normalizeArea(request.area);
    const keys = [
      ...RECEIPT_PARTS.map(([part]) => `household-survey-${part}-expenditure`),
      'household-survey-consumption-expenditure',
    ];
    const metrics = await Promise.all(keys.map((key) => loadMetric(key, read)));
    const year = request.year ?? metrics[10].item.latestYear.yearCode;
    // Extend the period contract only after checking the source definition for another survey year.
    if (year !== '2024')
      throw new Error(
        '家計レシートは対象期間を確認済みの2024年に対応しています'
      );
    const rows = metrics.map((metric) => findArea(getRows(metric, year), area));
    if (
      rows.some(
        (r) =>
          r.unit !== '円' ||
          r.value < 0 ||
          !Number.isInteger(r.value) ||
          r.areaName !== rows[0].areaName
      )
    )
      throw new Error('家計費目の単位・地域・金額が不正です');
    const total = rows[10].value;
    const difference =
      rows.slice(0, 10).reduce((sum, r) => sum + r.value, 0) - total;
    if (Math.abs(difference) > 10)
      throw new Error(
        `内訳と公表総額の差が丸めの範囲を超えます: ${difference}円`
      );
    return dataCardSchema.parse({
      kind: request.kind,
      key: `${area}-${year}`,
      areaName: rows[0].areaName,
      title: `${rows[0].areaName}の家計を\nレシートにすると。`,
      scope: '県全域・二人以上の世帯・1世帯当たり',
      period: `${year}年10〜11月の月平均`,
      canonicalPath: `/areas/${area}`,
      sources: sources(metrics),
      metricKeys: keys,
      rows: metrics
        .slice(0, 10)
        .map((m, i) => cell(m, rows[i], RECEIPT_PARTS[i][1])),
      total,
      difference,
      notes: [
        difference === 0
          ? '公表総額と10費目の合計は一致。'
          : `公表総額を表示（10費目の合計との差：${difference > 0 ? '+' : ''}${difference.toLocaleString('ja-JP')}円）。`,
        '税・社会保険料等を含まない消費支出です。',
      ],
    });
  }
  if (request.kind === 'area-atlas') {
    const area = normalizeArea(request.area);
    const metrics = await Promise.all(
      ATLAS_METRICS.map(([key]) => loadMetric(key, read))
    );
    const rows = metrics.map((m) =>
      findArea(getRows(m, m.item.latestYear.yearCode), area)
    );
    if (rows.some((row) => row.areaName !== rows[0].areaName))
      throw new Error('図鑑の地域名が混在しています');
    const silhouette = await shape(area);
    return dataCardSchema.parse({
      kind: request.kind,
      key: area,
      areaCode: area,
      areaName: rows[0].areaName,
      title: `${rows[0].areaName}を、\n4つの数字で読む。`,
      scope: '県全域・項目ごとに対象年が異なります',
      canonicalPath: `/areas/${area}`,
      sources: sources(metrics),
      metricKeys: metrics.map((m) => m.config.key),
      shape: silhouette.path,
      shapeNote: silhouette.note,
      rows: metrics.map((m, i) => cell(m, rows[i], ATLAS_METRICS[i][1])),
      notes: [
        '各指標の対象年・単位を併記しています。',
        '人口・面積・世帯数・森林面積割合を掲載。',
        `地図：${silhouette.note}。数値は県全域。`,
      ],
    });
  }
  if (
    !request.key ||
    !request.from ||
    !request.to ||
    !/^\d{4}$/.test(request.from) ||
    !/^\d{4}$/.test(request.to) ||
    Number(request.from) >= Number(request.to)
  )
    throw new Error(
      '順位図には --key と前後の異なる4桁年 --from / --to が必要です'
    );
  const metric = await loadMetric(request.key, read);
  // A single kakei series fixes household type, annual period, unit, and capital-city remap.
  if (
    metric.config.source.kind !== 'kakei-chousa' ||
    metric.config.source.filter?.statsDataId !== '0003348239' ||
    metric.config.source.filter?.cdCat02 !== '03' ||
    !request.key.endsWith('-consumption-expenditure') ||
    metric.item.unit !== '円' ||
    metric.config.supplementalSources?.length
  )
    throw new Error('順位図は家計調査の品目別年間支出額に対応しています');
  const before = getRows(metric, request.from),
    after = getRows(metric, request.to);
  const direction = rankDirection(before);
  if (direction !== rankDirection(after))
    throw new Error('2時点の順位方向が異なります');
  const codes =
    request.areas?.map(normalizeArea) ??
    [
      ...new Set([
        ...before.filter((r) => r.rank === 1).map((r) => r.areaCode),
        ...after
          .toSorted(
            (a, b) => a.rank - b.rank || a.areaCode.localeCompare(b.areaCode)
          )
          .map((r) => r.areaCode),
      ]),
    ].slice(0, 4);
  if (
    codes.length < 2 ||
    codes.length > 4 ||
    new Set(codes).size !== codes.length
  )
    throw new Error('抜粋地域は重複なしの2〜4地域にしてください');
  const routes = codes.map((code) => {
    const a = findArea(before, code),
      b = findArea(after, code);
    if (a.areaName !== b.areaName)
      throw new Error('2時点の地域定義が異なります');
    const name =
      code === '13000'
        ? '東京都区部'
        : PREF_CAPITAL_COORDS[code.slice(0, 2)].name;
    return {
      code,
      name,
      before: { rank: a.rank, value: a.value },
      after: { rank: b.rank, value: b.value },
    };
  });
  return dataCardSchema.parse({
    kind: request.kind,
    key: `${request.key}-${request.from}-${request.to}-${codes.map((c) => c.slice(0, 2)).join('-')}`,
    title: `${metric.item.readerLabel ?? metric.item.title}\n${request.from}年から${request.to}年へ。`,
    scope: '二人以上の世帯・1世帯当たり年間支出額',
    unit: metric.item.unit,
    beforeYear: before[0].yearName,
    afterYear: after[0].yearName,
    population: 47,
    direction,
    routes,
    canonicalPath: `/ranking/${request.key}`,
    sources: sources([metric]),
    metricKeys: [request.key],
    notes: [
      '47地域＝県庁所在市＋東京都区部。県全域の値ではありません。',
      '名目支出額の比較です。購入量の増減とは異なります。',
    ],
  });
}
