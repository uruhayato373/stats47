#!/usr/bin/env node
/**
 * 全コンテンツが 4 型のどれかに決まっていることの検査 (npm run content-types:check)。
 * 型が決まらないものがあれば exit 1。直し方は .claude/rules/content-type-standards.md。
 *
 *   node .claude/scripts/content-types/check-content-types.mjs
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { classifyAll, findStaleAssignments } from "./classify-core.mjs";
import { readClassifyInputs } from "./content-types-io.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const inputs = readClassifyInputs(ROOT);
if (inputs.pages.length === 0 || inputs.notes.length === 0) {
  console.error("✗ content-types:check: ページか note の台帳が空で、検査が成立していない");
  process.exit(2);
}
const classified = classifyAll(inputs);
const unclassified = [...classified].filter(([, c]) => c.type === null).map(([id]) => id);
const everyPost = new Set(inputs.posts.map((p) => `sns:${p.id}`));
const stale = findStaleAssignments(inputs.ledger, classified, everyPost);

for (const id of stale.slice(0, 20)) console.log(`! 個別の指定の宛先が無い: ${id}`);
for (const id of unclassified.slice(0, 50)) console.error(`✗ 型が決まらない: ${id}`);
if (unclassified.length > 50) console.error(`… 他 ${unclassified.length - 50} 件`);
if (unclassified.length) {
  console.error("  4 型の台帳 (content.types) の assignments に {id, type, reason} を足すか、まとまりなら rules を足す (.claude/rules/content-type-standards.md)");
}
console.log(`${unclassified.length ? "✗" : "✓"} content-types:check: 対象 ${classified.size} 件 / 型が決まらない ${unclassified.length} 件 / 宛先の無い指定 ${stale.length} 件`);
process.exit(unclassified.length ? 1 : 0);
