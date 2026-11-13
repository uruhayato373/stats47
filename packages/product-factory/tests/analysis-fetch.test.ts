import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAnalysisSource, type AnalysisSource } from "../src/analysis/fetch-estat";

const api = vi.hoisted(() => ({ meta: vi.fn(), data: vi.fn() }));
vi.mock("@stats47/estat-api/api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@stats47/estat-api/api")>(),
  fetchMetaInfoFromApi: api.meta,
  fetchStatsDataFromApi: api.data,
}));

const source: AnalysisSource = {
  id: "population", statsDataId: "0000020201", grain: "municipality", years: [2020],
  metrics: [{ id: "population", code: "A1101", label: "総人口", unit: "人" }],
};
const areaEntries = [
  ["00000", "全国"], ["01000", "北海道"], ["13000", "東京都"],
  ["01100", "北海道 札幌市"], ["01101", "北海道 札幌市 中央区"],
  ["13100", "東京都 特別区部"], ["13101", "東京都 千代田区"],
].map(([code, name]) => ({ "@code": code!, "@name": name! }));

function metadata(timeCodes = ["2020100000", "2015100000"], unit = "人") {
  return { GET_META_INFO: {
    RESULT: { STATUS: 0 },
    METADATA_INF: {
      TABLE_INF: { "@id": source.statsDataId, TITLE: { $: "人口・世帯" } },
      CLASS_INF: { CLASS_OBJ: [
        { "@id": "tab", "@name": "観測値", CLASS: [{ "@code": "00001", "@name": "観測値" }] },
        { "@id": "cat01", "@name": "人口", CLASS: [{ "@code": "A1101", "@name": "A1101_総人口", "@unit": unit }] },
        { "@id": "time", "@name": "年", CLASS: timeCodes.map((code) => ({ "@code": code, "@name": code })) },
        { "@id": "area", "@name": "地域", CLASS: areaEntries },
      ] },
    },
  } };
}

function value(area = "01100", raw = "100", time = "2020100000", unit = "人") {
  return { "@cat01": "A1101", "@tab": "00001", "@area": area, "@time": time, "@unit": unit, $: raw };
}

function response(values = [value()], total = values.length, start = 1, next?: number) {
  return { GET_STATS_DATA: {
    RESULT: { STATUS: 0 },
    STATISTICAL_DATA: {
      TABLE_INF: { "@id": source.statsDataId },
      RESULT_INF: { TOTAL_NUMBER: total, FROM_NUMBER: start, TO_NUMBER: start + values.length - 1, ...(next === undefined ? {} : { NEXT_KEY: next }) },
      DATA_INF: { VALUE: values },
    },
  } };
}

beforeEach(() => {
  vi.resetAllMocks();
  api.meta.mockResolvedValue(metadata());
  api.data.mockResolvedValue(response());
});

