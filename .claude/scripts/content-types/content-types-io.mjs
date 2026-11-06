/**
 * 4 型の判定の入力を台帳から読む。判定そのものは classify-core.mjs。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";

const readJson = (root, rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

/** 問いに答えるブログのページ ID。公開後の issue-links と、公開前の分析の記事 (analyses の article) の両方を見る */
export function readAnswerPages(root) {
  const { links } = readJson(root, datasetPath("content.issue-links"));
  const { analyses } = readJson(root, datasetPath("content.analyses"));
  return new Set([
    ...links.filter((l) => l.role === "answers").map((l) => l.page),
    ...analyses.flatMap((a) => (a.article?.slug ? [`blog:${a.article.slug}`] : [])),
  ]);
}

export function readContentTypesLedger(root) {
  return readJson(root, datasetPath("content.types"));
}

/** contents/blog の公開待ちの原稿の slug */
export function readDraftSlugs(root) {
  const dir = join(root, "contents/blog");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "article.md")))
    .map((e) => e.name);
}

export function readClassifyInputs(root) {
  const pagesDir = datasetDir("content.pages");
  return {
    ledger: readContentTypesLedger(root),
    pages: readdirSync(join(root, pagesDir))
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => readJson(root, `${pagesDir}/${f}`).pages),
    answerPages: readAnswerPages(root),
    notes: readJson(root, datasetPath("note.articles")).articles,
    posts: readJson(root, datasetPath("sns.posts")).posts,
    books: readJson(root, datasetPath("products.ledger")).products,
    draftSlugs: readDraftSlugs(root),
  };
}
