/**
 * 商品 Excel (.xlsx) ジェネレータ (exceljs)。
 * 値を書き換えると順位が再計算される数式駆動ワークブック。
 * exceljs はネイティブチャート/塗り分け地図を書き出せない (Phase 0 判定) ため、
 * 地図・グラフは「使い方」シートで Excel 側の挿入手順を案内する。
 */
import ExcelJS from "exceljs";
import type { Dataset } from "../data/dataset";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";

const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F7" } };
const INPUT_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFDEB" } };

export async function buildProductXlsx(ds: Dataset, title: string, outPath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "stats47";
  wb.company = "stats47";
  wb.title = title;

  // 使い方
  const readme = wb.addWorksheet("使い方");
  readme.getColumn(1).width = 110;
  const lines: string[] = [
    title,
    "",
    "1. 「入力」シートの「値」列（黄色）を書き換えると、「順位」列が自動で再計算されます。",
    "2. 都道府県コード（5 桁）で結合しています。行の並べ替えは自由です。",
    "3. 塗り分け地図・棒グラフは Excel の「挿入 → 塗り分けマップ / グラフ」で作成できます（Microsoft 365 デスクトップ推奨・地図はオンライン接続が必要）。",
    "4. 出典・基準年・加工方法は「出典」シートを参照してください。",
    ds.isSample
      ? "※ 本データは架空サンプルです（実データではありません）。"
      : `※ 収録データ: ${ds.indicator}（${ds.year}）／ 出典 ${ds.source.surveyName}。`,
    "※ 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
  ];
  lines.forEach((t, i) => {
    const cell = readme.getCell(i + 1, 1);
    cell.value = t;
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  // 入力
  const input = wb.addWorksheet("入力");
  input.columns = [
    { header: "都道府県コード", key: "code", width: 16 },
    { header: "都道府県", key: "name", width: 12 },
    { header: `値（${ds.unit}）`, key: "value", width: 16 },
    { header: "順位", key: "rank", width: 8 },
  ];
  const head = input.getRow(1);
  head.font = { bold: true };
  head.eachCell((c) => (c.fill = HEADER_FILL));
  ds.values.forEach((d, i) => {
    const r = i + 2;
    input.addRow({ code: d.code5, name: nameOf(d.code5), value: d.value });
    input.getCell(`C${r}`).fill = INPUT_FILL; // 編集する列を着色
    input.getCell(`D${r}`).value = { formula: `RANK(C${r},$C$2:$C$48)` };
  });

  // 設定
  const settings = wb.addWorksheet("設定");
  settings.getColumn(1).width = 16;
  settings.getColumn(2).width = 60;
  ([
    ["指標", ds.indicator],
    ["単位", ds.unit],
    ["基準年", ds.year],
    ["タイトル", title],
    ["データ種別", ds.isSample ? "架空サンプル" : "実データ（基準年固定）"],
  ] as const).forEach((kv, i) => {
    settings.getCell(i + 1, 1).value = kv[0];
    settings.getCell(i + 1, 1).font = { bold: true };
    settings.getCell(i + 1, 2).value = kv[1];
  });

  // 出典
  const sources = wb.addWorksheet("出典");
  sources.columns = [
    { header: "項目", key: "k", width: 16 },
    { header: "内容", key: "v", width: 72 },
  ];
  sources.getRow(1).font = { bold: true };
  const s = ds.source;
  ([
    ["調査名", s.surveyName],
    ["表名", s.tableName],
    ["statsDataId", s.statsDataId],
    ["URL", s.url],
    ["年", s.year],
    ["取得日", s.retrievedAt],
    ["単位", s.unit],
    ["加工式", s.transform],
    ["注意事項", s.notes],
  ] as const).forEach((kv) => sources.addRow({ k: kv[0], v: kv[1] }));

  await wb.xlsx.writeFile(outPath);
}
