import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkLedger, LEDGER_PATH, type DisplayUnitLedger, type DisplayUnitRow } from "../../../scripts/build-chart-display-units";

const row = (over: Partial<DisplayUnitRow> = {}): DisplayUnitRow => ({
  key: "business-tax", title: "事業税", unit: "千円", year: "2022", count: 47,
  max: 1_544_976_077, min: 14_040_236, minNonZeroAbs: 14_040_236,
  chartUnit: "億円", factor: 0.00001, decimals: 0, reason: "rescaled", ...over,
});
const ledger = (rows: DisplayUnitRow[], unparsedLarge: string[] = []): DisplayUnitLedger => ({
  schemaVersion: 1, generatedAt: "2026-11-03", source: { values: "", rule: "" },
  summary: { metrics: rows.length, byReason: {}, rescaled: 0, unparsedLarge }, rows,
});
const units = (map: Record<string, string>) => (key: string) => map[key];

describe("chart display-unit ledger check", () => {
  it("passes a ledger that matches the active metrics, their units and the rule", () => {
    expect(checkLedger(ledger([row()]), ["business-tax"], units({ "business-tax": "千円" }))).toEqual({ errors: [], warnings: [] });
  });

  it("warns about gaps the weekly rebuild fills, without stopping a PR before the values exist", () => {
    // A newly published metric that the ledger does not have yet.
    expect(checkLedger(ledger([row()]), ["business-tax", "new-metric"], units({ "business-tax": "千円" }))).toEqual({ errors: [], warnings: [expect.stringMatching(/^\[missing\] new-metric/)] });
    // The metric's unit was corrected and waits for re-ingestion.
    expect(checkLedger(ledger([row()]), ["business-tax"], units({ "business-tax": "円" })).warnings[0]).toMatch(/^\[unit-changed\]/);
  });

  it("stops a ledger the rule no longer produces and a new unreadable large metric", () => {
    // The rule moved (or the row was edited by hand): the stored scale no longer follows from the stored values.
    expect(checkLedger(ledger([row({ chartUnit: "万円", factor: 0.1 })]), ["business-tax"], units({ "business-tax": "千円" })).errors[0]).toMatch(/^\[rule-changed\]/);
    // One more large metric whose unit the canon cannot read: the baseline only shrinks.
    const unread = row({ key: "energy", unit: "TJ", max: 970_018, min: 1_000, minNonZeroAbs: 1_000, chartUnit: "TJ", factor: 1, decimals: null, reason: "unparsed" });
    expect(checkLedger(ledger([unread]), ["energy"], units({ energy: "TJ" })).errors).toEqual([expect.stringMatching(/^\[unparsed-large\] .*energy/)]);
    expect(checkLedger(ledger([unread], ["energy"]), ["energy"], units({ energy: "TJ" })).errors).toEqual([]);
  });

  it("the committed ledger matches the rule for every row", () => {
    const committed = JSON.parse(readFileSync(resolve(LEDGER_PATH), "utf8")) as DisplayUnitLedger;
    expect(committed.rows.length).toBeGreaterThan(2000);
    expect(checkLedger(committed, committed.rows.map((r) => r.key), () => undefined)).toEqual({ errors: [], warnings: [] });
  });
});
