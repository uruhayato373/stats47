import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import Ajv from "ajv";
import { describe, expect, it } from "vitest";

import { THEME_CATALOGS } from "..";

// テーマ定義の SSOT は data/themes/catalogs/<key>.json (2026-10-06 に git TS から移した)。
// index.ts の import 一覧・ファイル名・形・整形がずれると、表示されないテーマや読めない JSON が生まれる。
const THEMES_DIR = path.resolve(__dirname, "../../../../../data/themes");
const CATALOGS_DIR = path.join(THEMES_DIR, "catalogs");

const catalogFiles = readdirSync(CATALOGS_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();

const validate = new Ajv({ allErrors: true }).compile(
  JSON.parse(readFileSync(path.join(THEMES_DIR, "theme-catalog.schema.json"), "utf8")),
);

function readCatalog(name: string): { raw: string; data: Record<string, unknown> } {
  const raw = readFileSync(path.join(CATALOGS_DIR, name), "utf8");
  return { raw, data: JSON.parse(raw) };
}

describe("data/themes/catalogs のテーマ定義", () => {
  it("index.ts の登録一覧と data/themes/catalogs のファイルが 1 対 1 で対応する", () => {
    expect(Object.keys(THEME_CATALOGS).map((key) => `${key}.json`).sort()).toEqual(catalogFiles);
  });

  it.each(catalogFiles)("%s はファイル名と key が一致し、schema を満たす", (name) => {
    const { data } = readCatalog(name);
    expect(data.key).toBe(name.replace(/\.json$/, ""));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each(catalogFiles)("%s は 2 スペース・末尾改行の整形で保存されている", (name) => {
    // 夜間の選定根拠 backfill など機械の書き込みが同じ形で書くので、手編集で形が崩れると差分が膨らむ
    const { raw, data } = readCatalog(name);
    expect(raw).toBe(`${JSON.stringify(data, null, 2)}\n`);
  });

  it("JSON の読み込みは副作用なしと宣言したサブモジュールに閉じている (クライアントのチャンクに入れないため)", () => {
    // barrel (index.ts) が JSON を直接 import すると、GIS 原典の定数だけを使うクライアント部品にも
    // 55 テーマ分の JSON が JSON.parse として埋め込まれ、圧縮でも消えない (2026-10-06 実測: 初回 JS +134kB)
    const catalogDir = path.resolve(__dirname, "..");
    expect(readFileSync(path.join(catalogDir, "index.ts"), "utf8")).not.toMatch(/from\s+["'][^"']*data\/themes\//);
    expect(JSON.parse(readFileSync(path.join(catalogDir, "catalogs/package.json"), "utf8")).sideEffects).toBe(false);
  });

  it("schema は型の外れた定義を弾く (検査が空振りしていないことの確認)", () => {
    const { data } = readCatalog(catalogFiles[0]);
    const charts = data.charts as Array<Record<string, unknown>>;
    const brokenChart = { ...data, charts: [{ ...charts[0], componentType: "bar-chart" }, ...charts.slice(1)] };
    expect(validate(brokenChart)).toBe(false);
    expect(validate({ ...data, unknownField: true })).toBe(false);
    const metrics = data.metrics as Array<Record<string, unknown>>;
    expect(validate({ ...data, metrics: [{ ...metrics[0], role: "headline" }] })).toBe(false);
  });
});
