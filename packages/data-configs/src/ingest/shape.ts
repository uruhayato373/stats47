import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractYearCode } from "@stats47/estat-api/api";
// Compatibility: malformed time prefixes retain the previous slice result.
import { isPrefectureAreaCode, to2DigitPrefCode } from "@stats47/area";
import { datasetPath } from "../../../../config/datasets.mjs";
import type { SourceEvidence } from "../../scripts/lib/estat-table-reader.js";
import { conversionFactor } from "../unit/unit-semantics.js";
import { buildRecipe, type MetricRecipe } from "../recipe.js";
import { applyValueScale } from "../money-unit.js";
import { mergeSupplementalValues } from "../supplemental-values.js";
import { applyValueCorrections } from "../value-corrections";
import { applySampleCounts, sampleCountKey } from "../sample-count";
import type { MetricConfig, SampleCountSpec, SourceConfig } from "../types.js";
import { REPO_ROOT } from "./batch-context.js";
import { fetchEstatData, parseEstatValue, type EstatFetchResult, type EstatValue } from "./estat-fetch.js";
import { isIngestableCityCode } from "./city-source.js";

// ---- area マスタ (areaName 付与用) -------------------------------------
interface AreaMasters {
  pref: Map<string, string>; // prefCode(5桁) → prefName
  city: Map<string, string>; // cityCode(5桁) → cityName
}
let _masters: AreaMasters | null = null;
function loadAreaMasters(): AreaMasters {
  if (_masters) return _masters;
  const prefRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, datasetPath("areas.prefectures")), "utf8"),
  ) as Array<{ prefCode: string; prefName: string }>;
  const cityRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, datasetPath("areas.cities")), "utf8"),
  ) as Array<{ cityCode: string; cityName: string }>;
  _masters = {
    pref: new Map(prefRaw.map((p) => [p.prefCode, p.prefName])),
    city: new Map(cityRaw.map((c) => [c.cityCode, c.cityName])),
  };
  return _masters;
}

/** config.yearFormat に応じた yearName ("YYYY年度" / "YYYY年") */
function yearNameOf(yearCode: string, config: MetricConfig): string {
  return config.yearFormat === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
}

/**
 * config.years の範囲内か判定 (e-Stat 規約: cdTimeFrom/To を使わずメモリ内でフィルタ)。
 * years 未指定なら全年通す。
 */
function inYearRange(yearCode: string, config: MetricConfig): boolean {
  const y = Number(yearCode);
  if (!Number.isFinite(y)) return false;
  const spec = config.years;
  if (spec === "all" || spec == null) return true;
  // config.years が稀にフルタイムコード (例 2009100000) を含むため 4 桁年に正規化して比較
  if ("years" in spec) return spec.years.map((n) => (n > 9999 ? Number(/^\d{4}/.test(String(n)) ? extractYearCode(String(n)) : String(n).slice(0, 4)) : n)).includes(y);
  // { from, to }
  return y >= (spec.from > 9999 ? Number(/^\d{4}/.test(String(spec.from)) ? extractYearCode(String(spec.from)) : String(spec.from).slice(0, 4)) : spec.from) && y <= (spec.to > 9999 ? Number(/^\d{4}/.test(String(spec.to)) ? extractYearCode(String(spec.to)) : String(spec.to).slice(0, 4)) : spec.to);
}

export interface ShapedRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit: string;
  rank: number | null;
  prefectureCode?: string;
  /** 推計の人数 (`source.sampleCount` を宣言した指標だけ) */
  sampleCount?: number | null;
  /** 推計の人数が下限未満で順位から外した行 (ページでは参考値として示す) */
  reference?: boolean;
}

/** 年ごとに value 降順で rank を付与 (1=最大値)。null は rank null。同値は同順位 (競争順位)。 */
function assignRanks(rows: ShapedRow[]): void {
  const byYear = new Map<string, ShapedRow[]>();
  for (const r of rows) {
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, []);
    byYear.get(r.yearCode)!.push(r);
  }
  for (const group of byYear.values()) {
    const ranked = group
      // 推計の人数が少ない県・年 (参考値) は順位を持たせない (DATA-WAGE-TEACHER-COVERAGE-01)
      .filter((r) => r.value != null && !r.reference)
      .sort((a, b) => (b.value as number) - (a.value as number));
    let prevValue: number | null = null;
    let prevRank = 0;
    ranked.forEach((r, i) => {
      if (prevValue !== null && r.value === prevValue) {
        r.rank = prevRank; // 同値は同順位
      } else {
        r.rank = i + 1;
        prevRank = i + 1;
        prevValue = r.value;
      }
    });
  }
}

