// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 「クエリ文字列でサーバー描画の内容を変えない」契約 (2026-11-13 オーナー決定)。
 *
 * サーバーが描き分ける違いはパスで表す。`?` はサイト内検索だけ。検索に出さない画面操作の状態
 * (ページ送り・自治体名検索) は URL に載せない。クエリごとに描画が変わるページは、クローラーが
 * クエリの組み合わせを総なめして Workers CPU 課金を増やす (市区町村ランキングの ?pref= / ?page= が実例で、
 * 課金の約 28% を占めた)。
 *
 * 許可リストは縮小専用。新しいページでクエリを読みたくなったら、パスにするかブラウザ側の状態にする。
 * 棚卸しは backlog URL-QUERY-INVENTORY-01。
 * 増えても減っても落ちる (減ったら許可リストから消させるため)。
 */

const APP_DIR = resolve(import.meta.dirname, "../app");

/** `searchParams` を読む page.tsx の許可リスト。`file` は apps/web/src/app からの相対パス。 */
const ALLOWED_SEARCH_PARAMS_PAGES: ReadonlyArray<{ file: string; reason: string }> = [
  {
    file: "blog/page.tsx",
    reason: "ブログ一覧のページ送り (?page=N)。検索に出している一覧で、パスへ移すかの判断待ち (URL-QUERY-INVENTORY-01)。",
  },
  {
    file: "category/[categoryKey]/compare/page.tsx",
    reason: "比較する県の選択 (?areas=)。noindex の操作画面で、パスへ移すか廃止するかの判断待ち。",
  },
  {
    file: "geo/compare/page.tsx",
    reason: "県の初期選択 (?pref=)。Geo の判定表の初期表示に使う移行判断待ち。",
  },
  {
    file: "geo/layers/[layerSlug]/page.tsx",
    reason: "GIS レイヤーの対象県の切り替え (?pref=)。パスへ移す移行判断待ち。",
  },
  {
    file: "geo/map/page.tsx",
    reason: "重ねる主題と範囲の選択 (?base= / ?subjects= / ?scope=)。素の /geo/map を canonical にして、組み合わせは noindex にしている。",
  },
  {
    file: "geo/[analysisSlug]/page.tsx",
    reason: "Geo 分析の県・段階・施設群の切り替え (?pref= / ?stage= / ?group=)。県別の段階ページは別にあり、パスへ寄せる移行判断待ち。",
  },
  {
    file: "geo/[analysisSlug]/[prefCode]/[stage]/page.tsx",
    reason: "Geo 分析の県別・段階別ページの施設群の切り替え (?group=)。パスにするかブラウザ側の状態にするかの移行判断待ち。",
  },
  {
    file: "search/page.tsx",
    reason: "サイト内検索の入力 (?q= と絞り込み)。`?` を使ってよい唯一の面で、noindex。",
  },
  {
    file: "themes/[themeSlug]/page.tsx",
    reason: "県ごとのページを持たないテーマの県の選択 (?pref=)。県ごとのページを持つテーマは middleware が /areas/<県>/<テーマ> へ 301 する。移行判断待ち。",
  },
];

const MUNICIPALITY_RANKING_PAGE = "municipalities/ranking/[rankingKey]/page.tsx";

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

function pagesReadingSearchParams(): string[] {
  return findPageFiles(APP_DIR)
    .filter((path) => /\bsearchParams\b/.test(stripComments(readFileSync(path, "utf8"))))
    .map((path) => relative(APP_DIR, path).split("\\").join("/"))
    .sort();
}

describe("searchParams を読む page.tsx の契約", () => {
  it("searchParams を読むページの集合が許可リストと完全一致する (増減どちらも落ちる)", () => {
    const allowed = ALLOWED_SEARCH_PARAMS_PAGES.map((entry) => entry.file).sort();
    expect(pagesReadingSearchParams()).toEqual(allowed);
  });

  it("許可リストの各項目は理由を持ち、重複しない", () => {
    const files = ALLOWED_SEARCH_PARAMS_PAGES.map((entry) => entry.file);
    expect(new Set(files).size).toBe(files.length);
    for (const entry of ALLOWED_SEARCH_PARAMS_PAGES) {
      expect(entry.reason.trim().length, entry.file).toBeGreaterThan(0);
    }
  });

  it("市区町村ランキングの全国版は searchParams を読まず、許可リストにも載せない", () => {
    expect(ALLOWED_SEARCH_PARAMS_PAGES.map((entry) => entry.file)).not.toContain(MUNICIPALITY_RANKING_PAGE);
    expect(pagesReadingSearchParams()).not.toContain(MUNICIPALITY_RANKING_PAGE);
  });
});
