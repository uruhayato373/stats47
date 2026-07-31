import { describe, expect, it } from "vitest";

import { assessReingestNeed, summarizeReingest } from "../reingest-need";

describe("assessReingestNeed", () => {
  it("★config がデータより新しい = 再取り込みで直る", () => {
    const a = assessReingestNeed({
      key: "convenience-store-count-commercial",
      configModifiedAt: "2026-07-30T02:14:59Z",
      dataGeneratedAt: "2026-07-20T00:00:00Z",
    });
    expect(a.verdict).toBe("stale-delivery");
    expect(a.note).toMatch(/10 日新しい/);
  });

  it("データが新しい = 是正後に取り込んでも壊れている", () => {
    const a = assessReingestNeed({
      key: "x",
      configModifiedAt: "2026-07-01T00:00:00Z",
      dataGeneratedAt: "2026-07-30T00:00:00Z",
    });
    expect(a.verdict).toBe("config-insufficient");
  });

  it("同時刻は config-insufficient に倒す (誤って再取り込みを促さない)", () => {
    const a = assessReingestNeed({
      key: "x",
      configModifiedAt: "2026-07-30T00:00:00Z",
      dataGeneratedAt: "2026-07-30T00:00:00Z",
    });
    expect(a.verdict).toBe("config-insufficient");
  });

  it("config 更新日が取れなければ unknown", () => {
    const a = assessReingestNeed({
      key: "x",
      configModifiedAt: null,
      dataGeneratedAt: "2026-07-30T00:00:00Z",
    });
    expect(a.verdict).toBe("unknown");
    expect(a.note).toMatch(/config 更新日/);
  });

  it("データ生成日が取れなければ unknown", () => {
    const a = assessReingestNeed({
      key: "x",
      configModifiedAt: "2026-07-30T00:00:00Z",
      dataGeneratedAt: null,
    });
    expect(a.verdict).toBe("unknown");
    expect(a.note).toMatch(/データ生成日/);
  });

  it("両方欠けても落ちない", () => {
    const a = assessReingestNeed({ key: "x", configModifiedAt: null, dataGeneratedAt: null });
    expect(a.verdict).toBe("unknown");
  });

  it("解釈できない日付文字列は unknown", () => {
    const a = assessReingestNeed({
      key: "x",
      configModifiedAt: "そのうち",
      dataGeneratedAt: "2026-07-30T00:00:00Z",
    });
    expect(a.verdict).toBe("unknown");
  });
});

describe("summarizeReingest", () => {
  it("verdict 別に key を集計する", () => {
    const s = summarizeReingest([
      assessReingestNeed({ key: "a", configModifiedAt: "2026-07-30T00:00:00Z", dataGeneratedAt: "2026-07-01T00:00:00Z" }),
      assessReingestNeed({ key: "b", configModifiedAt: "2026-07-01T00:00:00Z", dataGeneratedAt: "2026-07-30T00:00:00Z" }),
      assessReingestNeed({ key: "c", configModifiedAt: null, dataGeneratedAt: null }),
    ]);
    expect(s.total).toBe(3);
    expect(s.staleDelivery).toEqual(["a"]);
    expect(s.configInsufficient).toEqual(["b"]);
    expect(s.unknown).toEqual(["c"]);
  });

  it("空でも落ちない", () => {
    expect(summarizeReingest([])).toEqual({
      total: 0,
      staleDelivery: [],
      configInsufficient: [],
      unknown: [],
    });
  });
});
