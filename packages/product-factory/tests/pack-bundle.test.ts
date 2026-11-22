import { describe, expect, it, afterEach } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { buildDatabook } from "../src/build/build-databook";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { MAX_INDICATORS_PER_PART, bundleFilePart, measureZipBreakdown, measureZipBytes, partBaseName, planBundleParts, svgRelPath, writeBundleFiles } from "../src/build/pack-bundle";
import { classifyChoropleth, legendEntries } from "../src/charts/chart-spec";
import { normalizeDataset, type Dataset } from "../src/data/dataset";
import { PREFECTURE_CODES5 } from "../src/data/prefectures";
import { parseTimeSeries, type MetricTimeSeries } from "../src/data/time-series";
import { renderChoroplethSvg } from "../src/generators/svg-map";
import { seriesSheetName } from "../src/generators/timeseries-xlsx";
import { syntheticGeometry } from "./helpers/synthetic-geometry";

const SOURCE = { surveyName: "社会・人口統計体系", tableName: "表", statsDataId: "0000010101", url: "https://example.com", year: "2020", retrievedAt: "2026-11-22", unit: "人", transform: "抽出", notes: "注" };

function dataset(key: string, category: string, year = "2020", offset = 0): Dataset {
  return {
    ...normalizeDataset({ indicator: `指標 ${key}`, unit: "人", year, source: SOURCE, values: PREFECTURE_CODES5.map((code, i) => ({ code, value: offset + i })) }),
    rankingKey: key,
    category,
  };
}

function series(ds: Dataset, years: string[]): MetricTimeSeries {
  const rows = years.flatMap((y) => PREFECTURE_CODES5.map((areaCode, i) => ({ areaCode, yearCode: y, yearName: `${y}年`, value: Number(y) + i - 2000, unit: "人" })));
  // 基準年は比較表と同じ値にする
  const own = PREFECTURE_CODES5.map((areaCode, i) => ({ areaCode, yearCode: ds.year, yearName: `${ds.year}年`, value: ds.values[i].value, unit: "人" }));
  return parseTimeSeries({ rows: [...rows.filter((r) => r.yearCode !== ds.year), ...own] }, { rankingKey: ds.rankingKey ?? "", indicator: ds.indicator, unit: ds.unit, category: ds.category });
}

describe("分割の計画 (planBundleParts)", () => {
  const items = [
    ...Array.from({ length: 5 }, (_, i) => ({ category: "tourism", id: `t${i}` })),
    ...Array.from({ length: 3 }, (_, i) => ({ category: "population", id: `p${i}` })),
    { category: undefined, id: "x" },
  ];

  it("分野ごとにまとめ、分野マスタの表示順に並べる (未設定は最後の「その他」)", () => {
    const parts = planBundleParts(items, 100);
    expect(parts.map((p) => p.categoryKey)).toEqual(["population", "tourism", "other"]);
    expect(parts.map((p) => partBaseName(p))).toEqual(["01-population", "02-tourism", "03-other"]);
    expect(parts[2].categoryName).toBe("その他");
  });

  it("max を超える分野は連番で分け、通し番号は分割後の並びで 1 から続く", () => {
    const parts = planBundleParts(items, 2);
    const tourism = parts.filter((p) => p.categoryKey === "tourism");
    expect(tourism.map((p) => [p.part, p.parts, p.items.length])).toEqual([[1, 3, 2], [2, 3, 2], [3, 3, 1]]);
    expect(tourism.map((p) => partBaseName(p))).toEqual(["02-tourism-1", "02-tourism-2", "02-tourism-3"]);
    expect(parts.map((p) => p.firstNumber)).toEqual([1, 3, 4, 6, 8, 9]);
    expect(parts.reduce((n, p) => n + p.items.length, 0)).toBe(items.length);
  });

  it("max が 1 未満は不正", () => {
    expect(() => planBundleParts(items, 0)).toThrow();
  });
});

describe("Excel のシート名", () => {
  it("連番つきで 31 文字に収め、禁止記号を除き、重複しない", () => {
    const used = new Set<string>(["目次"]);
    const long = "とても長い指標名".repeat(10);
    const a = seriesSheetName(1, long, used);
    const b = seriesSheetName(2, "a/b?c*d[e]f:g", used);
    expect(a.length).toBeLessThanOrEqual(31);
    expect(a.startsWith("001 ")).toBe(true);
    expect(b).toBe("002 abcdefg");
    expect(new Set([a, b]).size).toBe(2);
  });
});

