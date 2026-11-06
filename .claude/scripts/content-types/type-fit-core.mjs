/**
 * 型に合っていない記事の洗い出しの判定。本文の信号とクリックから処置の案を出す純関数。
 * 機械は案だけを出し、処置は人が決める。正典は .claude/rules/content-type-standards.md。
 */

const CAVEAT = /相関|因果|とは言え|とは限ら|断定|言えません|いえません|限界|注意|別の要因|可能性/;
const DEFINITION = /定義|とは|読み方|意味|読み違え|数えて|ベース|基準/;
const STEP = /手順|ステップ|^\s*\d+\.\s|^#{2,3}\s*(Step|ステップ|\d)/m;
const RANKING = /\d+\s*位|トップ|最下位|最多|最少|首位|^\|/m;

/** 本文から型の約束を満たしていない信号を返す */
export function promiseGaps(type, body) {
  const gaps = [];
  const hasCode = /```/.test(body);
  if (type === "type:paper" && !CAVEAT.test(body)) gaps.push("言える範囲の説明が無い");
  if (type === "type:textbook" && !DEFINITION.test(body)) gaps.push("定義・読み方の説明が無い");
  if (type === "type:howto" && !hasCode && !STEP.test(body)) gaps.push("手順が無い");
  if (type === "type:reference" && !RANKING.test(body)) gaps.push("順位・値の提示が無い");
  return gaps;
}

/** 県別などの連載は末尾の語が同じで、同じ指標でも別の記事である */
const seriesTail = (slug) => slug.split("-").slice(-2).join("-");

/**
 * 同じ型で同じ指標の組を扱う記事を、クリックの少ない方を統合候補として組にする。
 * 作り方型は題材の指標が重なるだけで別の記事なので見ない。
 */
export function findMergePairs(articles) {
  const groups = new Map();
  for (const a of articles) {
    if (a.rankingKeys.length === 0 || a.type === "type:howto") continue;
    const key = `${a.type}:${[...a.rankingKeys].sort().join("|")}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const pairs = new Map();
  for (const group of groups.values()) {
    const [main, ...rest] = [...group].sort((x, y) => y.clicks - x.clicks || x.id.localeCompare(y.id));
    for (const a of rest) {
      if (seriesTail(a.slug) !== seriesTail(main.slug)) pairs.set(a.id, main.id);
    }
  }
  return pairs;
}

/** クリックで判断するには、計測の窓の全体で公開されている必要がある */
export const MIN_OBSERVED_DAYS = 28;

/** article.md の frontmatter の公開日 (YYYY-MM-DD)。無ければ null */
export function publishedDateOf(body) {
  return /^(?:publishedAt|published_at|date):\s*["']?(\d{4}-\d{2}-\d{2})/m.exec(body)?.[1] ?? null;
}

/** 公開日が不明か、公開から計測の終わりまでが短い記事は、クリック 0 を証拠にできない */
export function isObservable(publishedDate, gscEnd) {
  if (Number.isNaN(Date.parse(gscEnd))) throw new Error(`計測の終わりの日付が読めない: ${gscEnd}`);
  if (!publishedDate) return false;
  return (Date.parse(gscEnd) - Date.parse(publishedDate)) / 86400000 >= MIN_OBSERVED_DAYS;
}

/**
 * 1 記事の処置の案。クリックのある記事は型が合わないだけなら撤去しない。
 * 計測できていない記事 (observable: false) はクリック 0 を根拠にしない。本文の信号による書き直しの案だけを出す。
 * 問いに答える記事 (answers) は台帳で問いと結ばれているので撤去の案にしない。
 * @returns {{ proposal: "rewrite" | "merge" | "retire", signals: string[], mergeWith?: string } | null}
 */
export function proposeAction({ slug, type, body, clicks, impressions, observable, answers = false }, mergeWith) {
  const gaps = promiseGaps(type, body);
  const unasked = observable && !answers && type === "type:paper" && slug.includes("-vs-") && clicks === 0 && impressions < 10;
  if (unasked) return { proposal: "retire", signals: ["2 指標の相関で読者の問いの証拠が無い (28 日以上の計測でクリック 0・表示 10 未満)", ...gaps] };
  if (mergeWith && observable && clicks === 0) return { proposal: "merge", signals: ["同じ指標の組の記事がある", ...gaps], mergeWith };
  if (gaps.length) return { proposal: "rewrite", signals: gaps };
  return null;
}
