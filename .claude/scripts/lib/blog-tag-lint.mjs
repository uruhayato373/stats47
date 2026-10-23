/**
 * blog-tag-lint.mjs — 記事の frontmatter の tags がタグ台帳 (content.tags) に登録されているかを見る。
 *
 * 公開の段 (`apps/web/scripts/export-blog-snapshot.ts` の `resolveContentTag`) は未登録タグで落ちる。
 * quality-gate がこれを見ていなかったので、gate を通った記事が公開の段で止まった
 * (2026-10-23 `municipality-population-change-census-2025` のタグ「東京23区」。BLOG-TAG-GATE-01)。
 * 判定は公開の段と同じく、タグの id・key・label・aliases のどれかに一致すれば登録済みとする。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { datasetPath } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** タグ台帳から、タグとして受け付ける値の集合を作る。 */
export function loadRegisteredTagValues(file = path.join(PROJECT_ROOT, datasetPath("content.tags"))) {
  const { tags } = JSON.parse(fs.readFileSync(file, "utf8"));
  return new Set(tags.flatMap((tag) => [tag.id, tag.key, tag.label, ...(tag.aliases ?? [])]));
}

/** frontmatter の tags を文字列の配列で返す。frontmatter や tags が無ければ空配列。 */
export function frontmatterTags(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const data = yaml.load(match[1]);
  const tags = data && typeof data === "object" ? data.tags : undefined;
  return Array.isArray(tags) ? tags.map((tag) => String(tag)) : [];
}

export function lintUnregisteredTags(text, registered = loadRegisteredTagValues()) {
  const tags = frontmatterTags(text);
  const unregistered = tags.filter((tag) => !registered.has(tag));
  return {
    tags,
    unregistered,
    blockers: unregistered.map(
      (tag) => `UNREGISTERED_TAG: 「${tag}」はタグ台帳 (${datasetPath("content.tags")}) に無い。公開の段で失敗するので、登録済みのタグに替えるか台帳へ登録する`,
    ),
  };
}