describe("凡例と編集用 SVG", () => {
  it("区分の凡例は下限以上・上限未満で、同じ値の境界で空になる区分は出さない", () => {
    const flat = normalizeDataset({ indicator: "x", unit: "人", year: "2020", source: SOURCE, values: PREFECTURE_CODES5.map((code) => ({ code, value: 5 })) });
    const entries = legendEntries(classifyChoropleth(flat, { classes: 5 }));
    expect(entries.length).toBeLessThan(5);
    const spread = dataset("s", "tourism");
    const spec = classifyChoropleth(spread, { classes: 5 });
    const labels = legendEntries(spec);
    expect(labels.length).toBe(5);
    expect(labels[0].label.startsWith("〜 ")).toBe(true);
    expect(labels[4].label.endsWith(" 〜")).toBe(true);
    expect(labels.map((e) => e.color)).toEqual([...spec.classColors]);
  });

  it("editable の SVG は県ごとに id・data-code・title を持ち、凡例を含む。既定の SVG は変わらない", () => {
    const ds = dataset("s", "tourism");
    const spec = classifyChoropleth(ds, { classes: 5 });
    const geo = syntheticGeometry();
    const editable = renderChoroplethSvg(geo, spec, { width: 620, title: "t", editable: true, legend: { title: "凡例", entries: legendEntries(spec) } });
    expect((editable.match(/<path id="pref-\d{5}"/g) ?? []).length).toBe(PREFECTURE_CODES5.length);
    expect(editable).toContain('id="pref-13000"');
    expect(editable).toContain("<title>東京都：");
    expect(editable).toContain('<g id="legend">');
    const plain = renderChoroplethSvg(geo, spec, { width: 620, title: "t" });
    expect(plain).not.toContain("pref-13000");
    expect(plain).not.toContain("legend");
  });
});

