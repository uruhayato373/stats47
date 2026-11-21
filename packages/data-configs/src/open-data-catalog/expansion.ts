import type { MetricConfig } from "../types";
import type { OpenDataFetchRecipe } from "./fetch-recipe";
import type { OpenDataNormalizedTable } from "./normalized-table";
import { PREFECTURE_AREA_CODES } from "../../../area/src/constants/prefecture-codes";

type OpenDataExpansionChannel = "prefecture-ranking" | "municipality-ranking" | "theme" | "area" | "gis";
interface OpenDataExpansionSlice {
  readonly version: string;
  readonly areaLevel: "prefecture" | "municipality";
  /** Every dimension is explicit; multiple values are summed only when declared below. */
  readonly dims: Readonly<Record<string, readonly string[]>>;
  readonly time: { readonly kind: "point"; readonly value: string } | { readonly kind: "range"; readonly start: string; readonly end: string };
  readonly dimensionAggregation: "none" | "sum";
  readonly timeAggregation: "none" | "sum" | "max";
  /** Explicit empty groups in a count table; raw-source confirmation belongs in reason. */
  readonly zeroAreaCodes?: readonly string[];
}
interface OpenDataExpansionFields {
  readonly datasetId: string;
  readonly table: string;
  readonly slice: OpenDataExpansionSlice;
  readonly channel: OpenDataExpansionChannel;
  readonly title: string;
  readonly unit: string;
  readonly aggregation: { readonly type: "identity" | "divide" | "per-100k"; readonly scale?: number; readonly denominatorTime?: string };
  readonly denominator?: string;
  readonly duplicateOf?: string;
  readonly target?: string;
  readonly reason: string;
  readonly decidedAt: string;
  readonly decidedBy: string;
  /** Review evidence, not a second copy of the 47 observations. */
  readonly verification?: { readonly tableSha256: string; readonly rowCount: number; readonly areaCount: number; readonly min: number; readonly max: number; readonly denominatorTime?: string; readonly denominatorSha256?: string };
}
/** Planned metric keys are future identifiers, never existing metric references. */
export type OpenDataExpansionCandidate = OpenDataExpansionFields & (
  | { readonly status: "planned"; readonly metricKey: string }
  | { readonly status: "rejected" | "blocked"; readonly metricKey?: string }
);

export interface OpenDataExpansion {
  readonly schemaVersion: 1;
  readonly candidates: readonly OpenDataExpansionCandidate[];
}

function normalizedName(value: string): string {
  return value.normalize("NFKC")
    .replace(/[（(]都道府県別・総数[）)]/g, "")
    .replace(/人口10万人(?:当たり|あたり)|(?:都道府県別[・ ]*)/g, "")
    .replace(/[（(](?:総数|10万人当たり|10万人当たり換算)[）)]/g, "")
    .replace(/[\s（）()]/g, "");
}
function sourcePattern(datasetId: string): RegExp {
  if (datasetId.startsWith("mhlw-medical-")) return /社会・人口統計体系|医療施設|医療情報|薬局|衛生行政/;
  if (datasetId.startsWith("nier-")) return /全国学力|国立教育政策研究所/;
  if (datasetId === "ndb-open-data") return /NDB|特定健診/;
  if (datasetId.startsWith("fdma-")) return /消防庁|救急搬送/;
  if (datasetId.startsWith("npa-")) return /交通事故|警察庁|社会・人口統計体系/;
  if (datasetId.startsWith("mlit-road-")) return /道路交通|道路.*センサス/;
  if (datasetId === "mhlw-covid19-open-data") return /新型コロナ|COVID|covid/;
  return /$a/;
}
function metricScale(metric: MetricConfig): "identity" | "per-100k" | "other" {
  const label = `${metric.title} ${metric.subtitle ?? ""} ${metric.unit}`.normalize("NFKC");
  if (/人口10万人|10万人当たり|10万人あたり|\/10万人/.test(label)) return "per-100k";
  if (/当たり|あたり|\/km|面積/.test(label)) return "other";
  return "identity";
}

