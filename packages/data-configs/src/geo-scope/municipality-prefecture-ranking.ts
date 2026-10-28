/**
 * 「県名×市区町村ランキング」(`/municipalities/ranking/<key>/<prefCode>`) を作る指標 (MUNI-PREF-RANKING-ROUTE-01)。
 *
 * `?pref=` の絞り込み表示は canonical を全国版へ向けているため検索に出ない。県名を含む検索
 * (「愛知県 製造品出荷額 ランキング」「東京都 小学校 児童数ランキング」など。GSC 2026-W42) に届くよう、
 * 指標を絞って県ごとの独立ページにする。全指標 × 47 県にすると薄いページの量産になるので、
 * ここに載せた指標だけを作る。
 *
 * 選定 (2026-10-28): GSC 2026-W42 で表示のある市区町村ランキング (製造品出荷額 1,687 表示・年間商品販売額・
 * 実質公債費比率・中学校生徒数・出生数)、県名つきの検索語 (財政力指数・小学校児童数)、子育て系
 * (年少人口割合・高齢化率)、所得。どれも全 47 県で県内 15 自治体以上に値がある (R2 values.json で確認)。
 * 将来負担比率 (県内 6 自治体の県がある)・持ち家比率 (8)・農業産出額 (2006 年) は外した。
 *
 * 指標を足すときは、全 47 県で県内の値が MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING 以上あることを確かめる。
 * 下回る県はページが 404 になるのに sitemap には載る。
 */
export const MUNICIPALITY_PREFECTURE_RANKING_KEYS: ReadonlySet<string> = new Set([
  'manufacturing-shipment-amount',
  'annual-sales-amount',
  'fiscal-strength-index',
  'per-taxpayer-income',
  'real-public-debt-service-ratio-city',
  'births',
  'young-population-ratio',
  'elderly-population-ratio',
  'elementary-school-children-count',
  'junior-high-school-students-count',
]);

/** 県内でこの数に満たない自治体しか値が無いときはページを作らない (比べる相手が少なすぎる)。 */
export const MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING = 10;

export function isMunicipalityPrefectureRankingKey(rankingKey: string): boolean {
  return MUNICIPALITY_PREFECTURE_RANKING_KEYS.has(rankingKey);
}