describe("analysis source fetch", () => {
  it("keeps designated cities and special wards, excluding prefectures, national/ward aggregates and administrative wards", async () => {
    api.data.mockResolvedValue(response(areaEntries.map((area) => value(area["@code"]))));
    const result = await fetchAnalysisSource(source);
    expect(result.rows.map((row) => row.areaCode)).toEqual(["01100", "13101"]);
    expect(result.rows[0]).toMatchObject({ areaName: "北海道 札幌市", year: 2020, value: 100, unit: "人" });
    expect(result.tableTitle).toBe("人口・世帯");
    expect(result.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("keeps only prefecture rows in a mixed-grain response", async () => {
    api.data.mockResolvedValue(response(areaEntries.map((area) => value(area["@code"]))));
    const result = await fetchAnalysisSource({ ...source, grain: "prefecture" });
    expect(result.rows.map((row) => row.areaCode)).toEqual(["01000", "13000"]);
  });

  it("collects every page before year filtering and preserves raw responses", async () => {
    const first = response([value("01100", "200", "2015100000")], 2, 1, 2);
    const second = response([value("13101", "300")], 2, 2);
    api.data.mockReset().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const result = await fetchAnalysisSource(source);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ areaCode: "13101", value: 300, year: 2020 });
    expect(result.raw).toEqual({ metadata: metadata(), pages: [first, second] });
    expect(api.data).toHaveBeenNthCalledWith(1, expect.objectContaining({ startPosition: 1 }));
    expect(api.data).toHaveBeenNthCalledWith(2, expect.objectContaining({ statsDataId: source.statsDataId, cdCat01: "A1101", startPosition: 2, replaceSpChars: "0" }));
    for (const [params] of api.data.mock.calls) {
      expect(params).not.toHaveProperty("startRecord");
      expect(params).not.toHaveProperty("cdArea");
      expect(params).not.toHaveProperty("cdTime");
      expect(params).not.toHaveProperty("cdTimeFrom");
      expect(params).not.toHaveProperty("cdTimeTo");
    }
  });

  it.each(["-", "***", "X", "…", "", " "])("keeps missing marker %j as null instead of zero", async (raw) => {
    api.data.mockResolvedValue(response([value("01100", raw), value("13101", "0")]));
    const result = await fetchAnalysisSource(source);
    expect(result.rows[0]).toMatchObject({ value: null, missingReason: raw.trim() || "blank" });
    expect(result.rows[1]).toMatchObject({ value: 0 });
    expect(result.rows[1]).not.toHaveProperty("missingReason");
  });

  it("accepts canonical four-digit annual time codes", async () => {
    api.meta.mockResolvedValue(metadata(["2020"]));
    api.data.mockResolvedValue(response([value("01100", "10", "2020")]));
    expect((await fetchAnalysisSource(source)).rows[0]!.year).toBe(2020);
  });

  it("excludes echoed credentials from raw provenance while retaining the response metadata", async () => {
    const meta = metadata();
    api.meta.mockResolvedValue({ GET_META_INFO: { ...meta.GET_META_INFO, PARAMETER: { STATS_DATA_ID: source.statsDataId, APP_ID: "secret-credential" } } });
    const data = response();
    api.data.mockResolvedValue({ GET_STATS_DATA: { ...data.GET_STATS_DATA, PARAMETER: { STATS_DATA_ID: source.statsDataId, appId: "secret-credential" } } });
    const raw = JSON.stringify((await fetchAnalysisSource(source)).raw);
    expect(raw).not.toContain("secret-credential");
    expect(raw).toContain(source.statsDataId);
  });

  it.each(["2020010000", "2020130000", "202", "2020x"])("rejects monthly or malformed time %s before a stats request", async (time) => {
    api.meta.mockResolvedValue(metadata([time]));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/time code/);
    expect(api.data).not.toHaveBeenCalled();
  });

  it("rejects ambiguous annual/fiscal observations and absent years", async () => {
    api.meta.mockResolvedValue(metadata(["2020100000", "2020000000"]));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/missing or ambiguous/);
    api.meta.mockResolvedValue(metadata(["2015100000"]));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/missing or ambiguous/);
    expect(api.data).not.toHaveBeenCalled();
  });

  it("rejects codes absent from metadata and does not choose a different table", async () => {
    await expect(fetchAnalysisSource({ ...source, metrics: [{ ...source.metrics[0]!, code: "nonexistent" }] })).rejects.toThrow(/metadata axis/);
    expect(api.meta).toHaveBeenCalledTimes(1);
    expect(api.data).not.toHaveBeenCalled();
  });

  it("rejects metadata and value unit mismatches", async () => {
    api.meta.mockResolvedValue(metadata(undefined, "千人"));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Unit mismatch/);
    expect(api.data).not.toHaveBeenCalled();
    api.meta.mockResolvedValue(metadata());
    api.data.mockResolvedValue(response([value("01100", "100", "2020100000", "千人")]));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Unit mismatch/);
  });

  it("rejects duplicate observations across pages", async () => {
    api.data.mockReset().mockResolvedValueOnce(response([value()], 2, 1, 2)).mockResolvedValueOnce(response([value()], 2, 2));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Duplicate observation/);
  });

  it("rejects truncated responses instead of returning a partial dataset", async () => {
    api.data.mockResolvedValue(response([value()], 2));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Truncated response/);
  });

  it("rejects a repeated first page when the server ignores the requested continuation position", async () => {
    api.data.mockResolvedValue(response([value()], 2, 1, 2));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Invalid pagination.*at 2/);
    expect(api.data).toHaveBeenCalledTimes(2);
    expect(api.data).toHaveBeenLastCalledWith(expect.objectContaining({ startPosition: 2 }));
  });

  it("rejects non-advancing pagination and changed totals", async () => {
    api.data.mockResolvedValue(response([value()], 2, 1, 1));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/NEXT_KEY/);
    api.data.mockReset().mockResolvedValueOnce(response([value()], 2, 1, 2)).mockResolvedValueOnce(response([value("13101")], 3, 2));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/changed total/);
  });

  it("rejects data from another table and non-finite numeric values", async () => {
    const wrongTable = response();
    wrongTable.GET_STATS_DATA.STATISTICAL_DATA.TABLE_INF["@id"] = "different";
    api.data.mockResolvedValue(wrongTable);
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Invalid data response/);
    api.data.mockResolvedValue(response([value("01100", "Infinity")]));
    await expect(fetchAnalysisSource(source)).rejects.toThrow(/Non-finite/);
  });
});
