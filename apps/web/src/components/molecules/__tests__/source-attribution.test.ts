import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isLinkableSurveyId } from "../SourceAttribution";

/**
 * SourceAttribution が `/survey/<id>` へリンクしてよい id かの判定を検証する。
 *
 * 背景 (2026-07-24): attribution.originalSurveys は surveys.json 照合を経ずに item.json へ
 * 焼き込まれるため、合成 id (`ssds-src:*`) がそのままリンクになり /survey/... が 404 を返していた
 * (約 231 ランキングページ)。規約 `.claude/rules/survey-linkage-standards.md` §5。
 *
 * 判定を緩めると 404 リンクが復活するので、実在マスタとの突合まで含めて固定する。
 */
describe("isLinkableSurveyId", () => {
  it("合成 id (ssds-src: / src:) をリンク対象から外す", () => {
    expect(isLinkableSurveyId("ssds-src:世界農林業センサス")).toBe(false);
    expect(isLinkableSurveyId("ssds-src:気象庁年報")).toBe(false);
    expect(isLinkableSurveyId("src:foo")).toBe(false);
  });

  it("非 ASCII / コロン / 大文字を含む id を弾く", () => {
    expect(isLinkableSurveyId("農林業センサス")).toBe(false);
    expect(isLinkableSurveyId("Census")).toBe(false);
    expect(isLinkableSurveyId("a:b")).toBe(false);
    expect(isLinkableSurveyId("")).toBe(false);
    expect(isLinkableSurveyId("-leading")).toBe(false);
    expect(isLinkableSurveyId("trailing-")).toBe(false);
  });

  it("kebab-case ASCII の実在 id を通す", () => {
    expect(isLinkableSurveyId("agriculture-forestry-census")).toBe(true);
    expect(isLinkableSurveyId("census")).toBe(true);
  });

  it("surveys.json の全 id が判定を通る (マスタ側の id 規約とのドリフト検知)", () => {
    const master = path.resolve(
      __dirname,
      "../../../../../../packages/ranking/src/data/surveys.json",
    );
    const surveys = JSON.parse(fs.readFileSync(master, "utf8")) as { id: string }[];
    expect(surveys.length).toBeGreaterThan(50);
    const rejected = surveys.map((s) => s.id).filter((id) => !isLinkableSurveyId(id));
    expect(rejected).toEqual([]);
  });
});
