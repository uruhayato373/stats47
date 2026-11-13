import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import geoAnalyses from "../../../../../data/geo/analyses/analyses.json";
import { GEO_ANALYSIS_THEME_SOURCES } from "../../business-plan/geo-analysis-theme-sources";
import { pinLiterals } from "../source-literals";

/**
 * テーマの出典の台帳 (themes.sources) と読み込み口 (<名前>-source.ts) の対応を固定する。
 * 台帳のファイル名と読み込み口の名前がずれると、出典を足したのに読まれない・読み込み口が消えた台帳が残る。
 */
const themeCatalogDir = resolve(__dirname, "..");
const ledgerDir = resolve(__dirname, "../../../../../data/themes/sources");

describe("themes.sources", () => {
  it("台帳の 1 ファイルに読み込み口が 1 つずつある", () => {
    const ledger = readdirSync(ledgerDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length));
    const loaders = readdirSync(themeCatalogDir)
      .filter((f) => f.endsWith("-source.ts"))
      .map((f) => f.slice(0, -"-source.ts".length));
    expect(ledger.sort()).toEqual(loaders.sort());
    expect(ledger).toHaveLength(19);
  });

  // check-datasets の refs は参照先のキーにファイル名を使えないので、Geo 分析の themeSource の参照はここで縛る
  it("Geo 分析の themeSource は台帳のファイル名と結合の関数の両方にある", () => {
    const ledger = new Set(readdirSync(ledgerDir).map((f) => f.replace(/\.json$/, "")));
    const used = Object.values(geoAnalyses.analyses).flatMap((a) => ("themeSource" in a ? [a.themeSource] : []));
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) expect(ledger.has(name), name).toBe(true);
    for (const name of Object.keys(GEO_ANALYSIS_THEME_SOURCES)) expect(ledger.has(name), name).toBe(true);
  });

  it("読み込み口が型に明示した値と台帳の値が違えば止める", () => {
    expect(pinLiterals("x", "keys", ["a", "b"], ["a", "b"])).toEqual(["a", "b"]);
    expect(() => pinLiterals("x", "keys", ["a", "c"], ["a", "b"])).toThrow(/読み込み口の型/);
    expect(() => pinLiterals("x", "keys", ["a"], ["a", "b"])).toThrow(/読み込み口の型/);
  });
});
