/**
 * WP2 境界チェックの分類テスト (mutation testing)。
 * 実行: node --test .claude/scripts/lib/__tests__/check-web-estat-imports.test.cjs
 *
 * ★値 import と型のみ import の分類を両方向で固定する。実装中に踏んだ罠を回帰させない:
 *   - 単一/複数行 `import type` を値 import と誤検出しない
 *   - 混在 `import { type A, valueB }` は値 import
 *   - インライン `import("...").Foo` 型参照は値でない
 *   - ファイル先頭の別 import から estat-api の from まで非貪欲マッチが跨がない (文境界)
 */
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  hasEstatValueImport,
  diffAgainstAllowlist,
  collectValueImportFiles,
  ALLOWLIST,
} = require("../check-web-estat-imports.cjs");

describe("hasEstatValueImport — 値 import を検知", () => {
  const isValue = (t) => hasEstatValueImport(t);
  it("単一行の値 import", () => {
    assert.equal(isValue(`import { fetchFormattedStats } from "@stats47/estat-api/server";`), true);
  });
  it("複数行の値 import", () => {
    assert.equal(
      isValue(`import {\n  fetchFormattedStats,\n  extractYearsFromStats,\n} from "@stats47/estat-api/server";`),
      true,
    );
  });
  it("混在 import { type A, valueB } は値", () => {
    assert.equal(
      isValue(`import { fetchFormattedStats, type GetStatsDataParams } from "@stats47/estat-api/server";`),
      true,
    );
  });
});

describe("hasEstatValueImport — 型のみは値でない (誤検出しない)", () => {
  const isValue = (t) => hasEstatValueImport(t);
  it("単一行 import type", () => {
    assert.equal(isValue(`import type { GetStatsDataParams } from "@stats47/estat-api/server";`), false);
  });
  it("複数行 import type", () => {
    assert.equal(
      isValue(`import type {\n  GetStatsDataParams,\n} from "@stats47/estat-api/server";`),
      false,
    );
  });
  it("インライン import 型参照 (import(\"...\").Foo)", () => {
    assert.equal(
      isValue(`const x = params as unknown as import("@stats47/estat-api/server").GetStatsDataParams;`),
      false,
    );
  });
  it("★先頭の別 import から estat-api の from まで跨がない (文境界)", () => {
    // React の値 import が先にあり、その後 estat-api の import type が来るファイル。
    const text = [
      `import React from "react";`,
      `import { useState } from "react";`,
      `import type { GetStatsDataParams } from "@stats47/estat-api/server";`,
    ].join("\n");
    assert.equal(isValue(text), false);
  });
  it("estat-api を全く import しない", () => {
    assert.equal(isValue(`import { foo } from "@/lib/foo";`), false);
  });
});

describe("diffAgainstAllowlist — ratchet", () => {
  it("allowlist 通りなら new も resolved も無い", () => {
    const { newOnes, resolved } = diffAgainstAllowlist([...ALLOWLIST]);
    assert.deepEqual(newOnes, []);
    assert.deepEqual(resolved, []);
  });
  it("★新規の値 import は違反として出る", () => {
    const { newOnes } = diffAgainstAllowlist([...ALLOWLIST, "features/new/leak.ts"]);
    assert.deepEqual(newOnes, ["features/new/leak.ts"]);
  });
  it("allowlist から消えたら resolved (移行の進捗)", () => {
    const shrunk = ALLOWLIST.slice(1);
    const { resolved } = diffAgainstAllowlist(shrunk);
    assert.deepEqual(resolved, [ALLOWLIST[0]]);
  });
});

describe("実ツリーで allowlist と一致する", () => {
  it("現行の値 import は allowlist と完全一致 (new/resolved 0)", () => {
    const found = collectValueImportFiles();
    const { newOnes, resolved } = diffAgainstAllowlist(found);
    assert.deepEqual(newOnes, [], `新規違反: ${newOnes.join(", ")}`);
    assert.deepEqual(resolved, [], `未除去の移行済み: ${resolved.join(", ")}`);
  });
});
