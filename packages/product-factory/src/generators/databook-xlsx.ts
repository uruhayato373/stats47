/**
 * データブック Excel (.xlsx) ジェネレータ (exceljs) — 大規模指標対応。
 *
 * 指標が数十〜数千に及ぶため、指標ごとに 1 シートは作らない (150+ タブは非現実的)。代わりに:
 *   - 「一覧」: 47 都道府県 × 全指標のワイド表 (値は編集可能な実データ)
 *   - カテゴリ別グループシート (e-Stat 17 分類): 都道府県 × [値, 順位(RANK 数式)] を指標ごとに並べる。
 *     値を書き換えると順位が自動再計算される。
 *   - 「使い方」「出典」(全指標)
 *
 * exceljs はネイティブチャート/塗り分け地図を書き出せない (Phase 0 判定) ため、
 * 地図・グラフは「使い方」シートで Excel 側の挿入手順を案内する。
 */
import ExcelJS from "exceljs";
import type { Dataset } from "../data/dataset";
import { PREFECTURE_CODES5, PREFECTURE_BY_CODE5 } from "../data/prefectures";

const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F7" } };
const INPUT_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFDEB" } };

/** e-Stat カテゴリ → 日本語ラベル (グループシート名)。 */
const CATEGORY_LABEL: Readonly<Record<string, string>> = {
  population: "人口・世帯",
  laborwage: "労働・賃金",
  tourism: "観光",
  international: "国際",
  administrativefinancial: "行財政",
  socialsecurity: "社会保障",
  educationsports: "教育・スポーツ",
  landweather: "国土・気候",
  commercial: "商業",
  miningindustry: "鉱工業",
  agriculture: "農林水産",
  economy: "経済・家計",
  infrastructure: "インフラ",
  construction: "建設",
  energy: "エネルギー",
  safetyenvironment: "安全・環境",
  ict: "情報通信",
};

/** シート名を Excel 制約 (31 文字・記号除去) に丸める。重複は連番で回避する。 */
function safeSheetName(raw: string, used: Set<string>): string {
  const base = raw.replace(/[\\/?*[\]:]/g, "").slice(0, 28) || "シート";
  let name = base;
  let n = 2;
  while (used.has(name)) name = `${base.slice(0, 26)}(${n++})`;
  used.add(name);
  return name;
}

/** A1 列文字 (1-indexed)。 */
function colLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

