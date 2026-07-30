import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { spliceEntries } from "../../scripts/shrink-shape-allowlist";

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(HERE, "../expected-shape-anomaly.ts");

/** scanner の `--emit-allowlist` が実際に出す形 (エントリのリテラルだけ) */
const EMITTED = `// 生成日時: 2026-07-30T00:00:00.000Z / エントリ数: 2
  {
    key: "alpha-metric",
    check: "percent-out-of-range",
    disposition: "known-broken",
    observedSeverity: 123,
    reason: "テスト",
    issue: "TEST-01",
    until: "2026-12-31",
  },
  {
    key: "beta-metric",
    check: "duplicate-area-year",
    disposition: "known-broken",
    observedSeverity: 2,
    reason: "テスト",
    issue: "TEST-01",
    until: "2026-12-31",
  },
`;

describe("spliceEntries — ★ファイルを壊さないこと", () => {
  const current = readFileSync(TARGET, "utf8");
  const next = spliceEntries(current, EMITTED, 2);

  it("import と型参照が残る (これを失うとビルドが通らない)", () => {
    expect(next).toContain('import type { ExpectedShapeAnomalyEntry } from "./shape-gate";');
    expect(next).toContain(
      "export const EXPECTED_SHAPE_ANOMALY: readonly ExpectedShapeAnomalyEntry[] = [",
    );
  });

  it("★MAX_KNOWN_BROKEN が残り、新しい件数に更新される", () => {
    // scanner の出力にはこの定数が含まれない。単純上書きすると消えて
    // import 元 (index.ts / テスト) が全部壊れる
    expect(next).toContain("export const MAX_KNOWN_BROKEN = 2;");
    expect(next).not.toContain("export const MAX_KNOWN_BROKEN = 203;");
  });

  it("設計コメント (allowlist を腐らせない 3 つの仕掛け) が残る", () => {
    expect(next).toContain("allowlist を腐らせない");
  });

  it("配列の中身が入れ替わる", () => {
    expect(next).toContain('key: "alpha-metric"');
    expect(next).toContain('key: "beta-metric"');
    expect(next).not.toContain('key: "vacant-housing-rate"');
  });

  it("生成日時コメントを配列の中に混ぜない (構文エラーになる)", () => {
    const body = next.slice(
      next.indexOf("EXPECTED_SHAPE_ANOMALY: readonly"),
      next.indexOf("\n];", next.indexOf("EXPECTED_SHAPE_ANOMALY: readonly")),
    );
    expect(body).not.toContain("生成日時");
  });

  it("配列は 1 つだけ閉じられている (終端の重複・欠落がない)", () => {
    expect(next.match(/\n\];/g) ?? []).toHaveLength(1);
  });

  it("宣言が見つからなければ throw (黙って壊さない)", () => {
    expect(() => spliceEntries("export const OTHER = [];\n", EMITTED, 1)).toThrow(
      /配列宣言が見つかりません/,
    );
  });
});
