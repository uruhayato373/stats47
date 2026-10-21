import { getMetricConfig } from "../registry";
import {
  parseStatSeriesRefsWith,
  parseThemeDbChartComponentPropsWith,
  validateChartPropsWith,
  type MetricKeyCheck,
  type StatSeriesRef,
  type ThemeDbChartComponentProps,
} from "./stat-series-ref";

/**
 * 全指標の registry で metricKey の登録を確かめる版。カタログ検査とサーバー側の処理が使う。
 * ブラウザ向けの部品は `./stat-series-ref` の `*With` を使い、この module を読まない
 * (`@stats47/data-configs/theme-catalog` の入口からも出さない)。
 */
export const isRegisteredMetricKey: MetricKeyCheck = (metricKey) => getMetricConfig(metricKey) !== undefined;

export function parseStatSeriesRefs(v: unknown): StatSeriesRef[] | null {
  return parseStatSeriesRefsWith(v, isRegisteredMetricKey);
}

/**
 * componentType ごとに componentProps の必須フィールドを検証する (errors[] を返す)。
 * seriesRefs の metricKey は registry に登録済みであることを要求する。
 */
export function validateChartProps(componentType: string, props: Record<string, unknown>): string[] {
  return validateChartPropsWith(componentType, props, isRegisteredMetricKey);
}

/** catalog validator と runtime が同じ schema を使う唯一の parser。 */
export function parseThemeDbChartComponentProps(
  componentType: string,
  props: Record<string, unknown>,
): ThemeDbChartComponentProps | null {
  return parseThemeDbChartComponentPropsWith(componentType, props, isRegisteredMetricKey);
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

  // 非公開の theme-only metric はデータ取得SSOTであり、/ranking へのナビゲーション対象ではない。
  // 1件でも含む複合chartは relatedRankingKeys と1:1にせず、公開済みの代表指標へ案内する。
  // 「表示不要のmetricを無理にランキング化しない」という ThemeCatalog 契約を優先する。
  if (refs.some((ref) => getMetricConfig(ref.metricKey)?.isActive === false)) return [];

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
