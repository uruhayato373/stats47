import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { adminStatPilotProgress, UNRECORDED } from "@/lib/admin-stat-pilot";
import { strategyGateBoard } from "@/lib/server/strategy-gates";

/**
 * 行政向け商品の検証 (収益化戦略 §5 の 4 段階) の進み具合を守る。
 * 画面は聞き取り台帳 data/products/admin-stat-interviews.json から導ける値だけを出し、
 * 台帳が空・欠けているときは 0 や段階 1 に読み替えず「未記録」と出す。
 */
const REPO = path.resolve(__dirname, "../../../..");
const STAGES = ["1. 業務を選ぶ", "2. 無料試用", "3. 有料pilot", "4. 更新・横展開"];

const interview = (n: number) => ({ interviewId: `I-00${n}`, interviewedAt: `2026-11-0${n}`, role: "財政課" });
const ledger = (interviews: unknown, gate: unknown = { targetInterviewCount: 3 }) => ({ schemaVersion: 1, gate, interviews });

describe("行政向け商品の検証の進み具合", () => {
  afterEach(() => {
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("台帳が空 (聞き取り 0 件) のとき、件数は 0/3 件と出し、段階は段階 1 に読み替えず未記録にする", () => {
    const p = adminStatPilotProgress(ledger([]), STAGES);
    expect(p.interviewCount).toBe("0/3 件");
    expect(p.stage).toBe(UNRECORDED);
    expect(p.nextDecision).toContain("3 件");
    expect(p.nextDecision).toContain("残り 3 件");
  });

  it("台帳を読めない・interviews の配列が無いとき、件数も段階も次の判断点も未記録にして欠けを挙げる", () => {
    for (const broken of [null, "text", {}, { interviews: "なし" }]) {
      const p = adminStatPilotProgress(broken, STAGES);
      expect(p).toMatchObject({ interviewCount: UNRECORDED, stage: UNRECORDED, nextDecision: UNRECORDED });
      expect(p.gaps).toHaveLength(1);
    }
  });

  it("聞き取りが上限より少ない間は段階 1 と出し、残りの件数を次の判断点に出す", () => {
    const p = adminStatPilotProgress(ledger([interview(1), interview(2)]), STAGES);
    expect(p.interviewCount).toBe("2/3 件");
    expect(p.stage).toBe("1. 業務を選ぶ (全 4 段階・聞き取り中)");
    expect(p.nextDecision).toContain("残り 1 件");
    expect(p.gaps).toEqual([]);
  });

  it("聞き取りが上限に達しても段階 2 へ進めず、進む・止めるの判定は未記録と出す", () => {
    const p = adminStatPilotProgress(ledger([interview(1), interview(2), interview(3)]), STAGES);
    expect(p.interviewCount).toBe("3/3 件");
    expect(p.stage).toContain("1. 業務を選ぶ");
    expect(p.stage).toContain(`進む・止めるの判定は${UNRECORDED}`);
    expect(p.nextDecision).not.toContain("残り");
  });

  it("ID か実施日が欠けた記録は聞き取りに数えず、数えなかった件数を欠けに挙げる", () => {
    const p = adminStatPilotProgress(ledger([interview(1), { interviewId: "I-002" }, { interviewedAt: "2026-11-03" }, null]), STAGES);
    expect(p.interviewCount).toBe("1/3 件");
    expect(p.gaps).toEqual(["ID か実施日が欠けた記録 3 件は聞き取りに数えていない"]);
  });

  it("聞き取りの上限が台帳に無いとき、件数は数えるが次の判断点は未記録にする", () => {
    for (const gate of [null, {}, { targetInterviewCount: "3" }, { targetInterviewCount: 0 }]) {
      const p = adminStatPilotProgress(ledger([interview(1)], gate), STAGES);
      expect(p.interviewCount).toBe(`1 件 (上限は${UNRECORDED})`);
      expect(p.stage).toBe("1. 業務を選ぶ (全 4 段階・聞き取り中)");
      expect(p.nextDecision).toBe(UNRECORDED);
      expect(p.gaps).toEqual(["聞き取りの上限 (gate.targetInterviewCount) が台帳に無い"]);
    }
  });

  it("段階の表を読めないとき、聞き取りがあっても段階は未記録にする", () => {
    const p = adminStatPilotProgress(ledger([interview(1)]), []);
    expect(p.stage).toBe(UNRECORDED);
    expect(p.gaps).toEqual(["収益化戦略 §5 の検証順序の表を読めない"]);
  });

  it("有料 pilot の開始日を置く欄は台帳に無いので、開始から 30 日の判断点はどの台帳でも未記録にする", () => {
    for (const interviews of [[], [interview(1), interview(2), interview(3)]]) {
      expect(adminStatPilotProgress(ledger(interviews), STAGES).paidPilotDecision).toBe(UNRECORDED);
    }
  });

  it("現物の収益化戦略 §5 の検証順序は 4 段階で、現物の台帳の件数と段階がゲート表の B2B基盤 の行に出る", () => {
    process.env.STATS47_PROJECT_ROOT = REPO;
    const board = strategyGateBoard();
    expect(board.error).toBeNull();
    expect(board.pilotStages).toHaveLength(4);
    expect(board.pilotStages[0]).toBe("1. 業務を選ぶ");
    const row = board.rows.find((r) => r.name === "B2B基盤");
    expect(row?.source).toContain("聞き取り台帳");
    expect(row?.details.join("\n")).toMatch(/聞き取り: \d+\/\d+ 件/);
    expect(row?.details.join("\n")).toMatch(/段階: (未記録|1\. 業務を選ぶ)/);
    expect(row?.details.join("\n")).not.toContain("gate.targetInterviewCount");
  });
});
