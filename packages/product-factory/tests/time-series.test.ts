import { describe, expect, it } from "vitest";
import { parseTimeSeries, checkSeriesAgainstDataset, compareSeriesWithDataset, withRoundingNote, fetchSeriesForDatasets, type StatsValueRow } from "../src/data/time-series";
import { normalizeDataset } from "../src/data/dataset";
import { PREFECTURE_CODES5 } from "../src/data/prefectures";
import { serializeSeriesCsv, serializeSeriesNotesCsv, TIMESERIES_CSV_HEADER } from "../src/generators/timeseries-csv";

const base = { rankingKey: "total-population", indicator: "総人口", unit: "人" };

/** 全県に同じ値 (県ごとに +i) の行を作る。 */
function rowsFor(yearCode: string, yearName: string, value: number, unit = "人"): StatsValueRow[] {
  return PREFECTURE_CODES5.map((areaCode, i) => ({ areaCode, yearCode, yearName, value: value + i, unit }));
}

describe("時系列の取り込み (parseTimeSeries)", () => {
  it("年は 4 桁にそろえ、古い年から並べる。全国・市区町村の行は入れない", () => {
    const rows: StatsValueRow[] = [
      ...rowsFor("2020100000", "2020年", 200),
      ...rowsFor("2015", "2015年", 100),
      { areaCode: "00000", yearCode: "2015", yearName: "2015年", value: 999, unit: "人" },
      { areaCode: "01100", yearCode: "2015", yearName: "2015年", value: 999, unit: "人" },
    ];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years.map((y) => y.year)).toEqual(["2015", "2020"]);
    expect(s.years[0].values.length).toBe(47);
    expect(s.years[0].values[0].value).toBe(100);
    expect(s.dropped).toEqual([]);
  });

  it("4 桁にできない年は理由つきで落とす (黙って通さない)", () => {
    const rows: StatsValueRow[] = [...rowsFor("2020", "2020年", 1), ...rowsFor("R2", "令和2年", 5)];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years.map((y) => y.year)).toEqual(["2020"]);
    expect(s.dropped).toEqual([{ year: "R2", reason: "年を 4 桁にできない" }]);
    expect(s.notes.join("")).toContain("R2 は取り込んでいません");
  });

  it("欠測は 0 にせず null + 欠損の理由で持ち、欠測のある年を注記する", () => {
    const rows = rowsFor("2020", "2020年", 10);
    rows[3] = { ...rows[3], value: null };
    const s = parseTimeSeries({ rows }, base);
    expect(s.years[0].values[3]).toEqual({ code5: PREFECTURE_CODES5[3], value: null, missing: "missing" });
    expect(s.notes.join("")).toContain("2020年（1県）");
  });

  it("行の無い県も 0 にせず欠損で補う", () => {
    const rows = rowsFor("2020", "2020年", 10).slice(0, 46);
    const s = parseTimeSeries({ rows }, base);
    expect(s.years[0].values[46]).toEqual({ code5: PREFECTURE_CODES5[46], value: null, missing: "missing" });
  });

  it("暦年と年度が混在する指標は、変わり目を注記する", () => {
    const rows = [...rowsFor("2018", "2018年", 1), ...rowsFor("2019", "2019年", 1), ...rowsFor("2020", "2020年度", 1), ...rowsFor("2021", "2021年度", 1)];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years.map((y) => y.basis)).toEqual(["暦年", "暦年", "年度", "年度"]);
    expect(s.notes[0]).toContain("2018〜2019年は暦年");
    expect(s.notes[0]).toContain("2020〜2021年は年度");
  });

  it("暦年だけ・年度だけの指標には年の定義の注記を付けない", () => {
    const s = parseTimeSeries({ rows: [...rowsFor("2020", "2020年度", 1), ...rowsFor("2021", "2021年度", 1)] }, base);
    expect(s.years.map((y) => y.basis)).toEqual(["年度", "年度"]);
    expect(s.notes).toEqual([]);
  });

  it("別の統計表で補った年を、統計表 ID つきで注記する (収録されている年だけ)", () => {
    const payload = {
      rows: [...rowsFor("2020", "2020年", 1), ...rowsFor("2025", "2025年", 1)],
      meta: { recipe: { ops: { supplements: [{ years: [2025, 2030], estatParams: { statsDataId: "0004065881" } }] } } },
    };
    const s = parseTimeSeries(payload, base);
    expect(s.notes.join("")).toContain("2025年は、他の年とは別の統計表（statsDataId 0004065881）");
    expect(s.notes.join("")).not.toContain("2030");
  });

  it("換算できる単位の年は単位の正典の係数で換算し、注記する", () => {
    const rows = [...rowsFor("2019", "2019年", 5, "千人"), ...rowsFor("2020", "2020年", 5000, "人")];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years[0].values[0].value).toBe(5000);
    expect(s.years[1].values[0].value).toBe(5000);
    expect(s.notes.join("")).toContain("千人→人");
  });

  it("比べられない単位の年は落として理由を残す (1 倍で通さない)", () => {
    const rows = [...rowsFor("2019", "2019年", 5, "円"), ...rowsFor("2020", "2020年", 50, "人")];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years.map((y) => y.year)).toEqual(["2020"]);
    expect(s.dropped[0].year).toBe("2019");
    expect(s.dropped[0].reason).toContain("単位が比べられない");
    expect(s.dropped[0].reason).toContain("dimension-mismatch");
  });

  it("同じ年・同じ県に違う値が重複したら、どちらも採らず空欄にして注記する", () => {
    const rows = [...rowsFor("2020", "2020年", 10), { areaCode: PREFECTURE_CODES5[0], yearCode: "2020", yearName: "2020年", value: 11, unit: "人" }];
    const s = parseTimeSeries({ rows }, base);
    expect(s.years[0].values[0].value).toBeNull();
    expect(s.notes.join("")).toContain("重複していた 1 件");
  });
});

