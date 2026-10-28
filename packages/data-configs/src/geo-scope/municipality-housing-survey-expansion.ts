/**
 * 社会・人口統計体系 (SSDS) 以外の e-Stat 表から足す市区町村指標: 令和5年住宅・土地統計調査 (2026-10-28)。
 *
 * SSDS の市区町村表は 901 指標中 716 を公開済みで、空き家比率・持ち家比率・延べ面積など住宅の基本項目は
 * SSDS 経由で既にある。ここでは SSDS に無い「最寄り施設までの距離」と空き家の内訳を、住宅・土地統計調査の
 * 市区町村表 (表章地域は市区と人口1万5千人以上の町村) から率にして足す。どれも cat 軸の axisRatio で、
 * 分母は同じ軸の総数コード。
 *
 * 判定 (2026-10-28 e-Stat getStatsData の実測。市区町村の地域 1,235 = 市・特別区・町村 1,037 + 政令市の区 198):
 * | key | 表 | 値のある地域 | 全国 |
 * |---|---|---|---|
 * | nursery-within-500m-young-child-household-ratio | 0004025628 cat01=R1 | 1,178 | 47.4% |
 * | elementary-school-within-1km-household-ratio | 0004025630 | 1,235 | 61.6% |
 * | junior-high-school-within-1km-household-ratio | 0004025631 | 1,210 | 37.2% |
 * | station-within-1km-household-ratio | 0004025593 | 1,127 | 43.6% |
 * | medical-facility-within-500m-household-ratio | 0004025621 | 1,231 | 58.1% |
 * | park-within-500m-household-ratio | 0004025595 | 1,228 | 69.8% |
 * | evacuation-site-within-500m-household-ratio | 0004025597 | 1,235 | 58.9% |
 * | post-office-bank-within-500m-household-ratio | 0004025627 | 1,233 | 48.7% |
 * | elderly-day-service-within-500m-household-ratio | 0004025626 | 1,220 | 46.2% |
 * | public-sewer-housing-ratio | 0004025576 | 1,191 | 87.5% |
 * | vacant-housing-rate-excluding-rental-sale-secondary | 0004021421 | 1,235 | 5.9% (公表値と一致) |
 * | vacant-housing-rate-for-rent | 0004021421 | 1,233 | 6.8% (公表値と一致) |
 * | damaged-vacant-housing-ratio | 0004021631 | 1,232 | 17.6% |
 *
 * 推計値の丸めで、距離の割合が 100% をわずかに超える地域がある (保育所 1・駅 1・医療機関 1・公園 3・避難場所 3)。
 * 公開時は valuePolicy で 0〜100 に限る。
 *
 * 状態: R2 の cities.json がまだ無い (取り込みは data-refresh の承認待ち)。公開集合に入れると空のページが
 * sitemap に載るので candidate に留め、テーマも draft にする。取り込み後に cities.json の件数と値を確かめてから
 * `MUNICIPALITY_HOUSING_SURVEY_STATUS` を 'published' に、テーマを 'active' に切り替える
 * (`.claude/todo/backlog.md` MUNI-RANKING-EXPANSION-01)。
 */
export const MUNICIPALITY_HOUSING_SURVEY_KEYS = [
  'nursery-within-500m-young-child-household-ratio',
  'elementary-school-within-1km-household-ratio',
  'junior-high-school-within-1km-household-ratio',
  'station-within-1km-household-ratio',
  'medical-facility-within-500m-household-ratio',
  'park-within-500m-household-ratio',
  'evacuation-site-within-500m-household-ratio',
  'post-office-bank-within-500m-household-ratio',
  'elderly-day-service-within-500m-household-ratio',
  'public-sewer-housing-ratio',
  'vacant-housing-rate-excluding-rental-sale-secondary',
  'vacant-housing-rate-for-rent',
  'damaged-vacant-housing-ratio',
] as const;

export const MUNICIPALITY_HOUSING_SURVEY_STATUS: 'candidate' | 'published' = 'candidate';

export const MUNICIPALITY_HOUSING_SURVEY_CANDIDATE_REASON =
  'e-Stat の実測で値のある市区町村を確認済み。R2 の cities.json が未取り込み (data-refresh の承認待ち) のため公開集合に入れない';

export const MUNICIPALITY_HOUSING_SURVEY_THEME = {
  slug: 'living-environment',
  title: '市区町村の住環境',
  defaultMetricKey: 'station-within-1km-household-ratio',
} as const;
