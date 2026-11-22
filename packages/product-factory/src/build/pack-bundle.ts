/**
 * データ集パックの「比較表 + 時系列 + 塗り分け地図」のうち、時系列 (②) と地図 (③) と README (④) の成果物を書く。
 * 比較表 (①)・出典 (SOURCES.csv)・利用条件 (LICENSE-ja.txt) は `build-databook.ts` が書く。
 *
 * 置き方 (パックの 1 版のディレクトリの下):
 * 分野 (e-Stat 17 分類) ごとに、50 指標までを 1 つの「パート」(<NN>-<分野>[-<n>]) にし、全ファイルが同じパートで分かれる:
 *   timeseries/<パート>.csv|xlsx            時系列。縦持ち CSV と、指標ごとに年を列にした Excel
 *   timeseries/NOTES.csv                    年の定義が変わった指標などの注記
 *   maps/pptx/<パート>.pptx                 塗り分け地図 (1 指標 1 スライド・県ごとに色を変えられる図形)
 *   maps/svg/<パート>/<番号>-<指標キー>.svg  指標ごとの SVG (県ごとに id 付き)
 *   maps/INDEX.csv                          番号・指標・ファイル・スライド番号の対応表
 *   README.md                               中身・使い方・境界の出どころ・注記
 * ファイル名は ASCII (分野キー・指標キー)。日本語名は INDEX.csv・各ファイルの中に書く。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIES, getCategoryName } from "@stats47/data-configs/categories";
import JSZip from "jszip";
import type { ProductFormat } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import type { MetricTimeSeries } from "../data/time-series";
import type { PrefectureGeometry } from "../maps/prefecture-geometry";
import { PREFECTURE_BOUNDARY_MIN_ISLAND_KM2, PREFECTURE_BOUNDARY_NOTICE, PREFECTURE_BOUNDARY_SHORT, PREFECTURE_BOUNDARY_SOURCE } from "../maps/prefecture-boundary";
import { classifyChoropleth, legendEntries } from "../charts/chart-spec";
import { renderChoroplethSvg } from "../generators/svg-map";
import { buildMapPptx, MAP_CLASSES, MAP_PALETTE } from "../generators/map-pptx";
import { serializeSeriesCsv, serializeSeriesNotesCsv } from "../generators/timeseries-csv";
import { buildSeriesXlsx } from "../generators/timeseries-xlsx";
import { SITE } from "@stats47/data-configs";

/**
 * 1 パートに入れる指標の最大数。PowerPoint の地図の枚数・Excel のシート数の目安で、開く速さと見つけやすさのための値
 * (note の添付の上限から決めた値ではない)。時系列・PowerPoint・SVG が同じパートで分かれるので、ZIP を分野・パートごとに分けられる。
 */
export const MAX_INDICATORS_PER_PART = 50;
/** note の添付 (ZIP) の上限。`.claude/scripts/note/prepare-article.cjs` と同じ 50MiB。 */
export const NOTE_ATTACHMENT_LIMIT_BYTES = 50 * 1024 * 1024;

export interface BundlePart<T> {
  /** 2 桁の分野順 (ファイル名の先頭)。 */
  readonly order: string;
  readonly categoryKey: string;
  readonly categoryName: string;
  /** 1 始まり。 */
  readonly part: number;
  readonly parts: number;
  readonly items: readonly T[];
  /** 先頭の指標の通し番号 (1 始まり・分野の並び順)。 */
  readonly firstNumber: number;
}

const OTHER = "other";

function categoryOf(ds: { category?: string }): string {
  return ds.category && ds.category !== "?" ? ds.category : OTHER;
}

/**
 * 分野 (e-Stat 17 分類) ごとにまとめ、max 件を超える分野は連番で分ける。分野の順は分野マスタの表示順 (未設定は最後)。
 * 通し番号は分割後の並び順で 1 から振る (ファイル名・スライドの番号・INDEX.csv が同じ番号を指す)。
 */
