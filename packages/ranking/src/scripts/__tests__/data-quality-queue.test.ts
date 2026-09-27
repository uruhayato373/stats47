import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import * as fs from "node:fs";
import * as path from "node:path";

import {
  classifyFreshness,
  classifyQueueEntry,
  classifyYearLabel,
  sortQueue,
  resolveSources,
} from "../lib/data-quality-queue";

/**
 * データ品質キューの判定契約 (DATA-QUALITY-LOOP-01)。
 *
 * 守りたいのは (1) 公式表記を確認済みの時点統計が fiscal なら必ず「誤り」になること、
 * (2) 未確認の調査は推測で誤りにせず unknown に留めること、(3) 最新年の遅れを周期で測ること、
 * (4) 処置が「上から最初に当てはまる」順で 1 つだけ付くこと。
 */

const base = { key: "k", years: [2020, 2021, 2022, 2023, 2024], currentYear: 2026, estatExtendCandidate: false, demand: null };

describe("classifyYearLabel", () => {
  it("国勢調査だけが原典で fiscal は誤り", () => {
    expect(classifyYearLabel({ yearFormat: "fiscal", sources: ["国勢調査報告"] })).toBe("error");
  });
  it("確認済み調査の組み合わせでも fiscal は誤り、calendar は正しい", () => {
    const sources = ["人口動態統計", "人口推計", "国勢調査報告"];
    expect(classifyYearLabel({ yearFormat: "fiscal", sources })).toBe("error");
    expect(classifyYearLabel({ yearFormat: "calendar", sources })).toBe("ok");
  });
  it("未確認の調査が 1 つでも混ざれば推測せず unknown", () => {
    expect(classifyYearLabel({ yearFormat: "fiscal", sources: ["国勢調査報告", "学校基本調査報告"] })).toBe("unknown");
    expect(classifyYearLabel({ yearFormat: "fiscal", sources: null })).toBe("unknown");
  });
  it("SSDS 以外は surveyId で同じ判定をする", () => {
    expect(classifyYearLabel({ yearFormat: "fiscal", sources: null, surveyId: "census" })).toBe("error");
    expect(classifyYearLabel({ yearFormat: "fiscal", sources: null, surveyId: "port-statistics" })).toBe("unknown");
  });
});

describe("classifyFreshness", () => {
  it("毎年の統計で最新が公表遅れ内なら fresh", () => {
    expect(classifyFreshness({ years: [2023, 2024], currentYear: 2026 }).verdict).toBe("fresh");
  });
  it("5 年周期の国勢調査は 2020 年が最新でも 2026 年時点では fresh", () => {
    expect(classifyFreshness({ years: [2010, 2015, 2020], currentYear: 2026 }).verdict).toBe("fresh");
  });
  it("周期 1 回分以上の遅れは stale", () => {
    expect(classifyFreshness({ years: [2020, 2021, 2022], currentYear: 2026 }).verdict).toBe("stale");
  });
  it("周期 3 回分かつ 10 年以上の遅れは ended-candidate", () => {
    expect(classifyFreshness({ years: [2000, 2005], currentYear: 2026 }).verdict).toBe("ended-candidate");
  });
  it("年が無ければ unknown", () => {
    expect(classifyFreshness({ years: [], currentYear: 2026 }).verdict).toBe("unknown");
  });
});

describe("classifyQueueEntry", () => {
  it("年表記の誤りは古さより優先して処置 1", () => {
    const e = classifyQueueEntry({ ...base, years: [2000, 2005], yearFormat: "fiscal", sources: ["国勢調査報告"] });
    expect(e.treatment).toBe(1);
  });
  it("e-Stat 拡張候補は処置 2", () => {
    const e = classifyQueueEntry({ ...base, yearFormat: "fiscal", sources: null, estatExtendCandidate: true });
    expect(e.treatment).toBe(2);
  });
  it("観測 2 年で需要が小さければ処置 4、需要があれば処置なし", () => {
    const thin = { ...base, years: [2023, 2024], yearFormat: "fiscal", sources: null };
    expect(classifyQueueEntry({ ...thin, demand: 3 }).treatment).toBe(4);
    expect(classifyQueueEntry({ ...thin, demand: 500 }).treatment).toBeNull();
  });
  it("需要の多い順に並ぶ (未観測は最後)", () => {
    const mk = (key: string, demand: number | null) =>
      classifyQueueEntry({ ...base, key, years: [2010, 2011], yearFormat: "fiscal", sources: null, demand });
    expect(sortQueue([mk("a", null), mk("b", 5), mk("c", 900)]).map((e) => e.key)).toEqual(["c", "b", "a"]);
  });
});

describe("実 config の回帰: 公式表記確認済みの時点統計に fiscal が戻ったら検出する", () => {
  const map = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../../data-configs/src/ssds/cdcat01-sources.generated.json"), "utf8")
  ) as Record<string, { sources?: string[] }>;
  const config = METRICS_REGISTRY["elderly-single-person-households"];
  const cd = (config.source as { cdCat01?: string }).cdCat01 as string;
  const sources = map[cd]?.sources ?? null;

  it("elderly-single-person-households (国勢調査) は calendar で ok", () => {
    expect(sources).toEqual(expect.arrayContaining(["国勢調査報告"]));
    expect(classifyYearLabel({ yearFormat: config.yearFormat, sources })).toBe("ok");
  });
  it("同じ config を fiscal に戻すと誤りとして検出される (mutation)", () => {
    expect(classifyYearLabel({ yearFormat: "fiscal", sources })).toBe("error");
  });
});

describe("resolveSources (指標の式に出る基礎項目の原典も見る)", () => {
  const cdcat = {
    "#C04605": { kind: "indicator", formula: "C360111/A1101", sources: ["人口推計", "国勢調査報告"] },
    "#A05201": { kind: "indicator", formula: "A4101/A1101", sources: ["人口動態統計", "人口推計", "国勢調査報告"] },
    C360111: { kind: "base", sources: [] },
    A4101: { kind: "base", sources: ["人口動態統計"] },
    A1101: { kind: "base", sources: ["人口推計", "国勢調査報告"] },
  };

  it("分子の原典が不明なら全体を不明にする (預金残高 1 人当たりを暦年の誤りと数えない)", () => {
    expect(resolveSources(cdcat, "#C04605")).toBeNull();
  });

  it("基礎項目の原典がすべて分かれば和集合を返す", () => {
    expect(resolveSources(cdcat, "#A05201")?.sort()).toEqual(["人口動態統計", "人口推計", "国勢調査報告"].sort());
  });
});
