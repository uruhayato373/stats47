import { describe, expect, test } from "vitest";

import {
  buildLengthSeries,
  classifyTransitions,
  haversineKm,
  isActiveInYear,
  maxSeriesDiffKm,
  splitLineByPrefecture,
  sumLengthSeries,
  type Position,
  type SegmentAssignment,
} from "../core";
import { infraHistoryKeys, infraNetworkOfKey } from "../keys";
import { INFRA_PUBLICATION_REQUIRED_SCOPES } from "../types";
import { INFRA_NETWORKS, findInfraNetworksForDataset, isInfraNetworkPublishable, infraNetworkTerms, isInfraNetworkAdFree } from "../networks";
import { parseInfraHistorySummary } from "../parse";
import { INFRA_REGIONS, INFRA_SCOPE_REGIONS } from "../scopes";

/** 経度 135 未満を "27"、以上を "28"、経度 140 以上をどの県にも入らない海とみなす */
const assignByLongitude = (lon: number): SegmentAssignment | null => {
  if (lon >= 140) return null;
  return { prefCode: lon < 135 ? "27" : "28", method: "polygon" };
};

describe("isActiveInYear", () => {
  test("原典の終了年は廃止の 1 年前なので、開始年と終了年の両方を含む", () => {
    expect(isActiveInYear(1965, 1970, 1965)).toBe(true);
    expect(isActiveInYear(1965, 1970, 1970)).toBe(true);
    expect(isActiveInYear(1965, 1970, 1971)).toBe(false);
    expect(isActiveInYear(1965, 1970, 1964)).toBe(false);
  });
});

describe("splitLineByPrefecture", () => {
  test("県が変わる線分で piece を分け、境目の頂点を両側に含める", () => {
    const line: Position[] = [[134.0, 35], [134.5, 35], [135.5, 35], [136.0, 35]];
    const pieces = splitLineByPrefecture(line, (lon) => assignByLongitude(lon));
    expect(pieces.map((p) => p.prefCode)).toEqual(["27", "28"]);
    expect(pieces[0].coords.at(-1)).toEqual(pieces[1].coords[0]);
  });

  test("分割しても延長の合計は元の線と一致する (保存則)", () => {
    const line: Position[] = [[134.0, 35], [134.9, 35.1], [135.2, 35.2], [136.0, 35]];
    const whole = line.slice(1).reduce((sum, p, i) => sum + haversineKm(line[i], p), 0);
    const pieces = splitLineByPrefecture(line, (lon) => assignByLongitude(lon));
    expect(pieces.reduce((sum, p) => sum + p.km, 0)).toBeCloseTo(whole, 9);
  });

  test("どの県にも決まらない線分は null の piece になり、近い県へ寄せない", () => {
    const line: Position[] = [[139.0, 35], [139.8, 35], [140.4, 35], [141.0, 35]];
    const pieces = splitLineByPrefecture(line, (lon) => assignByLongitude(lon));
    expect(pieces.map((p) => p.prefCode)).toEqual(["28", null]);
    expect(pieces[1].method).toBeNull();
  });
});

describe("buildLengthSeries", () => {
  test("各年に存在した区間だけを種別ごとに合計する", () => {
    const series = buildLengthSeries(
      [
        { start: 2000, end: 9999, category: "1", km: 10 },
        { start: 2001, end: 2001, category: "2", km: 5 },
      ],
      [2000, 2001, 2002],
      ["1", "2"],
    );
    expect(series.total).toEqual([10, 15, 10]);
    expect(series.byCategory["2"]).toEqual([0, 5, 0]);
  });

  test("台帳に無い種別コードは黙って捨てずに止める", () => {
    expect(() =>
      buildLengthSeries([{ start: 2000, end: 2000, category: "9", km: 1 }], [2000], ["1"]),
    ).toThrow("台帳に無い種別コード");
  });

  test("県別系列の合計と全国系列の差を保存則として測れる", () => {
    const years = [2000, 2001];
    const a = buildLengthSeries([{ start: 2000, end: 9999, category: "1", km: 3 }], years, ["1"]);
    const b = buildLengthSeries([{ start: 2001, end: 9999, category: "1", km: 4 }], years, ["1"]);
    const national = buildLengthSeries(
      [
        { start: 2000, end: 9999, category: "1", km: 3 },
        { start: 2001, end: 9999, category: "1", km: 4 },
      ],
      years,
      ["1"],
    );
    expect(maxSeriesDiffKm(sumLengthSeries([a, b], years.length, ["1"]), national)).toBe(0);
    expect(maxSeriesDiffKm(a, national)).toBe(4);
  });
});