export function planBundleParts<T extends { category?: string }>(items: readonly T[], max: number): BundlePart<T>[] {
  if (max < 1) throw new Error("planBundleParts: max は 1 以上");
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const key = categoryOf(it);
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const rank = (key: string): number => {
    const i = CATEGORIES.findIndex((c) => c.categoryKey === key);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const ordered = [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b));
  const out: BundlePart<T>[] = [];
  let number = 1;
  ordered.forEach(([key, arr], gi) => {
    const parts = Math.ceil(arr.length / max);
    for (let p = 0; p < parts; p += 1) {
      const chunk = arr.slice(p * max, (p + 1) * max);
      out.push({
        order: String(gi + 1).padStart(2, "0"),
        categoryKey: key,
        categoryName: key === OTHER ? "その他" : (getCategoryName(key) ?? "その他"),
        part: p + 1,
        parts,
        items: chunk,
        firstNumber: number,
      });
      number += chunk.length;
    }
  });
  return out;
}

/** `<NN>-<分野>` または `<NN>-<分野>-<n>` (ファイル名の拡張子なし)。 */
export function partBaseName(part: BundlePart<unknown>): string {
  return `${part.order}-${part.categoryKey}${part.parts > 1 ? `-${part.part}` : ""}`;
}

function partTitle(part: BundlePart<unknown>): string {
  return `${part.categoryName}${part.parts > 1 ? `（${part.part}/${part.parts}）` : ""}`;
}

function csvCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface BundleInput {
  readonly packName: string;
  /** 商品の形式 (README に書く比較表のファイルを実際に入っているものだけにする)。 */
  readonly formats: readonly ProductFormat[];
  readonly datasets: readonly Dataset[];
  /** datasets と同じ並び・同じ長さ。 */
  readonly series: readonly MetricTimeSeries[];
  readonly geo: PrefectureGeometry;
}

export interface BundleResult {
  /** outDir からの相対パス (manifest に載せる)。 */
  readonly files: readonly string[];
  readonly summary: {
    readonly indicators: number;
    readonly timeseriesFiles: number;
    readonly pptxFiles: number;
    readonly svgFiles: number;
    readonly seriesWithNotes: number;
    readonly seriesYearsTotal: number;
  };
}

/** SVG のファイル名 (番号は分割後の通し番号)。 */
export function svgRelPath(partBase: string, number: number, rankingKey: string): string {
  return `maps/svg/${partBase}/${String(number).padStart(3, "0")}-${rankingKey}.svg`;
}

export async function writeBundleFiles(outDir: string, input: BundleInput): Promise<BundleResult> {
  const { datasets, series, geo } = input;
  if (datasets.length !== series.length) throw new Error(`pack-bundle: 指標 ${datasets.length} と時系列 ${series.length} の数が違う`);
  datasets.forEach((d, i) => {
    if (d.rankingKey !== series[i].rankingKey) throw new Error(`pack-bundle: ${i} 番目の指標キーが比較表 (${d.rankingKey}) と時系列 (${series[i].rankingKey}) で違う`);
  });
  const files: string[] = [];
  const write = (rel: string, data: string | Buffer): void => {
    const abs = join(outDir, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, data);
    files.push(rel);
  };

  // 分野・分割は比較表と時系列で同じ並びにする (datasets に series を添えて 1 つの配列で扱う)
  const pairs = datasets.map((ds, i) => ({ category: ds.category, ds, series: series[i] }));

  // ② 時系列
  const parts = planBundleParts(pairs, MAX_INDICATORS_PER_PART);
  const footerLines = [`地図の境界: ${PREFECTURE_BOUNDARY_NOTICE}。`, "出典・調査名・statsDataId は同梱の SOURCES.csv を参照してください。"];
  for (const part of parts) {
    const base = `timeseries/${partBaseName(part)}`;
    const chunk = part.items.map((p) => p.series);
    write(`${base}.csv`, serializeSeriesCsv(chunk));
    const xlsxRel = `${base}.xlsx`;
    await buildSeriesXlsx(chunk, join(outDir, xlsxRel), { title: `${input.packName} 時系列（${partTitle(part)}）`, firstNumber: part.firstNumber, footerLines });
    files.push(xlsxRel);
  }
  write("timeseries/NOTES.csv", serializeSeriesNotesCsv(series));

  // ③ 地図: PowerPoint (分野ごと・50 指標ごと) と SVG (指標ごと)
  const indexRows: string[] = [["番号", "指標キー", "指標名", "単位", "年", "分野", "PowerPoint", "スライド番号", "SVG"].join(",")];
  let svgCount = 0;
  for (const part of parts) {
    const rel = `maps/pptx/${partBaseName(part)}.pptx`;
    mkdirSync(join(outDir, "maps/pptx"), { recursive: true });
    await buildMapPptx(part.items.map((p) => p.ds), geo, join(outDir, rel), {
      title: `${input.packName} 塗り分け地図`,
      subtitle: `${partTitle(part)}（${part.items.length} 指標）`,
      firstNumber: part.firstNumber,
    });
    files.push(rel);
    part.items.forEach((p, i) => {
      const number = part.firstNumber + i;
      const spec = classifyChoropleth(p.ds, { classes: MAP_CLASSES, paletteId: MAP_PALETTE });
      const svg = renderChoroplethSvg(geo, spec, {
        width: 620,
        title: `${p.ds.indicator}（${p.ds.unit}・${p.ds.year}）`,
        footer: `出典：${p.ds.source.surveyName}／${PREFECTURE_BOUNDARY_SHORT}／${SITE.domain}`,
        editable: true,
        legend: { title: `凡例（${MAP_CLASSES} 区分・分位）`, entries: legendEntries(spec), note: "各区分は下限以上・上限未満" },
      });
      const svgRel = svgRelPath(partBaseName(part), number, p.ds.rankingKey ?? String(number));
      write(svgRel, svg);
      svgCount += 1;
      indexRows.push(
        [String(number).padStart(3, "0"), p.ds.rankingKey ?? "", p.ds.indicator, p.ds.unit, p.ds.year, part.categoryName, rel, String(i + 3), svgRel].map(csvCell).join(","),
      );
    });
  }
  write("maps/INDEX.csv", `﻿${indexRows.join("\r\n")}\r\n`);

  const seriesWithNotes = series.filter((s) => s.notes.length > 0).length;
  const seriesYearsTotal = series.reduce((n, s) => n + s.years.length, 0);
  write("README.md", renderBundleReadme(input, { tsFiles: parts.length, pptxFiles: parts.length, svgFiles: svgCount, seriesWithNotes }));

  return {
    files,
    summary: {
      indicators: datasets.length,
      timeseriesFiles: parts.length * 2 + 1,
      pptxFiles: parts.length,
      svgFiles: svgCount,
      seriesWithNotes,
      seriesYearsTotal,
    },
  };
}