describe("時系列と比較表の突き合わせ", () => {
  const ds = normalizeDataset({
    indicator: "総人口",
    unit: "人",
    year: "2020",
    source: { surveyName: "x", tableName: "x", statsDataId: "0000010101", url: "https://example.com", year: "2020", retrievedAt: "2026-11-22", unit: "人", transform: "x", notes: "x" },
    values: PREFECTURE_CODES5.map((code, i) => ({ code, value: 10 + i })),
  });

  it("基準年の値が全県で同じなら一致", () => {
    const s = parseTimeSeries({ rows: rowsFor("2020", "2020年", 10) }, base);
    expect(checkSeriesAgainstDataset(s, ds)).toBeNull();
  });

  it("基準年が時系列に無い・1 県でも値が違えば不一致", () => {
    expect(checkSeriesAgainstDataset(parseTimeSeries({ rows: rowsFor("2015", "2015年", 10) }, base), ds)?.reason).toContain("基準年 2020 が時系列に無い");
    const rows = rowsFor("2020", "2020年", 10);
    rows[46] = { ...rows[46], value: 1 };
    expect(checkSeriesAgainstDataset(parseTimeSeries({ rows }, base), ds)?.reason).toContain("47000");
  });
});

describe("丸めの違い (比較表が時系列を丸めた値)", () => {
  const mkDs = (values: number[]) =>
    normalizeDataset({
      indicator: "x",
      unit: "円",
      year: "2020",
      source: { surveyName: "x", tableName: "x", statsDataId: "-", url: "x", year: "2020", retrievedAt: "x", unit: "円", transform: "x", notes: "x" },
      values: PREFECTURE_CODES5.map((code, i) => ({ code, value: values[i] })),
    });
  const mkSeries = (values: number[]) =>
    parseTimeSeries({ rows: PREFECTURE_CODES5.map((areaCode, i) => ({ areaCode, yearCode: "2020", yearName: "2020年", value: values[i], unit: "円" })) }, { rankingKey: "x", indicator: "x", unit: "円" });
  const exact = PREFECTURE_CODES5.map((_, i) => 100 + i);

  it("比較表 584.8 と時系列 584.83 は、小数第 1 位への丸めとして一致扱いにし、桁数を返す", () => {
    const table = [...exact];
    const full = [...exact];
    table[0] = 584.8;
    full[0] = 584.83;
    const r = compareSeriesWithDataset(mkSeries(full), mkDs(table));
    expect(r.mismatch).toBeNull();
    expect(r.roundedDecimals).toBe(1);
    expect(withRoundingNote(mkSeries(full), mkDs(table), 1).notes.join("")).toContain("小数第 1 位までに丸めています");
  });

  it("丸めでは説明できない差 (584.8 と 584.9) は不一致のまま", () => {
    const table = [...exact];
    const full = [...exact];
    table[0] = 584.8;
    full[0] = 584.93;
    expect(compareSeriesWithDataset(mkSeries(full), mkDs(table)).mismatch?.reason).toContain("01000");
  });

  it("桁数が同じ (584.8 と 584.9) は丸めではなく不一致", () => {
    const table = [...exact];
    const full = [...exact];
    table[0] = 584.8;
    full[0] = 584.9;
    expect(compareSeriesWithDataset(mkSeries(full), mkDs(table)).mismatch).not.toBeNull();
  });

  it("全県で完全に一致するなら丸めなし", () => {
    expect(compareSeriesWithDataset(mkSeries(exact), mkDs(exact))).toEqual({ mismatch: null, roundedDecimals: null });
  });
});

