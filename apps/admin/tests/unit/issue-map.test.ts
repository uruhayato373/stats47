import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { ContentTypeDef } from "@/lib/content-coverage";
import { buildIssueMap, resolveRef, validateIssueMap, type IssueCell, type IssueMapSpec, type LedgerIndex } from "@/lib/issue-map";

/**
 * 事業イシューマップが守る意図:
 *   - 判定日と状態は参照先の台帳の値で出す (台帳に写さないので、参照先を直せば画面も変わる)
 *   - 参照先の無い ID を「未定」に紛れさせない
 *   - 4 型 × 3 収益源の全マスが 1 つずつある
 */

const INDEX: LedgerIndex = {
  today: "2026-11-10",
  improvements: { "IMP-01": { due: "2026-11-09", status: "pending" }, "IMP-02": { due: "-", status: "pending" } },
  backlog: { "CARD-01": { due: "2026-12-01", wip: true }, "CARD-02": { due: null, wip: false } },
  pilots: { kdp: { judgeDate: "2026-09-27", state: "due" } },
  experiments: { "EXP-001": { nextCheck: null, status: "proposed" } },
};

const cell = (row: string, column: string, extra: Partial<IssueCell> = {}): IssueCell => ({
  id: `biz:${row}:${column}`,
  row: `biz:row:${row}`,
  column: `biz:col:${column}`,
  rating: "○",
  ratingLabel: "条件つき",
  states: [{ kind: "open", label: "未検証" }],
  evidence: "根拠",
  ...extra,
});

const TYPES: ContentTypeDef[] = [{ id: "type:a", title: "参照型", question: "1 位はどこか", examples: "ランキング" }];

const SPEC: IssueMapSpec = {
  observedAt: "2026-W43",
  issue: { id: "biz:issue", question: "問い", hypothesis: "仮説", criteria: [] },
  columns: [
    { id: "biz:col:ads", title: "広告", description: "" },
    { id: "biz:col:data", title: "データ", description: "" },
  ],
  rows: [{ id: "biz:row:a", contentType: "type:a" }],
  cells: [
    cell("a", "ads", {
      judgments: [
        { picture: "後の絵", ref: { kind: "backlog", id: "CARD-01" } },
        { picture: "先の絵", ref: { kind: "improvement", id: "IMP-01" } },
      ],
    }),
    cell("a", "data", {
      judgments: [{ picture: "日付の無い絵", ref: { kind: "experiment", id: "EXP-001" } }],
      refs: [{ kind: "pilot", id: "kdp" }],
    }),
  ],
  premises: [
    { id: "biz:premise:x", title: "前提", state: { kind: "unknown", label: "判定不能" }, evidence: "", judgments: [{ picture: "前提の絵", ref: { kind: "backlog", id: "CARD-02" } }] },
  ],
  storyline: { steps: [], summary: "" },
  notes: [{ id: "biz:note:x", observedAt: "2026-11-05", text: "注記", cells: ["biz:a:data"] }],
};

describe("事業イシューマップ", () => {
  it("判定日は参照先の台帳から引き、4 種類の台帳を解決する", () => {
    expect(resolveRef({ kind: "improvement", id: "IMP-01" }, INDEX)).toMatchObject({ found: true, date: "2026-11-09", status: "pending" });
    expect(resolveRef({ kind: "backlog", id: "CARD-01" }, INDEX)).toMatchObject({ found: true, date: "2026-12-01", status: "進行中" });
    expect(resolveRef({ kind: "pilot", id: "kdp" }, INDEX)).toMatchObject({ found: true, date: "2026-09-27", status: "due" });
    expect(resolveRef({ kind: "experiment", id: "EXP-001" }, INDEX)).toMatchObject({ found: true, date: null, status: "proposed" });
  });

  it("参照先の Due が日付でなければ未定として扱う", () => {
    expect(resolveRef({ kind: "improvement", id: "IMP-02" }, INDEX)).toMatchObject({ found: true, date: null });
  });

  it("参照先の無い ID は未定に紛れさせず problems に出す", () => {
    const spec = { ...SPEC, cells: [cell("a", "ads", { refs: [{ kind: "backlog", id: "GONE-01" }] }), SPEC.cells[1]] };
    const map = buildIssueMap(spec, INDEX, TYPES);
    expect(map.problems).toEqual(["backlog の GONE-01 が参照先に無い"]);
    expect(map.rows[0].cells[0].otherRefs[0]).toMatchObject({ found: false, date: null });
  });

  it("判定日の表は日付の早い順で、未定は後ろ。今日より前だけを過ぎたとする", () => {
    const { schedule } = buildIssueMap(SPEC, INDEX, TYPES);
    expect(schedule.map((s) => s.picture)).toEqual(["先の絵", "後の絵", "日付の無い絵", "前提の絵"]);
    expect(schedule.map((s) => s.overdue)).toEqual([true, false, false, false]);
    expect(schedule[0].label).toBe("参照型 × 広告");
    expect(schedule[3].label).toBe("前提: 前提");
  });

  it("注記は指定したマスにだけ付く", () => {
    const [ads, data] = buildIssueMap(SPEC, INDEX, TYPES).rows[0].cells;
    expect(ads.notes).toEqual([]);
    expect(data.notes.map((n) => n.id)).toEqual(["biz:note:x"]);
  });

  it("行の題・問い・例は台帳に写さず型の台帳から結ぶので、型を直せば画面も変わる", () => {
    const [row] = buildIssueMap(SPEC, INDEX, TYPES).rows;
    expect(row).toMatchObject({ contentType: "type:a", title: "参照型", question: "1 位はどこか", examples: "ランキング" });
    const renamed = buildIssueMap(SPEC, INDEX, [{ ...TYPES[0], title: "参照の型" }]);
    expect(renamed.rows[0].title).toBe("参照の型");
    expect(renamed.schedule[0].label).toBe("参照の型 × 広告");
    expect(validateIssueMap(SPEC, [])).toEqual(["biz:row:a: 型 type:a が型の台帳に無い"]);
  });

  it("欠けたマス・重複したマスを止める", () => {
    const missing = validateIssueMap({ ...SPEC, cells: [SPEC.cells[0]], notes: [] }, TYPES);
    expect(missing).toEqual(["biz:row:a × biz:col:data のマスが無い"]);
    const doubled = validateIssueMap({ ...SPEC, cells: [...SPEC.cells, SPEC.cells[0]], notes: [] }, TYPES);
    expect(doubled.join()).toContain("重複している");
  });

  it("リポジトリの台帳は 4 型 × 3 収益源の 12 マスがそろい、カードどおりの評価を持つ", () => {
    const spec = JSON.parse(readFileSync(resolve(__dirname, "../../../../data/business/issue-map.json"), "utf8")) as IssueMapSpec;
    const types = JSON.parse(readFileSync(resolve(__dirname, "../../../../data/content/content-types.json"), "utf8")) as { types: ContentTypeDef[] };
    expect(validateIssueMap(spec, types.types)).toEqual([]);
    expect(spec.cells).toHaveLength(12);
    expect(spec.cells.map((c) => c.rating).join("")).toBe("◎✕○○○○○△○△◎○");
    // 判定日は参照先から引くので、根拠の文に日付の形で写さない
    expect(JSON.stringify(spec.cells)).not.toMatch(/\b\d{1,2}-\d{2}\b/);
  });
});
