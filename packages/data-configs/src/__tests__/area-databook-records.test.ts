import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AREA_DATABOOK_TEMPLATE,
  AREA_EDITORIALS,
  collectTemplateMetricKeys,
  listAreaEditorials,
  listTemplateCharts,
  templateToPageComponentsJson,
} from "../area-databook";

const REPO_ROOT = resolve(__dirname, "../../../..");
const EDITORIAL_DIR = resolve(REPO_ROOT, "data/areas/editorial");
const CODES = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);

describe("台帳 areas.editorial (県の本文)", () => {
  it("47 県が登録され、記録のファイルと過不足なく対応する", () => {
    expect(Object.keys(AREA_EDITORIALS).sort()).toEqual(CODES);
    const files = readdirSync(EDITORIAL_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    expect(files.sort()).toEqual(CODES);
    for (const [code, editorial] of Object.entries(AREA_EDITORIALS)) expect(editorial.areaCode).toBe(code);
  });

  it("特産品は 375 件で、1 県 5〜9 件・slug は県内で一意", () => {
    const all = listAreaEditorials();
    expect(all.reduce((sum, e) => sum + e.specialties.length, 0)).toBe(375);
    for (const e of all) {
      expect(e.specialties.length).toBeGreaterThanOrEqual(5);
      expect(e.specialties.length).toBeLessThanOrEqual(9);
      expect(new Set(e.specialties.map((s) => s.slug)).size).toBe(e.specialties.length);
    }
  });

  it("出典の注記 sourceNote は記録だけが持ち、export には出さない", () => {
    for (const e of listAreaEditorials()) expect(Object.keys(e)).toEqual(["areaCode", "symbols", "specialties"]);
    const record = JSON.parse(readFileSync(resolve(EDITORIAL_DIR, "01000.json"), "utf8"));
    expect(typeof record.sourceNote).toBe("string");
  });
});

describe("台帳 areas.databook-template (県データブックのテンプレート)", () => {
  it("18 セクション・chart 6 つ・指標のキー 102 件で、chart の生成物が commit 済みの県ページの部品と一致する", () => {
    expect(AREA_DATABOOK_TEMPLATE.sections).toHaveLength(18);
    expect(listTemplateCharts(AREA_DATABOOK_TEMPLATE)).toHaveLength(6);
    expect(collectTemplateMetricKeys(AREA_DATABOOK_TEMPLATE)).toHaveLength(102);
    const committed = readFileSync(resolve(REPO_ROOT, "apps/web/scripts/data/page-components/area/13000.json"), "utf8");
    expect(templateToPageComponentsJson(AREA_DATABOOK_TEMPLATE)).toBe(committed);
  });
});
