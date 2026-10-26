import Ajv from "ajv";
import { describe, expect, it } from "vitest";

import surveys from "../surveys.json";
import schema from "../surveys.schema.json";

type SurveyRow = { id: string; name: string; parentSourceId: string | null };
const rows = surveys as SurveyRow[];

describe("surveys.json (調査マスタ)", () => {
  it("JSON Schema (surveys.schema.json) に適合する", () => {
    const validate = new Ajv({ allErrors: true }).compile(schema);
    const ok = validate(surveys);
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
  });

  it("schema は壊れた行を拒否する (検査が何も見ていない状態でないことの確認)", () => {
    const validate = new Ajv({ allErrors: true }).compile(schema);
    const base = { ...(surveys[0] as Record<string, unknown>) };
    expect(validate([{ ...base, id: "Kakei_Chousa" }])).toBe(false);
    expect(validate([{ ...base, unknownField: 1 }])).toBe(false);
    const { name: _omit, ...withoutName } = base;
    expect(validate([withoutName])).toBe(false);
    expect(validate([base])).toBe(true);
  });

  it("id と name はそれぞれ重複しない", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(new Set(rows.map((r) => r.name)).size).toBe(rows.length);
  });

  it('parentSourceId は "estat" (e-Stat ポータル)・null・マスタ実在 id のいずれかで、自分自身を指さない', () => {
    const ids = new Set(rows.map((r) => r.id));
    for (const r of rows) {
      if (r.parentSourceId === null || r.parentSourceId === "estat") continue;
      expect(ids.has(r.parentSourceId), `${r.id} → ${r.parentSourceId}`).toBe(true);
      expect(r.parentSourceId).not.toBe(r.id);
    }
  });

  it("家計調査の二重 id: kakei-chousa (品目別) は household-survey の子として明示されている", () => {
    // URL (/survey/kakei-chousa と /survey/household-survey) を変えないため統合せず、親子で関係を表す
    const kakei = rows.find((r) => r.id === "kakei-chousa");
    expect(kakei?.parentSourceId).toBe("household-survey");
    expect(rows.some((r) => r.id === "household-survey")).toBe(true);
  });
});
