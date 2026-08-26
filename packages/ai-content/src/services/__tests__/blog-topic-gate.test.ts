import { describe, expect, it } from "vitest";

import { checkGroundedRows, findKnownBrokenChecks, gateTopicData } from "../blog-topic-gate";

const NOW = new Date("2026-07-31T00:00:00Z");
const KNOWN_BROKEN_FIXTURE = [
  {
    key: "test-known-broken",
    check: "percent-out-of-range" as const,
    entities: ["prefecture" as const],
    disposition: "known-broken" as const,
    observedSeverity: 200,
    reason: "テスト専用の既知破損データ",
    issue: "TEST-ONLY",
    until: "2026-12-31",
  },
];

/** 47 県ぶんのダミー行 (値は全て異なる) */
function healthyRows(n = 47) {
  return Array.from({ length: n }, (_, i) => ({
    areaName: `県${i + 1}`,
    value: 100 - i,
    rank: i + 1,
  }));
}

describe("checkGroundedRows", () => {
  it("47 県・値が異なるデータは通す", () => {
    expect(checkGroundedRows(healthyRows()).ok).toBe(true);
  });

  it("対象外県がある metric (40 県台) も通す — 港湾・漁港系で正常", () => {
    // 「47 でなければ違反」にすると port-* / fishery-* 系を誤検知する。
    expect(checkGroundedRows(healthyRows(41)).ok).toBe(true);
  });

  it("★同一県が複数行なら弾く (分類軸の絞り忘れ = 実際に踏んだ壊れ方)", () => {
    const rows = [...healthyRows(47), { areaName: "県1", value: -1.7, rank: 48 }];
    const v = checkGroundedRows(rows);
    expect(v.ok).toBe(false);
    expect(v.reasons.join()).toMatch(/同一県が複数行/);
  });

  it("47 県を超える行数は弾く", () => {
    const rows = Array.from({ length: 94 }, (_, i) => ({
      areaName: `県${i}`,
      value: 100 - i,
      rank: i + 1,
    }));
    const v = checkGroundedRows(rows);
    expect(v.ok).toBe(false);
    expect(v.reasons.join()).toMatch(/47 県を超えている/);
  });

  it("県が極端に少なければ弾く", () => {
    const v = checkGroundedRows(healthyRows(12));
    expect(v.ok).toBe(false);
    expect(v.reasons.join()).toMatch(/網羅が足りない/);
  });

  it("非有限値を含めば弾く", () => {
    const rows = healthyRows();
    rows[3] = { areaName: "県4", value: Number.NaN, rank: 4 };
    expect(checkGroundedRows(rows).ok).toBe(false);
  });

  it("全県同値なら弾く (差を論じる記事にならない)", () => {
    const rows = healthyRows().map((r) => ({ ...r, value: 10 }));
    const v = checkGroundedRows(rows);
    expect(v.ok).toBe(false);
    expect(v.reasons.join()).toMatch(/全県が同じ値/);
  });

  it("0 行は弾く", () => {
    expect(checkGroundedRows([]).ok).toBe(false);
  });
});

describe("findKnownBrokenChecks", () => {
  it("★allowlist に known-broken で載る key を検出する", () => {
    const hits = findKnownBrokenChecks("test-known-broken", NOW, KNOWN_BROKEN_FIXTURE);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.join()).toMatch(/percent-out-of-range/);
  });

  it("legitimate な100％超の公式値は known-broken と扱わない", () => {
    expect(findKnownBrokenChecks("employment-insurance-daily-receipt-rate", NOW)).toEqual([]);
  });

  it("allowlist に無い key は空", () => {
    expect(findKnownBrokenChecks("no-such-metric-key-xyz", NOW)).toEqual([]);
  });

  it("期限切れの entry は許可扱いしない (= 検出もしない)", () => {
    // until を過ぎると findExpectedShapeAnomaly が null を返すため hits も空になる。
    // 「期限切れ = 素通し」ではなく、接地データ側の検査 (checkGroundedRows) が実データで弾く。
    const far = new Date("2030-01-01T00:00:00Z");
    expect(findKnownBrokenChecks("test-known-broken", far, KNOWN_BROKEN_FIXTURE)).toEqual([]);
  });
});

describe("gateTopicData", () => {
  it("健全な key + 健全なデータなら通す", () => {
    expect(gateTopicData("no-such-metric-key-xyz", healthyRows(), NOW).ok).toBe(true);
  });

  it("★known-broken な key はデータが綺麗に見えても書かない", () => {
    const v = gateTopicData("test-known-broken", healthyRows(), NOW, KNOWN_BROKEN_FIXTURE);
    expect(v.ok).toBe(false);
    expect(v.reasons.join()).toMatch(/既知の壊れ/);
  });

  it("allowlist に無くても接地データが壊れていれば弾く", () => {
    const rows = [...healthyRows(), { areaName: "県1", value: 1, rank: 48 }];
    expect(gateTopicData("no-such-metric-key-xyz", rows, NOW).ok).toBe(false);
  });
});
