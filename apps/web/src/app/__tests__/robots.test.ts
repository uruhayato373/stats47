import { describe, expect, it } from "vitest";

import robots from "../robots";

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

const rules = robots().rules as Rule[];

function agentsOf(rule: Rule): string[] {
  return rule.userAgent === undefined ? [] : [rule.userAgent].flat();
}

function asArray(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : [value].flat();
}

describe("robots.txt", () => {
  it.each(["MJ12bot", "SemrushBot", "DotBot", "AhrefsBot", "YandexBot"])("%s は全面 disallow (送客が無く Workers CPU を使うだけ)", (agent) => {
    const rule = rules.find((r) => agentsOf(r).includes(agent));
    expect(rule, `${agent} のルールが無い`).toBeDefined();
    expect(asArray(rule?.disallow)).toEqual(["/"]);
    expect(asArray(rule?.allow)).toEqual([]);
  });

  it.each(["Googlebot", "bingbot", "PerplexityBot"])("%s を名指しで disallow するルールは無い", (agent) => {
    const named = rules.filter((r) => agentsOf(r).some((a) => a.toLowerCase() === agent.toLowerCase()));
    expect(named).toEqual([]);
  });

  it("既定 (*) は / を allow する", () => {
    const rule = rules.find((r) => agentsOf(r).includes("*"));
    expect(asArray(rule?.allow)).toContain("/");
    expect(asArray(rule?.disallow)).not.toContain("/");
  });

  it("既存の AI 学習ボット (GPTBot / CCBot) の全面 disallow は維持する", () => {
    for (const agent of ["GPTBot", "CCBot"]) {
      const rule = rules.find((r) => agentsOf(r).includes(agent));
      expect(asArray(rule?.disallow)).toEqual(["/"]);
    }
  });
});
