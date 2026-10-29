import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { INFRA_NETWORKS } from "../../infra-history/networks";
import {
  KSJ_CLASSIFICATIONS,
  KSJ_UNCLASSIFIED_KEY,
  classifyKsjFeature,
  ksjClassification,
} from "../classifications";
import { GIS_DATASETS_BY_ID } from "../datasets";

/**
 * 区分の台帳 (classifications.ts) は、交通網の変遷と単体 GIS ページの地図・凡例が共有する SSOT。
 * 台帳の中の矛盾 (同じ原典コードが 2 つの区分に入る等) と、参照する側が台帳から外れることを止める。
 */
describe("区分の台帳", () => {
  it("どの dataId も GIS 台帳に登録されている", () => {
    for (const dataId of KSJ_CLASSIFICATIONS.keys()) {
      expect(GIS_DATASETS_BY_ID.has(dataId), dataId).toBe(true);
    }
  });

  it("区分コードは一意で、1 つの原典コードは 1 つの区分にしか入らない", () => {
    for (const classification of KSJ_CLASSIFICATIONS.values()) {
      const codes = classification.classes.map((item) => item.code);
      expect(new Set(codes).size, classification.dataId).toBe(codes.length);
      expect(codes, classification.dataId).not.toContain(KSJ_UNCLASSIFIED_KEY);
      const sourceCodes = classification.classes.flatMap((item) => item.sourceCodes);
      expect(new Set(sourceCodes).size, classification.dataId).toBe(sourceCodes.length);
      expect(classification.classes.every((item) => item.sourceCodes.length > 0), classification.dataId).toBe(true);
    }
  });

  it("属性の値を文字列で区分へ写し、属性が無い・区分外の地物は null にする", () => {
    const airport = ksjClassification("N08");
    expect(classifyKsjFeature(airport, { N08_002: 6 })?.code).toBe("hub");
    expect(classifyKsjFeature(airport, { N08_002: "9" })?.code).toBe("local");
    expect(classifyKsjFeature(airport, { N08_019: "新東京国際空港" })).toBeNull();
    expect(classifyKsjFeature(airport, { N08_002: 99 })).toBeNull();
    expect(classifyKsjFeature(airport, null)).toBeNull();
  });

  it("交通網の変遷の種別と属性名は台帳そのものを使う (複製しない)", () => {
    for (const network of INFRA_NETWORKS) {
      const classification = KSJ_CLASSIFICATIONS.get(network.source.dataId);
      expect(classification, network.key).toBeDefined();
      expect(network.categories, network.key).toBe(classification?.classes);
      expect(network.attributes.category, network.key).toBe(classification?.field);
    }
  });
});

/**
 * 区分のまとめ方と色の正本は主題の台帳 (data/geo/subjects/subjects.json。2026-10-29 決定) へ移る。
 * 画面を主題の台帳につなぎ替えるまで (GIS-ATTRIBUTE-LEDGER-01 手順 2)、この TS と食い違わないことを固定する。
 * つなぎ替えたら classifications.ts の区分を消し、このテストも消す。
 */
describe("区分の台帳と主題の台帳の一致 (移行期間)", () => {
  const subjects = (
    JSON.parse(readFileSync(resolve(__dirname, "../../../../../data/geo/subjects/subjects.json"), "utf8")) as {
      subjects: { source: { kind: string; dataId?: string; featureType?: string }; style: { kind: string; classes?: unknown[] } }[];
    }
  ).subjects;
  const pairs: [dataId: string, featureType: string][] = [
    ["N06", "HighwaySection"],
    ["N05", "RailroadSection2"],
    ["N02", "RailroadSection"],
    ["N08", "Airport"],
  ];
  it.each(pairs)("%s:%s の区分 (コード・名前・原典コード・色) が同じ", (dataId, featureType) => {
    const subject = subjects.find((item) => item.source.kind === "ksj" && item.source.dataId === dataId && item.source.featureType === featureType);
    expect(subject?.style.kind).toBe("category");
    expect(subject?.style.classes).toEqual(KSJ_CLASSIFICATIONS.get(dataId)?.classes.map(({ code, label, sourceCodes, color }) => ({ code, label, sourceCodes, color })));
  });
});
