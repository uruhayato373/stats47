import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { LOW_ELEVATION_G04_ZIPS } from "../low-elevation-inputs";
import {
  LOW_ELEVATION_ATTRIBUTION,
  LOW_ELEVATION_BAND_LABELS,
  LOW_ELEVATION_THRESHOLDS_M,
  assertGeoLowElevationConservation,
  lowElevationBand,
  lowElevationMeshBounds,
  parseGeoLowElevationManifest,
  parseGeoLowElevationPrefDetail,
  summarizeLowElevation,
  type GeoLowElevationMesh,
} from "../low-elevation-population";

const ROOT = fileURLToPath(new URL("../../../../../.local/r2/", import.meta.url));
const AREA = "13000";
const GENERATED_AT = "2026-10-08T04:00:00.000Z";

/** 閾値の境界値(0/5/10ちょうど)と、平均と最低が分かれるケースを含む。 */
const MESHES: GeoLowElevationMesh[] = [
  ["53394611", "13101", 100, -0.4, 2, -1],
  ["53394612", "13101", 200, 0, 3, 0],
  ["53394613", "13101", 300, 5, 9, 1],
  ["53394621", "13101", 400, 5.1, 9, 4.9],
  ["53394622", "13102", 500, 10, 12, 8],
  ["53394623", "13102", 600, 30, 80, 10.1],
  ["53394631", "13102_13103", 7, null, null, null], // 複数市区町村にまたがるメッシュ(原典のSHICODE連結)
];

const round4 = (x: number) => Math.round(x * 10000) / 10000;
const share = (n: number, d: number) => round4((n / d) * 100);

function buildDetail(meshes: readonly GeoLowElevationMesh[] = MESHES) {
  const r = summarizeLowElevation(meshes);
  const people = (scaled: number) => scaled / 10000;
  const total = people(r.totalScaled);
  return {
    schemaVersion: 1,
    slug: "population-low-elevation",
    generatedAt: GENERATED_AT,
    areaCode: AREA,
    areaName: "東京都",
    meshMethod: "mesh-code-join",
    columns: [
      "meshId",
      "municipalityCode",
      "population2020",
      "meanElevationM",
      "maxElevationM",
      "minElevationM",
    ],
    meshes: meshes.map((m) => [...m]),
    summary: {
      meshCount: r.meshCount,
      population2020: total,
      bands: LOW_ELEVATION_BAND_LABELS.map((label, i) => ({
        label,
        meshCount: r.bands[i]![0],
        population: people(r.bands[i]![1]),
        sharePercent: share(r.bands[i]![1], r.totalScaled),
      })),
      thresholds: LOW_ELEVATION_THRESHOLDS_M.map((thresholdM, i) => ({
        thresholdM,
        meanBased: {
          meshCount: r.mean[i]![0],
          population: people(r.mean[i]![1]),
          sharePercent: share(r.mean[i]![1], r.totalScaled),
        },
        minBased: {
          meshCount: r.min[i]![0],
          population: people(r.min[i]![1]),
          sharePercent: share(r.min[i]![1], r.totalScaled),
        },
      })),
      conservation: {
        meshPopulation: total,
        meshPopulationRounded: Math.round(total),
        censusPopulation2020: Math.round(total),
        difference: round4(total - Math.round(total)),
        bandSumMatches: true,
        bandMeshSumMatches: true,
        matchesCensus: true,
      },
    },
  };
}
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe("標高区分と閾値の境界", () => {
  test("0m・5m・10mちょうどは各閾値に含み、不明は低地に入れない", () => {
    expect(lowElevationBand(null)).toBe(0);
    expect([-0.4, 0, 0.1, 5, 5.1, 10, 10.1].map(lowElevationBand)).toEqual([
      1, 1, 2, 2, 3, 3, 4,
    ]);
    const r = summarizeLowElevation(MESHES);
    expect(r.bands.map((b) => b[0])).toEqual([1, 2, 1, 2, 1]);
    expect(r.totalScaled).toBe(2107 * 10000);
    expect(r.mean.map((m) => m[1])).toEqual([300, 600, 1500].map((n) => n * 10000));
    // 最低標高基準は平均基準の上限側(平均5.1・最低4.9のメッシュを含む)
    expect(r.min[1]![1]).toBe(1000 * 10000);
    expect(r.min.every((m, i) => m[1] >= r.mean[i]![1])).toBe(true);
    // 標高不明7人は、どの閾値のどの基準にも入らない
    for (const t of [...r.mean, ...r.min]) expect(t[1] % 100).toBe(0);
  });

  test("3次メッシュコードの境界を復元し、不正コードと範囲外を拒否する", () => {
    const [w, s, e, n] = lowElevationMeshBounds("53394611")!;
    expect(w).toBeCloseTo(139.7625, 6);
    expect(s).toBeCloseTo(35.675, 6);
    expect(e - w).toBeCloseTo(1 / 80, 9);
    expect(n - s).toBeCloseTo(1 / 120, 9);
    expect(lowElevationMeshBounds("5339461")).toBeNull();
    expect(lowElevationMeshBounds("53398611")).toBeNull(); // 2次メッシュ区画番号は0-7
    expect(lowElevationMeshBounds("10010101")).toBeNull(); // 日本の範囲外
  });
});

