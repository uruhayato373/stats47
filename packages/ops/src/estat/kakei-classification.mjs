/**
 * 家計調査の metric と、総務省の収支項目分類 (data/estat/kakei-classification/<revision>.json) を突き合わせる純粋関数。
 *
 * 検査すること (2026-10-08 の誤りの再発防止):
 *   1. metric の cdCat01 が分類の品目に解決できる (品目番号の分からない metric を残さない)
 *   2. metric の文言 (title / subtitle / note) が、その品目の「× 含まれない」例示と矛盾しない
 *      例: 371 ぎょうざ は「× ぎょうざの冷凍品→370」なのに、note が「冷凍・調理済み」を含むと書いていた
 *
 * 2 は語の照合による検査で、意味の正しさを保証しない。限定語 (QUALIFIERS) が除外例示と metric の文言の両方に現れ、
 * metric の文に否定 (除く・含まれない 等) が無いときだけ指摘する。
 */

/** 除外例示に現れる、品目の範囲を分ける語。除外側にあれば「その状態の物は別品目」を意味する */
export const QUALIFIERS = ["冷凍", "缶詰", "レトルト", "インスタント", "粉末", "外食", "乾燥"];
const NEGATION = /(除く|除い|除外|含まれない|含まない|含めない|入らない|入れない|別品目|別の品目|対象外|ではない)/;

/**
 * e-Stat の cat01 名「371 ぎょうざ」から品目番号 "371" を取り出す。品目番号は 3 桁 (例 371・38A)。
 * 「1 食料」のような十大費目や「1.9.2 他の調理食品」のような中分類は品目ではないので null。
 */
export function itemNumberFromCat01Name(name) {
  const match = String(name ?? "").match(/^([0-9]{3}|[0-9]{2}[A-Z])\s/);
  return match ? match[1] : null;
}

function sentences(text) {
  return String(text ?? "").split(/[。\n]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * @param {{ key: string, title?: string, subtitle?: string, note?: string, cdCat01: string }} metric  合算の metric は品目ごとに呼ぶ
 * @param {Map<string, string>} cat01Names  cdCat01 → e-Stat の分類名 (「371 ぎょうざ」)
 * @param {{ items: Record<string, { code: string, name: string, excludes: { text: string, movedTo: string | null }[] }> }} classification
 * @returns {{ key: string, item: string | null, findings: { code: string, message: string }[] }}
 */
export function checkKakeiMetric(metric, cat01Names, classification) {
  const findings = [];
  const cat01Name = cat01Names.get(metric.cdCat01);
  if (!cat01Name) {
    return { key: metric.key, item: null, findings: [{ code: "UNRESOLVED_CAT01", message: `cdCat01 ${metric.cdCat01} が e-Stat のメタ控えに無い` }] };
  }
  const number = itemNumberFromCat01Name(cat01Name);
  // 「1.9.2 他の調理食品」のような中分類は品目番号を持たない。範囲の例示は品目だけにあるので検査を見送る
  if (!number) return { key: metric.key, item: null, findings };
  const item = classification.items[number];
  if (!item) {
    return { key: metric.key, item: number, findings: [{ code: "UNKNOWN_ITEM", message: `品目 ${cat01Name} が収支項目分類に無い` }] };
  }
  const fields = { title: metric.title, subtitle: metric.subtitle, note: metric.note };
  for (const exclusion of item.excludes) {
    // 品目名そのものに入っている語 (370 冷凍調理食品 の「冷凍」) は、その品目の範囲を言っているだけなので照合しない
    for (const qualifier of QUALIFIERS.filter((q) => exclusion.text.includes(q) && !item.name.includes(q))) {
      for (const [field, value] of Object.entries(fields)) {
        for (const sentence of sentences(value)) {
          if (!sentence.includes(qualifier) || NEGATION.test(sentence)) continue;
          findings.push({
            code: "CONTRADICTS_EXCLUSION",
            message: `${field} が「${qualifier}」を含むと読めるが、${item.code} ${item.name} の公式例示は「× ${exclusion.text}${exclusion.movedTo ? `→${exclusion.movedTo}` : ""}」: ${sentence.slice(0, 80)}`,
          });
        }
      }
    }
  }
  return { key: metric.key, item: number, findings };
}
