/**
 * 使い方マニュアル (manual.pdf) ジェネレータ。pdf-lib + @pdf-lib/fontkit で NotoSansJP を
 * subset 埋め込みし、日本語 PDF を小サイズで生成する。
 */
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import type { ProductDefinition } from "../catalog/types";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";

const localRequire = createRequire(import.meta.url);

function notoFontBytes(): Uint8Array {
  const candidates: string[] = [];
  try {
    candidates.push(localRequire.resolve("@expo-google-fonts/noto-sans-jp/400Regular/NotoSansJP_400Regular.ttf"));
  } catch {
    /* fall through */
  }
  try {
    const pkg = localRequire.resolve("@expo-google-fonts/noto-sans-jp/package.json");
    candidates.push(resolve(dirname(pkg), "400Regular/NotoSansJP_400Regular.ttf"));
  } catch {
    /* fall through */
  }
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  candidates.push(resolve(repoRoot, "node_modules/@expo-google-fonts/noto-sans-jp/400Regular/NotoSansJP_400Regular.ttf"));
  for (const c of candidates) if (existsSync(c)) return readFileSync(c);
  throw new Error("NotoSansJP フォント (.ttf) が見つかりません");
}

interface Block {
  readonly text: string;
  readonly size: number;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (ch === "\n") {
      lines.push(cur);
      cur = "";
      continue;
    }
    const test = cur + ch;
    if (cur !== "" && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  lines.push(cur);
  return lines;
}

/** 使い方マニュアル PDF を outPath に書き出す。 */
export async function buildManualPdf(product: ProductDefinition, outPath: string): Promise<void> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(notoFontBytes(), { subset: true });
  doc.setTitle(`${product.name} 使い方マニュアル`);

  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  const blocks: Block[] = [
    { text: `${product.name} 使い方マニュアル`, size: 20 },
    { text: " ", size: 8 },
    { text: "1. この商品について", size: 14 },
    { text: "47 都道府県の地図・ランキング・グラフをまとめた PowerPoint テンプレートです。地図は都道府県ごとに色を変更できる編集可能な図形として収録しています。", size: 11 },
    { text: " ", size: 8 },
    { text: "2. 同梱ファイル", size: 14 },
    { text: "product.pptx（本体） / data.csv（差し替え用データ） / SOURCES.csv（出典台帳） / LICENSE-ja.txt（利用許諾） / preview（サムネイル）", size: 11 },
    { text: " ", size: 8 },
    { text: "3. 地図の色を変える", size: 14 },
    { text: "地図の各都道府県は独立した図形です。クリックで選択し、「図形の塗りつぶし」から任意の色に変更できます。複数県を選択して一括変更もできます。", size: 11 },
    { text: " ", size: 8 },
    { text: "4. グラフのデータを差し替える", size: 14 },
    { text: "グラフを選択し「グラフのデザイン → データの編集」で埋め込み Excel を開き、数値を書き換えると自動で更新されます。data.csv を貼り付けると 47 県を一括で差し替えられます。", size: 11 },
    { text: " ", size: 8 },
    { text: "5. 対応環境", size: 14 },
    { text: product.compatibility.join(" / "), size: 11 },
    { text: " ", size: 8 },
    { text: "6. 利用許諾", size: 14 },
    { text: `${lic.scope}。クライアント納品物への組み込み: ${lic.clientWork ? "可" : "不可"}。テンプレート・図形・元データ単体の再販売 / 再配布は禁止です。詳細は LICENSE-ja.txt を参照してください。`, size: 11 },
    { text: " ", size: 8 },
    { text: "7. 免責", size: 14 },
    { text: "公的統計の概況整理であり、医療・投資・防災等の意思決定結果を保証しません。本サンプルは架空データで、販売版では実データに差し替えます。", size: 11 },
  ];

  const pageW = 595;
  const pageH = 842;
  const margin = 56;
  const maxWidth = pageW - margin * 2;
  let page: PDFPage = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  for (const block of blocks) {
    const lineHeight = block.size * 1.5;
    for (const line of wrap(block.text, font, block.size, maxWidth)) {
      if (y < margin + lineHeight) {
        page = doc.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      page.drawText(line, { x: margin, y, size: block.size, font, color: rgb(0.12, 0.16, 0.22) });
      y -= lineHeight;
    }
  }

  const bytes = await doc.save();
  writeFileSync(outPath, bytes);
}
