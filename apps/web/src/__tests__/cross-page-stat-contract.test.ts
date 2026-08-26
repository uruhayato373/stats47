import { toDisplayEntry } from "@stats47/ranking/utils";
import { describe, expect, it } from "vitest";

import { toLineChartData } from "@/components/stat-charts/adapters/toLineChartData";

import { convertToBarData } from "@/features/blog/utils/convert-chart-data";

import type { SnapshotReadResult } from "@stats47/r2-storage/server";
import type { RankingValue } from "@stats47/ranking";
import type { StatsValuesPayload } from "@stats47/stats-r2";
import type { StatsSchema } from "@stats47/types";



const EXPECTED = {
  metricKey: "total-population",
  yearCode: "2024",
  areaCode: "13000",
  value: 14_177_173,
  unit: "人",
  label: "総人口",
  provenance: "qg3-fixture-config-hash",
} as const;

function fixture(): SnapshotReadResult<StatsValuesPayload> {
  return {
    status: "ok",
    attempts: 1,
    data: {
      metricKey: EXPECTED.metricKey,
      entityKind: "prefecture",
      rows: [
        {
          areaCode: EXPECTED.areaCode,
          areaName: "東京都",
          yearCode: EXPECTED.yearCode,
          yearName: "2024年",
          value: EXPECTED.value,
          unit: EXPECTED.unit,
          rank: 1,
        },
      ],
      meta: {
        rowCount: 1,
        yearRange: [EXPECTED.yearCode, EXPECTED.yearCode],
        areaCount: 1,
        generatedAt: "2026-08-26T00:00:00.000Z",
        recipe: {
          kind: "estat",
          estatParams: { statsDataId: "0000010101", cdCat01: "A1101" },
          derived: false,
          configHash: EXPECTED.provenance,
        },
      },
    },
  };
}

interface SurfaceObservation {
  surface: "ranking" | "theme" | "blog";
  metricKey: string;
  yearCode: string;
  areaCode: string;
  value: number;
  unit: string;
  label: string;
  provenance: string;
}

function adaptAllSurfaces(result: SnapshotReadResult<StatsValuesPayload>): SurfaceObservation[] {
  if (result.status !== "ok" && result.status !== "stale") {
    throw new Error(`reader state is ${result.status}`);
  }
  const payload = result.data;
  const row = payload.rows.find(
    (candidate) => candidate.areaCode === EXPECTED.areaCode && candidate.yearCode === EXPECTED.yearCode
  );
  if (!row || row.value === null || !row.unit || !payload.meta.recipe?.configHash) {
    throw new Error("expected observation or provenance is missing");
  }

  const statsRow: StatsSchema = {
    metricKey: payload.metricKey,
    areaCode: row.areaCode,
    areaName: row.areaName,
    yearCode: row.yearCode,
    yearName: row.yearName,
    value: row.value,
    unit: row.unit,
  };
  const ranking = toDisplayEntry({
    ...statsRow,
    rank: row.rank ?? 0,
  } as RankingValue);
  const theme = toLineChartData([[statsRow]], [EXPECTED.label]);
  const blog = convertToBarData([statsRow])[0];
  const common = {
    metricKey: payload.metricKey,
    yearCode: row.yearCode,
    areaCode: row.areaCode,
    unit: row.unit,
    label: EXPECTED.label,
    provenance: payload.meta.recipe.configHash,
  };

  return [
    { surface: "ranking", ...common, value: ranking.value },
    {
      surface: "theme",
      ...common,
      value: Number(theme.data[0]?.[EXPECTED.label]),
    },
    { surface: "blog", ...common, value: blog?.value ?? Number.NaN },
  ];
}

function expectedSurface(surface: SurfaceObservation["surface"]): SurfaceObservation {
  return { surface, ...EXPECTED };
}

function assertAllSurfacesContract(result: SnapshotReadResult<StatsValuesPayload>): SurfaceObservation[] {
  const observations = adaptAllSurfaces(result);
  const expected = [expectedSurface("ranking"), expectedSurface("theme"), expectedSurface("blog")];
  const mismatched = observations.some((observation, index) => {
    const target = expected[index];
    return (
      !target ||
      observation.surface !== target.surface ||
      observation.metricKey !== target.metricKey ||
      observation.yearCode !== target.yearCode ||
      observation.areaCode !== target.areaCode ||
      observation.value !== target.value ||
      observation.unit !== target.unit ||
      observation.label !== target.label ||
      observation.provenance !== target.provenance
    );
  });
  if (observations.length !== expected.length || mismatched) {
    throw new Error("public surface observation contract mismatch");
  }
  return observations;
}

function mutate(apply: (payload: StatsValuesPayload) => StatsValuesPayload): SnapshotReadResult<StatsValuesPayload> {
  const base = fixture();
  if (base.status !== "ok") throw new Error("fixture must be ok");
  return { ...base, data: apply(base.data) };
}

describe("ranking/theme/blog public observation contract", () => {
  it("同じreader結果からvalue/unit/label/provenanceが3 surfaceで一致する", () => {
    const observations = assertAllSurfacesContract(fixture());
    expect(observations).toEqual([expectedSurface("ranking"), expectedSurface("theme"), expectedSurface("blog")]);
  });

  it.each([
    [
      "value 10倍",
      (payload: StatsValuesPayload) => ({
        ...payload,
        rows: payload.rows.map((row) => ({
          ...row,
          value: EXPECTED.value * 10,
        })),
      }),
    ],
    [
      "yearずれ",
      (payload: StatsValuesPayload) => ({
        ...payload,
        rows: payload.rows.map((row) => ({
          ...row,
          yearCode: "2023",
          yearName: "2023年",
        })),
      }),
    ],
    [
      "unitだけ変更",
      (payload: StatsValuesPayload) => ({
        ...payload,
        rows: payload.rows.map((row) => ({ ...row, unit: "千人" })),
      }),
    ],
    ["area欠落", (payload: StatsValuesPayload) => ({ ...payload, rows: [] })],
  ] as const)("%s mutationを契約違反として落とす", (_name, apply) => {
    expect(() => assertAllSurfacesContract(mutate(apply))).toThrowError();
  });
});
