/**
 * 出品前チェックリスト (READINESS.md) ジェネレータ。オーナー向けの手渡し用メタ文書。
 * 生成パイプラインが機械的に満たした項目と、オーナーが実機確認・出品で実施する項目を分ける。
 * 仕様 §出品前チェックリスト / レビュー §出品前チェックリスト に対応。
 */
import type { ProductDefinition } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";

export function renderReadiness(product: ProductDefinition, ds: Dataset): string {
  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  const lines = [
    `# 出品前チェックリスト — ${product.id} ${product.name}`,
    "",
    `- 収録データ: ${ds.indicator}（${ds.year}）／ ${ds.isSample ? "架空サンプル" : "実データ"}`,
    `- 出典: ${ds.source.surveyName}（statsDataId ${ds.source.statsDataId}）`,
    `- ライセンス: ${lic.name}`,
    "",
    "## 自動で満たした項目（生成パイプライン）",
    `- [${ds.isSample ? " " : "x"}] 実データ収録（架空サンプルではない）`,
    "- [x] 47 都道府県すべてを都道府県コードで結合（欠損 0 埋めなし）",
    "- [x] 出典・調査名・statsDataId・年次・取得日・加工式を SOURCES.csv に収録",
    "- [x] 利用許諾（再販売禁止・出典義務・免責）を LICENSE-ja.txt に収録",
    "- [x] data.csv は UTF-8 BOM（日本語 Excel で文字化けしない）",
    "- [x] 販売文（listing.md）に用途・納品物・対応環境・利用範囲・注意を記載",
    "- [x] 620×620 サムネイル生成",
    "- [x] Office メタデータにユーザー名・絶対パスを含めない",
    "- [x] e-Stat の公認・推奨と誤認させる表現なし",
    "",
    "## あなた（オーナー）が確認・実施する項目",
    "- [ ] **PowerPoint（Windows/Mac 365）で実機確認**: 県クリック→塗りつぶし色変更 / チャート編集→再計算 / 表示崩れ / 日本語フォント",
    "- [ ] 地図の見た目（離島・沖縄配置・海岸線の粗さ）が販売品質か目視",
    "- [ ] 第三者素材の権利（本商品は stats47 自作 + e-Stat のみ。素材を足す場合は要確認）",
    "- [ ] ココナラの最新手数料・禁止事項・対応形式（.pptx / .pdf / .csv / .png）を再確認",
    `- [ ] 価格の最終決定（カタログ想定 ${product.price.initialYen} 円〜）と採算ライン`,
    "- [ ] サムネイル・商品説明文の最終調整",
    "- [ ] **ココナラへの出品（アップロード）** ← アカウント操作。私（Claude）は実行しません",
    "",
    "## 免責",
    "- 公的統計の概況整理であり、医療・投資・防災等の意思決定結果を保証しません。",
    `- 利用範囲: ${lic.scope}（テンプレート・素材単体の再販売・再配布は禁止）。`,
    "",
  ];
  return lines.join("\n");
}
