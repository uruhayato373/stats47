import test from "node:test";
import assert from "node:assert/strict";
import { affectedTemplates, PAGE_TEMPLATES } from "../templates.ts";

test("ranking配下の変更はrankingテンプレートだけを返す", () => {
  const result = affectedTemplates(["apps/web/src/features/ranking/components/Foo.tsx"]);
  assert.deepEqual(result.map((t) => t.key), ["ranking"]);
});

test("area-profileとarea-databookの変更はprefecture-detailだけを返す", () => {
  const result = affectedTemplates(["apps/web/src/features/area-profile/utils/generate-structured-data.ts"]);
  assert.deepEqual(result.map((t) => t.key), ["prefecture-detail"]);
});

test("共通レイアウトの変更は全テンプレートを返す", () => {
  const result = affectedTemplates(["apps/web/src/components/layout/PageShell.tsx"]);
  assert.equal(result.length, PAGE_TEMPLATES.length);
});

test("共通CSS・UI primitiveの変更は全テンプレートを返す", () => {
  for (const changedPath of [
    "apps/web/src/app/globals.css",
    "apps/web/src/components/ui/Button.tsx",
    "apps/web/tailwind.config.ts",
  ]) {
    assert.equal(affectedTemplates([changedPath]).length, PAGE_TEMPLATES.length);
  }
});

test("広告コンポーネントの変更は全テンプレートを返す", () => {
  const result = affectedTemplates(["apps/web/src/features/ads/components/AreaBannerAd.tsx"]);
  assert.equal(result.length, PAGE_TEMPLATES.length);
});

test("無関係なファイルの変更は空配列を返す", () => {
  const result = affectedTemplates(["docs/00_プロジェクト管理/02_収益化戦略.md"]);
  assert.deepEqual(result, []);
});

test("変更ファイルが無ければ空配列を返す", () => {
  assert.deepEqual(affectedTemplates([]), []);
});

test("複数テンプレートに跨る変更は該当分だけ返す(共通ファイルなし)", () => {
  const result = affectedTemplates([
    "apps/web/src/app/ranking/page.tsx",
    "apps/web/src/app/blog/page.tsx",
  ]);
  assert.deepEqual(result.map((t) => t.key).sort(), ["blog", "ranking"]);
});

// データの型の違い (variants) は、代表URL 1 件では拾えない崩れを週次で見るためのもの (2026-09-25 の UI 全面点検)。
test("variants は id・URL が重複せず、代表URLと同じ URL を持たない", async () => {
  const { browserPages } = await import("../templates.ts");
  const pages = browserPages();
  assert.equal(new Set(pages.map((p) => p.key)).size, pages.length, "page key が重複している");
  assert.equal(new Set(pages.map((p) => p.url)).size, pages.length, "同じ URL を 2 回撮影している");
  for (const p of pages) assert.match(p.url, /^\/[^\s]*$/, `サイトルート相対でない: ${p.url}`);
  assert.ok(pages.filter((p) => p.variantId).length >= 30, "variants が減っている (全面点検の 32 件)");
});

test("agent の確認は代表URLを毎週含み、variants は 4 週で全件を 1 回ずつ見る", async () => {
  const { browserPages, reviewPageKeys, REVIEW_ROTATION_WEEKS } = await import("../templates.ts");
  const pages = browserPages();
  const reps = pages.filter((p) => !p.variantId).map((p) => p.key);
  const seen = new Map();
  for (let w = 0; w < REVIEW_ROTATION_WEEKS; w += 1) {
    const date = new Date(Date.UTC(2026, 8, 27 + 7 * w)).toISOString().slice(0, 10);
    const keys = reviewPageKeys(date);
    for (const rep of reps) assert.ok(keys.includes(rep), `${date} に代表URL ${rep} が無い`);
    for (const k of keys.filter((k) => !reps.includes(k))) seen.set(k, (seen.get(k) ?? 0) + 1);
    assert.ok(keys.length <= reps.length + Math.ceil((pages.length - reps.length) / REVIEW_ROTATION_WEEKS));
  }
  const variants = pages.filter((p) => p.variantId).map((p) => p.key);
  for (const v of variants) assert.equal(seen.get(v), 1, `${v} が 4 週で 1 回ずつ確認されていない`);
});
