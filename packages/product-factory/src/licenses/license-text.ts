/**
 * LICENSE-ja.txt 本文ジェネレータ。LICENSE_REGISTRY (SSOT) から購入者向けの利用許諾文を生成する。
 * どのライセンスでも再販売 / 再配布は禁止 (resale: false)。
 */
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";
import { sourceOrigin, type SourceRow } from "../data/sources";

function isLicenseId(id: string): id is LicenseId {
  return id in LICENSE_REGISTRY;
}

/**
 * 出典表示の節。収録指標の出典の種類に従う:
 * e-Stat の統計表を基にした指標がある場合だけ e-Stat の出典表示を書き、それ以外の提供元は
 * 調査名と URL を挙げて、その提供元を出典として表示するよう案内する。
 * sources を渡さない場合 (出典の種類が不明) は従来どおり e-Stat の出典表示のみ。
 */
function attributionLines(attribution: string, sources?: readonly SourceRow[]): string[] {
  if (!sources || sources.length === 0) return [`- ${attribution}`];
  const hasEstat = sources.some((s) => sourceOrigin(s) === "estat");
  const others = new Map<string, string>();
  for (const s of sources) if (sourceOrigin(s) === "other" && !others.has(s.surveyName)) others.set(s.surveyName, s.url);
  const lines: string[] = [];
  if (hasEstat) lines.push(others.size > 0 ? `- e-Stat の統計表を基にした指標：${attribution}` : `- ${attribution}`);
  if (others.size > 0) {
    lines.push(
      "- e-Stat 以外の提供元の指標は、SOURCES.csv の「調査名」「URL」に記載した提供元を出典として表示してください（提供元の数値を stats47 が加工・作成した旨を添えてください）。",
      ...[...others].map(([name, url]) => `  - ${name}（${url}）`),
    );
  }
  return lines;
}

/**
 * licenseId から LICENSE-ja.txt の本文を生成する。未知 ID は throw。
 * @param sources 収録指標の出典行。出典表示をパックに含まれる出典の種類に合わせる。
 */
export function renderLicenseText(licenseId: string, sources?: readonly SourceRow[]): string {
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
    ...attributionLines(lic.attribution, sources),
    "",
    "## 免責",
    "- 公的統計の概況整理であり、医療・投資・防災等の意思決定結果を保証しません。",
    "- 基準年・調査年・加工方法は各成果物の SOURCES.csv を確認してください。",
  ];
  return lines.join("\n") + "\n";
}
