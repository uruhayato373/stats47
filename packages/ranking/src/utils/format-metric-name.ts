/**
 * 指標名を画面に出すときの組み立て (SUBTITLE-DROP-SITEWIDE-01)。
 *
 * `readerLabel` は正準名 (title) だけから導く平易な名前で、分母・内訳を持たない。分母・内訳は
 * `subtitle` が持つ規約 (unit-semantics-standards §4) なので、`readerLabel ?? title` だけを出すと
 * 「図書館数 27館」(人口100万人当たり) のように人口当たりの値が総数に見える。
 * 名前を出す部品はこのファイルの関数だけを使う (直書きは契約テストが止める)。
 */

/** 指標名の組み立てに要る最小の形。 */
export interface MetricNameSource {
  title: string;
  readerLabel?: string | null;
  subtitle?: string | null;
}

/** subtitle がデータ注釈 (※系) かどうかを文面から判定する。注釈は名前に連結しない。 */
export function isCaveatNote(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  return (
    t.startsWith("※") ||
    t.startsWith("注") ||
    t.includes("調査対象外") ||
    t.includes("value=0") ||
    t.includes("対象外")
  );
}

/**
 * 家計調査系の「都道府県庁所在市の二人以上世帯の年間〜」は調査方法の定型文で、名前の区別に使えない
 * (METRIC-SUBTITLE-KAKEI-NOTE-01 でデータ側を直すまでの扱い)。
 */
const SURVEY_METHOD_PREFIX = /^(都道府県)?庁所在市の/;

/** 名前だけ (補足を別の場所に出す部品用)。 */
export function metricShortName(item: MetricNameSource): string {
  return item.readerLabel ?? item.title;
}

/**
 * 名前に連結してよい補足。注釈・名前の言い換え・調査方法の定型文は返さない。
 */
export function metricNameQualifier(item: MetricNameSource): string | null {
  const subtitle = item.subtitle?.trim();
  if (!subtitle) return null;
  if (isCaveatNote(subtitle)) return null;
  if (SURVEY_METHOD_PREFIX.test(subtitle)) return null;
  const name = metricShortName(item);
  if (subtitle.includes(item.title) || subtitle.includes(name) || name.includes(subtitle)) return null;
  return subtitle;
}

/** 名前 + 補足 (「図書館数（人口100万人当たり）」)。補足を別に出さない部品はこれを使う。 */
export function metricDisplayName(item: MetricNameSource): string {
  const qualifier = metricNameQualifier(item);
  const name = metricShortName(item);
  return qualifier ? `${name}（${qualifier}）` : name;
}
