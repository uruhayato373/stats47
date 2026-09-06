/**
 * 販売文 (listing.md) ジェネレータ。商品定義 + データセットから、出品ページ向けの説明文を作る。
 * ココナラ外への直接誘導は入れない (禁止事項)。
 * 納品物は product.formats から導出する (xlsx 商品に「PowerPoint 本体」と書かない・形式ズレ防止)。
 */
import type { ProductDefinition, ProductFormat } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";

function yen(n: number): string {
  return n.toLocaleString("ja-JP");
}

/** product.formats → 納品物の説明行。宣言された形式だけを列挙する。 */
function deliverableLines(formats: readonly ProductFormat[]): string[] {
  const label: Partial<Record<ProductFormat, string>> = {
    pptx: "PowerPoint 本体（.pptx・16:9・編集可能な地図/グラフ）",
    xlsx: "Excel ブック（.xlsx・値を書き換えると順位が再計算）",
    csv: "data.csv（UTF-8 BOM・差し替え / 取り込み用）",
    svg: "地図（SVG・都道府県ごとに色を変えられる編集可能な図形）",
    png: "地図（PNG・高解像度ラスター）",
    pdf: "PDF（データブック本体 / 使い方マニュアル）",
  };
  const lines: string[] = [];
  for (const f of formats) {
    const l = label[f];
    if (l) lines.push(`- ${l}`);
  }
  lines.push("- SOURCES.csv（出典台帳）");
  lines.push("- LICENSE-ja.txt（利用許諾）");
  return lines;
}

/**
 * @param product 商品定義
 * @param datasets 収録データセット (単一商品は 1 件、データブックは複数)
 */
/** 指標一覧を最大 cap 件まで列挙し、超過分は「ほか N 指標」に畳む (大規模パック対策)。 */
function indicatorList(
  datasets: readonly Dataset[],
  fmt: (d: Dataset) => string,
  sep: string,
  cap = 30,
): string {
  const shown = datasets.slice(0, cap).map(fmt).join(sep);
  const more = datasets.length - Math.min(cap, datasets.length);
  return more > 0 ? `${shown}${sep}ほか ${more} 指標` : shown;
}

export function renderListing(product: ProductDefinition, datasets: readonly Dataset[]): string {
  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  const hasMap = product.formats.includes("svg") || product.formats.includes("png") || product.formats.includes("pptx");
  const allSample = datasets.every((d) => d.isSample);

  const canDoLines = ["## この商品でできること", `- ${product.jobToBeDone}`];
  if (datasets.length > 1) {
    canDoLines.push(
      `- 収録指標（全 ${datasets.length} 指標）: ${indicatorList(datasets, (d) => `${d.indicator}（${d.year}）`, " / ")}。47 都道府県を一覧・比較できます。`,
    );
  }
  if (hasMap) {
    canDoLines.push("- 47 都道府県のコロプレス地図を確認できます。利用範囲は同梱ライセンスに従ってください。");
    canDoLines.push(product.formats.includes("pptx") || product.formats.includes("svg")
      ? "- 地図は都道府県ごとに色を変更できる編集可能な図形として収録しています。"
      : "- PNGは固定画像です。県別の再着色・数値編集による地図の自動更新機能はありません。");
  } else {
    canDoLines.push("- 47 都道府県の値・順位を、資料や分析にそのまま使えます（Excel は値編集で順位が再計算されます）。");
  }

  const lines = [
    `# ${product.name}`,
    "",
    `- 想定価格: ${yen(product.price.initialYen)}円（税抜）`,
    `- 形式: ${product.formats.join(" / ")}`,
    `- 主な購入者: ${product.audience.join("・")}`,
    "",
    ...canDoLines,
    "",
    "## 納品物",
    ...deliverableLines(product.formats),
    ...(product.formats.includes("pptx") && datasets.length > 30 ? ["- PowerPointは先頭30指標の抜粋版。全指標はCSV・PDF（Excel同梱商品ではExcelも）に収録。"] : []),
    "",
    "## 対応環境",
    ...product.compatibility.map((c) => `- ${c}`),
    "",
    "## 利用範囲",
    `- ${lic.scope}`,
    `- クライアント納品物への組み込み: ${lic.clientWork ? "可" : "不可"}`,
    "- 本商品の独自編集物単体の再販売 / 再配布は禁止です。原データの利用条件は提供元に従ってください。",
    "",
    "## 注意事項",
    ...(allSample
      ? [
          `- 本サンプルは${indicatorList(datasets, (d) => `「${d.indicator}」（${d.year}）`, "・")}を使用しています（架空サンプル・実データではありません）。`,
          "- 販売版では実データに差し替えます。基準年・出典は SOURCES.csv を確認してください。",
        ]
      : [
          `- 収録データは全 ${datasets.length} 指標（${indicatorList(datasets, (d) => `「${d.indicator}」（${d.year}）`, "・")}）（基準年固定の買い切り）です。`,
          `- 出典：${[...new Set(datasets.map((d) => d.source.surveyName))].slice(0, 12).join("・")}${new Set(datasets.map((d) => d.source.surveyName)).size > 12 ? " ほか" : ""}。基準年は固定で自動更新はありません。調査名・年次・加工方法は同梱の SOURCES.csv を確認してください。`,
        ]),
    "- 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
    "",
  ];
  return lines.join("\n");
}
