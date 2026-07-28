/**
 * asp-vertical-keywords.mjs — ASP 走査時に「当たりを付ける」ための vertical 別の語彙
 * ---------------------------------------------------------------------------
 * 正典は `apps/web/src/features/ads/constants/affiliate-category.ts` の 10 軸。
 * ここは**走査で拾うかどうかを決めるだけ**の広めの語彙で、最終的な vertical 判定は
 * 登録時に人/agent が行う (推測で確定しない)。
 *
 * afb-scan と moshimo-scan で同じ語彙を使うため 1 箇所に置く (二重定義するとドリフトする)。
 */

export const VERTICAL_KEYWORDS = {
  labor: "転職|求人|キャリア|年収|就職|副業|派遣|エージェント",
  housing: "住宅|不動産|引越|賃貸|マンション|注文住宅|リフォーム|住まい",
  population: "子育て|保育|結婚|婚活|出産|ベビー",
  economy: "投資|証券|保険|ＦＰ|FP|家計|クレジット|ローン|NISA|資産運用",
  health: "健康|ダイエット|フィットネス|医療|サプリ|ジム|パーソナル",
  energy: "電気|ガス|電力|通信|光回線|格安SIM|Wi-Fi|モバイル",
  travel: "旅行|宿泊|ホテル|旅館|ツアー|航空券|レンタカー|観光",
  furusato: "ふるさと納税|返礼品",
  education: "通信教育|資格|スクール|学習|塾|英会話|プログラミング|講座",
  mobility: "自動車|カーリース|車査定|自動車保険|バイク|中古車",
};

/** 抽出フィルタ。verticals 指定があればその軸だけ、無ければ 10 軸の和。 */
export function buildVerticalFilter(verticals) {
  const keys = verticals ?? Object.keys(VERTICAL_KEYWORDS);
  return new RegExp(keys.map((k) => VERTICAL_KEYWORDS[k]).join("|"), "i");
}

/** 案件名から vertical を推定する (最初に一致した軸。不明は null)。 */
export function guessVertical(name) {
  for (const [key, pattern] of Object.entries(VERTICAL_KEYWORDS)) {
    if (new RegExp(pattern, "i").test(name)) return key;
  }
  return null;
}

/** 未知の vertical 名を弾く (typo を黙って通さない)。 */
export function assertKnownVerticals(verticals) {
  const unknown = (verticals ?? []).filter((v) => !VERTICAL_KEYWORDS[v]);
  if (unknown.length) {
    throw new Error(`未知の vertical: ${unknown.join(", ")} (${Object.keys(VERTICAL_KEYWORDS).join(" / ")})`);
  }
}
