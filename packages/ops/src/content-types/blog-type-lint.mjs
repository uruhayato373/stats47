/**
 * ブログの品質ゲートの 4 型の検査。リポジトリの原稿と公開記事だけを見る (テストの一時ディレクトリの記事は対象外)。
 * 判定は classify-core.mjs で、正典は .claude/rules/content-type-standards.md。
 */
import { relative, sep } from "node:path";

import { classifyBlog } from "./classify-core.mjs";
import { readAnswerPages, readContentTypesLedger } from "./content-types-io.mjs";

export function lintBlogContentType(root, slug, articlePath) {
  if (relative(root, articlePath).startsWith(`..${sep}`)) return { type: null, blockers: [] };
  const id = `blog:${slug}`;
  const ledger = readContentTypesLedger(root);
  const assigned = new Map(ledger.assignments.map((a) => [a.id, a.type]));
  const { type } = classifyBlog(slug, id, readAnswerPages(root).has(id), ledger.rules, assigned);
  return {
    type,
    blockers: type ? [] : [`4 型が決まらない: ${id}。4 型の台帳 (content.types) の assignments に {id, type, reason} を足す (content-type-standards.md)`],
  };
}
