import data from '../../../../data/municipalities/catalog/prefecture-ranking.json';

/**
 * 「県名×市区町村ランキング」(`/municipalities/ranking/<key>/<prefCode>`) を作る指標 (MUNI-PREF-RANKING-ROUTE-01)。
 * 選定の記録と理由は台帳 `municipalities.prefecture-ranking` (data/municipalities/catalog/prefecture-ranking.json + Schema)。
 * 全指標 × 47 県にすると薄いページの量産になるので、台帳に載せた指標だけを作る。
 */
export const MUNICIPALITY_PREFECTURE_RANKING_KEYS: ReadonlySet<string> = new Set(data.keys);

/** 県内でこの数に満たない自治体しか値が無いときはページを作らない (比べる相手が少なすぎる)。指標を足すときは全 47 県で下回らないことを確かめる。 */
export const MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING = 10;

export function isMunicipalityPrefectureRankingKey(rankingKey: string): boolean {
  return MUNICIPALITY_PREFECTURE_RANKING_KEYS.has(rankingKey);
}
