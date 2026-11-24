/**
 * 時系列 Excel (.xlsx・exceljs)。指標ごとに 1 シートで、行 = 47 都道府県・列 = 年。
 * 「目次」シートに指標名・単位・収録年・注記を並べ、各シートへ移動できる。
 * 欠測は空セル (0 埋めしない)。値は実データで、数式は持たない (順位の再計算は比較表の Excel が担う)。
 */
import ExcelJS from "exceljs";
import type { MetricTimeSeries } from "../data/time-series";
import { PREFECTURE_BY_CODE5, PREFECTURE_CODES5 } from "../data/prefectures";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F7" } };
const NOTE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } };

/** Excel のシート名の上限。 */
const SHEET_NAME_MAX = 31;

/** `<連番> <指標名>` を Excel 制約 (31 文字・記号除去・重複なし) のシート名にする。連番が先頭なので切り詰めても一意。 */
export function seriesSheetName(number: number, indicator: string, used: Set<string>): string {
  const prefix = String(number).padStart(3, "0");
  const base = `${prefix} ${indicator.replace(/[\\/?*[\]:]/g, "")}`.slice(0, SHEET_NAME_MAX).trimEnd();
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) name = `${base.slice(0, SHEET_NAME_MAX - 4)}(${n++})`;
  used.add(name.toLowerCase());
  return name;
}

export interface SeriesXlsxOptions {
  readonly title: string;
  /** 指標の通し番号の開始 (ファイルをまたいで続ける)。 */
  readonly firstNumber?: number;
  /** 目次・使い方に書く出典・境界の注記。 */
  readonly footerLines?: readonly string[];
}

export async function buildSeriesXlsx(series: readonly MetricTimeSeries[], outPath: string, opts: SeriesXlsxOptions): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "stats47";
  wb.company = "stats47";
  wb.title = opts.title;
  const first = opts.firstNumber ?? 1;

  const toc = wb.addWorksheet("目次");
  const used = new Set<string>(["目次"]);
  const sheetNames = series.map((s, i) => seriesSheetName(first + i, s.indicator, used));

  toc.getColumn(1).width = 8;
  toc.getColumn(2).width = 44;
  toc.getColumn(3).width = 22;
  toc.getColumn(4).width = 14;
  toc.getColumn(5).width = 90;
  toc.getCell(1, 1).value = opts.title;
  toc.getCell(1, 1).font = { bold: true, size: 14 };
  const guide = [
    "1 指標 1 シートで、行は 47 都道府県（都道府県コード 5 桁）、列は取れた全年です。",
    "欠測・秘匿・非該当は空セルで、0 にはしていません。「年の区分」の行で、暦年と年度のどちらの年かを確認できます。",
    "年の定義が途中で変わる指標・別の統計表で補った年・単位を換算した年は、注記の列と各シートの上部に書いています。",
    ...(opts.footerLines ?? []),
  ];
  guide.forEach((t, i) => (toc.getCell(2 + i, 1).value = t));
  const headRow = 3 + guide.length;
  toc.getRow(headRow).values = ["番号", "指標", "単位", "収録年", "注記"];
  toc.getRow(headRow).font = { bold: true };
  toc.getRow(headRow).eachCell((c) => (c.fill = HEADER_FILL));
  series.forEach((s, i) => {
    const r = headRow + 1 + i;
    const firstYear = s.years[0]?.year ?? "";
    const lastYear = s.years[s.years.length - 1]?.year ?? "";
    toc.getCell(r, 1).value = first + i;
    toc.getCell(r, 2).value = { text: s.indicator, hyperlink: `#'${sheetNames[i]}'!A1` };
    toc.getCell(r, 2).font = { color: { argb: "FF1D4ED8" }, underline: true };
    toc.getCell(r, 3).value = s.unit;
    toc.getCell(r, 4).value = firstYear === lastYear ? firstYear : `${firstYear}〜${lastYear}`;
    toc.getCell(r, 5).value = s.notes.join(" ");
  });
  toc.views = [{ state: "frozen", ySplit: headRow }];

  series.forEach((s, i) => {
    const ws = wb.addWorksheet(sheetNames[i]);
    ws.getColumn(1).width = 16;
    ws.getColumn(2).width = 12;
    ws.getCell(1, 1).value = `${s.indicator}（単位：${s.unit}）`;
    ws.getCell(1, 1).font = { bold: true, size: 13 };
    const noteRows = s.notes.length;
    s.notes.forEach((n, k) => {
      const c = ws.getCell(2 + k, 1);
      c.value = `注記：${n}`;
      c.fill = NOTE_FILL;
    });
    const head = 3 + noteRows;
    const h1 = ws.getRow(head);
    const h2 = ws.getRow(head + 1);
    h1.getCell(1).value = "都道府県コード";
    h1.getCell(2).value = "都道府県";
    h2.getCell(1).value = "年の区分";
    s.years.forEach((y, yi) => {
      h1.getCell(3 + yi).value = y.year;
      h2.getCell(3 + yi).value = y.basis;
      ws.getColumn(3 + yi).width = 13;
    });
    h1.font = { bold: true };
    h2.font = { color: { argb: "FF6B7280" } };
    h1.eachCell((c) => (c.fill = HEADER_FILL));
    PREFECTURE_CODES5.forEach((code5, pi) => {
      const row = ws.getRow(head + 2 + pi);
      row.getCell(1).value = code5;
      row.getCell(2).value = PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;
      s.years.forEach((y, yi) => {
        const v = y.values[pi]?.value;
        if (v !== null && v !== undefined) row.getCell(3 + yi).value = v;
      });
    });
    ws.views = [{ state: "frozen", xSplit: 2, ySplit: head + 1 }];
  });

  await wb.xlsx.writeFile(outPath);
}
