/**
 * topic-queue-spurious-core.mjs — B型 (相関) 候補の疑似相関を決定的ルールで除外する純粋関数群。
 * (TOPIC-QUEUE-SPURIOUS-FILTER-01)
 *
 * build-topic-queue.mjs から呼ばれる。モデル判断を挟まない (ルーティングはすべて決定的)。
 * テスト: .claude/scripts/blog/lib/__tests__/topic-queue-spurious-core.test.mjs (node --test)
 *
 * 除外ルール (reason code):
 *  - self-derived     : 同一 metric / 派生 key (prefix 包含。例 convenience-store-count vs -commercial)
 *  - synonym-family   : key の family 一致 (消費量 vs 支出額、-commercial 等の同義バリアント)
 *  - scale-pair       : 両方が絶対量スケール指標 (人口・経済規模に両比例) かつ |r|>=0.95
 *                       (偏相関データ無しなら |r|>=0.9)。「コンビニ店舗数×手数料 r=0.99」型
 *  - same-category    : 同一 e-Stat category (機序カテゴリ距離ゼロ)。B型は跨ぎのみ採用
 *  - year-mismatch    : 両 metric の最新年が 5 年以上乖離 (古いデータ同士の見かけ相関)
 *  - low-n            : 相関の標本都道府県数 < 40 (欠測が多く不安定)
 *  - national-mixed   : scatterData に全国値 (areaCode 00000) が混入
 */

const RATIO_UNIT_RE = /[%％‰倍]|ポイント/u;
const DERIVED_KEY_RE =
  /-per-|-rate$|-ratio$|-percentage$|-density$|-share$|-proportion$/;
const PER_SOMETHING_RE = /あたり|平均|一人当|1人当|人当たり/u;
// 絶対量を示す単位の末尾 (百万円・千人・事業所 等の複合単位を endsWith で拾う)
const SCALE_UNIT_TAIL_RE =
  /(人|件|円|世帯|戸|店|店舗|所|箇所|施設|台|個|校|園|館|棟|床|局|頭|羽|隻|トン|人日|人回|事業所|企業|法人|団体|冊|部|席|室|基|面|区画|加入|契約|回線|t|ha|m2|ｍ2|m²|㎡|km2|km²)$/u;

const MIN_SCATTER_N = 40;
const YEAR_MISMATCH_THRESHOLD = 5;
const SCALE_PAIR_R = 0.95;
const SCALE_PAIR_R_NO_PARTIAL = 0.9;

// 同義バリアントを畳む suffix (順に 1 回ずつ除去)
const FAMILY_SUFFIXES = [
  "-consumption-expenditure",
  "-consumption-quantity",
  "-expenditure",
  "-quantity",
  "-commercial",
  "-total",
];

/**
 * 絶対量スケール指標か (人口・経済規模に比例する実数)。
 * 家計調査系 (世帯あたり) と比率・派生指標は false。
 */
export function isScaleMetric({ key, unit, title = "", isKakei = false }) {
  if (isKakei) return false; // 家計調査は世帯あたり値
  const u = (unit || "").trim();
  if (!u) return false;
  if (RATIO_UNIT_RE.test(u)) return false;
  if (u.includes("/")) return false; // 人/10万人 等の正規化単位
  if (PER_SOMETHING_RE.test(u) || PER_SOMETHING_RE.test(title)) return false;
  if (DERIVED_KEY_RE.test(key)) return false;
  return SCALE_UNIT_TAIL_RE.test(u);
}

/** 同義バリアント判定用の key family (suffix を畳んだ形) */
export function keyFamily(key) {
  let k = key;
  for (const suffix of FAMILY_SUFFIXES) {
    if (k.endsWith(suffix)) k = k.slice(0, -suffix.length);
  }
  return k;
}

/**
 * B型候補ペアの疑似相関 reason code 配列を返す。空配列 = 採用可。
 *
 * @param {object} input
 *   base / pair: { key, unit, title, category, isKakei, yearTo }
 *   pearsonR: number
 *   partialRPopulation: number | null
 *   scatterData: Array<{areaCode: string}> | null
 */
export function spuriousReasons({ base, pair, pearsonR, partialRPopulation, scatterData }) {
  const reasons = [];
  const absR = Math.abs(pearsonR);

  // 自己相関・派生 key
  if (
    base.key === pair.key ||
    base.key.startsWith(`${pair.key}-`) ||
    pair.key.startsWith(`${base.key}-`)
  ) {
    reasons.push("self-derived");
  } else if (keyFamily(base.key) === keyFamily(pair.key)) {
    reasons.push("synonym-family");
  }

  // 共通分母 (規模) 疑似相関
  const bothScale = isScaleMetric(base) && isScaleMetric(pair);
  if (
    bothScale &&
    (absR >= SCALE_PAIR_R || (partialRPopulation == null && absR >= SCALE_PAIR_R_NO_PARTIAL))
  ) {
    reasons.push("scale-pair");
  }

  // 機序カテゴリ距離 (同一 category は B型の跨ぎ要件を満たさない)
  if (base.category && pair.category && base.category === pair.category) {
    reasons.push("same-category");
  }

  // 年度不一致
  if (
    Number.isFinite(base.yearTo) &&
    Number.isFinite(pair.yearTo) &&
    Math.abs(base.yearTo - pair.yearTo) >= YEAR_MISMATCH_THRESHOLD
  ) {
    reasons.push("year-mismatch");
  }

  // 欠測・全国値混入
  if (Array.isArray(scatterData) && scatterData.length > 0) {
    if (scatterData.length < MIN_SCATTER_N) reasons.push("low-n");
    if (scatterData.some((p) => p.areaCode === "00000")) reasons.push("national-mixed");
  }

  return reasons;
}

/**
 * 疑似相関でない採用ペアの suggestedTitle。
 * 「意外な関係」クリックベイトを廃し、疑問形 1 要素の機序検証タイトルにする
 * (blog-quality-standards: gap は 1 要素・短く)。
 */
export function correlationTitle(baseStem, pairStem, pearsonR) {
  return pearsonR >= 0
    ? `${baseStem}が多い県は${pairStem}も多い?`
    : `${baseStem}が多い県は${pairStem}が少ない?`;
}
