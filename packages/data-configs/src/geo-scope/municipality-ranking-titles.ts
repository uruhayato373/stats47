import { METRICS_REGISTRY } from '../registry';

import { KNOWN_MUNICIPALITY_RANKING_KEYS } from './municipality-catalog';

/**
 * 公開中の市区町村ランキングのうち、title が他と重なるものの限定子 (subtitle)。
 *
 * 重ならない title には「総数」のような限定子を付けない (付けると読みにくいだけ)。重なるのに限定子が無い・
 * 注記 (※) しか無いときは throw する (同じ <title> のページを 2 つ作らないため)。
 * 市区町村ランキングの生成 (item.json の subtitle) とコンテンツ索引の表示名がこの 1 つの関数を使う。
 */
export function buildMunicipalityRankingSubtitles(
  keys: ReadonlySet<string> = KNOWN_MUNICIPALITY_RANKING_KEYS,
  metrics: Readonly<Record<string, { title: string; subtitle?: string }>> = METRICS_REGISTRY
): Map<string, string> {
  const titleCount = new Map<string, number>();
  for (const key of keys) {
    const title = metrics[key]?.title;
    if (title) titleCount.set(title, (titleCount.get(title) ?? 0) + 1);
  }
  const result = new Map<string, string>();
  for (const key of keys) {
    const metric = metrics[key];
    if (!metric || (titleCount.get(metric.title) ?? 0) <= 1) continue;
    const subtitle = metric.subtitle?.trim();
    if (!subtitle || subtitle.startsWith('※')) {
      throw new Error(`title collision without distinguishing subtitle: ${key} (${metric.title})`);
    }
    result.set(key, subtitle);
  }
  return result;
}