describe("県別途中artifactの検証", () => {
  test("再計算したsummaryと一致する正常な県詳細を受理する", () => {
    expect(parseGeoLowElevationPrefDetail(buildDetail(), AREA)).not.toBeNull();
  });

  test("別県の確認・schema・列定義の取り違えを拒否する", () => {
    const base = buildDetail();
    expect(parseGeoLowElevationPrefDetail(base, "14000")).toBeNull();
    expect(parseGeoLowElevationPrefDetail({ ...base, slug: "population-snow-designation" }, AREA)).toBeNull();
    expect(parseGeoLowElevationPrefDetail({ ...base, columns: [...base.columns].reverse() }, AREA)).toBeNull();
    expect(parseGeoLowElevationPrefDetail({ ...base, extra: 1 }, AREA)).toBeNull();
  });

  test.each([
    ["メッシュを1つ落とす(件数・人口とも不一致)", (d: ReturnType<typeof buildDetail>) => d.meshes.pop()],
    ["標高を閾値の反対側へ動かす", (d: ReturnType<typeof buildDetail>) => { d.meshes[2]![3] = 5.01; }],
    ["人口を1人変える", (d: ReturnType<typeof buildDetail>) => { d.meshes[0]![2] = 101; }],
    ["同じ市区町村・同じメッシュを重複させる", (d: ReturnType<typeof buildDetail>) => { d.meshes[1]![0] = d.meshes[0]![0]; d.meshes[1]![1] = d.meshes[0]![1]; }],
    ["別県の市区町村コードを混ぜる", (d: ReturnType<typeof buildDetail>) => { d.meshes[0]![1] = "14101"; }],
    ["存在しないメッシュコードを混ぜる", (d: ReturnType<typeof buildDetail>) => { d.meshes[0]![0] = "53398611"; }],
    ["最低標高が平均を上回る", (d: ReturnType<typeof buildDetail>) => { d.meshes[2]![5] = 6; }],
    ["標高3列のうち1列だけ欠測", (d: ReturnType<typeof buildDetail>) => { d.meshes[0]![4] = null; }],
    ["負の人口", (d: ReturnType<typeof buildDetail>) => { d.meshes[0]![2] = -1; }],
    ["区分ラベルを入れ替える", (d: ReturnType<typeof buildDetail>) => { const b = d.summary.bands; [b[1]!.label, b[2]!.label] = [b[2]!.label, b[1]!.label]; }],
    ["閾値行の順序を入れ替える", (d: ReturnType<typeof buildDetail>) => { d.summary.thresholds.reverse(); }],
    ["区分合計の一致フラグを偽る", (d: ReturnType<typeof buildDetail>) => { d.summary.conservation.bandSumMatches = false; }],
    ["国勢調査の人口とずらす", (d: ReturnType<typeof buildDetail>) => { d.summary.conservation.censusPopulation2020 += 1; }],
    ["閾値の共有率を書き換える", (d: ReturnType<typeof buildDetail>) => { d.summary.thresholds[1]!.meanBased.sharePercent = 99; }],
  ])("%sと拒否する", (_label, mutate) => {
    const detail = clone(buildDetail());
    mutate(detail);
    // 変異前は受理され、変異後だけ拒否される(別の理由で赤になっていないことの対照)
    expect(parseGeoLowElevationPrefDetail(buildDetail(), AREA)).not.toBeNull();
    expect(parseGeoLowElevationPrefDetail(detail, AREA)).toBeNull();
  });

  test("集計行(item.json)との数値対応が崩れると例外になる", () => {
    const detail = parseGeoLowElevationPrefDetail(buildDetail(), AREA)!;
    const t = detail.summary.thresholds;
    const row = {
      areaCode: AREA,
      areaName: "東京都",
      rank: 1,
      values: {
        lowElevationShareMean5m: t[1]!.meanBased.sharePercent,
        lowElevationShareMean0m: t[0]!.meanBased.sharePercent,
        lowElevationShareMean10m: t[2]!.meanBased.sharePercent,
        lowElevationShareMin0m: t[0]!.minBased.sharePercent,
        lowElevationShareMin5m: t[1]!.minBased.sharePercent,
        lowElevationShareMin10m: t[2]!.minBased.sharePercent,
        population2020: detail.summary.population2020,
        lowElevationPopulationMean5m: t[1]!.meanBased.population,
        elevationUnknownPopulation: detail.summary.bands[0]!.population,
      },
    };
    expect(() => assertGeoLowElevationConservation(detail, row)).not.toThrow();
    expect(() =>
      assertGeoLowElevationConservation(detail, {
        ...row,
        values: { ...row.values, lowElevationShareMean5m: 99 },
      })
    ).toThrow();
    expect(() =>
      assertGeoLowElevationConservation(detail, { ...row, areaName: "大阪府" })
    ).toThrow();
  });
});

