/**
 * 販売文 (listing.md) ジェネレータ。商品定義 + データセットから、出品ページ向けの説明文を作る。
 * ココナラ外への直接誘導は入れない (禁止事項)。
 */
import type { ProductDefinition } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";

function yen(n: number): string {
  return n.toLocaleString("ja-JP");
}

export function renderListing(product: ProductDefinition, dataset: Dataset): string {
  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  const lines = [
    `# ${product.name}`,
    "",
    `- 想定価格: ${yen(product.price.initialYen)}円（税抜）`,
    `- 形式: ${product.formats.join(" / ")}`,
    `- 主な購入者: ${product.audience.join("・")}`,
    "",
    "## この商品でできること",
    `- ${product.jobToBeDone}`,
    "- 47 都道府県のコロプレス地図・ランキング・チャートを、資料にそのまま使えます。",
    "- 地図は都道府県ごとに色を変更できる編集可能な図形として収録しています。",
    "",
    "## 納品物",
    "- PowerPoint 本体（.pptx・16:9）",
    "- data.csv（差し替え用サンプルデータ）",
    "- SOURCES.csv（出典台帳）",
    "- LICENSE-ja.txt（利用許諾）",
    "- 使い方マニュアル（PDF）",
    "",
    "## 対応環境",
    ...product.compatibility.map((c) => `- ${c}`),
    "",
    "## 利用範囲",
    `- ${lic.scope}`,
    `- クライアント納品物への組み込み: ${lic.clientWork ? "可" : "不可"}`,
    "- テンプレート・図形・元データ単体の再販売 / 再配布は禁止です。",
    "",
    "## 注意事項",
    ...(dataset.isSample
      ? [
          `- 本サンプルは「${dataset.indicator}」（${dataset.year}）を使用しています（架空サンプル・実データではありません）。`,
          "- 販売版では実データに差し替えます。基準年・出典は SOURCES.csv を確認してください。",
        ]
      : [
          `- 収録データは「${dataset.indicator}」（${dataset.year}・基準年固定の買い切り）です。出典：${dataset.source.surveyName}。`,
          "- 基準年は固定です（自動更新はありません）。調査名・年次・加工方法は同梱の SOURCES.csv を確認してください。",
        ]),
    "- 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
    "",
  ];
  return lines.join("\n");
}
