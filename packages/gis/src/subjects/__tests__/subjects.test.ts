import { describe, expect, it } from "vitest";

import { GEO_SUBJECTS, findGeoSubject, geoSubjectClassOf, normalizeGeoMapSubjects } from "..";

describe("主題の台帳", () => {
  it("id は一意で、区分で色分けする主題は 1 つの原典コードを 1 つの区分にしか入れない", () => {
    const ids = GEO_SUBJECTS.map((subject) => subject.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const subject of GEO_SUBJECTS) {
      if (subject.style.kind !== "category") continue;
      const codes = subject.style.classes.flatMap((item) => item.sourceCodes);
      expect(new Set(codes).size, subject.id).toBe(codes.length);
    }
  });

  it("原典のコード値を文字列で区分へ写す", () => {
    const joints = findGeoSubject("expressway-joints");
    if (!joints) throw new Error("expressway-joints が無い");
    expect(geoSubjectClassOf(joints, 3)?.code).toBe("jct");
    expect(geoSubjectClassOf(joints, "2")?.code).toBe("smart-ic");
    expect(geoSubjectClassOf(joints, 9)).toBeNull();
  });
});

describe("normalizeGeoMapSubjects (URL の base= と subjects= の正規化)", () => {
  it("背景は塗り分けの主題 1 つ、重ねるものは線・点だけ。取り違え・台帳に無い・重複を外して理由を返す", () => {
    const { base, overlays, dropped } = normalizeGeoMapSubjects(
      "municipal-population",
      ["expressway-sections", "nope", "expressway-sections", "municipal-manufacturing-shipment"],
      "region",
    );
    expect(base?.id).toBe("municipal-population");
    expect(overlays.map((subject) => subject.id)).toEqual(["expressway-sections"]);
    expect(dropped).toEqual([
      { id: "nope", reason: "unknown" },
      { id: "expressway-sections", reason: "duplicate" },
      { id: "municipal-manufacturing-shipment", reason: "kind" },
    ]);
    expect(normalizeGeoMapSubjects("expressway-sections", [], "region").dropped).toEqual([{ id: "expressway-sections", reason: "kind" }]);
  });

  it("市区町村の塗り分けは全国では描かない (scopes)", () => {
    const { base, dropped } = normalizeGeoMapSubjects("municipal-population", ["expressway-joints"], "national");
    expect(base).toBeNull();
    expect(dropped).toEqual([{ id: "municipal-population", reason: "scope" }]);
  });

  it("重ねる順は線 → 点 (同じ形は指定順)", () => {
    const { overlays } = normalizeGeoMapSubjects(null, ["expressway-joints", "railway-sections", "expressway-sections"], "prefecture");
    expect(overlays.map((subject) => subject.id)).toEqual(["railway-sections", "expressway-sections", "expressway-joints"]);
  });
});
