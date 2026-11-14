import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { adminStatPilotProgress } from "@/lib/admin-stat-pilot";
import { buildGateBoard, GATE_NAMES, gateRowsFromTable, type GateInputs } from "@/lib/strategy-gates";
import { strategyGateBoard } from "@/lib/server/strategy-gates";

/**
 * 収益化戦略 §5 のゲート表 (/dashboard の「今週の判断」) を守る。
 * 画面は判定を作らず、既存の判定 (measurementGate・pilot readiness・売上の計測範囲) を読むだけにする。
 * 表の行が増減したら、判定元の対応を決め直すまでここで止める。
 */
const REPO = path.resolve(__dirname, "../../../..");

const HEADER = ["Gate", "通過条件", "未達時"];
const TABLE_ROWS = GATE_NAMES.map((name) => [name, `${name} の通過条件`, `${name} の未達時`]);
const NO_PILOT = adminStatPilotProgress(null, []);
const NO_INPUTS: GateInputs = { measurementGate: null, pilotReadiness: null, adsenseCoverage: null, adminStatPilot: NO_PILOT };

describe("収益化戦略 §5 のゲート表", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("現物の §5 の表は 6 行で、行が増減したら判定元の対応と食い違って落ちる", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const board = strategyGateBoard();
    expect(board.error).toBeNull();
    expect(board.rows.map((r) => r.name)).toEqual([...GATE_NAMES]);
    expect(board.issues).toEqual([]);
  });

  it("現物の 6 行すべてが 通過・未達・判定元なし のどれかになり、判定元の無い 3 行は判定元なしと出る", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const board = strategyGateBoard();
    expect(board.rows).toHaveLength(6);
    for (const row of board.rows) {
      expect(["pass", "fail", "no-source"]).toContain(row.state);
      expect(row.passCondition).not.toBe("");
      expect(row.onFail).not.toBe("");
    }
    const noSource = board.rows.filter((r) => r.state === "no-source").map((r) => r.name);
    expect(noSource).toEqual(expect.arrayContaining(["トラフィック拡大", "商品横展開", "B2B基盤"]));
  });

  it("表に行が増えたら、その行を判定元なしで出し、増えた行を issues に挙げる", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: [...TABLE_ROWS, ["会員制", "条件", "未達"]] });
    const board = buildGateBoard(rows, NO_INPUTS);
    expect(board.rows).toHaveLength(7);
    expect(board.rows.at(-1)).toMatchObject({ name: "会員制", state: "no-source" });
    expect(board.issues).toEqual(["ゲート表に行が増えた: 会員制 (判定元の対応が未定義)"]);
  });

  it("表から行が減ったら、消えた行を issues に挙げる", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS.filter(([name]) => name !== "B2B基盤") });
    const board = buildGateBoard(rows, NO_INPUTS);
    expect(board.rows).toHaveLength(5);
    expect(board.issues).toEqual(["ゲート表から行が消えた: B2B基盤"]);
  });

  it("列の見出しが変わった表は読まずにエラーにする", () => {
    expect(() => gateRowsFromTable({ header: ["Gate", "条件"], rows: [] })).toThrow(/列/);
    expect(() => gateRowsFromTable(null)).toThrow(/表が無い/);
  });

  it("セルのリンクとコード記法を外して文だけにする", () => {
    const [row] = gateRowsFromTable({
      header: HEADER,
      rows: [["トラフィック拡大", "[`03_マーケティング戦略.md`](./03_マーケティング戦略.md) の T1〜T4 ゲートに従う", "前倒ししない"]],
    });
    expect(row.passCondition).toBe("03_マーケティング戦略.md の T1〜T4 ゲートに従う");
  });

  it("計測とアフィ横展開は既存のゲートの status をそのまま写し、ready だけを通過にする", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS });
    const board = buildGateBoard(rows, {
      measurementGate: { status: "ready", reasons: [], generatedAt: "2026-11-09T22:56:13.652Z" },
      pilotReadiness: { status: "blocked", reasons: ["a8-results-month-missing"], generatedAt: "2026-11-09T22:56:14.472Z" },
      adsenseCoverage: { state: "measured", note: "週次 CSV" },
      adminStatPilot: NO_PILOT,
    });
    const by = Object.fromEntries(board.rows.map((r) => [r.name, r]));
    expect(by["計測"]).toMatchObject({ state: "pass", href: "/affiliate" });
    expect(by["計測"].note).toContain("status=ready");
    expect(by["計測"].note).toContain("2026-11-09");
    expect(by["アフィ横展開"].state).toBe("fail");
    expect(by["アフィ横展開"].note).toContain("a8-results-month-missing");
    expect(by["AdSense"]).toMatchObject({ state: "pass", href: "/revenue" });
    expect(board.issues).toEqual([]);
  });

  it("売上の計測範囲が unmeasured なら AdSense は未達にする", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS });
    const board = buildGateBoard(rows, { ...NO_INPUTS, adsenseCoverage: { state: "unmeasured", note: "API 認証切れ" } });
    expect(board.rows.find((r) => r.name === "AdSense")).toMatchObject({ state: "fail" });
  });

  it("判定元の state を読めない行は 0 や未達に読み替えず、判定元なしにして理由を出す", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS });
    const board = buildGateBoard(rows, {
      measurementGate: { status: "unknown", reasons: [], generatedAt: null },
      pilotReadiness: null,
      adsenseCoverage: null,
      adminStatPilot: NO_PILOT,
    });
    for (const name of ["計測", "AdSense", "アフィ横展開"]) {
      const row = board.rows.find((r) => r.name === name);
      expect(row?.state).toBe("no-source");
      expect(row?.note).toMatch(/読めない|status が無い/);
    }
  });

  it("B2B基盤 の行は聞き取り台帳の件数・段階・次の判断点を並べ、通過・未達は作らず判定元なしのままにする", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS });
    const ledger = { gate: { targetInterviewCount: 3 }, interviews: [{ interviewId: "I-001", interviewedAt: "2026-11-20" }] };
    const board = buildGateBoard(rows, { ...NO_INPUTS, adminStatPilot: adminStatPilotProgress(ledger, ["1. 業務を選ぶ", "2. 無料試用"]) });
    const b2b = board.rows.find((r) => r.name === "B2B基盤");
    expect(b2b).toMatchObject({ state: "no-source", href: null });
    expect(b2b?.details).toEqual([
      "聞き取り: 1/3 件",
      "段階: 1. 業務を選ぶ (全 2 段階・聞き取り中)",
      "次の判断点: 聞き取りが 3 件に達した時点で段階 1 の進む・止めるを決める (残り 2 件)",
      "有料 pilot の初回判断点 (開始から 30 日): 未記録",
    ]);
    expect(board.rows.filter((r) => r.name !== "B2B基盤").every((r) => r.details.length === 0)).toBe(true);
  });

  it("聞き取り台帳を読めないとき、B2B基盤 の行の件数・段階・次の判断点はすべて未記録になり、欠けを 1 行出す", () => {
    const rows = gateRowsFromTable({ header: HEADER, rows: TABLE_ROWS });
    const b2b = buildGateBoard(rows, NO_INPUTS).rows.find((r) => r.name === "B2B基盤");
    expect(b2b?.details).toEqual([
      "聞き取り: 未記録",
      "段階: 未記録",
      "次の判断点: 未記録",
      "有料 pilot の初回判断点 (開始から 30 日): 未記録",
      "台帳の欠け: 聞き取り台帳を読めない",
    ]);
  });
});
