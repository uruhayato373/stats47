import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * サイト内 URL はテンプレート文字列で組み立てず、route 契約 (data/content/routes.json) から作る。
 * 組み立て口: `hrefFor()` (`@stats47/data-configs/content/href`)、テーマは `themeHref()`。
 *
 * 2026-10-26 に約 190 行あった `/ranking/${key}` などの直書きは、2026-10-27 (WIRING-URL-HREF-REST-01)
 * で middleware・sitemap・app/themes を含めて全件置き換えた。例外は置かない。
 * 検出対象は「パスの先頭が既知の route の語」の形だけ。外部 URL (`https://…`)・クエリや hash だけの
 * 組み立て (`?pref=…`)・API/R2 キー (`app/ranking/…`) は route 契約の外なので検出しない。
 * route が無い URL は routes.json に route を足して hrefFor() へ名前を登録する。
 */

const SRC = path.resolve(process.cwd(), "src");

/** `/ranking/${…}` や `${base}/areas/${…}` のように、パスの先頭からサイト内 URL を組み立てる書き方 */
const DIRECT_HREF = /(?:`|\})\/(?:ranking|areas|themes|blog|tag|category|geo|survey|municipalities|japan|products)\/\$\{/g;

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

  it("直書きが 0 件 (hrefFor() / themeHref() で作る)", () => {
    expect(rows.map((r) => `${r.rel}:${r.line}: ${r.text}`)).toEqual([]);
  });

  it("検出パターンが直書きを捕まえる (検査の検査)", () => {
    expect("href={`/ranking/${key}`}".match(DIRECT_HREF)).toHaveLength(1);
    expect("url: `${BASE_URL}/areas/${code}`".match(DIRECT_HREF)).toHaveLength(1);
    expect("`app/ranking/${key}/item.json`".match(DIRECT_HREF)).toBeNull();
  });
});
