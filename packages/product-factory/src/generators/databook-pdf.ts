/**
 * データブック PDF ジェネレータ。pdf-lib + NotoSansJP subset で、収録指標ごとに
 * 47 都道府県のランキング表 (順位・都道府県・値) を実データで描画する。末尾に出典・利用許諾。
 * D-01 のように pdf を「データ本体」として納品する商品向け (manual.pdf ではなくデータブック本体)。
 */
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { writeFileSync } from "node:fs";
import type { ProductDefinition } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";
import { notoSansJpBytes } from "./jp-font";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;
const MISSING_LABEL: Readonly<Record<string, string>> = { missing: "欠損", confidential: "秘匿", na: "非該当" };

const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;

interface Cursor {
  page: PDFPage;
  y: number;
}

function jaNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

export async function buildDatabookPdf(
  product: ProductDefinition,
  title: string,
  datasets: readonly Dataset[],
  outPath: string,
): Promise<void> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(notoSansJpBytes(), { subset: true });
  doc.setTitle(title);

  const cur: Cursor = { page: doc.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN };

  const drawLine = (text: string, size: number, color = rgb(0.12, 0.16, 0.22)): void => {
    const lineHeight = size * 1.5;
    // Long definitions and source URLs must wrap, never disappear beyond the page edge.
    let line = "";
    const flush = (): void => {
      if (cur.y < MARGIN + lineHeight) {
        cur.page = doc.addPage([PAGE_W, PAGE_H]);
        cur.y = PAGE_H - MARGIN;
      }
      cur.page.drawText(line, { x: MARGIN, y: cur.y, size, font, color });
      cur.y -= lineHeight;
      line = "";
    };
    for (const char of text) {
      if (char === "\n") { flush(); continue; }
      if (line && font.widthOfTextAtSize(line + char, size) > PAGE_W - MARGIN * 2) flush();
      line += char;
    }
    flush();
  };

  const newPage = (): void => {
    cur.page = doc.addPage([PAGE_W, PAGE_H]);
    cur.y = PAGE_H - MARGIN;
  };

  // 表紙
  drawLine(title, 22);
  drawLine(" ", 8);
  drawLine("47 都道府県の基礎統計をまとめたデータブックです。", 11);
  drawLine(`収録指標: ${datasets.length} 指標。各指標の表・末尾の出典台帳を参照してください。`, 11);
  drawLine("県名は対応する県コードの表示です。県庁所在市・特定世帯・観測地点の値を含み、県全体を表さない指標があります。", 11);
  drawLine("すべて実データ・基準年固定です（自動更新はありません）。", 11);
  drawLine("国・府省・自治体や e-Stat の公認・推奨を示すものではありません。", 10, rgb(0.4, 0.44, 0.5));

  // 指標ごとのランキング表
  const rowH = 16;
  const col = { rank: MARGIN, name: MARGIN + 60, value: MARGIN + 200 };
  for (const ds of datasets) {
    newPage();
    drawLine(`${ds.indicator}（${ds.year}）  単位: ${ds.unit}`, 16);
    drawLine(`出典: ${ds.source.surveyName}`, 9, rgb(0.4, 0.44, 0.5));
    cur.y -= 6;

    // 値降順で順位付け。欠損は末尾。
    const ranked = ds.values
      .map((d) => ({ code5: d.code5, value: d.value, missing: d.missing }))
      .sort((a, b) => {
        if (a.value === null && b.value === null) return 0;
        if (a.value === null) return 1;
        if (b.value === null) return -1;
        return b.value - a.value;
      });

    // ヘッダ行
    const drawRow = (rank: string, name: string, value: string, bold = false): void => {
      if (cur.y < MARGIN + rowH) newPage();
      const color = bold ? rgb(0.1, 0.14, 0.2) : rgb(0.16, 0.2, 0.26);
      cur.page.drawText(rank, { x: col.rank, y: cur.y, size: bold ? 11 : 10, font, color });
      cur.page.drawText(name, { x: col.name, y: cur.y, size: bold ? 11 : 10, font, color });
      cur.page.drawText(value, { x: col.value, y: cur.y, size: bold ? 11 : 10, font, color });
      cur.y -= rowH;
    };
    drawRow("順位", "都道府県", `値（${ds.unit}）`, true);
    let rank = 0;
    ranked.forEach((d, i) => {
      if (d.value !== null) {
        rank = i + 1;
        drawRow(String(rank), nameOf(d.code5), jaNumber(d.value));
      } else {
        drawRow("—", nameOf(d.code5), MISSING_LABEL[d.missing ?? "missing"] ?? "欠損");
      }
    });
  }

  // 出典ページ
  newPage();
  drawLine("出典・加工方法", 16);
  drawLine(" ", 6);
  for (const ds of datasets) {
    const s = ds.source;
    drawLine(`■ ${ds.indicator}`, 12);
    drawLine(`調査名: ${s.surveyName}`, 9);
    drawLine(`表名: ${s.tableName}（statsDataId ${s.statsDataId}）`, 9);
    drawLine(`基準年: ${s.year} / 取得日: ${s.retrievedAt} / 単位: ${s.unit}`, 9);
    drawLine(`加工: ${s.transform}`, 9);
    drawLine(`注意: ${s.notes}`, 9);
    drawLine(" ", 6);
  }

  // 利用許諾
  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  drawLine("利用許諾・免責", 14);
  drawLine(`${lic.scope}。クライアント納品物への組み込み: ${lic.clientWork ? "可" : "不可"}。`, 9);
  drawLine("本商品の独自編集物単体の再販売 / 再配布は禁止です。原データの利用条件は提供元に従ってください（詳細は LICENSE-ja.txt）。", 9);
  drawLine("公的統計の概況整理であり、意思決定結果を保証しません。", 9);

  writeFileSync(outPath, await doc.save());
}