export async function buildDatabookXlsx(title: string, datasets: readonly Dataset[], outPath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "stats47";
  wb.company = "stats47";
  wb.title = title;

  // カテゴリ別にグループ化 (未設定は「その他」)。挿入順を保持。
  const groups = new Map<string, Dataset[]>();
  for (const ds of datasets) {
    const cat = ds.category ?? "other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(ds);
  }

  // 使い方
  const readme = wb.addWorksheet("使い方");
  readme.getColumn(1).width = 120;
  const groupSummary = [...groups.entries()]
    .map(([cat, arr]) => `${CATEGORY_LABEL[cat] ?? "その他"}（${arr.length}）`)
    .join(" / ");
  const lines: string[] = [
    title,
    "",
    `本データブックは 47 都道府県 × ${datasets.length} 指標の実データ集です。`,
    "1.「一覧」シートに全指標を横並びで収録しています（都道府県コード 5 桁で結合・並べ替え自由）。",
    "2. カテゴリ別のシートでは、各指標に「値（黄色・編集可）」と「順位」列があり、値を書き換えると順位（RANK）が自動再計算されます。",
    `   収録カテゴリ: ${groupSummary}。`,
    "3. 塗り分け地図・棒グラフは Excel の「挿入 → 塗り分けマップ / グラフ」で作成できます（Microsoft 365 デスクトップ推奨・地図はオンライン接続が必要）。",
    "4. 出典・基準年・statsDataId・加工方法は「出典」シートを参照してください。",
    "※ すべて実データ・基準年固定です（自動更新はありません）。欠損・秘匿・非該当は空セルで、0 埋めはしていません。",
    "※ 県名は対応する県コードの表示です。県庁所在市・特定世帯・観測地点の値を含み、県全体を表さない指標があります。出典シートの対象範囲を確認してください。",
    "※ 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。e-Stat の数値・表を基に stats47 が作成しました。",
  ];
  lines.forEach((t, i) => {
    const cell = readme.getCell(i + 1, 1);
    cell.value = t;
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  const usedNames = new Set<string>(["使い方"]);

  // 一覧 (全指標ワイド・値は実データ)
  const overview = wb.addWorksheet(safeSheetName("一覧", usedNames));
  overview.getColumn(1).width = 16;
  overview.getColumn(2).width = 12;
  const ovHeader = ["都道府県コード", "都道府県", ...datasets.map((d) => `${d.indicator}（${d.unit}・${d.year}）`)];
  overview.getRow(1).values = ovHeader;
  const ovHead = overview.getRow(1);
  ovHead.font = { bold: true };
  ovHead.eachCell((c) => (c.fill = HEADER_FILL));
  PREFECTURE_CODES5.forEach((code5, i) => {
    const r = i + 2;
    const row = overview.getRow(r);
    row.getCell(1).value = code5;
    row.getCell(2).value = nameOf(code5);
    datasets.forEach((ds, di) => {
      const v = ds.values[i]?.value;
      if (v !== null && v !== undefined) row.getCell(3 + di).value = v;
    });
  });
  overview.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

  // カテゴリ別グループシート ([値, 順位] × 指標)
  for (const [cat, arr] of groups) {
    const label = CATEGORY_LABEL[cat] ?? "その他";
    const ws = wb.addWorksheet(safeSheetName(label, usedNames));
    ws.getColumn(1).width = 16;
    ws.getColumn(2).width = 12;
    // ヘッダ 2 段: 1 段目=指標名 (値/順位 2 列を結合)、2 段目=値/順位
    const h1 = ws.getRow(1);
    const h2 = ws.getRow(2);
    h1.getCell(1).value = "都道府県コード";
    h1.getCell(2).value = "都道府県";
    arr.forEach((ds, di) => {
      const valCol = 3 + di * 2;
      const rankCol = valCol + 1;
      h1.getCell(valCol).value = `${ds.indicator}（${ds.unit}・${ds.year}）`;
      ws.mergeCells(1, valCol, 1, rankCol);
      h2.getCell(valCol).value = "値";
      h2.getCell(rankCol).value = "順位";
      ws.getColumn(valCol).width = 14;
      ws.getColumn(rankCol).width = 7;
    });
    h1.font = { bold: true };
    h2.font = { bold: true };
    h1.eachCell((c) => (c.fill = HEADER_FILL));
    h2.eachCell((c) => (c.fill = HEADER_FILL));
    // データ (行 3〜49)
    const firstDataRow = 3;
    const lastDataRow = firstDataRow + 46; // 47 県
    PREFECTURE_CODES5.forEach((code5, i) => {
      const r = firstDataRow + i;
      const row = ws.getRow(r);
      row.getCell(1).value = code5;
      row.getCell(2).value = nameOf(code5);
      arr.forEach((ds, di) => {
        const valCol = 3 + di * 2;
        const rankCol = valCol + 1;
        const v = ds.values[i]?.value;
        row.getCell(valCol).fill = INPUT_FILL;
        if (v !== null && v !== undefined) {
          row.getCell(valCol).value = v;
          const L = colLetter(valCol);
          row.getCell(rankCol).value = {
            formula: `RANK(${L}${r},${L}$${firstDataRow}:${L}$${lastDataRow})`,
          };
        }
      });
    });
    ws.views = [{ state: "frozen", xSplit: 2, ySplit: 2 }];
  }

  // 出典 (全指標ぶん)
  const sources = wb.addWorksheet(safeSheetName("出典", usedNames));
  sources.columns = [
    { header: "指標", key: "ind", width: 28 },
    { header: "項目", key: "k", width: 14 },
    { header: "内容", key: "v", width: 80 },
  ];
  sources.getRow(1).font = { bold: true };
  for (const ds of datasets) {
    const s = ds.source;
    (
      [
        ["調査名", s.surveyName],
        ["表名", s.tableName],
        ["statsDataId", s.statsDataId],
        ["URL", s.url],
        ["年", s.year],
        ["取得日", s.retrievedAt],
        ["単位", s.unit],
        ["加工式", s.transform],
        ["注意事項", s.notes],
      ] as const
    ).forEach((kv, i) => {
      sources.addRow({ ind: i === 0 ? ds.indicator : "", k: kv[0], v: kv[1] });
    });
    sources.addRow({});
  }

  await wb.xlsx.writeFile(outPath);
}
