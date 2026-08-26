/**
 * StatSeriesRef — チャートが読む「1 系列 = R2 上の 1 metric」への型付き参照 (WP1)
 *
 * 現状の ThemeCatalog は各 chart の `componentProps` を `Record<string, unknown>` に丸投げし、
 * 生の e-Stat パラメータ (statsDataId/cdCat01) を持つ。WP1 は 2 つを入れる:
 *   (a) 目標参照モデル `StatSeriesRef` — データ変換式を**持たない**。metricKey で R2 の metric を指し、
 *       表示 label と色 role だけを添える。全 9 componentType の系列がこの 1 モデルで表せることを
 *       fixture で確認する (WP6 の R2 参照移行の土台)。
 *   (b) 現行 componentProps の chart 種別ごと discriminated-union 検証 `validateChartProps`。
 *       これまで catalog validator は componentType が union に入るかしか見ておらず、props の
 *       形 (必須フィールド) を検査していなかった。exhaustive switch で未知種別は skip せず error。
 *
 * 規約: `.claude/rules/theme-catalog-standards.md` / backlog `CROSS-PAGE-DATA-SSOT-01` WP1
 */
import { isChartColorRole, type ChartColorRole } from "./chart-color-role";
import { parseFaqMarkdown } from "./faq-markdown";
import type { CatalogComponentType } from "./types";

// ChartColorRole の SSOT は chart-color-role.ts (resolver と parity テストの単一ソース)。
// 再 export はしない (index が chart-color-role から出すので二重 export を避ける)。

/** 地域選択。既定は都道府県、`national` で全国系列。 */
export type AreaSelection = "prefecture" | "national";

/**
 * R2 上の 1 metric を指す型付き系列参照。**変換式・倍率・生 e-Stat コードを持たない。**
 * 単位・スケールは metric 側 (MetricConfig / WrittenStatsMeta) が持つ (WP3)。
 */
export interface StatSeriesRef {
  /** METRICS_REGISTRY のキー = R2 `app/ranking/<metricKey>/values.json` を指す */
  metricKey: string;
  /** 特定年に固定する場合 (4 桁)。省略時は最新 / 全年 */
  year?: string;
  /** 都道府県 or 全国 */
  area?: AreaSelection;
  /** 凡例・タブ表示ラベル */
  label?: string;
  /** 色は意味ロールで解決する (色コードを持たない) */
  colorRole?: ChartColorRole;
}

/**
 * line chart のうち R2 `StatSeriesRef` へ移行済みの component key。
 *
 * 移行済みチャートが生の e-Stat recipe へ戻る回帰を validator で拒否する shrink-only
 * ratchet。CROSS-PAGE-DATA-SSOT-01 WP6 の wave ごとに追加し、最終的には全 line chart を
 * 型付き参照へ移す。
 */
export const MIGRATED_LINE_SERIES_REF_COMPONENT_KEYS: ReadonlySet<string> = new Set([
  "labor-wages-gender-gap",
  "theme-occ-medical-trend",
  "theme-economy-income-wage",
]);

// ---- 現行 componentProps の discriminated-union 検証 ----

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** e-Stat パラメータ 1 件 (全値が string の非空オブジェクト)。 */
function isEstatParams(v: unknown): boolean {
  return (
    isRecord(v) &&
    Object.keys(v).length > 0 &&
    Object.values(v).every((x) => typeof x === "string")
  );
}

function isEstatParamsList(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0 && v.every(isEstatParams);
}

function nonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.length > 0;
}

function isStatSeriesRef(v: unknown): v is StatSeriesRef {
  if (!isRecord(v) || !nonEmptyString(v.metricKey)) return false;
  if (v.year !== undefined && (typeof v.year !== "string" || !/^\d{4}$/.test(v.year))) {
    return false;
  }
  if (v.area !== undefined && v.area !== "prefecture" && v.area !== "national") {
    return false;
  }
  if (v.label !== undefined && !nonEmptyString(v.label)) return false;
  if (v.colorRole !== undefined && !isChartColorRole(v.colorRole)) return false;
  return true;
}

/** runtime / validator が共有する seriesRefs parser。無効・空配列は null。 */
export function parseStatSeriesRefs(v: unknown): StatSeriesRef[] | null {
  if (!Array.isArray(v) || v.length === 0 || !v.every(isStatSeriesRef)) return null;
  return v;
}

/**
 * seriesRefs と relatedRankingKeys / ThemeCatalog.metrics shortLabel の対応を検証する。
 * recipe は metricKey の先で MetricConfig が一元管理し、表示名も同テーマの指標ラベルを再利用する。
 */
