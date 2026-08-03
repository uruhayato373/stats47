/**
 * docs/21 outbox と R2 (正典) の突き合わせ。
 *
 * outbox の 1 記事は R2 に対して 3 状態のいずれかを取る:
 *
 *   | 状態              | published | R2      | 意味                       | 誰が処理するか        |
 *   |-------------------|-----------|---------|----------------------------|-----------------------|
 *   | 未公開            | true      | 無し    | 新規記事。公開待ち         | blog-auto-publish     |
 *   | **改稿版**        | true      | 旧版    | brushup 済み。再公開待ち   | blog-auto-publish     |
 *   | 公開済みの取り残し| true      | 一致    | 掃除対象                   | prune-published-outbox|
 *   | 作業中            | false     | —       | 触らない                   | —                     |
 *
 * この判定は **prune (消す) と publish (出す) の裏表**で、片方だけがズレると
 * 「消されないが出もしない」記事が生まれる。実際 2026-08-03 まで
 * blog-auto-publish の reconcile が `!live.has(slug)` だけを見ていたため、
 * **改稿版は構造的に永久公開されなかった** (pruner は正しく保持していたので
 * outbox に溜まり続けた)。両者が同じ関数を使うことでこのズレを再発させない。
 *
 * 正典: .claude/rules/blog-data-schema.md §0 (docs/21 = ephemeral outbox / R2 = SSOT)
 */

import { readFileSync } from "node:fs";

export const DEFAULT_R2_BASE = "https://storage.stats47.jp";

/** frontmatter の published を読む。true/false/null(不明・読めない) */
export function getPublished(articlePath) {
  try {
    const txt = readFileSync(articlePath, "utf8");
    const m = txt.match(/^published:\s*(true|false)/m);
    return m ? m[1] === "true" : null;
  } catch {
    return null;
  }
}

/**
 * 改行/末尾空白の差を無視して内容比較する。
 * publish は `cp -R` の verbatim コピーなので、公開済みなら正規化後に完全一致する。
 */
export function normalizeBody(s) {
  return String(s)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/** R2 (正典) の article.md 本文を返す。未掲載 / 取得失敗は null */
export async function fetchR2Article(slug, base = DEFAULT_R2_BASE) {
  const url = `${base}/app/blog/${encodeURIComponent(slug)}/article.md`;
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
    if (res.status !== 200) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * outbox の 1 記事が R2 に対してどの状態かを返す。
 *
 * `liveBody` が null は「R2 に無い」で、取得失敗と区別できない。**publish 側は
 * これを "未公開" として扱ってよい**が (再公開は冪等)、**prune 側は削除に使っては
 * ならない** (取得失敗で消すと不可逆)。呼び出し側が用途に応じて解釈する。
 *
 * @returns {"unpublished"|"revised"|"in-sync"|"draft"}
 */
export function classifyAgainstLive({ published, localBody, liveBody }) {
  if (published !== true) return "draft";
  if (liveBody === null || liveBody === undefined) return "unpublished";
  return normalizeBody(localBody) === normalizeBody(liveBody) ? "in-sync" : "revised";
}

/** publish (新規公開 or 再公開) が要る状態か */
export function needsPublish(state) {
  return state === "unpublished" || state === "revised";
}
