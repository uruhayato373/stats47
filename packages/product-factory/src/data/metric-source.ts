/**
 * metric config (指標定義) から SOURCES.csv の 1 行を導く。出典は指標定義の取得元が唯一の真実で、
 * 手で書いた固定文言を使わない。
 *
 * - 取得元は `supplementalSources` (年を指定した補完出典) を優先する。総人口 2025 のように、
 *   主出典 (社会・人口統計体系) に未反映の年を国勢調査の原数値表から取っている指標は、
 *   その年の statsDataId・調査名を書く。
 * - 出典の種類 (origin) を持たせる。e-Stat の統計表 (estat / kakei-chousa) 以外 (全日遊連・水産庁・
 *   消防庁・中体連・国土数値情報など) は、注意事項に「e-Stat の数値・表を基に」と書かず、実際の提供元を書く。
 * - 算出指標 (calculated) は固有の出典を持たないので、親指標 (numerator / denominator) の出典で書く。
 */
import type { SourceOrigin, SourceRow } from "./sources";

type Cfg = Record<string, unknown>;
export type MetricRegistry = Record<string, Cfg>;

const FALLBACK_URL = "https://www.stat.go.jp/data/ssds/index.htm";
const ESTAT_STATS_DATA_ID = /^\d{10}$/;
const MAX_CALCULATION_DEPTH = 4;

const asRecord = (v: unknown): Cfg => (v && typeof v === "object" ? (v as Cfg) : {});
const asString = (v: unknown): string => (typeof v === "string" ? v : "");

interface ResolvedSource {
  /** SOURCES.csv の「調査名」。 */
  readonly surveyName: string;
  /** 注意事項に書く具体的な出典名 (例「全日本遊技事業協同組合連合会「全国遊技場店舗数…」2025年報告」)。 */
  readonly citation: string;
  readonly statsDataId: string;
  readonly url: string;
  readonly origin: SourceOrigin;
}

/** 指定した年を補完出典が担当していれば、その取得元。無ければ主出典。 */
function effectiveSource(cfg: Cfg, year: string): Cfg {
  const supplements = Array.isArray(cfg.supplementalSources) ? cfg.supplementalSources : [];
  for (const entry of supplements) {
    const e = asRecord(entry);
    const years = Array.isArray(e.years) ? e.years.map(Number) : [];
    if (years.includes(Number(year))) return asRecord(e.source);
  }
  return asRecord(cfg.source);
}

function uniq(values: readonly string[]): string[] {
  return [...new Set(values.filter((v) => v !== ""))];
}

function resolveSource(cfg: Cfg, key: string, year: string, registry: MetricRegistry, depth: number): ResolvedSource {
  const src = effectiveSource(cfg, year);
  const title = asString(cfg.title) || key;
  const kind = asString(src.kind);
  const displayName = asString(src.displayName);
  const config = asRecord(src.config);

  // 算出指標: 親指標の出典で書く
  if (kind === "calculated" || (kind === "external" && asString(src.fetcherKey) === "calculated")) {
    const calc = asRecord(cfg.calculation);
    const parentKeys = uniq([asString(calc.numeratorKey), asString(calc.denominatorKey)]);
    const parents = depth >= MAX_CALCULATION_DEPTH
      ? []
      : parentKeys.filter((k) => registry[k]).map((k) => resolveSource(registry[k], k, year, registry, depth + 1));
    if (parents.length === 0) {
      return { surveyName: title, citation: title, statsDataId: "-", url: FALLBACK_URL, origin: "other" };
    }
    const ids = uniq(parents.map((p) => p.statsDataId).filter((id) => id !== "-"));
    return {
      surveyName: uniq(parents.map((p) => p.surveyName)).join("・"),
      citation: uniq(parents.map((p) => p.citation)).join("・"),
      statsDataId: ids.length > 0 ? ids.join(" / ") : "-",
      url: parents[0].url,
      origin: parents.every((p) => p.origin === "estat") ? "estat" : "other",
    };
  }

  const detail = asRecord(config.source);
  const provenance = asRecord(config.provenance);
  const filter = asRecord(src.filter);
  const statsDataId =
    asString(src.statsDataId) || asString(filter.statsDataId) || asString(config.statsDataId) || "-";
  const surveyName = displayName || asString(detail.name) || title;
  const url = asString(src.url) || asString(detail.url) || asString(provenance.url) || asString(provenance.pdfUrl) || FALLBACK_URL;
  // 非 e-Stat の具体的な出典名 (報告書名・年版まで)。無ければ調査名。
  const citation = asString(detail.name) || surveyName;
  const viaEstat = kind === "estat" || kind === "kakei-chousa" || ESTAT_STATS_DATA_ID.test(statsDataId);
  return { surveyName, citation, statsDataId, url, origin: viaEstat ? "estat" : "other" };
}

/**
 * 指標定義から SOURCES.csv 行を作る。
 * @param tableName 「表名」欄。stats47 が検証した指標ラベル (productIndicatorLabel) を呼び出し側が渡す。
 */
export function buildSourceRow(
  cfg: Cfg,
  key: string,
  year: string,
  unit: string,
  retrievedAt: string,
  tableName: string,
  registry: MetricRegistry,
): SourceRow {
  const resolved = resolveSource(cfg, key, year, registry, 0);
  const note = asString(cfg.note);
  const fixed = `基準年固定（${year}）。`;
  const attribution = resolved.origin === "estat"
    ? "e-Stat の数値・表を基に stats47 作成。公認・推奨を示すものではありません。"
    : `${resolved.citation}（${resolved.url}）の公表値を基に stats47 が加工・作成。公認・推奨を示すものではありません。`;
  return {
    surveyName: resolved.surveyName,
    tableName,
    statsDataId: resolved.statsDataId,
    url: resolved.url,
    year,
    retrievedAt,
    unit,
    transform: `都道府県別・基準年（${year}）を stats47 が R2 (app/ranking/${key}/values.json) から抽出。`,
    notes: note ? `${note} ${fixed}${attribution}` : `${fixed}${attribution}`,
    origin: resolved.origin,
  };
}

/** license 欄でこの印が付いた指標は、再配布・商用利用の許諾が確認できていない。 */
export const LICENSE_UNCONFIRMED_MARK = "[要確認]";

/**
 * 権利状態が要確認 (許諾が確認できない) の指標なら、その license 欄の文を返す。そうでなければ null。
 * 算出指標は親指標のどれかが要確認なら要確認として扱う。有料パックに入れる前の除外判定に使う。
 */
export function unconfirmedLicense(cfg: Cfg, registry: MetricRegistry, depth = 0): string | null {
  const src = asRecord(cfg.source);
  const config = asRecord(src.config);
  const licenses = [
    asString(asRecord(config.source).license),
    asString(config.license),
    asString(asRecord(config.provenance).license),
    asString(src.license),
    asString(cfg.license),
  ];
  const hit = licenses.find((l) => l.includes(LICENSE_UNCONFIRMED_MARK));
  if (hit) return hit;
  if (depth >= MAX_CALCULATION_DEPTH) return null;
  const calc = asRecord(cfg.calculation);
  for (const parentKey of uniq([asString(calc.numeratorKey), asString(calc.denominatorKey)])) {
    const parent = registry[parentKey];
    const found = parent ? unconfirmedLicense(parent, registry, depth + 1) : null;
    if (found) return found;
  }
  return null;
}
