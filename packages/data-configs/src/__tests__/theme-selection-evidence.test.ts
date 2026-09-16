import { describe, expect, it } from "vitest";

import { validateSelectionEvidence } from "../../scripts/validate-theme-catalog";
import { METRICS_REGISTRY } from "../registry";
import type { CatalogMetric, MetricSelection, ThemeCatalog } from "../theme-catalog/types";

/**
 * 「一次資料で裏付けた」と主張する selection (adoptionCriteria あり) の機械検査契約。
 * 夜間 backfill (THEME-SELECTION-BACKFILL-01) の書き込みを目視なしで受け入れる床なので、
 * 誤記コード・定型文・出典欠落・全基準列挙の 4 つが error になることを固定する。
 */

/** registry から cdCat01 付きの e-Stat 指標を 1 つ取る (固定キーに依存しない)。 */
const ESTAT_KEY = (() => {
  const hit = Object.entries(METRICS_REGISTRY).find(
    ([, m]) => m.source.kind === "estat" && typeof (m.source as { cdCat01?: string }).cdCat01 === "string" && /^#[A-Z]\d{5,}$/.test((m.source as { cdCat01: string }).cdCat01),
  );
  if (!hit) throw new Error("cdCat01 (#Axxxxx 形式) 付きの estat metric が registry に無い");
  return hit[0];
})();
const OWN_CODE = (METRICS_REGISTRY[ESTAT_KEY].source as { cdCat01: string }).cdCat01;

function catalog(metrics: CatalogMetric[]): ThemeCatalog {
  return { key: "test-theme", title: "テスト", description: "テスト", category: "economy", usage: "theme", metrics, charts: [] };
}

function evidenced(overrides: Partial<MetricSelection> = {}): MetricSelection {
  return {
    proposedBy: "令和7年版 高齢社会白書 第1章第1節",
    sourceUrl: "https://www8.cao.go.jp/kourei/whitepaper/w-2025/html/zenbun/s1_1_4.html",
    surveyedAt: "2026-09-16",
    rationale: "白書が地域比較の中心指標として都道府県別の値を掲げており、テーマの主問に直接答える。",
    adoptionCriteria: ["representativeness", "readerValue"],
    ...overrides,
  };
}

function run(selection: MetricSelection, rankingKey = ESTAT_KEY): string[] {
  const errors: string[] = [];
  validateSelectionEvidence(catalog([{ rankingKey, shortLabel: "x", role: "primary", selection }]), errors);
  return errors;
}

describe("validateSelectionEvidence", () => {
  it("一次資料付きの正しい selection はエラーなし", () => {
    expect(run(evidenced())).toEqual([]);
  });

  it("rationale の統計指標コードが metric config の cdCat01 と一致すれば通る", () => {
    expect(run(evidenced({ rationale: `社会生活統計指標${OWN_CODE}と定義が一致する。` }))).toEqual([]);
  });

  it("コードの誤記 (別コード) を error にする — adoptionCriteria が無くても見る", () => {
    const wrong = OWN_CODE.replace(/\d$/, (d) => String((Number(d) + 1) % 10));
    expect(run(evidenced({ rationale: `社会生活統計指標${wrong}と一致する。` }))).toEqual([
      expect.stringContaining("[selection-code-mismatch]"),
    ]);
    expect(run({ proposedBy: "x", surveyedAt: "2026-09-08", rationale: `${wrong}を参照する。` })).toEqual([
      expect.stringContaining("[selection-code-mismatch]"),
    ]);
  });

  it("adoptionCriteria 付きなのに定型文が残っていれば error", () => {
    const errors = run(evidenced({ rationale: "総人口は詳細索引に保持し、冒頭の要約へ重ねない。" }));
    expect(errors.filter((e) => e.includes("[selection-boilerplate]"))).toHaveLength(2);
    expect(run(evidenced({ proposedBy: "全テーマ構成監査（既存統計・公開データの照合）" }))).toEqual([
      expect.stringContaining("[selection-boilerplate]"),
    ]);
  });

  it("adoptionCriteria 無しの定型文は warn 側 (no-adoption-criteria) に任せ、ここでは黙る", () => {
    expect(run({ proposedBy: "全テーマ構成監査", surveyedAt: "2026-09-08", rationale: "総人口は詳細索引に保持し、冒頭の要約へ重ねない。" })).toEqual([]);
  });

  it("adoptionCriteria 付きは https の sourceUrl と ISO 日付の surveyedAt が必須", () => {
    expect(run(evidenced({ sourceUrl: undefined }))).toEqual([expect.stringContaining("[selection-source-required]")]);
    expect(run(evidenced({ sourceUrl: "http://example.go.jp/x" }))).toEqual([expect.stringContaining("[selection-source-required]")]);
    expect(run(evidenced({ surveyedAt: "2026/09/16" }))).toEqual([expect.stringContaining("surveyedAt")]);
  });

  it("5 基準を全部列挙したら error (満たす基準だけを書く規律)", () => {
    expect(
      run(evidenced({ adoptionCriteria: ["representativeness", "comparability", "complementarity", "dataQuality", "readerValue"] })),
    ).toEqual([expect.stringContaining("[selection-criteria-all]")]);
  });
});
