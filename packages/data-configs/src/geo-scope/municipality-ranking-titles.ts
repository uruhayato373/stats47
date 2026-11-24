import { textDeclaresDenominator } from '../display-semantics';
import { METRICS_REGISTRY } from '../registry';
import { parseUnit } from '../unit';

import { KNOWN_MUNICIPALITY_RANKING_KEYS } from './municipality-catalog';

type TitleMetric = { title: string; subtitle?: string; unit?: string };

/**
 * 分母が subtitle にしか無い指標か。unit を単位の正典 (parseUnit) が分母なしと解釈し、title にも分母の宣言が無く、
 * subtitle が「人口10万人当たり」「1住宅当たり」など分母を宣言しているとき true。
 * このとき subtitle を表示名に付けないと、割った値が件数・総量のように見える (CITY-UNIT-DENOMINATOR-01。
 * 例: 百貨店数 0.9店 = 人口10万人当たり、人口集中地区人口密度 7,993.8人 = 人口集中地区面積1km²当たり)。
 */
export function subtitleCarriesDenominator(metric: TitleMetric): boolean {
  const subtitle = metric.subtitle?.trim();
  if (!subtitle || subtitle.startsWith('※')) return false;
  if (parseUnit(metric.unit).hasDenominator) return false;
  if (textDeclaresDenominator(metric.title)) return false;
  return textDeclaresDenominator(subtitle);
}

/**
 * 公開中の市区町村ランキングのうち、表示名に subtitle を付けるもの (限定子)。付けるのは次の 2 つ。
 *
 * 1. title が他と重なるもの。重なるのに限定子が無い・注記 (※) しか無いときは throw する (同じ <title> のページを 2 つ作らないため)。
 * 2. 分母が subtitle にしか無いもの (`subtitleCarriesDenominator`)。
 *
 * どちらでもない title には「総数」のような限定子を付けない (付けると読みにくいだけ)。
 * 市区町村ランキングの生成 (item.json の subtitle) とコンテンツ索引の表示名がこの 1 つの関数を使う。
 */
export function buildMunicipalityRankingSubtitles(
  keys: ReadonlySet<string> = KNOWN_MUNICIPALITY_RANKING_KEYS,
  metrics: Readonly<Record<string, TitleMetric>> = METRICS_REGISTRY
): Map<string, string> {
  const titleCount = new Map<string, number>();
  for (const key of keys) {
    const title = metrics[key]?.title;
    if (title) titleCount.set(title, (titleCount.get(title) ?? 0) + 1);
  }
  const result = new Map<string, string>();
  for (const key of keys) {
    const metric = metrics[key];
    if (!metric) continue;
    if ((titleCount.get(metric.title) ?? 0) <= 1) {
      if (subtitleCarriesDenominator(metric)) result.set(key, metric.subtitle!.trim());
      continue;
    }
    const subtitle = metric.subtitle?.trim();
    if (!subtitle || subtitle.startsWith('※')) {
      throw new Error(`title collision without distinguishing subtitle: ${key} (${metric.title})`);
    }
    result.set(key, subtitle);
  }
  return result;
}