/**
 * 書き出す payload の meta。
 *
 * ★`recipe` を **必須**にしている。値を書く経路で焼き忘れると型エラーになり、
 * 「値はあるがどう作ったか分からない」状態を構造的に作れなくする。
 * (`StatsValuesPayload` 側は旧 payload を読めるよう optional。書き手だけが必須)
 */
interface WrittenStatsMeta {
  rowCount: number;
  yearRange: [string, string] | null;
  areaCount: number;
  generatedAt: string;
  recipe: MetricRecipe;
  source?: SourceEvidence & { inputs?: SourceEvidence[] };
  sampleCount?: { kind: "estimated-workers"; unit: "人"; referenceBelow: number; cdTab: string };
}

/** meta を組み立てる共通処理 */
function buildMeta(config: MetricConfig, rows: ShapedRow[], actualSource?: Extract<SourceConfig, { kind: "estat" }>): WrittenStatsMeta {
  const years = Array.from(new Set(rows.map((r) => r.yearCode))).sort();
  const areas = new Set(rows.map((r) => r.areaCode));
  const canonical = buildRecipe(config);
  return {
    rowCount: rows.length,
    yearRange: (years.length > 0 ? [years[0], years[years.length - 1]] : null) as
      | [string, string]
      | null,
    areaCount: areas.size,
    generatedAt: new Date().toISOString(),
    // 取得座標は実際の市区町村表、drift監査のconfigHashは元の正準configとの比較を維持する。
    recipe: actualSource ? { ...buildRecipe({ ...config, source: actualSource }), configHash: canonical.configHash } : canonical,
  };
}

/**
 * config が宣言している単位換算倍率 (金額族専用・`10^k`)。
 * 未宣言 / estat 以外は 1 = 換算しない。判定は `audit-money-unit-scale.ts` が全数監査する。
 */
function valueScaleOf(config: MetricConfig): number | undefined {
  return config.source.kind === "estat" ? config.source.valueScale : undefined;
}

/**
 * 推計の人数の表章項目を取り、(地域, 年) → 表の単位の人数にする (`source.sampleCount`)。
 * 年代違いのコードを並べた cdTab が同じ年に 2 つ値を返したら、定義が重なっているので止める (tabCombination と同じ)。
 */
export async function fetchSampleCounts(
  appId: string,
  src: Extract<SourceConfig, { kind: "estat" }>,
  spec: SampleCountSpec | undefined = src.sampleCount,
) {
  if (!spec) return null;
  const part = await fetchEstatData(appId, { ...src, cdTab: spec.cdTab, tabCombination: undefined, sampleCount: undefined });
  const counts = new Map<string, number | null>();
  for (const v of part.values) {
    const key = sampleCountKey(v["@area"], v["@time"]);
    if (counts.has(key)) {
      throw new Error(`sampleCount の cdTab "${spec.cdTab}" が ${key} に複数の値を返した (年代違いのコードが同じ年に重なっている)`);
    }
    const factor = conversionFactor(v["@unit"], "人");
    if (factor === null || factor !== spec.factor) throw new Error(`sampleCount unit/factor mismatch: ${v["@unit"]}/${spec.factor}`);
    const raw = parseEstatValue(v.$);
    if (raw !== null && raw < 0) throw new Error(`Negative estimated-worker count: ${key}`);
    // Keep source units here: applySampleCounts performs the declared conversion exactly once.
    counts.set(key, raw);
  }
  return Object.assign(counts, { sources: part.sources });
}