describe("classifyTransitions", () => {
  // 東西に 0.1 度ずつ (約 9km) 並ぶ線。y=35 の直線上
  const line = (fromLon: number, toLon: number): Position[] =>
    Array.from({ length: Math.round((toLon - fromLon) / 0.1) + 1 }, (_, i) => [fromLon + i * 0.1, 35] as const);

  test("前年に同じ関係 ID の記録が無い区間の始まりは開通、翌年に無い区間の終わりは廃止", () => {
    const events = classifyTransitions(
      [{ start: 2000, end: 2009, relationIds: ["A"], lines: [line(135, 135.5)] }],
      1990,
      2024,
    );
    expect(events.map((e) => [e.kind, e.year])).toEqual([
      ["open", 2000],
      ["close", 2010],
    ]);
  });

  test("会社名の変更のように同じ場所で記録が付け替わっただけなら開通・廃止にしない", () => {
    const events = classifyTransitions(
      [
        { start: 1990, end: 2009, relationIds: ["A"], lines: [line(135, 135.5)] },
        { start: 2010, end: 9999, relationIds: ["A"], lines: [line(135, 135.5)] },
      ],
      1990,
      2024,
    );
    expect(events).toEqual([]);
  });

  test("同じ関係 ID で線が伸びたら、伸びた部分だけを延伸として返す", () => {
    const [event] = classifyTransitions(
      [
        { start: 1990, end: 2023, relationIds: ["A"], lines: [line(135, 135.5)] },
        { start: 2024, end: 9999, relationIds: ["A"], lines: [line(135, 136)] },
      ],
      1990,
      2024,
    );
    expect(event.kind).toBe("extend");
    expect(event.year).toBe(2024);
    // 伸びた 135.5〜136 の約 45km だけ (元の区間を含めない)
    expect(event.km).toBeGreaterThan(40);
    expect(event.km).toBeLessThan(50);
  });

  test("同じ関係 ID で線が縮んだら、無くなった部分だけを短縮として返す", () => {
    const [event] = classifyTransitions(
      [
        { start: 1990, end: 2023, relationIds: ["A"], lines: [line(135, 136)] },
        { start: 2024, end: 9999, relationIds: ["A"], lines: [line(135, 135.5)] },
      ],
      1990,
      2024,
    );
    expect(event.kind).toBe("shorten");
    expect(event.year).toBe(2024);
    expect(event.km).toBeGreaterThan(40);
  });

  test("関係備考の別 ID でつながる記録も同じ区間として扱う", () => {
    const events = classifyTransitions(
      [
        { start: 1990, end: 2009, relationIds: ["A"], lines: [line(135, 135.5)] },
        { start: 2010, end: 9999, relationIds: ["B", "A"], lines: [line(135, 135.5)] },
      ],
      1990,
      2024,
    );
    expect(events).toEqual([]);
  });

  test("原典の最初の年に始まる記録と継続中の記録は開通・廃止にしない", () => {
    const events = classifyTransitions(
      [{ start: 1950, end: 9999, relationIds: ["A"], lines: [line(135, 135.5)] }],
      1950,
      2024,
    );
    expect(events).toEqual([]);
  });
});

describe("地方の区分", () => {
  test("北海道と沖縄は単独の区分になり、地方のページは 2 都道府県以上の区分だけ", () => {
    expect(INFRA_SCOPE_REGIONS.map((region) => region.name)).toEqual([
      "北海道", "東北", "関東", "中部", "近畿", "中国", "四国", "九州", "沖縄",
    ]);
    expect(INFRA_REGIONS.map((region) => region.code)).not.toContain("hokkaido");
    expect(INFRA_REGIONS.map((region) => region.code)).not.toContain("okinawa");
  });

  test("47 都道府県がちょうど 1 つの区分に入る", () => {
    const codes = INFRA_SCOPE_REGIONS.flatMap((region) => region.prefCodes);
    expect(codes).toHaveLength(47);
    expect(new Set(codes).size).toBe(47);
  });
});