/** 比較表として入っているファイル (data.csv は常に入る)。 */
function comparisonFiles(formats: readonly ProductFormat[]): string {
  return [formats.includes("xlsx") ? "`product.xlsx`" : null, "`data.csv`", formats.includes("pdf") ? "`databook.pdf`" : null].filter((x) => x !== null).join("・");
}

function renderBundleReadme(
  input: BundleInput,
  n: { tsFiles: number; pptxFiles: number; svgFiles: number; seriesWithNotes: number },
): string {
  const years = input.series.flatMap((s) => s.years.map((y) => Number(y.year)));
  const minYear = years.length ? Math.min(...years) : "-";
  const maxYear = years.length ? Math.max(...years) : "-";
  const b = PREFECTURE_BOUNDARY_SOURCE;
  return [
    `# ${input.packName}`,
    "",
    `47 都道府県 × ${input.datasets.length} 指標の、比較表・時系列・塗り分け地図のセットです。`,
    "",
    "## 入っているもの",
    "",
    "| 何が | どこに | 使い方 |",
    "|---|---|---|",
    `| ① 比較表（最新の基準年の 47 都道府県） | ${comparisonFiles(input.formats)} | 値を並べ替え・比較する。${input.formats.includes("xlsx") ? "Excel は値を書き換えると順位が再計算されます" : "data.csv は 47 県 × 指標の一覧です"} |`,
    `| ② 時系列（取れる全年・${minYear}〜${maxYear}年） | \`timeseries/\`（CSV と Excel。分野ごと・${MAX_INDICATORS_PER_PART} 指標ごとに分割） | 縦持ち CSV は 1 行が「指標 × 年 × 都道府県」。Excel は指標ごとに 1 シートで、行が都道府県・列が年です |`,
    `| ③ 塗り分け地図 | \`maps/pptx/\`（PowerPoint。1 指標 1 スライド・${n.pptxFiles} ファイル）と \`maps/svg/\`（指標ごとの SVG・${n.svgFiles} ファイル） | 県ごとに色を変えられる図形です。対応表は \`maps/INDEX.csv\` |`,
    "| ④ 出典・利用条件 | `SOURCES.csv`・`LICENSE-ja.txt`・この README | 調査名・統計表 ID・基準年・単位・加工の内容、地図の境界の出どころ |",
    "",
    "## 時系列の読み方",
    "",
    "- 年は 4 桁です。各年の「年の区分」（暦年／年度）を Excel の各シートの 2 行目と、CSV の「年の区分」列に書いています。",
    "- 欠測・秘匿・非該当は 0 にせず空欄にしています。CSV の「欠損理由」列で区別できます。",
    "- 単位は比較表と同じです。年によって単位が違う場合は、単位の定義に従って換算するか、比べられない年は入れていません。",
    `- 注記のある指標は ${n.seriesWithNotes} 件です（年の定義が途中で変わる・別の統計表で補った年・換算・欠測）。\`timeseries/NOTES.csv\` と、各 Excel の目次・各シートの上部に書いています。`,
    "",
    "## 地図の読み方",
    "",
    `- 値を ${MAP_CLASSES} 区分（分位）に分け、青の濃淡で塗っています。各区分は下限以上・上限未満です。値の無い県は灰色で、0 としては塗っていません。`,
    "- 地図は都道府県コードで値と結び付けています。PowerPoint は選択ウィンドウに県名が出ます。SVG は県ごとに `id=\"pref-<5 桁コード>\"` を付けています。",
    `- 小笠原諸島など遠方の島と、描画上は点にしかならない小さな島、面積 ${PREFECTURE_BOUNDARY_MIN_ISLAND_KM2} km² 未満の離島は描いていません。`,
    "",
    "## 地図の境界について",
    "",
    `- 出典: ${b.provider}「${b.surveyName}」（${b.referenceDate} 時点・${b.datum}）`,
    `- 入手先: 政府統計の総合窓口（e-Stat）の統計 GIS（${b.catalogUrl}）。調査の識別子 ${b.dlserveyId}。`,
    `- 加工: ${b.transform}。当方（stats47）が作成した加工物で、国・府省・自治体や e-Stat の公認・推奨を示すものではありません。`,
    "- 境界は国勢調査の調査区の形を基にしているため、実際の行政界・海岸線とは細部で異なります。",
    "",
    "## 利用条件",
    "",
    "同梱の `LICENSE-ja.txt` を参照してください。この資料の再販売・再配布はできません。",
    "",
  ].join("\n");
}

