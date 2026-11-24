// .claude の実物 (手元の検査の既定の画面・週次 UI 確認のプロンプト) を確かめるテスト。
// page-quality の本体は packages/ops にあるが、これらは .claude が持つ資産の契約なのでここに置く。
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { browserPages } from "../../../../packages/ops/src/page-quality/templates.ts";

test("手元の検査 (npm run ui-theme:line-grid) の既定の画面は、週次が見るページと同じ一覧を使い、検索・固定ページを含む", () => {
  const script = readFileSync(new URL("../../ui/check-line-grid.mjs", import.meta.url), "utf8");
  assert.match(script, /browserPages\(\)/, "既定の一覧を手書きに戻すと週次と食い違う");
  assert.match(script, /line-grid-probe\.mjs/, "判定を手元の検査に複製しない");
  const urls = browserPages().map((p) => p.url);
  for (const url of ["/search?q=%E4%BA%BA%E5%8F%A3", "/privacy", "/terms", "/ranking", "/geo/compare"]) {
    assert.ok(urls.includes(url), `週次のブラウザ検査に ${url} が無い`);
  }
});


test("週次 UI 確認のプロンプトに「データの意味」の観点 (ラベルと単位・値の食い違い、内部用語) があり、指摘止まりと明記している (DISPLAY-SEMANTICS-FOLLOWUP-01)", async () => {
  const path = fileURLToPath(new URL("../../../prompts/ci/page-ui-review.md", import.meta.url));
  const prompt = readFileSync(path, "utf-8");
  assert.match(prompt, /データの意味/);
  assert.match(prompt, /見出し|ラベル|説明文/);
  assert.match(prompt, /内部用語/);
  assert.match(prompt, /指摘止まり|指摘だけ/);
});
