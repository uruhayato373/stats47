import { describe, expect, it } from "vitest";

import { buildPilotBoard, type PilotInputs, type PilotSpec } from "@/lib/pilot-board";

const BASE: PilotInputs = {
  today: "2026-10-27",
  navClicks: [],
  sales: [],
  note: null,
  experiments: [],
  improvementDue: {},
};

const blogProduct: PilotSpec = {
  id: "blog-product",
  title: "ブログの商品案内",
  route: "展開順序 1",
  card: "PRODUCT-FUNNEL-DEPLOY-01",
  schedule: { kind: "window", start: "2026-10-17", startEvidence: "deploy", windowDays: 28 },
  metrics: [{ label: "クリック", kind: "ga4-nav-click", surface: "blog_product" }],
};

describe("pilot 判定ボード", () => {
  it("開始日より前の日を含む 28 日窓は使わず、最初の有効窓の締め日を示す", () => {
    const [row] = buildPilotBoard([blogProduct], {
      ...BASE,
      navClicks: [{ weekId: "2026-W42", periodEnd: "2026-10-17", rows: [{ surface: "blog_product", count: 9 }] }],
    });
    expect(row.metrics[0]).toMatchObject({ status: "waiting", value: null });
    expect(row.metrics[0].note).toContain("2026-11-13 締め");
    expect(row).toMatchObject({ state: "measuring", judgeDate: "2026-11-14", daysLeft: 18 });
  });

  it("反映後だけの窓があればその導線のクリックを数え、行が無い導線は 0 とする", () => {
    const navClicks = [
      { weekId: "2026-W46", periodEnd: "2026-11-14", rows: [{ surface: "blog_product", count: 4 }] },
      { weekId: "2026-W47", periodEnd: "2026-11-21", rows: [{ surface: "ranking", count: 50 }] },
    ];
    const [row] = buildPilotBoard([blogProduct], { ...BASE, today: "2026-11-22", navClicks });
    expect(row.metrics[0]).toMatchObject({ status: "ok", value: "0 クリック", observedAt: "2026-11-21" });
    expect(row.state).toBe("due");
  });

  it("開始日が台帳に無い pilot は未開始と出す", () => {
    const spec: PilotSpec = { ...blogProduct, schedule: { kind: "window", start: null, startEvidence: "商品が未選定", windowDays: 28 } };
    const [row] = buildPilotBoard([spec], BASE);
    expect(row).toMatchObject({ state: "not-started", judgeDate: null, stateNote: "商品が未選定" });
  });

  it("計測が欠けている回収経路は判定不能と出し、欠けた指標を理由に挙げる", () => {
    const kdp: PilotSpec = {
      id: "kdp",
      title: "KDP",
      route: "コンテンツ販売",
      card: "KDP-EXPANSION-01",
      schedule: { kind: "window", start: "2026-08-30", startEvidence: "4週窓", windowDays: 28 },
      metrics: [
        { label: "販売数・売上", kind: "sales-ledger", channel: "kdp", productIds: [] },
        { label: "既読ページ (KENP)", kind: "unrecorded", reason: "台帳に列が無い" },
      ],
    };
    const sales = [
      { channel: "kdp", productId: "K-S1-02", periodStart: "2026-08-01", periodEnd: "2026-08-31", units: 1, netRevenueYen: 254, recordedAt: "2026-10-07T00:00:00Z" },
      { channel: "note", productId: "x", periodStart: "2026-09-01", periodEnd: "2026-09-30", units: 9, netRevenueYen: 900, recordedAt: "2026-10-07T00:00:00Z" },
    ];
    const [row] = buildPilotBoard([kdp], { ...BASE, sales });
    expect(row.metrics[0]).toMatchObject({ status: "ok", value: "1 冊・¥254" });
    expect(row.state).toBe("no-data");
    expect(row.stateNote).toContain("既読ページ (KENP): 台帳に列が無い");
  });

  it("note の記録が無ければ判定不能、古ければ記録が古いと出す。判定日は improvements の Due から引く", () => {
    const spec: PilotSpec = {
      id: "note-fiscal",
      title: "note 2 本",
      route: "展開順序",
      card: "NOTE-FISCAL-PEER-SALES-01",
      schedule: { kind: "improvement", id: "NOTE-FISCAL-PEER-SALES-01" },
      metrics: [{ label: "閲覧・売上", kind: "note-dashboard", noteIds: ["a", "b"] }],
    };
    const improvementDue = { "NOTE-FISCAL-PEER-SALES-01": "2026-11-09" };
    const [missing] = buildPilotBoard([spec], { ...BASE, improvementDue });
    expect(missing.metrics[0].status).toBe("missing");

    const note = {
      fetchedAt: "2026-10-05T00:00:00Z",
      period: { start: "2026-09-07", end: "2026-10-04" },
      articles: [
        { noteId: "a", title: "A — 副題", publishedAt: "2026-10-12", pageViews: 1, salesJpy: 0 },
        { noteId: "b", title: "B", publishedAt: "2026-10-12", pageViews: 4, salesJpy: 300 },
      ],
    };
    const [stale] = buildPilotBoard([spec], { ...BASE, improvementDue, note });
    expect(stale).toMatchObject({ start: "2026-10-12", judgeDate: "2026-11-09", state: "no-data" });
    expect(stale.metrics[0]).toMatchObject({ status: "stale", value: "A: 1 PV・¥0 / B: 4 PV・¥300", observedAt: "2026-10-05" });
  });

  it("実験台帳で保留中の pilot は保留と出し、開始日・判定日は experiment_window から引く", () => {
    const spec: PilotSpec = {
      id: "youtube",
      title: "YouTube",
      route: "SNS",
      card: "EXP-006",
      schedule: { kind: "experiment", id: "EXP-006" },
      metrics: [{ label: "公開と記録値", kind: "experiment", id: "EXP-006" }],
    };
    const experiments = [
      {
        id: "EXP-006",
        title: "YouTube",
        status: "running",
        experiment_window: { start: "2026-08-23", final_measurement: "2026-10-18" },
        next_check_date: "2026-12-01",
        pilot_videos: [{ title: "1", status: "script-next" }, { title: "2", status: "brief-ready" }],
        history: [{ date: "2026-08-22T21:39:54Z", action: "running" }, { date: "2026-09-23", action: "paused" }],
      },
    ];
    const [row] = buildPilotBoard([spec], { ...BASE, experiments });
    expect(row).toMatchObject({ start: "2026-08-23", judgeDate: "2026-10-18", state: "paused" });
    expect(row.stateNote).toBe("2026-09-23 から保留・次の確認 2026-12-01");
    expect(row.metrics[0]).toMatchObject({ status: "missing", value: "公開 0/2 本 (script-next・brief-ready)" });
  });
});
