/**
 * コンテンツの 4 型の判定。管理画面・npm run content-types:check・ブログの品質ゲートが同じ判定を使う。
 * 正典は .claude/rules/content-type-standards.md、型と規則の正本は data/content/content-types.json。
 *
 * 優先順は 個別の指定 → 問いへの答え・指している先からの導出 → 規則。決まらないものは type: null で返し、推測で埋めない。
 * 純関数だけを置く。ファイルの読み込みは content-types-io.mjs。
 */

/** @typedef {{ type: string | null, how: string }} Classified */

const UNDECIDED = Object.freeze({ type: null, how: "規則で決まらない" });
const MANUAL = "個別の指定";

/** @returns {Classified} */
export function classifyBlog(key, id, answers, rules, assigned) {
  const manual = assigned.get(id);
  if (manual) return { type: manual, how: MANUAL };
  if (answers) return { type: "type:paper", how: "問いへの答え" };
  const suffix = Object.keys(rules.blogSlugSuffixes).find((s) => key.endsWith(s));
  if (suffix) return { type: rules.blogSlugSuffixes[suffix], how: `URL の末尾 ${suffix}` };
  const infix = Object.keys(rules.blogSlugInfixes).find((s) => key.includes(s));
  return infix ? { type: rules.blogSlugInfixes[infix], how: `URL の ${infix}` } : UNDECIDED;
}

/** @returns {Classified} */
export function classifyNote(note, rules, assigned) {
  const manual = assigned.get(`note:${note.key}`);
  if (manual) return { type: manual, how: MANUAL };
  const byVertical = note.vertical ? rules.noteVerticals[note.vertical] : undefined;
  if (byVertical) return { type: byVertical, how: `マガジン ${note.vertical}` };
  const bySeries = note.series ? rules.noteSeries[note.series] : undefined;
  return bySeries ? { type: bySeries, how: `シリーズ ${note.series}` } : UNDECIDED;
}

/** ブログ・note を指す投稿は、指している先の型を継ぐ。@returns {Classified} */
export function classifyPost(post, rules, assigned, resolved) {
  const manual = assigned.get(`sns:${post.id}`);
  if (manual) return { type: manual, how: MANUAL };
  if ((post.domain === "blog" || post.domain === "note") && post.content_key) {
    const target = resolved.get(`${post.domain}:${post.content_key}`);
    if (target?.type) return { type: target.type, how: `指している${post.domain === "blog" ? "記事" : " note"}の型` };
  }
  const byDomain = rules.snsDomains[post.domain];
  return byDomain ? { type: byDomain, how: `投稿の種類 ${post.domain}` } : UNDECIDED;
}

/** @returns {Classified} */
export function classifyPage(page, answers, rules, assigned) {
  if (page.kind === "blog") return classifyBlog(page.key, page.id, answers, rules, assigned);
  const manual = assigned.get(page.id);
  if (manual) return { type: manual, how: MANUAL };
  const type = rules.pageKinds[page.kind];
  return type ? { type, how: `ページの種別 ${page.kind}` } : UNDECIDED;
}

/** @returns {Classified} */
export function classifyBook(key, rules, assigned) {
  const manual = assigned.get(`kindle:${key}`);
  return manual ? { type: manual, how: MANUAL } : { type: rules.kindle, how: "Kindle の規則" };
}

/**
 * 型を持つべき全コンテンツを判定する。ナビ用のページ・削除した投稿・取り下げた本は対象にしない。
 * @param {any} input ledger・pages・answerPages・notes・posts・books と、任意の draftSlugs
 * @returns {Map<string, Classified>} ID → 判定
 */
export function classifyAll(input) {
  const { ledger, pages, answerPages, notes, posts, books, draftSlugs = [] } = input;
  const { rules } = ledger;
  const assigned = new Map(ledger.assignments.map((a) => [a.id, a.type]));
  const excluded = new Set(rules.excludedPageKinds);
  const result = new Map();
  for (const page of pages) {
    if (!excluded.has(page.kind)) result.set(page.id, classifyPage(page, answerPages.has(page.id), rules, assigned));
  }
  for (const slug of draftSlugs) {
    const id = `blog:${slug}`;
    if (!result.has(id)) result.set(id, classifyBlog(slug, id, answerPages.has(id), rules, assigned));
  }
  // 公開で送り箱から消え、まだ索引に載っていない答えの記事も論文型と決まる
  for (const id of answerPages) {
    if (id.startsWith("blog:") && !result.has(id)) result.set(id, classifyBlog(id.slice("blog:".length), id, true, rules, assigned));
  }
  for (const note of notes) result.set(`note:${note.key}`, classifyNote(note, rules, assigned));
  for (const book of books) {
    if (book.channel === "kdp" && book.status !== "withdrawn") result.set(`kindle:${book.key}`, classifyBook(book.key, rules, assigned));
  }
  for (const post of posts) {
    if (post.status !== "deleted") result.set(`sns:${post.id}`, classifyPost(post, rules, assigned, result));
  }
  return result;
}

/** どのコンテンツにも当たらない個別の指定 (記事の撤去などで残った行)。判定には影響しない */
export function findStaleAssignments(ledger, classified, allIds) {
  return ledger.assignments.filter((a) => !classified.has(a.id) && !allIds.has(a.id)).map((a) => a.id);
}