describe("承認済み原典の入力集合", () => {
  test("標高176ファイルのコードが一意で、SHA-256が64桁", () => {
    expect(LOW_ELEVATION_G04_ZIPS).toHaveLength(176);
    expect(new Set(LOW_ELEVATION_G04_ZIPS.map((z) => z[0])).size).toBe(176);
    expect(LOW_ELEVATION_G04_ZIPS.every((z) => /^\d{4}$/.test(z[0]) && /^[a-f0-9]{64}$/.test(z[2]) && z[1] > 0)).toBe(true);
  });
  test("原典表示にG04-aの承認番号2件とCC BY 4.0を含む", () => {
    expect(LOW_ELEVATION_ATTRIBUTION["G04-a"].join("")).toContain("平成25情使、第590号");
    expect(LOW_ELEVATION_ATTRIBUTION["G04-a"].join("")).toContain("平成25情複、第581号");
    expect(LOW_ELEVATION_ATTRIBUTION.mesh1000r6).toContain("CC BY 4.0");
  });
});

// 生成物がローカルにあるときだけ、実際の47県・manifestに対して契約を確認する。
const hasArtifacts = existsSync(`${ROOT}app/geo/population-low-elevation/manifest.json`);
describe.skipIf(!hasArtifacts)("ローカル生成物(.local/r2)の契約", () => {
  const read = (key: string) => JSON.parse(readFileSync(`${ROOT}${key}`, "utf8")) as Record<string, any>;

  test("manifestが承認済み入力集合・4段階・47県と一致する", () => {
    const manifest = read("app/geo/population-low-elevation/manifest.json");
    expect(parseGeoLowElevationManifest(manifest)).not.toBeNull();
    // 入力集合の欠落・差し替え・段階の取り違え・原典表示の改変を拒否する
    const drop = clone(manifest); drop.inputs.splice(10, 1);
    const swap = clone(manifest); swap.inputs[3].sha256 = "0".repeat(64);
    const stage = clone(manifest); [stage.stages[0], stage.stages[1]] = [stage.stages[1], stage.stages[0]];
    const attribution = clone(manifest); attribution.attribution["G04-a"] = [];
    const context = clone(manifest); context.contextLayers = [{ layerId: "x" }];
    const quality = clone(manifest); quality.quality.populatedMeshes += 1;
    const detailSha = clone(manifest); detailSha.stages[2].outputs[0].sha256 = "1".repeat(64);
    for (const bad of [drop, swap, stage, attribution, context, quality, detailSha])
      expect(parseGeoLowElevationManifest(bad)).toBeNull();
  });

  test("47県すべてが検証を通り、manifestのSHA・件数・国勢調査人口と集計行に一致する", () => {
    const manifest = read("app/geo/population-low-elevation/manifest.json");
    const item = read("app/geo/population-low-elevation/item.json");
    const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
    expect(sha(readFileSync(`${ROOT}app/geo/population-low-elevation/item.json`))).toBe(manifest.aggregate.sha256);
    let meshes = 0;
    for (const out of manifest.stages[0].outputs) {
      const body = readFileSync(`${ROOT}${out.key}`);
      expect(sha(body)).toBe(out.sha256);
      expect(body.byteLength).toBe(out.bytes);
      const detail = parseGeoLowElevationPrefDetail(JSON.parse(body.toString("utf8")), out.areaCode)!;
      expect(detail, out.key).not.toBeNull();
      expect(detail.meshes.length).toBe(out.recordCount);
      expect(detail.summary.conservation.censusPopulation2020).toBe(manifest.censusReference.populationByArea[out.areaCode]);
      assertGeoLowElevationConservation(detail, item.rows.find((r: { areaCode: string }) => r.areaCode === out.areaCode));
      meshes += detail.meshes.length;
    }
    expect(meshes).toBe(manifest.quality.populatedMeshes);
  });
});