/** 取得 raw values → StatsValues 構造 (prefecture)。areaName/unit/yearName/rank を付与し本番投入可能形に。 */
export function shapeForPrefecture(
  config: MetricConfig,
  values: EstatValue[],
  sample?: { counts: ReadonlyMap<string, number | null>; spec: SampleCountSpec },
  source?: WrittenStatsMeta["source"],
) {
  const masters = loadAreaMasters();
  const scale = valueScaleOf(config);
  const shaped: ShapedRow[] = values
    .filter((v) => isPrefectureAreaCode(v["@area"]) && inYearRange((typeof v["@time"] === "string" && /^\d{4}/.test(v["@time"]) ? extractYearCode(v["@time"]) : v["@time"].slice(0, 4)), config))
    .map((v) => {
      const yearCode = (typeof v["@time"] === "string" && /^\d{4}/.test(v["@time"]) ? extractYearCode(v["@time"]) : v["@time"].slice(0, 4));
      return {
        areaCode: v["@area"],
        areaName: masters.pref.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: applyValueScale(parseEstatValue(v.$), scale),
        unit: config.unit,
        rank: null as number | null,
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  const rows = sample ? applySampleCounts(shaped, sample.counts, sample.spec) : shaped;
  assignRanks(rows);
  const meta = buildMeta(config, rows);
  if (source) meta.source = source;
  if (sample) {
    meta.sampleCount = { kind: "estimated-workers", unit: "人", referenceBelow: sample.spec.minimum, cdTab: sample.spec.cdTab };
  }
  return { metricKey: config.key, entityKind: "prefecture" as const, rows, meta };
}

/** 取得 raw values → StatsValues 構造 (city)。areaName(市区町村マスタ join)/unit/yearName/rank を付与。 */
export function shapeForCity(config: MetricConfig, values: EstatValue[], actualSource: Extract<SourceConfig, { kind: "estat" }>) {
  const masters = loadAreaMasters();
  const scale = actualSource.valueScale;
  const rawRows: ShapedRow[] = values
    .filter((v) => isIngestableCityCode(v["@area"], masters.city) && inYearRange((typeof v["@time"] === "string" && /^\d{4}/.test(v["@time"]) ? extractYearCode(v["@time"]) : v["@time"].slice(0, 4)), config))
    .map((v) => {
      const yearCode = (typeof v["@time"] === "string" && /^\d{4}/.test(v["@time"]) ? extractYearCode(v["@time"]) : v["@time"].slice(0, 4));
      return {
        areaCode: v["@area"],
        areaName: masters.city.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: applyValueScale(parseEstatValue(v.$), scale),
        unit: config.unit,
        rank: null as number | null,
        prefectureCode: to2DigitPrefCode(v["@area"]),
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  const rows = applyValueCorrections(config.key, rawRows, config.cityValueCorrections ?? []);
  assignRanks(rows);
  return { metricKey: config.key, entityKind: "city" as const, rows, meta: buildMeta(config, rows, actualSource) };
}

/**
 * `supplementalSources` の年を別表から取り、主出典の取得結果へ合流させる。
 * 県と市で同じ補完表を使うので、1 回の processOne の中では取得を共有する。
 */
export async function applySupplements(
  appId: string,
  config: MetricConfig,
  fetched: EstatFetchResult,
  cache: Map<string, Promise<EstatFetchResult>>,
  notes: string[],
  entity: "prefecture" | "city",
): Promise<EstatFetchResult> {
  const supplements = config.supplementalSources ?? [];
  if (supplements.length === 0) return fetched;

  const batches = await Promise.all(
    supplements.map(async (s) => {
      const outOfRange = s.years.filter((y) => !inYearRange(String(y), config));
      if (outOfRange.length > 0) {
        throw new Error(
          `${config.key}: supplementalSources の年 ${outOfRange.join(",")} が years に含まれていない`,
        );
      }
      const cacheKey = JSON.stringify(s.source);
      if (!cache.has(cacheKey)) cache.set(cacheKey, fetchEstatData(appId, { ...s.source }));
      const result = await cache.get(cacheKey)!;
      return { years: s.years, values: result.values, raw: result.raw, sources: result.sources };
    }),
  );

  const merged = mergeSupplementalValues(fetched.values, batches);
  notes.push(`${entity}-supplement=${merged.suppliedYears.join("|") || "none"}`);
  if (merged.overlapYears.length > 0) {
    console.warn(
      `  [supplement-overlap] ${config.key} ${entity}: 主出典も ${merged.overlapYears.join(",")} 年を持つ。` +
        `値を確かめて supplementalSources から外す`,
    );
  }
  return {
    values: merged.values,
    sources: [...fetched.sources, ...batches.flatMap((b) => b.sources)],
    raw: batches.reduce(
      (acc, b) => ({
        totalNumber: acc.totalNumber + b.raw.totalNumber,
        toNumber: acc.toNumber + b.raw.toNumber,
      }),
      fetched.raw,
    ),
  };
}