describe("バンドルの書き出し (writeBundleFiles)", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  async function build() {
    const dir = mkdtempSync(join(tmpdir(), "pf-bundle-"));
    dirs.push(dir);
    const datasets = [dataset("k-one", "tourism", "2020"), dataset("k-two", "population", "2015", 100), dataset("k-three", "tourism", "2020", 7)];
    const ser = datasets.map((d, i) => series(d, i === 1 ? ["2010", "2015"] : ["2018", "2019", "2020"]));
    const result = await writeBundleFiles(dir, { packName: "テスト パック", formats: ["pptx", "csv", "svg"], datasets, series: ser, geo: syntheticGeometry() });
    return { dir, datasets, ser, result };
  }

  it("書いたファイルの一覧 = 実在するファイル。分野ごとに timeseries と maps が分かれる", async () => {
    const { dir, result } = await build();
    for (const rel of result.files) expect(statSync(join(dir, rel)).size, rel).toBeGreaterThan(0);
    expect(new Set(result.files).size).toBe(result.files.length);
    expect(result.files).toEqual(
      expect.arrayContaining([
        "timeseries/01-population.csv",
        "timeseries/01-population.xlsx",
        "timeseries/02-tourism.csv",
        "timeseries/02-tourism.xlsx",
        "timeseries/NOTES.csv",
        "maps/pptx/01-population.pptx",
        "maps/pptx/02-tourism.pptx",
        "maps/INDEX.csv",
        "README.md",
        svgRelPath("01-population", 1, "k-two"),
        svgRelPath("02-tourism", 2, "k-one"),
        svgRelPath("02-tourism", 3, "k-three"),
      ]),
    );
    expect(result.summary).toMatchObject({ indicators: 3, pptxFiles: 2, svgFiles: 3 });
    // 日本語のファイル名を使わない (Windows の zip ツールでの文字化けを避ける)
    for (const rel of result.files) expect(rel, rel).toMatch(/^[A-Za-z0-9_./-]+$/);
  });

  it("PowerPoint: 地図スライドごとに 47 県の図形があり、県名が選択ウィンドウの名前になる", async () => {
    const { dir } = await build();
    const zip = await JSZip.loadAsync(readFileSync(join(dir, "maps/pptx/02-tourism.pptx")));
    const slideNames = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    expect(slideNames.length).toBe(2 + 2); // 表紙 + 使い方 + 地図 2 枚
    const counts: number[] = [];
    for (const n of slideNames) {
      const xml = await zip.file(n)!.async("string");
      counts.push((xml.match(/<a:custGeom>/g) ?? []).length);
      if ((xml.match(/<a:custGeom>/g) ?? []).length > 0) {
        expect(xml).toContain('name="北海道"');
        expect(xml).toContain('name="沖縄県"');
        expect(xml).toContain("凡例");
      }
    }
    expect(counts.filter((c) => c === PREFECTURE_CODES5.length).length).toBe(2);
    expect(counts.filter((c) => c === 0).length).toBe(2);
    // 圧縮されている (pptxgenjs の Node 出力は既定で無圧縮)
    const entry = zip.file(slideNames[2]) as unknown as { _data: { compressedSize: number; uncompressedSize: number } };
    expect(entry._data.compressedSize).toBeLessThan(entry._data.uncompressedSize / 2);
  });

  it("時系列 Excel: 目次 + 指標ごとのシート。行 = 47 県・列 = 年・欠測は空セル", async () => {
    const { dir } = await build();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(join(dir, "timeseries/02-tourism.xlsx"));
    expect(wb.worksheets.map((w) => w.name)).toEqual(["目次", "002 指標 k-one", "003 指標 k-three"]);
    const ws = wb.getWorksheet("002 指標 k-one")!;
    // 注記なし: 1 行目 = 題名、2 行目 = 注記の置き場 (空)、3 行目 = 見出し、4 行目 = 年の区分、5 行目から 47 県
    expect(ws.getCell(1, 1).value).toContain("指標 k-one");
    expect(ws.getCell(3, 1).value).toBe("都道府県コード");
    expect(ws.getCell(3, 3).value).toBe("2018");
    expect(ws.getCell(4, 3).value).toBe("暦年");
    expect(ws.getCell(5, 1).value).toBe("01000");
    expect(ws.getCell(5, 2).value).toBe("北海道");
    expect(ws.getCell(5 + 46, 2).value).toBe("沖縄県");
    expect(ws.getCell(5, 5).value).toBe(0); // 2020 年の基準年の値 (北海道 = offset 0)。0 は実値で欠測ではない
    const toc = wb.getWorksheet("目次")!;
    const found = toc.getRows(1, toc.rowCount)?.flatMap((r) => r.values as unknown[]).some((v) => typeof v === "object" && v !== null && "hyperlink" in v);
    expect(found).toBe(true);
  });

  it("INDEX.csv の番号・スライド番号・SVG のパスが、実際のファイルと対応する", async () => {
    const { dir } = await build();
    const lines = readFileSync(join(dir, "maps/INDEX.csv"), "utf8").slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe("番号,指標キー,指標名,単位,年,分野,PowerPoint,スライド番号,SVG");
    expect(lines.length).toBe(1 + 3);
    const cells = lines.slice(1).map((l) => l.split(","));
    expect(cells.map((c) => c[0])).toEqual(["001", "002", "003"]);
    expect(cells.map((c) => c[7])).toEqual(["3", "3", "4"]);
    for (const c of cells) expect(readdirSync(join(dir, c[8], "..")).includes(c[8].split("/").pop()!)).toBe(true);
  });

  it("README は入っているファイルだけを比較表として挙げ、境界の出どころを書く", async () => {
    const { dir } = await build();
    const readme = readFileSync(join(dir, "README.md"), "utf8");
    expect(readme).toContain("`data.csv`");
    expect(readme).not.toContain("product.xlsx"); // formats に xlsx が無い
    expect(readme).not.toContain("databook.pdf");
    expect(readme).toContain("令和2年国勢調査 町丁・字等別境界データ");
    expect(readme).toContain("A002005212020");
    expect(readme).toContain("公認・推奨を示すものではありません");
  });

  it("指標と時系列の並びが違えば止まる", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pf-bundle-"));
    dirs.push(dir);
    const a = dataset("k-a", "tourism");
    const b = dataset("k-b", "tourism");
    await expect(writeBundleFiles(dir, { packName: "x", formats: [], datasets: [a, b], series: [series(b, ["2020"]), series(a, ["2020"])], geo: syntheticGeometry() })).rejects.toThrow("指標キー");
  });

  it("ZIP の大きさを測れる (note の添付の上限との比較用)", async () => {
    const { dir, result } = await build();
    const bytes = await measureZipBytes(dir, result.files);
    expect(bytes).toBeGreaterThan(1000);
    const raw = result.files.reduce((n, rel) => n + statSync(join(dir, rel)).size, 0);
    expect(bytes).toBeLessThan(raw);
  });

  it("パートごとの ZIP の大きさ: ファイル名からパートを読み、共通のファイルと分けて測る", async () => {
    expect(bundleFilePart("timeseries/02-tourism.csv")).toBe("02-tourism");
    expect(bundleFilePart("timeseries/03-socialsecurity-2.xlsx")).toBe("03-socialsecurity-2");
    expect(bundleFilePart("maps/pptx/01-population.pptx")).toBe("01-population");
    expect(bundleFilePart("maps/svg/02-tourism-3/002-k-one.svg")).toBe("02-tourism-3");
    for (const common of ["README.md", "SOURCES.csv", "maps/INDEX.csv", "timeseries/NOTES.csv", "product.xlsx"]) expect(bundleFilePart(common), common).toBeNull();
    const { dir, result } = await build();
    const z = await measureZipBreakdown(dir, result.files);
    expect([...z.byPart.keys()].sort()).toEqual(["01-population", "02-tourism"]);
    expect(z.commonBytes).toBeGreaterThan(0);
    // パートごとの合計は、全体を 1 つの ZIP にした大きさと同じ桁 (圧縮の細部で多少違う)
    const whole = await measureZipBytes(dir, result.files);
    const sum = z.commonBytes + [...z.byPart.values()].reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - whole) / whole).toBeLessThan(0.1);
  });

  it("パートごとに全ファイルが同じ分け方になる (時系列・PowerPoint・SVG が同じパート名)", async () => {
    const { result } = await build();
    const parts = new Set(result.files.map((f) => bundleFilePart(f)).filter((p) => p !== null));
    expect([...parts].sort()).toEqual(["01-population", "02-tourism"]);
    for (const part of parts) {
      expect(result.files).toContain(`timeseries/${part}.csv`);
      expect(result.files).toContain(`timeseries/${part}.xlsx`);
      expect(result.files).toContain(`maps/pptx/${part}.pptx`);
    }
  });

  it("1 パートの指標数の上限は 50", () => {
    expect(MAX_INDICATORS_PER_PART).toBe(50);
  });
});

