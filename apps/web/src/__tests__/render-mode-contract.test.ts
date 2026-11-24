// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * page.tsx の描画方式の契約 (CF-CPU-ISR-01・2026-11-21)。
 *
 * 動的セグメント (`[...]`) の page が `revalidate` を書いても、`generateStaticParams` が無いと
 * 実行時の ISR は効かず毎リクエスト描画になる。Next.js 公式: 実行時に ISR を効かせるには
 * generateStaticParams が空配列を返すか force-static が要る
 * (https://nextjs.org/docs/app/api-reference/functions/generate-static-params 、2026-11-21 確認)。
 * 2026-06-22〜11-21 は `/ranking/*` と `/areas/*` がこの状態で、1 描画約 1.7 秒の CPU が
 * Workers 課金の約 7 割を占めた。
 *
 * 逆に generateStaticParams がキー列を返すと、R2 を読むページはビルド時に R2 を読めず
 * notFound が焼かれて固着する (2026-06-22 障害)。だから R2 を読む動的 route は **空配列** を返す。
 *
 * 許可リストは縮小専用。増えても減っても落ちる。
 */

const APP_DIR = resolve(import.meta.dirname, "../app");

/** generateStaticParams がキー列を返してよい page (ビルド時に一覧を読み、本文はビルド時の R2 読み取りで足りる)。 */
const KEYED_STATIC_PARAMS_PAGES: ReadonlyArray<{ file: string; reason: string }> = [
  { file: "blog/[slug]/page.tsx", reason: "記事一覧をビルド時に読んで prerender する。本文の差し替えは purge-isr-routes と再デプロイで反映する運用。" },
  { file: "products/[slug]/page.tsx", reason: "商品は git の台帳から列挙し、R2 を読まない。" },
  { file: "tag/[tagKey]/page.tsx", reason: "タグ一覧をビルド時に読んで prerender する。" },
];

/** revalidate を持つが generateStaticParams を持たず、実行時 ISR が効いていない page。縮小専用。 */
const REVALIDATE_WITHOUT_STATIC_PARAMS_PAGES: ReadonlyArray<{ file: string; reason: string }> = [
  { file: "geo/[analysisSlug]/[prefCode]/[stage]/page.tsx", reason: "searchParams (?group=) を読むので ISR にならない。URL-QUERY-INVENTORY-01 で移行判断。" },
  { file: "geo/[analysisSlug]/page.tsx", reason: "searchParams (?pref= ほか) を読むので ISR にならない。URL-QUERY-INVENTORY-01 で移行判断。" },
  { file: "geo/data/[analysisSlug]/[prefCode]/page.tsx", reason: "未対応。読み取り失敗時に notFound を保存しないかを確かめてから空配列を足す (Geo は CPU の約 2%)。" },
  { file: "geo/layers/[layerSlug]/page.tsx", reason: "searchParams (?pref=) を読むので ISR にならない。URL-QUERY-INVENTORY-01 で移行判断。" },
  { file: "geo/population-station-access/[prefCode]/[stage]/page.tsx", reason: "未対応。読み取り失敗時に notFound を保存しないかを確かめてから空配列を足す (Geo は CPU の約 2%)。" },
];

/** force-dynamic の page (2026-11-21 時点の集合)。新しいページは ISR (revalidate + 空の generateStaticParams) で作る。縮小専用。 */
const FORCE_DYNAMIC_PAGES: readonly string[] = [
  "blog/tags/page.tsx",
  "geo/2050-population/page.tsx",
  "geo/airport-tourism/page.tsx",
  "geo/data-catalog/page.tsx",
  "geo/datasets/[dataId]/page.tsx",
  "geo/history/[network]/[scope]/page.tsx",
  "geo/history/[network]/page.tsx",
  "geo/ic-manufacturing/page.tsx",
  "geo/ic-population/page.tsx",
  "geo/map/page.tsx",
  "geo/page.tsx",
  "geo/shinkansen-population/page.tsx",
  "municipalities/ranking/[rankingKey]/[prefCode]/page.tsx",
  "municipalities/themes/[themeSlug]/page.tsx",
  "page.tsx",
  "ranking/page.tsx",
  "survey/page.tsx",
  "themes/[themeSlug]/page.tsx",
];

function findPageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" || entry.name === "__tests__" ? [] : findPageFiles(path);
    }
    return /^page\.(tsx|ts|jsx|js)$/.test(entry.name) ? [path] : [];
  });
}

