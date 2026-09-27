import { describe, expect, it } from "vitest";

import { AREA_DATABOOK_TEMPLATE } from "../area-databook";
import type { AreaDatabookTemplate } from "../area-databook/types";
import { checkLabelAgainstMetric, checkTrendChart, classifyMetric } from "../display-semantics";
import { auditAreaDatabookTemplate, auditCardYearDisplay } from "../display-semantics/audit";
import { METRICS_REGISTRY } from "../registry";

const lookup = (key: string) => METRICS_REGISTRY[key];

/** 2026-09-25 に AREA-DATABOOK-LABEL-INTEGRITY-01 で直す前のテンプレート断片 (実例 ①③)。 */
function templateWith(description: string, metrics: Array<{ rankingKey: string; shortLabel: string }>): AreaDatabookTemplate {
  return {
    sections: [
      {
        sectionKey: "education-facility",
        kind: "education-facility",
        title: "学校・施設",
        description,
        sortOrder: 70,
        blocks: [{ blockType: "ranked-kpi-grid", blockKey: "facility-kpi", columns: 3, metrics }],
      },
    ],
  };
}

describe("display-semantics: 2026-09-25 の実例 4 件を検知する", () => {
  it("① 総数の指標に「10万人比」のラベル (医師数) を error にする", () => {
    const findings = auditAreaDatabookTemplate(
      templateWith("学校と施設", [{ rankingKey: "physicians-in-medical-facilities", shortLabel: "医師数(10万人比)" }]),
      lookup,
    );
    expect(findings.map((f) => [f.rule, f.severity])).toEqual([["label-rate-on-total", "error"]]);
  });

  it("② 月額の指標を「年間支出」と説明した節を error にする (指標が月額を宣言している場合)", () => {
    const findings = checkLabelAgainstMetric({
      where: "area-databook/consumption/consumption-kpi",
      label: "消費支出",
      sectionDescription: "県庁所在市の 1 世帯当たり年間支出",
      metric: { key: "consumption-fixture", title: "消費支出", subtitle: "二人以上世帯・1か月当たり", unit: "千円" },
    });
    expect(findings.map((f) => f.rule)).toEqual(["period-mismatch"]);
    expect(findings[0].severity).toBe("error");
  });

  it("② 実在の消費支出 (2026-09-27 に subtitle へ「1か月平均」を補記) を年間と説明すると error にする", () => {
    const findings = checkLabelAgainstMetric({
      where: "x",
      label: "消費支出",
      sectionDescription: "県庁所在市の 1 世帯当たり年間支出",
      metric: lookup("consumption-expenditure-multi-person-households-per-month")!,
    });
    expect(findings.map((f) => [f.rule, f.severity])).toEqual([["period-mismatch", "error"]]);
  });

  it("② 指標側に期間の宣言が無いときは断定せず warning (補記を促す) に留める", () => {
    const findings = checkLabelAgainstMetric({
      where: "x",
      label: "消費支出",
      sectionDescription: "県庁所在市の 1 世帯当たり年間支出",
      metric: { key: "undeclared-fixture", title: "消費支出", subtitle: null, unit: "円" },
    });
    expect(findings.map((f) => [f.rule, f.severity])).toEqual([["period-undeclared", "warning"]]);
  });

  it("③「人口当たり」と説明した節に総数の指標 (一般病院数) を error にする", () => {
    const findings = auditAreaDatabookTemplate(
      templateWith("人口 10 万人当たりの施設数など", [{ rankingKey: "general-hospital-count", shortLabel: "一般病院数" }]),
      lookup,
    );
    expect(findings.map((f) => f.rule)).toEqual(["section-per-population-on-total"]);
  });

  it("④ 数値カードの部品が年を表示しないと error にする", () => {
    const withoutYear = `export function Card({ v }) { return <span>{v.value}{v.unit}</span>; }`;
    const withYear = `export function Card({ v }) { return <span>{v.value}<small>{v.year}</small></span>; }`;
    expect(auditCardYearDisplay([{ file: "a.tsx", source: withoutYear }]).map((f) => f.rule)).toEqual(["card-year-missing"]);
    expect(auditCardYearDisplay([{ file: "b.tsx", source: withYear }])).toEqual([]);
  });
});

describe("display-semantics: 誤検知を出さない", () => {
  it("修正後の県データブックのテンプレートは error 0 件", () => {
    const errors = auditAreaDatabookTemplate(AREA_DATABOOK_TEMPLATE, lookup).filter((f) => f.severity === "error");
    expect(errors).toEqual([]);
  });

  it("分母を宣言していない指標は総数と断定しない (博物館数 100万人当たりの誤検知の再発防止)", () => {
    expect(classifyMetric({ key: "m", title: "博物館数", unit: "館" }).basis).toBe("unknown");
  });

  it("総数は指標名ではなく宣言 (SSDS 基礎データ表 / subtitle「総数」) で決める", () => {
    expect(classifyMetric({ key: "any-name-per-100k", title: "医師数", unit: "人", source: { statsDataId: "0000010109" } }).basis).toBe("total");
    expect(classifyMetric({ key: "x", title: "一般病院数", subtitle: "総数", unit: "施設" }).basis).toBe("total");
    expect(classifyMetric({ key: "x", title: "医師数", unit: "人", source: { statsDataId: "0000010209" } }).basis).toBe("unknown");
    expect(classifyMetric({ key: "x", title: "高齢化率", unit: "％" }).basis).toBe("rate");
  });

  it("「比較」「効率」は割合のラベルとして扱わない", () => {
    const findings = checkLabelAgainstMetric({
      where: "x",
      label: "医師数の比較",
      metric: { key: "x", title: "医師数", subtitle: "総数", unit: "人" },
    });
    expect(findings).toEqual([]);
  });

  it("「推移」と題したチャートは時系列を描ける型を要求する", () => {
    expect(checkTrendChart({ where: "x", title: "人口の推移", componentType: "line-chart" })).toEqual([]);
    expect(checkTrendChart({ where: "x", title: "人口の推移", componentType: "radar-chart" }).map((f) => f.severity)).toEqual(["warning"]);
  });
});
