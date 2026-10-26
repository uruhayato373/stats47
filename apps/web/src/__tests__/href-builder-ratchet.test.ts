import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * サイト内 URL はテンプレート文字列で組み立てず、route 契約 (data/content/routes.json) から作る。
 * 組み立て口: `hrefFor()` (`@stats47/data-configs/content/href`)、テーマは `themeHref()`。
 *
 * 2026-10-26 時点で `/ranking/${key}` などの直書きが約 190 行あり、テーマは既存の themeHref を
 * 迂回する箇所が 5 件あった。ランキングとテーマ (theme-dashboard 外) の直書きを置き換え、
 * 残りは件数を固定して縮小だけを許す (ラチェット)。置き換えたら下の上限を実数へ下げる。
 * app/themes/** は別の作業で編集中のため 2026-10-26 時点の計測から外している。
 */

const SRC = path.resolve(process.cwd(), "src");

/** `/ranking/${…}` や `${base}/areas/${…}` のように、パスの先頭からサイト内 URL を組み立てる書き方 */
const DIRECT_HREF = /(?:`|\})\/(?:ranking|areas|themes|blog|tag|category|geo|survey|municipalities|japan|products)\/\$\{/g;

/** 縮小専用の上限。増えたら hrefFor() で書く。減ったらこの数を下げる */
const MAX_DIRECT_HREFS = 141;

/** ランキングの直書きは middleware のリダイレクト組み立てだけを残す (Edge の転送処理) */
const RANKING_DIRECT_ALLOWED = new Set(["src/middleware.ts"]);

function listSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry)) continue;
      out.push(...listSources(abs));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(abs);
  }
  return out;
}

function scan() {
  const rows: { rel: string; line: number; text: string }[] = [];
  for (const file of listSources(SRC)) {
    const rel = path.relative(path.resolve(SRC, ".."), file).split(path.sep).join("/");
    if (rel.startsWith("src/app/themes/")) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((text, i) => {
        const hits = text.match(DIRECT_HREF)?.length ?? 0;
        for (let n = 0; n < hits; n++) rows.push({ rel, line: i + 1, text: text.trim() });
      });
  }
  return rows;
}

describe("サイト内 URL の直書き (ラチェット)", () => {
  const rows = scan();

  it(`直書きの件数が上限 ${MAX_DIRECT_HREFS} を超えない`, () => {
    expect(rows.length, rows.map((r) => `${r.rel}:${r.line}`).join("\n")).toBeLessThanOrEqual(MAX_DIRECT_HREFS);
  });

  it("ランキング URL は hrefFor('ranking') で作る (middleware を除く)", () => {
    const offenders = rows
      .filter((r) => /\/ranking\/\$\{/.test(r.text) && !/\/(?:api|app|municipalities)\/ranking\//.test(r.text))
      .filter((r) => !RANKING_DIRECT_ALLOWED.has(r.rel))
      .map((r) => `${r.rel}:${r.line}: ${r.text}`);
    expect(offenders).toEqual([]);
  });

  it("テーマ URL は themeHref() で作る (theme-href.ts 自身と app/themes を除く)", () => {
    const offenders = rows
      .filter((r) => /(?:`|\})\/themes\/\$\{/.test(r.text))
      .map((r) => `${r.rel}:${r.line}: ${r.text}`);
    expect(offenders).toEqual([]);
  });

  it("検出パターンが直書きを捕まえる (検査の検査)", () => {
    expect("href={`/ranking/${key}`}".match(DIRECT_HREF)).toHaveLength(1);
    expect("url: `${BASE_URL}/areas/${code}`".match(DIRECT_HREF)).toHaveLength(1);
    expect("`app/ranking/${key}/item.json`".match(DIRECT_HREF)).toBeNull();
  });
});