describe("台帳", () => {
  test("広告の有無は台帳の使い方の利用条件で決まり、非商用の網は事務局の了承の記録があるときだけ公開扱いになる", () => {
    const byKey = Object.fromEntries(INFRA_NETWORKS.map((network) => [network.key, network]));
    expect(isInfraNetworkAdFree(byKey.expressway)).toBe(true);
    expect(isInfraNetworkAdFree(byKey.railway)).toBe(true);
    // 空港時系列は商用可なので広告を出せる
    expect(isInfraNetworkAdFree(byKey.airport)).toBe(false);
    for (const network of INFRA_NETWORKS) {
      if (network.publication.status === "public-approved") {
        expect(network.publication.permissionEvidence).not.toBeNull();
        for (const scope of INFRA_PUBLICATION_REQUIRED_SCOPES) expect(network.publication.permissionEvidence?.scope, network.key).toContain(scope);
        expect(network.publication.permissionEvidence?.date, network.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(network.publication.permissionEvidence?.counterpart, network.key).toBeTruthy();
      }
      // 非商用の網は、公式ページの条件ではなく事務局の了承 (書面・電話) が要り、広告のあるページは範囲に入れない
      if (infraNetworkTerms(network).license === "non-commercial" && network.publication.status === "public-approved") {
        expect(network.publication.permissionEvidence?.method, network.key).not.toBe("official-terms");
        expect(network.publication.permissionEvidence?.scope, network.key).not.toContain("ad-page");
        expect(isInfraNetworkAdFree(network), network.key).toBe(true);
      }
    }
  });

  test("現況の単体 GIS ページから時系列ページを逆引きできる", () => {
    expect(findInfraNetworksForDataset("N02").map((network) => network.key)).toEqual(["railway"]);
    expect(findInfraNetworksForDataset("N08").map((network) => network.key)).toEqual(["airport"]);
    expect(findInfraNetworksForDataset("C28")).toEqual([]);
  });

  test("R2 key は URL /geo/history/<network> に対応し、路線網を逆引きできる", () => {
    expect(infraHistoryKeys.prefecture("railway", "28")).toBe("app/geo/history/railway/pref/28.topojson");
    expect(infraNetworkOfKey("app/geo/history/expressway/summary.json")).toBe("expressway");
    expect(infraNetworkOfKey("app/geo/layers/items.json")).toBeNull();
  });
});

describe("parseInfraHistorySummary", () => {
  const network = INFRA_NETWORKS[0];
  const codes = network.categories.map((c) => c.code);
  const years = Array.from(
    { length: network.years.last - network.years.first + 1 },
    (_, i) => network.years.first + i,
  );
  const series = buildLengthSeries([], years, codes);
  const valid = {
    schemaVersion: 1,
    network: network.key,
    years,
    national: series,
    unassigned: series,
    regions: { kanto: series },
    prefectures: Object.fromEntries(
      Array.from({ length: 47 }, (_, i) => [String(i + 1).padStart(2, "0"), series]),
    ),
  };

  test("47 県と台帳の種別が揃った summary を読む", () => {
    expect(parseInfraHistorySummary(valid, network.key)?.years.length).toBe(years.length);
  });

  test("県が欠けた summary は欠損を 0 で描かないよう null を返す", () => {
    const { "13": _removed, ...rest } = valid.prefectures;
    expect(parseInfraHistorySummary({ ...valid, prefectures: rest }, network.key)).toBeNull();
  });

  test("別の路線網の summary は読まない", () => {
    expect(parseInfraHistorySummary(valid, "railway")).toBeNull();
  });
});

describe("公開の判定 (isInfraNetworkPublishable)", () => {
  const evidence = {
    method: "phone" as const,
    date: "2026-10-29",
    counterpart: "国土数値情報 事務局",
    summary: "広告のないページでの公開を了承",
    recordedBy: "owner",
  };
  test("広告なしページと加工データ配信の両方の了承があるときだけ公開できる", () => {
    const publication = (scope: readonly ("ad-free-page" | "processed-data-delivery" | "sns" | "ad-page")[]) => ({
      publication: { status: "public-approved" as const, blockedReason: null, permissionEvidence: { ...evidence, scope } },
    });
    expect(isInfraNetworkPublishable(publication(["ad-free-page", "processed-data-delivery"]))).toBe(true);
    expect(isInfraNetworkPublishable(publication(["ad-free-page"]))).toBe(false);
    expect(isInfraNetworkPublishable(publication(["sns"]))).toBe(false);
  });
  test("status が local-only なら証跡があっても公開しない", () => {
    expect(
      isInfraNetworkPublishable({
        publication: {
          status: "local-only",
          blockedReason: "確認中",
          permissionEvidence: { ...evidence, scope: ["ad-free-page", "processed-data-delivery"] },
        },
      }),
    ).toBe(false);
  });
});