/** Deterministic semantic comparison over ALL supplied metrics, not catalog hints or key equality.
 * Names retain school/subject/age distinctions; geography, source family and normalization must agree.
 * SSDS and its ministry source are compared as replacement candidates, never silently equated as observations.
 */
export function findExpansionDuplicates(candidate: OpenDataExpansionCandidate, metrics: readonly MetricConfig[]): readonly MetricConfig[] {
  const entity = candidate.slice.areaLevel === "municipality" ? "city" : "prefecture";
  const facility = candidate.datasetId.startsWith("mhlw-medical-");
  const unit = (s: string) => {
    const raw = s.normalize("NFKC").replace(/\/(?:10万人|人口10万人)$/, "");
    return facility && /^(施設|所)$/.test(raw) ? "施設" : raw;
  };
  return metrics.filter((metric) => metric.entities.includes(entity)
    && normalizedName(metric.title) === normalizedName(candidate.title)
    && unit(metric.unit) === unit(candidate.unit)
    && metricScale(metric) === (candidate.aggregation.type === "per-100k" ? "per-100k" : "identity")
    && sourcePattern(candidate.datasetId).test(JSON.stringify(metric.source)))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * planned の候補に、公開前 (isActive: false) の指標の定義がすでにあるときのキー。
 * 定義の provenance.openData が候補 1 件とちょうど一致するときだけ、衝突の検査から外す。
 */
export function stagedExpansionMetricKeys(expansion: OpenDataExpansion, metrics: readonly MetricConfig[]): ReadonlySet<string> {
  return new Set(metrics.filter((metric) => {
    if (metric.isActive !== false || metric.source.kind !== "external") return false;
    const provenance = metric.source.config.provenance as { openData?: { datasetId?: string; version?: string; table?: string; candidate?: { metricKey?: string; channel?: string } } } | undefined;
    const ref = provenance?.openData;
    if (ref?.candidate?.metricKey !== metric.key || ref.candidate.channel !== "prefecture-ranking") return false;
    const matches = expansion.candidates.filter((c) => c.metricKey === metric.key && c.channel === ref.candidate?.channel);
    return matches.length === 1 && matches[0].status === "planned" && matches[0].datasetId === ref.datasetId
      && matches[0].table === ref.table && matches[0].slice.version === ref.version;
  }).map((metric) => metric.key));
}

export function validateOpenDataExpansion(
  expansion: OpenDataExpansion,
  context: {
    readonly recipes: readonly OpenDataFetchRecipe[];
    readonly metrics: readonly MetricConfig[];
    readonly existingMetricKeys: ReadonlySet<string>;
    readonly themeIds: ReadonlySet<string>;
    readonly areaIds: ReadonlySet<string>;
  },
): string[] {
  const errors: string[] = [];
  const identities = new Set<string>();
  const plannedKeys = new Map<string, string>();
  for (const c of expansion.candidates) {
    const owner = `expansion:${c.datasetId}/${c.table}:${c.channel}:${c.title}`;
    const fail = (message: string) => errors.push(`${owner}: ${message}`);
    const recipe = context.recipes.find((r) => r.datasetId === c.datasetId);
    if (!recipe?.normalize?.tables.some((t) => t.table === c.table)) fail("正規化表が recipe.normalize にありません");
    if (c.slice.zeroAreaCodes?.length && (recipe?.normalize?.tables.find((t) => t.table === c.table)?.aggregation !== "count" || c.slice.time.kind !== "point")) fail("明示ゼロは単時点の件数集計表だけに指定できます");
    if (!c.reason.trim()) fail("reason が空です");
    if (!c.decidedBy.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(c.decidedAt) || !Number.isFinite(Date.parse(c.decidedAt)) || new Date(c.decidedAt).toISOString().slice(0, 10) !== c.decidedAt) fail("判断者または判断日が不正です");
    if (c.aggregation.type === "identity" && (c.aggregation.scale !== undefined || c.aggregation.denominatorTime)) fail("そのままの値に倍率や分母時点は指定できません");
    if (c.aggregation.type === "per-100k" && c.aggregation.scale !== undefined) fail("人口10万人当たりの倍率は固定です");
    if (c.slice.time.kind === "range" && c.slice.timeAggregation === "none" && c.status === "planned") fail("日次系列をそのまま planned にできません");
    if (c.channel === "prefecture-ranking" && c.slice.areaLevel !== "prefecture") fail("県ランキングの地域粒度が不正です");
    if (c.channel === "municipality-ranking" && c.slice.areaLevel !== "municipality") fail("市区町村ランキングの地域粒度が不正です");
    if (c.denominator && !context.existingMetricKeys.has(c.denominator)) fail(`未知の denominator ${c.denominator}`);
    if (c.denominator && c.aggregation.type === "identity") fail("そのままの値に denominator は指定できません");
    if (c.duplicateOf && !context.existingMetricKeys.has(c.duplicateOf)) fail(`未知の duplicateOf ${c.duplicateOf}`);
    if (c.verification && c.aggregation.type !== "identity" && (c.verification.denominatorTime !== c.aggregation.denominatorTime || !/^[a-f0-9]{64}$/.test(c.verification.denominatorSha256 ?? ""))) fail("率の検証記録に分母時点とsha256が必要です");
    if (c.channel === "theme" && (!c.target || !context.themeIds.has(c.target))) fail("未知の theme target");
    if (c.channel === "area" && (!c.target || !context.areaIds.has(c.target))) fail("未知の area target");
    // 同じ正規化表から作った公開済みの指標は「実現済み」。テーマ・地域ページの候補はその指標を載せる予定として残せる。
    const realized = c.metricKey ? context.metrics.find((m) => {
      if (m.key !== c.metricKey || m.isActive === false || m.source.kind !== "external") return false;
      const ref = (m.source.config.provenance as { openData?: { datasetId?: string; table?: string } } | undefined)?.openData;
      return ref?.datasetId === c.datasetId && ref.table === c.table;
    }) : undefined;
    if (realized && c.channel === "prefecture-ranking") fail(`公開済みの県ランキングは台帳から外す (指標の定義 ${realized.key} が正本)`);
    const duplicates = findExpansionDuplicates(c, context.metrics).filter((m) => m.key !== realized?.key);
    if (c.duplicateOf && !duplicates.some((m) => m.key === c.duplicateOf)) fail("duplicateOf が名前・単位・出典・地域粒度の機械照合と一致しません");
    if (duplicates.length && !c.duplicateOf) fail(`既存概念との重複を未記録: ${duplicates.map((m) => m.key).join(", ")}`);
    const definition = JSON.stringify([c.datasetId, c.table, c.slice, c.aggregation, c.denominator, c.unit]);
    const identity = JSON.stringify([definition, c.channel, c.target, c.title]);
    if (identities.has(identity)) fail("同じ展開判断が重複しています");
    identities.add(identity);
    if (c.status !== "planned") continue;
    if (!c.metricKey) fail("planned に metricKey が必要です");
    if (c.metricKey && context.existingMetricKeys.has(c.metricKey) && !realized) fail(`planned の metricKey が既存指標と衝突: ${c.metricKey}`);
    if (c.duplicateOf || duplicates.length) fail("既存概念を planned にできません");
    if (c.aggregation.type !== "identity" && (!c.denominator || !c.aggregation.denominatorTime)) fail("分母とその時点が必要です");
    if (c.aggregation.type === "identity" && /^(人|件|施設|所)$/.test(c.unit) && /ranking$/.test(c.channel)) fail("件数そのものをランキングの planned にできません");
    if (c.slice.areaLevel === "prefecture" && (c.verification?.areaCount !== PREFECTURE_AREA_CODES.length || !Number.isFinite(c.verification.min) || !Number.isFinite(c.verification.max))) fail("47県の検証記録が必要です");
    if (c.verification && (c.verification.min > c.verification.max || c.verification.rowCount < c.verification.areaCount)) fail("検証記録の件数または範囲が不正です");
    if (c.metricKey) {
      if (plannedKeys.has(c.metricKey) && plannedKeys.get(c.metricKey) !== definition) fail("同じ予定キーに異なる計算定義があります");
      plannedKeys.set(c.metricKey, definition);
    }
  }
  return errors;
}

/** Published snapshot selection: null is not zero, years and geography never fall back silently. */
export function selectExpansionDenominator(candidate: OpenDataExpansionCandidate, snapshot: {
  readonly metricKey: string;
  readonly entityKind: string;
  readonly rows: readonly { readonly areaCode: string; readonly yearCode: string; readonly value: number | null; readonly unit: string }[];
}): ReadonlyMap<string, number> {
  const entity = candidate.slice.areaLevel === "prefecture" ? "prefecture" : "city";
  if (snapshot.metricKey !== candidate.denominator || snapshot.entityKind !== entity) throw Error("分母の指標/地域粒度が一致しません");
  const numeratorYear = Number((candidate.slice.time.kind === "point" ? candidate.slice.time.value : candidate.slice.time.end).slice(0, 4));
  const years = [...new Set(snapshot.rows.map((r) => r.yearCode))];
  if (!years.length || years.some((y) => !/^\d{4}$/.test(y)) || !Number.isFinite(numeratorYear)) throw Error("分母の年が不正です");
  const nearest = years.sort((a, b) => Math.abs(Number(a) - numeratorYear) - Math.abs(Number(b) - numeratorYear) || Number(a) - Number(b))[0];
  if (candidate.aggregation.denominatorTime !== nearest) throw Error("分母時点が分子に最も近い公開年ではありません");
  const values = new Map<string, number>();
  const seen = new Set<string>();
  for (const row of snapshot.rows.filter((r) => r.yearCode === nearest)) {
    if (seen.has(row.areaCode)) throw Error("分母の地域・年が重複しています");
    seen.add(row.areaCode);
    if (candidate.aggregation.type === "per-100k" && row.unit !== "人") throw Error("人口分母の単位が人ではありません");
    if (row.value !== null && Number.isFinite(row.value) && row.value > 0) values.set(row.areaCode, row.value);
  }
  return values;
}

function dateKey(value: string): string {
  const parts = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);
  if (!parts) throw Error(`日付が不正です: ${value}`);
  const date = `${parts[1]}-${parts[2].padStart(2, "0")}-${parts[3].padStart(2, "0")}`;
  if (new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw Error(`日付が不正です: ${value}`);
  return date;
}

/** Pure, offline reproduction. Only explicitly confirmed empty count groups become zero. */
export function evaluateExpansionCandidate(
  candidate: OpenDataExpansionCandidate,
  table: OpenDataNormalizedTable,
  denominatorValues?: ReadonlyMap<string, number>,
): { rowCount: number; areaCount: number; min: number; max: number } {
  const { slice } = candidate;
  if (table.datasetId !== candidate.datasetId || table.table !== candidate.table || table.version !== slice.version) throw Error("正規化表の帰属/版が一致しません");
  const allDims = new Set(table.rows.flatMap((row) => Object.keys(row.dims)));
  if (allDims.size !== Object.keys(slice.dims).length || [...allDims].some((key) => !slice.dims[key])) throw Error("全 dims の固定値または合計範囲を指定してください");
  for (const [key, values] of Object.entries(slice.dims)) {
    if (!values.length || values.some((value) => !table.rows.some((row) => row.dims[key] === value))) throw Error(`未知の dims: ${key}`);
  }
  const time = slice.time;
  const start = time.kind === "range" ? dateKey(time.start) : undefined;
  const end = time.kind === "range" ? dateKey(time.end) : undefined;
  if (start && end && start > end) throw Error("期間の開始と終了が逆です");
  const rows = table.rows.filter((row) => row.areaLevel === slice.areaLevel
    && Object.entries(slice.dims).every(([key, values]) => values.includes(row.dims[key]))
    && (time.kind === "point" ? row.time === time.value : dateKey(row.time) >= start! && dateKey(row.time) <= end!));
  if (!rows.length) throw Error("選択した行がありません");
  if (new Set(rows.map((r) => r.unit)).size !== 1 || rows.some((r) => !Number.isFinite(r.value))) throw Error("単位混在/非有限値");
  if (candidate.aggregation.type === "identity" && rows[0].unit !== candidate.unit) throw Error("入力と出力の単位が一致しません");
  const seen = new Set<string>();
  const byArea = new Map<string, Map<string, number[]>>();
  for (const row of rows) {
    const rowTime = time.kind === "point" ? row.time : dateKey(row.time);
    const identity = JSON.stringify([row.areaCode, rowTime, Object.keys(slice.dims).sort().map((key) => row.dims[key])]);
    if (seen.has(identity)) throw Error("同じ地域・時点・dims の重複行");
    seen.add(identity);
    const times = byArea.get(row.areaCode) ?? new Map<string, number[]>();
    const values = times.get(rowTime) ?? [];
    values.push(row.value); times.set(rowTime, values); byArea.set(row.areaCode, times);
  }
  for (const area of slice.zeroAreaCodes ?? []) {
    if (time.kind !== "point" || !/^(人|件|施設|所)$/.test(rows[0].unit)
      || table.rows.some((r) => !Number.isInteger(r.value) || r.value < 0)
      || byArea.has(area)
      || !table.rows.some((r) => r.areaLevel === slice.areaLevel && r.time === time.value && r.areaCode === area)) throw Error("明示ゼロの地域に選択行があるか、同時点の件数集計による裏付けがありません");
    byArea.set(area, new Map([[time.value, [0]]]));
  }
  if (slice.areaLevel === "prefecture" && (byArea.size !== PREFECTURE_AREA_CODES.length || PREFECTURE_AREA_CODES.some((code) => !byArea.has(code)))) throw Error("47県が揃っていません");
  const results: number[] = [];
  const expectedDays = start && end ? (Date.parse(end) - Date.parse(start)) / 86400000 + 1 : 1;
  const expectedDims = Object.values(slice.dims).reduce((n, values) => n * values.length, 1);
  for (const [area, times] of byArea) {
    if (times.size !== expectedDays) throw Error("地域ごとの期間に欠測があります");
    const daily = [...times.values()].map((values) => {
      if (slice.dimensionAggregation === "none" && values.length !== 1) throw Error("分類軸が1系列に絞られていません");
      if (/^(％|%|比|km\/h)$/.test(rows[0].unit) && values.length !== expectedDims) throw Error("分類軸に欠測があります");
      return values.reduce((a, b) => a + b, 0);
    });
    if (slice.timeAggregation === "none" && daily.length !== 1) throw Error("時点が1系列に絞られていません");
    let value = slice.timeAggregation === "max" ? Math.max(...daily) : daily.reduce((a, b) => a + b, 0);
    if (candidate.aggregation.type !== "identity") {
      const denominator = denominatorValues?.get(area);
      if (denominator === undefined || !Number.isFinite(denominator) || denominator <= 0) throw Error("有効な分母の観測値がありません");
      value = value / denominator * (candidate.aggregation.type === "per-100k" ? 100000 : candidate.aggregation.scale ?? 1);
    }
    if (!Number.isFinite(value)) throw Error("計算結果が非有限値です");
    results.push(value);
  }
  return { rowCount: rows.length, areaCount: byArea.size, min: Math.min(...results), max: Math.max(...results) };
}