describe("buildDatabook の bundle 指定", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  const product = ALL_PRODUCTS.find((p) => p.id === "P-03")!;

  it("SOURCES.csv と LICENSE-ja.txt に境界の出どころが入り、manifest の全ファイルが実在し、READINESS に ZIP の大きさが出る", async () => {
    const outRoot = mkdtempSync(join(tmpdir(), "pf-bundle-db-"));
    dirs.push(outRoot);
    const datasets = [dataset("k-one", "tourism"), dataset("k-two", "international", "2020", 3)];
    const ser = datasets.map((d) => series(d, ["2019", "2020"]));
    const res = await buildDatabook(product, { title: product.name, datasets }, { outRoot, version: "t1", geo: syntheticGeometry(), bundle: { series: ser } });
    const sources = readFileSync(join(res.outDir, "SOURCES.csv"), "utf8").trim().split("\r\n");
    expect(sources.length).toBe(1 + 2 + 1); // 見出し + 指標 2 + 境界
    expect(sources[sources.length - 1]).toContain("令和2年国勢調査 町丁・字等別境界データ");
    expect(readFileSync(join(res.outDir, "LICENSE-ja.txt"), "utf8")).toContain("地図の境界: ");
    for (const f of res.manifest.files) expect(statSync(join(res.outDir, f.path)).size, f.path).toBe(f.bytes);
    expect(res.manifest.files.map((f) => f.path)).toEqual(expect.arrayContaining(["maps/pptx/01-tourism.pptx", "timeseries/02-international.csv", "README.md"]));
    expect(res.manifest.notice).toContain("時系列と塗り分け地図つき");
    const readiness = readFileSync(join(res.outDir, "READINESS.md"), "utf8");
    expect(readiness).toMatch(/ZIP（deflate）にした大きさ: [\d.]+ MB/);
    expect(readiness).toContain("実機は未確認");
  }, 60_000);

  it("bundle を付けない従来の生成物は変わらない (境界の行も maps/ も無い)", async () => {
    const outRoot = mkdtempSync(join(tmpdir(), "pf-bundle-db-"));
    dirs.push(outRoot);
    const datasets = [dataset("k-one", "tourism")];
    const res = await buildDatabook(product, { title: product.name, datasets }, { outRoot, version: "t1", geo: syntheticGeometry() });
    expect(readFileSync(join(res.outDir, "SOURCES.csv"), "utf8")).not.toContain("国勢調査 町丁");
    expect(res.manifest.files.some((f) => f.path.startsWith("maps/") || f.path.startsWith("timeseries/"))).toBe(false);
  }, 60_000);

  it("時系列が比較表と食い違えば、版のディレクトリを作る前に止まる", async () => {
    const outRoot = mkdtempSync(join(tmpdir(), "pf-bundle-db-"));
    dirs.push(outRoot);
    const ds = dataset("k-one", "tourism", "2020");
    const stale = parseTimeSeries(
      { rows: PREFECTURE_CODES5.map((areaCode, i) => ({ areaCode, yearCode: "2020", yearName: "2020年", value: i + 1, unit: "人" })) },
      { rankingKey: "k-one", indicator: ds.indicator, unit: "人" },
    );
    await expect(buildDatabook(product, { title: product.name, datasets: [ds] }, { outRoot, version: "t1", geo: syntheticGeometry(), bundle: { series: [stale] } })).rejects.toThrow("時系列が比較表と一致しない");
    expect(readdirSync(outRoot)).toEqual([]);
  });
});
