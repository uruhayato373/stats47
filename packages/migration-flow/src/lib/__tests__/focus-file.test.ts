import { describe, expect, it } from "vitest";

import { buildMigrationFocusFile, MIGRATION_FLOW_SOURCE, type MigrationFlowOdRow } from "../focus-file";

const prefNames = new Map([
  ["13000", "東京都"],
  ["11000", "埼玉県"],
  ["12000", "千葉県"],
  ["14000", "神奈川県"],
]);

const row = (from: string, to: string, inflow: number, outflow: number): MigrationFlowOdRow => ({
  fromPrefCode: from,
  toPrefCode: to,
  inflow,
  outflow,
  net: inflow - outflow,
});

describe("buildMigrationFocusFile", () => {
  const rows = [
    row("11000", "13000", 50, 70),
    row("14000", "13000", 90, 60),
    row("12000", "13000", 50, 40),
    row("13000", "13000", 999, 999), // 自県→自県は相手県に数えない
    row("13000", "11000", 70, 50), // 他の焦点県の行は混ぜない
  ];

  it("焦点県の行だけを相手県にし、流入の多い順 (同数は県コード順) に並べる", () => {
    const file = buildMigrationFocusFile({ focusCode5: "13000", year: 2024, rows, prefNames });
    expect(file.partners.map((p) => p.code)).toEqual(["14", "11", "12"]);
    expect(file.partners[1]).toEqual({ code: "11", name: "埼玉県", inflow: 50, outflow: 70, net: -20 });
  });

  it("合計は相手県の流入・流出の和で、純移動 = 流入 − 流出", () => {
    const file = buildMigrationFocusFile({ focusCode5: "13000", year: 2024, rows, prefNames });
    expect(file.totals).toEqual({ inflow: 190, outflow: 170, net: 20 });
    expect(file.totals.net).toBe(file.partners.reduce((sum, p) => sum + p.net, 0));
  });

  it("ファイルの識別子は 2 桁コード・出典は共通定数", () => {
    const file = buildMigrationFocusFile({ focusCode5: "13000", year: 2024, rows, prefNames });
    expect(file).toMatchObject({ focusCode: "13", focusName: "東京都", year: 2024, source: MIGRATION_FLOW_SOURCE });
  });

  it("欠損値は 0、県名が引けない相手はコードで表示する", () => {
    const file = buildMigrationFocusFile({
      focusCode5: "13000",
      year: 2024,
      rows: [{ fromPrefCode: "99000", toPrefCode: "13000", inflow: null, outflow: undefined, net: null }],
      prefNames,
    });
    expect(file.partners).toEqual([{ code: "99", name: "99000", inflow: 0, outflow: 0, net: 0 }]);
  });
});