/** コメントの中の語で誤検出しないよう、ブロックコメントと行コメントを除く (URL の `://` は行コメントとみなさない) */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

interface PageSource {
  file: string;
  code: string;
}

function readPages(): PageSource[] {
  return findPageFiles(APP_DIR)
    .map((path) => ({
      file: relative(APP_DIR, path).split("\\").join("/"),
      code: stripComments(readFileSync(path, "utf8")),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

const isDynamicSegment = (file: string) => file.includes("[");
const hasRevalidate = (code: string) => /export const revalidate\s*=/.test(code);
const hasStaticParams = (code: string) => /export (async )?function generateStaticParams\b/.test(code);
const returnsEmptyStaticParams = (code: string) =>
  /export (async )?function generateStaticParams\([^)]*\)(\s*:[^\n]*?)?\s*\{\s*return \[\];\s*\}/.test(code);
const isForceDynamic = (code: string) => /export const dynamic\s*=\s*["']force-dynamic["']/.test(code);

describe("page.tsx の描画方式の契約", () => {
  const pages = readPages();

  it("revalidate を持つ動的 route は generateStaticParams も持つ (無ければ実行時 ISR が効かない)", () => {
    const missing = pages
      .filter((p) => isDynamicSegment(p.file) && hasRevalidate(p.code) && !hasStaticParams(p.code))
      .map((p) => p.file);
    expect(missing).toEqual(REVALIDATE_WITHOUT_STATIC_PARAMS_PAGES.map((e) => e.file).sort());
  });

  it("generateStaticParams は空配列を返す (キー列はビルド時の notFound 固着を招く。許可リストを除く)", () => {
    const keyed = pages
      .filter((p) => hasStaticParams(p.code) && !returnsEmptyStaticParams(p.code))
      .map((p) => p.file);
    expect(keyed).toEqual(KEYED_STATIC_PARAMS_PAGES.map((e) => e.file).sort());
  });

  it("force-dynamic の page の集合が許可リストと完全一致する (増減どちらも落ちる)", () => {
    const actual = pages.filter((p) => isForceDynamic(p.code)).map((p) => p.file);
    expect(actual).toEqual([...FORCE_DYNAMIC_PAGES].sort());
  });

  it("CPU の大きい route は実行時 ISR の形になっている", () => {
    for (const file of ["ranking/[rankingKey]/page.tsx", "areas/[areaCode]/page.tsx", "areas/[areaCode]/[themeSlug]/page.tsx"]) {
      const page = pages.find((p) => p.file === file);
      expect(page, file).toBeDefined();
      expect(hasRevalidate(page!.code), file).toBe(true);
      expect(returnsEmptyStaticParams(page!.code), file).toBe(true);
      expect(isForceDynamic(page!.code), file).toBe(false);
    }
  });

  it("許可リストの各項目は理由を持ち、重複しない", () => {
    for (const list of [KEYED_STATIC_PARAMS_PAGES, REVALIDATE_WITHOUT_STATIC_PARAMS_PAGES]) {
      const files = list.map((e) => e.file);
      expect(new Set(files).size).toBe(files.length);
      for (const entry of list) expect(entry.reason.trim().length, entry.file).toBeGreaterThan(0);
    }
    expect(new Set(FORCE_DYNAMIC_PAGES).size).toBe(FORCE_DYNAMIC_PAGES.length);
  });
});
