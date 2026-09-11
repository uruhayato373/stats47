import { describe, expect, it } from "vitest";

import { validateMetricGroups } from "../../scripts/validate-theme-catalog";
import { METRICS_REGISTRY } from "../registry";
import { THEME_CATALOGS } from "../theme-catalog";
import { normalizeUnitForAxis, type ThemeCatalog } from "../theme-catalog/types";

/**
 * metricGroups (指標カードの編成) の検査契約。
 *
 * ここで守りたいのは「定義した瞬間に壊れているグループを弾く」こと。
 * UI 側は軸を 2 本しか持てないので、単位が 3 種以上のグループは描けない。
 * 実在しないキーや空の初期チェックは、そのままだと空カード / 系列ゼロになる。
 */

/** 実在する metric から、単位ごとに 1 件ずつ選ぶ (検査は METRICS_REGISTRY を引くため実キーが要る) */
function keyWithUnit(unit: string): string {
  const hit = Object.entries(METRICS_REGISTRY).find(
    ([, m]) => normalizeUnitForAxis(m.unit ?? "") === normalizeUnitForAxis(unit),
  );
  if (!hit) throw new Error(`単位 "${unit}" を持つ metric が registry に無い`);
  return hit[0];
}

const YEN = keyWithUnit("円");
const PERCENT = keyWithUnit("％");
const TIMES = keyWithUnit("倍");

function catalog(groups: ThemeCatalog["metricGroups"], keys: string[]): ThemeCatalog {
  return {
    key: "test-theme",
    title: "テスト",
    description: "テスト",
    category: "economy",
    usage: "theme",
    metrics: keys.map((k) => ({
      rankingKey: k,
      shortLabel: k,
      role: "secondary" as const,
    })),
    charts: [],
    metricGroups: groups,
  };
}

function run(c: ThemeCatalog) {
  const errors: string[] = [];
  const warns: string[] = [];
  validateMetricGroups(c, new Set(c.metrics.map((m) => m.rankingKey)), errors, warns);
  return { errors, warns };
}

describe("validateMetricGroups — error", () => {
  it("専用財政カードは実配置時だけ所属として認め、削除すれば未配置を検出する", () => {
    const c = structuredClone(THEME_CATALOGS['local-finance']);
    expect(run(c).warns).toEqual([]);
    c.sections = [];
    expect(run(c).warns.filter((warning) => warning.startsWith('[group-orphan]'))).toHaveLength(4);
  });
  it("単位 3 種のグループを弾く (Y 軸は左右 2 本しかない)", () => {
    const { errors } = run(
      catalog(
        [{ key: "g", title: "G", rankingKeys: [YEN, PERCENT, TIMES], defaultCheckedKeys: [YEN] }],
        [YEN, PERCENT, TIMES],
      ),
    );
    expect(errors.some((e) => e.startsWith("[group-units]"))).toBe(true);
  });

  it("単位 2 種は通す (2 軸で描けるので分割を強制しない)", () => {
    const { errors } = run(
      catalog(
        [{ key: "g", title: "G", rankingKeys: [YEN, PERCENT], defaultCheckedKeys: [YEN] }],
        [YEN, PERCENT],
      ),
    );
    expect(errors).toEqual([]);
  });

  it("metrics に無い rankingKey を弾く", () => {
    const { errors } = run(
      catalog([{ key: "g", title: "G", rankingKeys: [YEN, "ghost"], defaultCheckedKeys: [YEN] }], [YEN]),
    );
    expect(errors.some((e) => e.startsWith("[group-key]"))).toBe(true);
  });

  it("defaultCheckedKeys が空なら弾く (系列ゼロでカードが開く)", () => {
    const { errors } = run(
      catalog([{ key: "g", title: "G", rankingKeys: [YEN], defaultCheckedKeys: [] }], [YEN]),
    );
    expect(errors.some((e) => e.startsWith("[group-default]"))).toBe(true);
  });

  it("defaultCheckedKeys が rankingKeys の外なら弾く", () => {
    const { errors } = run(
      catalog(
        [{ key: "g", title: "G", rankingKeys: [YEN], defaultCheckedKeys: [PERCENT] }],
        [YEN, PERCENT],
      ),
    );
    expect(errors.some((e) => e.startsWith("[group-default]"))).toBe(true);
  });

  it("group key / title の重複を弾く", () => {
    const { errors } = run(
      catalog(
        [
          { key: "g", title: "G", rankingKeys: [YEN], defaultCheckedKeys: [YEN] },
          { key: "g", title: "G", rankingKeys: [PERCENT], defaultCheckedKeys: [PERCENT] },
        ],
        [YEN, PERCENT],
      ),
    );
    expect(errors.some((e) => e.startsWith("[group-dup-key]"))).toBe(true);
    expect(errors.some((e) => e.startsWith("[group-dup-title]"))).toBe(true);
  });

  it("rankingKeys が空なら弾く", () => {
    const { errors } = run(
      catalog([{ key: "g", title: "G", rankingKeys: [], defaultCheckedKeys: [YEN] }], [YEN]),
    );
    expect(errors.some((e) => e.startsWith("[group-empty]"))).toBe(true);
  });
});

describe("validateMetricGroups — warn", () => {
  it("どのグループにも入らない非 context 指標を warn する", () => {
    const { warns } = run(
      catalog(
        [{ key: "g", title: "G", rankingKeys: [YEN], defaultCheckedKeys: [YEN] }],
        [YEN, PERCENT],
      ),
    );
    expect(warns.some((w) => w.startsWith("[group-orphan]"))).toBe(true);
  });

  it("初期チェックが 4 件以上なら warn する (初期取得が増える)", () => {
    const keys = Object.keys(METRICS_REGISTRY).slice(0, 4);
    const { warns } = run(
      catalog([{ key: "g", title: "G", rankingKeys: keys, defaultCheckedKeys: keys }], keys),
    );
    expect(warns.some((w) => w.startsWith("[group-default-many]"))).toBe(true);
  });

  it("metricGroups 未定義なら何も言わない (カタログ未登録テーマを壊さない)", () => {
    const { errors, warns } = run(catalog(undefined, [YEN, PERCENT]));
    expect(errors).toEqual([]);
    expect(warns).toEqual([]);
  });
});

describe("normalizeUnitForAxis", () => {
  it("全角と半角のパーセントを同じ軸に載せる", () => {
    expect(normalizeUnitForAxis("％")).toBe(normalizeUnitForAxis("%"));
  });

  it("★円と千円は別物のまま (桁が 1000 倍違うので同じ軸に載せない)", () => {
    expect(normalizeUnitForAxis("円")).not.toBe(normalizeUnitForAxis("千円"));
  });
});


describe("固定年の比較条件", () => {
  it("比較年を4桁年へ限定する", () => {
    const { errors } = run(catalog([{ key: "fixed", title: "Fixed", rankingKeys: [YEN], defaultCheckedKeys: [YEN], comparisonYear: "latest" }], [YEN]));
    expect(errors.some((error) => error.startsWith("[group-comparison-year]"))).toBe(true);
  });
  it("同じ指標へ異なる比較年を設定させない", () => {
    const { errors } = run(catalog([
      { key: "before", title: "Before", rankingKeys: [YEN], defaultCheckedKeys: [YEN], comparisonYear: "2021" },
      { key: "after", title: "After", rankingKeys: [YEN], defaultCheckedKeys: [YEN], comparisonYear: "2023" },
    ], [YEN]));
    expect(errors.some((error) => error.startsWith("[group-comparison-year]"))).toBe(true);
  });
});