export function validateStatSeriesRefAlignment(
  props: Record<string, unknown>,
  relatedRankingKeys: readonly string[],
  metricLabels: ReadonlyMap<string, string>,
): string[] {
  if (props.seriesRefs === undefined) return [];
  const refs = parseStatSeriesRefs(props.seriesRefs);
  if (!refs) return ["seriesRefs は1件以上の有効な StatSeriesRef 配列にする"];

  const errors: string[] = [];
  if (refs.length !== relatedRankingKeys.length) {
    errors.push(
      `seriesRefs (${refs.length}) と relatedRankingKeys (${relatedRankingKeys.length}) の要素数が不一致`,
    );
  }
  for (let index = 0; index < refs.length; index += 1) {
    const ref = refs[index];
    const relatedKey = relatedRankingKeys[index];
    if (ref.metricKey !== relatedKey) {
      errors.push(
        `系列${index + 1}: metricKey "${ref.metricKey}" と relatedRankingKeys "${String(relatedKey)}" が不一致`,
      );
    }
    const expectedLabel = metricLabels.get(ref.metricKey);
    if (ref.label !== undefined && expectedLabel !== undefined && ref.label !== expectedLabel) {
      errors.push(
        `系列${index + 1}: label "${ref.label}" は ThemeCatalog.metrics の shortLabel "${expectedLabel}" と一致させる`,
      );
    }
  }
  return errors;
}

/** 移行済み key が legacy recipe（期限: 2026-09-30、削除条件: 全chartのR2移行完了）へ戻っていないかを検証する。 */
export function validateMigratedSeriesRefContract(
  componentKey: string,
  props: Record<string, unknown>,
): string[] {
  if (!MIGRATED_LINE_SERIES_REF_COMPONENT_KEYS.has(componentKey)) return [];
  return parseStatSeriesRefs(props.seriesRefs)
    ? []
    : ["移行済み line-chart は生の estatParams ではなく seriesRefs を使う"];
}

/** {code,label} を必須とする配列 (composition segments)。 */
function isCodeLabelList(v: unknown, requireColor: boolean): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (item) =>
        isRecord(item) &&
        nonEmptyString(item.code) &&
        nonEmptyString(item.label) &&
        (!requireColor || nonEmptyString(item.color)),
    )
  );
}

/**
 * componentType ごとに componentProps の必須フィールドを検証する (errors[] を返す)。
 * exhaustive switch。未知の componentType は skip せず error にする (依存の取りこぼしを防ぐ)。
 */
export function validateChartProps(
  componentType: string,
  props: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  const need = (cond: boolean, msg: string) => {
    if (!cond) errors.push(msg);
  };

  switch (componentType as CatalogComponentType) {
    case "line-chart":
      {
      const hasEstatParams =
        isEstatParams(props.estatParams) || isEstatParamsList(props.estatParams);
      const hasSeriesRefs = parseStatSeriesRefs(props.seriesRefs) !== null;
      need(
        hasEstatParams || hasSeriesRefs,
        "line-chart: estatParams または seriesRefs (非空配列) が必要",
      );
      need(
        !(hasEstatParams && hasSeriesRefs),
        "line-chart: seriesRefs と estatParams は同時指定できない",
      );
      break;
      }
    case "mixed-chart":
      need(isEstatParamsList(props.columnParams), "mixed-chart: columnParams (非空配列) が必要");
      need(isEstatParamsList(props.lineParams), "mixed-chart: lineParams (非空配列) が必要");
      break;
    case "composition-chart":
      need(nonEmptyString(props.statsDataId), "composition-chart: statsDataId が必要");
      need(isCodeLabelList(props.segments, false), "composition-chart: segments {code,label} が必要");
      break;
    case "donut-chart":
      need(nonEmptyString(props.statsDataId), "donut-chart: statsDataId が必要");
      need(isCodeLabelList(props.categories, true), "donut-chart: categories {code,label,color} が必要");
      break;
    case "cpi-profile":
    case "cpi-heatmap":
      need(nonEmptyString(props.statsDataId), `${componentType}: statsDataId が必要`);
      break;
    case "kpi-card":
      // データは estatParams か rankingLink 由来。estatParams があれば形を検証、無くても可 (ranking 駆動)。
      if (props.estatParams !== undefined) {
        need(
          isEstatParams(props.estatParams) || isEstatParamsList(props.estatParams),
          "kpi-card: estatParams は object か非空配列",
        );
      }
      break;
    case "markdown-section":
      need(nonEmptyString(props.markdown), "markdown-section: markdown (本文) が必要");
      need(
        props.displayMode === undefined ||
          props.displayMode === "prose" ||
          props.displayMode === "faq",
        "markdown-section: displayMode は prose または faq",
      );
      if (props.displayMode === "faq") {
        const parsed = parseFaqMarkdown(props.markdown);
        need(parsed.ok, `markdown-section: ${parsed.ok ? "" : parsed.error}`);
      }
      break;
    case "pyramid-chart":
      // props は空 ({})。rankingLink / dataSource で描画される。必須フィールドなし。
      break;
    default:
      errors.push(`未知の componentType: ${componentType} (依存抽出の対象外になる)`);
  }
  return errors;
}
