import assert from "node:assert/strict";
import { test } from "node:test";

import { frontmatterTags, lintUnregisteredTags } from "../blog-tag-lint.mjs";

const article = (tags) => `---\ntitle: "x"\ntags:\n${tags.map((tag) => `  - ${tag}`).join("\n")}\npublished: true\n---\n\n本文`;

test("台帳の key・label・別名のどれかに一致するタグは通す (公開の段と同じ判定)", () => {
  const registered = new Set(["tag:t-1", "東京都", "Tokyo"]);
  assert.deepEqual(lintUnregisteredTags(article(["東京都", "Tokyo"]), registered).blockers, []);
});

test("台帳に無いタグを blocker にする (2026-10-23 に公開の段で落ちた「東京23区」)", () => {
  const result = lintUnregisteredTags(article(["東京都", "東京23区"]), new Set(["東京都"]));
  assert.deepEqual(result.unregistered, ["東京23区"]);
  assert.match(result.blockers[0], /UNREGISTERED_TAG: 「東京23区」/);
});

test("実際のタグ台帳で、登録済みのタグは通り未登録は止まる", () => {
  assert.deepEqual(lintUnregisteredTags(article(["国勢調査", "市区町村"])).blockers, []);
  assert.equal(lintUnregisteredTags(article(["存在しないタグ名テスト"])).blockers.length, 1);
});

test("tags が無い・インライン配列の frontmatter も読める", () => {
  assert.deepEqual(frontmatterTags("---\ntitle: x\n---\n本文"), []);
  assert.deepEqual(frontmatterTags("---\ntags: [a, b]\n---\n"), ["a", "b"]);
});