describe("時系列の取得", () => {
  it("指標キーの無い指標 (手記のデータセット) は取れないと止まる", async () => {
    const ds = normalizeDataset({
      indicator: "手記",
      unit: "人",
      year: "2020",
      source: { surveyName: "x", tableName: "x", statsDataId: "-", url: "x", year: "2020", retrievedAt: "x", unit: "人", transform: "x", notes: "x" },
      values: [],
    });
    await expect(fetchSeriesForDatasets([ds])).rejects.toThrow("指標キーの無い指標");
  });

  it("並列に取っても datasets の並びのまま返し、進捗を数える", async () => {
    const mk = (key: string) => ({ ...normalizeDataset({ indicator: key, unit: "人", year: "2020", source: { surveyName: "x", tableName: "x", statsDataId: "-", url: "x", year: "2020", retrievedAt: "x", unit: "人", transform: "x", notes: "x" }, values: [] }), rankingKey: key });
    const keys = ["a", "b", "c", "d", "e"];
    let done = 0;
    const out = await fetchSeriesForDatasets(keys.map(mk), {
      concurrency: 3,
      onProgress: () => (done += 1),
      fetchSeries: async (b) => {
        await new Promise((r) => setTimeout(r, b.rankingKey === "a" ? 20 : 1));
        return parseTimeSeries({ rows: [] }, b);
      },
    });
    expect(out.map((s) => s.rankingKey)).toEqual(keys);
    expect(done).toBe(5);
  });
});

describe("時系列 CSV", () => {
  it("縦持ち: 指標 × 年 × 47 県。欠測は空欄 + 欠損理由 (0 にしない)。BOM + CRLF", () => {
    const rows = rowsFor("2020", "2020年度", 10);
    rows[0] = { ...rows[0], value: null };
    const s = parseTimeSeries({ rows }, base);
    const csv = serializeSeriesCsv([s]);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe(TIMESERIES_CSV_HEADER.join(","));
    expect(lines.length).toBe(1 + 47);
    expect(lines[1]).toBe("total-population,総人口,人,2020,年度,01000,北海道,,欠損");
    expect(lines[2]).toBe("total-population,総人口,人,2020,年度,02000,青森県,11,");
  });

  it("注記 CSV は注記のある指標だけを書く", () => {
    const noted = parseTimeSeries({ rows: [...rowsFor("2018", "2018年", 1), ...rowsFor("2020", "2020年度", 1)] }, base);
    const plain = parseTimeSeries({ rows: rowsFor("2020", "2020年", 1) }, { ...base, rankingKey: "other", indicator: "別" });
    const lines = serializeSeriesNotesCsv([noted, plain]).slice(1).trimEnd().split("\r\n");
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain("total-population");
    expect(lines[1]).toContain("2018〜2020");
  });
});
