import { readFileSync } from "node:fs";
import path from "node:path";

import { MUNICIPALITY_THEME_CATALOGS } from "@stats47/data-configs/geo-scope";
import { describe, expect, it } from "vitest";

import {
  AFFILIATE_VERTICALS,
  MUNICIPALITY_THEME_AFFILIATE_MAP,
  SURVEY_AFFILIATE_MAP,
  TAG_AFFILIATE_MAP,
  THEME_AFFILIATE_MAP,
  resolveContentVertical,
} from "../constants/affiliate-category";

/**
 * 意図ハブ (affiliate-category.ts) の契約テスト。
 *
 * 2026-09-02: 公開 523 記事のうち 212 記事 (ブログ imp の 56%) でタグが vertical に
 * 解決されず、本文 3・末尾 1・右レール 2・テキスト 4 の枠がすべて空だった。
 * 写像の追加で記事数 311→363 / imp 44%→89% に上げた。ここでは
 *   (1) 追加した写像が同じ主題の CATEGORY / THEME 写像と同じ vertical を指すこと
 *   (2) 汎用・無意図タグを写像していないこと (誤った軸へ流すより空の方が無害)
 *   (3) 市区町村テーマ slug が全件 vertical を持つこと (slug を足したら写像も足す)
 * を固定する。
 */
describe("TAG_AFFILIATE_MAP (2026-09-02 追加分)", () => {
  it("同じ主題の CATEGORY / THEME 写像と同じ vertical を指す", () => {
    // 製造業 = manufacturing テーマ → economy / 農業 = agriculture → furusato /
    // 在留外国人 = foreign-residents テーマ → population
    expect(TAG_AFFILIATE_MAP["製造業"]).toBe(THEME_AFFILIATE_MAP["manufacturing"]);
    expect(TAG_AFFILIATE_MAP["農業"]).toBe("furusato");
    expect(TAG_AFFILIATE_MAP["在留外国人"]).toBe(THEME_AFFILIATE_MAP["foreign-residents"]);
    expect(TAG_AFFILIATE_MAP["地方債"]).toBe(THEME_AFFILIATE_MAP["local-finance"]);
    expect(TAG_AFFILIATE_MAP["太陽光発電"]).toBe("energy");
  });

  it("汎用・無意図タグ、および商材の無い主題 (身長・気候) は写像しない", () => {
    for (const tag of ["都道府県格差", "都道府県別", "地域差", "地域格差", "地名", "地形", "漢字", "公務員", "e-Stat", "身長", "体重", "学校保健統計", "気候", "気温", "猛暑日", "降雪量"]) {
      expect(TAG_AFFILIATE_MAP[tag], tag).toBeUndefined();
    }
  });

  it("値は 10 vertical のいずれか", () => {
    const allowed = new Set<string>(AFFILIATE_VERTICALS);
    for (const [tag, vertical] of Object.entries(TAG_AFFILIATE_MAP)) {
      expect(allowed.has(vertical), `${tag} → ${vertical}`).toBe(true);
    }
  });
});

describe("MUNICIPALITY_THEME_AFFILIATE_MAP", () => {
  it("市区町村テーマ slug は全件 vertical を持つ", () => {
    const slugs = Object.keys(MUNICIPALITY_THEME_CATALOGS);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(MUNICIPALITY_THEME_AFFILIATE_MAP[slug], slug).toBeDefined();
    }
  });

  it("実在しない slug を写像していない", () => {
    for (const slug of Object.keys(MUNICIPALITY_THEME_AFFILIATE_MAP)) {
      expect(MUNICIPALITY_THEME_CATALOGS[slug], slug).toBeDefined();
    }
  });
});

describe("SURVEY_AFFILIATE_MAP", () => {
  // 調査マスタ (survey-linkage-standards.md の SSOT)。package exports に無いので直接読む
  // vitest は apps/web を cwd に走る (package.json の test script / turbo とも同じ)
  const surveysJson = JSON.parse(
    readFileSync(path.resolve(process.cwd(), "../../packages/ranking/src/data/surveys.json"), "utf8"),
  ) as { id: string }[] | { surveys: { id: string }[] };
  const surveyIds = new Set(
    (Array.isArray(surveysJson) ? surveysJson : surveysJson.surveys).map((s) => s.id),
  );

  it("surveys.json に実在する調査 id だけを持つ", () => {
    for (const id of Object.keys(SURVEY_AFFILIATE_MAP)) {
      expect(surveyIds.has(id), id).toBe(true);
    }
  });

  it("家計調査 (品目別) は furusato、学校保健統計と気象統計は広告なし (null)", () => {
    expect(SURVEY_AFFILIATE_MAP["kakei-chousa"]).toBe("furusato");
    expect(SURVEY_AFFILIATE_MAP["school-health-survey"]).toBeNull();
    expect(SURVEY_AFFILIATE_MAP["weather-statistics"]).toBeNull();
  });
});

describe("resolveContentVertical (出典調査 → タグ → カテゴリ)", () => {
  it("出典調査が最優先: 家計調査の指標はカテゴリが economy でも furusato", () => {
    const r = resolveContentVertical({ surveyIds: ["kakei-chousa"], categoryKey: "economy" });
    expect(r).toEqual({ source: "survey", vertical: "furusato", verticals: ["furusato"] });
  });

  it("調査が null なら広告を出さない (タグ・カテゴリがあっても落とさない)", () => {
    const r = resolveContentVertical({
      surveyIds: ["school-health-survey"],
      tagKeys: ["教育"],
      categoryKey: "educationsports",
    });
    expect(r.source).toBe("survey-none");
    expect(r.vertical).toBeNull();
    expect(r.verticals).toEqual([]);
  });

  it("写像に無い調査はタグへ落ちる (複数 vertical は全部残す)", () => {
    const r = resolveContentVertical({ surveyIds: ["census"], tagKeys: ["人口", "住宅"], categoryKey: "economy" });
    expect(r.source).toBe("tags");
    expect(r.vertical).toBe("population");
    expect(r.verticals).toEqual(["population", "housing"]);
  });

  it("タグも無ければカテゴリ、それも無ければ none (推測しない)", () => {
    expect(resolveContentVertical({ categoryKey: "laborwage" })).toEqual({
      source: "category",
      vertical: "labor",
      verticals: ["labor"],
    });
    expect(resolveContentVertical({ tagKeys: ["都道府県格差"], categoryKey: "unknown" })).toEqual({
      source: "none",
      vertical: null,
      verticals: [],
    });
  });

  it("空・未指定の入力でも落ちない", () => {
    expect(resolveContentVertical({}).source).toBe("none");
    expect(resolveContentVertical({ surveyIds: null, tagKeys: null, categoryKey: null }).source).toBe("none");
  });
});
