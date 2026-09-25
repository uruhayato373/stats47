import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 出典表示の統一契約を source レベルで固定する。
 *
 * - ページ末尾の「データ出典」を描画するのは `DataSourceList` だけ
 *   (ブログ本文の手書き節・ランキングの旧 RankingSourceCard のような別経路を作らない)
 * - e-Stat 統計表の URL は `buildEstatTableUrl` だけが組み立てる
 * - ranking item の `source` (builder が出力しない旧フィールド) を参照しない。
 *   参照すると本番では常に空になり、出典カードと JSON-LD が黙って消えていた
 *
 * 正典: `docs/01_技術設計/04_デザインシステム.md`「データ出典」
 */

const ROOT = process.cwd();
const SRC = path.resolve(ROOT, "src");

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    if (statSync(abs).isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry)) continue;
      out.push(...listSourceFiles(abs));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(abs);
  }
  return out;
}

const FILES = listSourceFiles(SRC).map((abs) => ({
  file: path.relative(ROOT, abs).split(path.sep).join("/"),
  source: readFileSync(abs, "utf8"),
}));

const DATA_SOURCE_LIST = "src/components/molecules/DataSourceList.tsx";

describe("data source contract", () => {
  it("「データ出典」見出しを描画するのは DataSourceList だけ", () => {
    const offenders = FILES.filter(
      ({ file, source }) => file !== DATA_SOURCE_LIST && />\s*データ出典\s*</.test(source),
    ).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("e-Stat 統計表の URL を画面側で組み立てない (buildEstatTableUrl を使う)", () => {
    const offenders = FILES.filter(({ source }) => /e-stat\.go\.jp\/dbview\?sid=/.test(source)).map(
      ({ file }) => file,
    );
    expect(offenders).toEqual([]);
  });

  it("ranking item の旧 source フィールドを参照しない", () => {
    const offenders = FILES.filter(({ source }) =>
      /\b(?:rankingItem|itemDetail)\??\.source\b(?!Config)/.test(source),
    ).map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("ページ本体は DataSourceList を使って出典を出す", () => {
    const consumers = [
      "src/app/blog/[slug]/page.tsx",
      "src/features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx",
      "src/app/municipalities/ranking/[rankingKey]/page.tsx",
      "src/app/geo/layers/[layerSlug]/page.tsx",
    ];
    const missing = consumers.filter(
      (file) => !FILES.find((entry) => entry.file === file)?.source.includes("<DataSourceList"),
    );
    expect(missing).toEqual([]);
  });
});