/**
 * バンドルのファイルのパート名 (`<NN>-<分野>[-<n>]`。timeseries/<パート>.*・maps/pptx/<パート>.pptx・maps/svg/<パート>/*)。
 * パートに属さない共通のファイル (SOURCES.csv・README.md・比較表など) は null。
 */
export function bundleFilePart(rel: string): string | null {
  const svg = /^maps\/svg\/(\d{2}-[a-z0-9]+(?:-\d+)?)\//.exec(rel);
  if (svg) return svg[1];
  const file = /^(?:timeseries|maps\/pptx)\/(\d{2}-[a-z0-9]+(?:-\d+)?)\.(?:csv|xlsx|pptx)$/.exec(rel);
  return file ? file[1] : null;
}

export interface ZipBreakdown {
  /** 共通のファイルだけを ZIP にした大きさ。 */
  readonly commonBytes: number;
  /** パートごとのファイルだけを ZIP にした大きさ (パート名 → バイト)。 */
  readonly byPart: ReadonlyMap<string, number>;
}

/**
 * 全体が note の添付の上限を超えるときに、パート (分野・50 指標ごと) ごとに ZIP を分けた場合の大きさを測る。
 * パートごとの ZIP には共通のファイルを足す必要があるので、判定は commonBytes + パートの大きさで行う。
 */
export async function measureZipBreakdown(outDir: string, files: readonly string[]): Promise<ZipBreakdown> {
  const groups = new Map<string | null, string[]>();
  for (const rel of files) {
    const key = bundleFilePart(rel);
    groups.set(key, [...(groups.get(key) ?? []), rel]);
  }
  const byPart = new Map<string, number>();
  let commonBytes = 0;
  for (const [key, rels] of groups) {
    const bytes = await measureZipBytes(outDir, rels);
    if (key === null) commonBytes = bytes;
    else byPart.set(key, bytes);
  }
  return { commonBytes, byPart };
}

/** 書き出したファイル一式を ZIP にしたときの大きさ (note の添付の上限との比較用)。ファイルは書かない。 */
export async function measureZipBytes(outDir: string, files: readonly string[]): Promise<number> {
  const zip = new JSZip();
  for (const rel of files) zip.file(rel, readFileSync(join(outDir, rel)));
  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return buf.length;
}
