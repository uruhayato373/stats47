/**
 * LICENSE-ja.txt 本文ジェネレータ。LICENSE_REGISTRY (SSOT) から購入者向けの利用許諾文を生成する。
 * どのライセンスでも再販売 / 再配布は禁止 (resale: false)。
 */
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";

function isLicenseId(id: string): id is LicenseId {
  return id in LICENSE_REGISTRY;
}

/** licenseId から LICENSE-ja.txt の本文を生成する。未知 ID は throw。 */
export function renderLicenseText(licenseId: string): string {
  if (!isLicenseId(licenseId)) throw new Error(`未知の licenseId: ${licenseId}`);
  const lic = LICENSE_REGISTRY[licenseId];
  const clientLine = lic.clientWork
    ? "可 (クライアント納品物への組み込みを含む)"
    : lic.scope;
  const lines = [
    `# 利用許諾 — ${lic.name}`,
    "",
    "本ファイルは stats47 が制作した都道府県データ資料です。以下の条件で利用できます。",
    "",
    "## 許諾範囲",
    `- 利用範囲: ${lic.scope}`,
    `- 業務資料・提案書・記事・動画への組み込み: ${clientLine}`,
    "- 色・数値・レイアウトの改変: 可",
    "",
    "## 禁止事項",
    "- 本商品の独自編集によるテンプレート・shape・SVG・編集済みデータ集単体の再販売 / 再配布",
    "- 公的統計の原データそのものの利用権を制限するものではありません。一次資料を別途取得して利用する場合は、その提供元の利用条件に従ってください。",
    "- 国・府省・自治体や e-Stat の公認・推奨と誤認させる表示",
    "- 本許諾は著作権の譲渡ではありません",
    "",
    "## 出典表示",
    `- ${lic.attribution}`,
    "",
    "## 免責",
    "- 公的統計の概況整理であり、医療・投資・防災等の意思決定結果を保証しません。",
    "- 基準年・調査年・加工方法は各成果物の SOURCES.csv を確認してください。",
  ];
  return lines.join("\n") + "\n";
}
