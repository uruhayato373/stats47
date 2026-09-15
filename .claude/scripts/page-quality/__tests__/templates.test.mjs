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
