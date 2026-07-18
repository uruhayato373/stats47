/**
 * draft.md ジェネレータ (仕様 §7・§8)。
 * article-plan + member 商品 + 添付 + provenance から note 記事ドラフトを決定的に組み立てる。
 *
 * 規律:
 *  - 有料記事は `<!-- paid:start -->` を有料境界の SSOT マーカーとし、添付はマーカー後ろに置く。
 *  - 無料記事 (J/K/L) は有料境界を持たない。J はココナラ受注へ、L は有料版へ、K は選び方へ誘導。
 *  - markdown 表を使わない (箇条書きのみ)。誇大・保証・公認示唆を書かない。相関を因果と書かない。
 *  - 地の文はですます調。数値の断定は provenance に基づく範囲のみ。
 */
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition } from "../../../catalog/types";
import type { NoteAttachment } from "./attachments";
import type { ProductProvenance } from "./manifest";
import { LICENSE_REGISTRY, type LicenseId } from "../../../catalog/licenses";

function yen(n: number): string {
  return n.toLocaleString("ja-JP");
}

function uniq<T>(xs: readonly T[]): T[] {
  return [...new Set(xs)];
}

function frontmatter(article: NoteArticlePlan): string {
  return [
    "---",
    `slug: ${article.slug}`,
    `series: ${article.series}`,
    `title: ${article.title}`,
    `access: ${article.access}`,
    `price_jpy: ${article.priceJpy}`,
    `role: ${article.role}`,
    "published: false",
    "reviewer: (pending)",
    "verdict: (pending)",
    "---",
  ].join("\n");
}

function memberList(article: NoteArticlePlan, byId: Map<string, ProductDefinition>): ProductDefinition[] {
  return article.memberProductIds.map((id) => byId.get(id)).filter((p): p is ProductDefinition => !!p);
}

function stats47LinksBlock(article: NoteArticlePlan): string[] {
  const links = article.stats47Targets.map(
    (t) => `- 無料で見られる関連データ: [stats47.jp${t}](https://stats47.jp${t})`,
  );
  return links.length > 0 ? links : ["- 無料で見られる関連データ: [stats47.jp](https://stats47.jp)"];
}

function provenanceBlock(provenance: readonly ProductProvenance[]): string[] {
  const years = uniq(provenance.map((p) => p.year)).join(" / ");
  const indicators = uniq(provenance.map((p) => p.indicator)).slice(0, 4).join("・");
  return [
    `- 収録データ例: ${indicators || "都道府県統計"}（基準年 ${years || "固定"}）`,
    "- 出典: 政府統計の総合窓口 (e-Stat) を基に stats47 が集計・可視化しています。",
    "- 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。",
  ];
}

function attachmentBullets(attachments: readonly NoteAttachment[]): string[] {
  if (attachments.length === 0) return ["- （添付ファイルは商品生成後に確定します）"];
  return attachments.map((a) => {
    const kb = a.bytes > 0 ? `約${Math.max(1, Math.round(a.bytes / 1024)).toLocaleString("ja-JP")}KB` : "生成後に確定";
    const verified = a.verified ? "" : "（実機検証前のため暫定）";
    return `- ${a.productId} / ${a.filename}（${a.contentType.split("/").pop()}・${kb}）${verified}`;
  });
}

/**
 * 記事の成果物を表す名詞。完成イメージ・無料/有料差の説明で使う。
 * series 優先、無ければ添付形式から判定する。「地図」固定を避け、記事ごとに正確な語にする。
 */
function deliverableNoun(article: NoteArticlePlan, members: readonly ProductDefinition[]): string {
  const formats = new Set(members.flatMap((p) => p.formats));
  switch (article.series) {
    case "prefecture-map-powerpoint":
      return "PowerPoint テンプレート";
    case "prefecture-excel-analysis":
      return "Excel テンプレート";
    case "regional-data-packs":
      return "データパック";
    case "business-location-analysis":
      return formats.has("xlsx") ? "分析テンプレート" : "分析パック";
    case "government-statistics-work":
      return formats.has("pptx") && !formats.has("xlsx") ? "説明資料テンプレート" : "業務テンプレート";
    case "media-data-visuals":
      return "図版テンプレート";
    case "statistics-education":
      return "授業・教材セット";
    case "life-area-comparison":
      return "比較シート";
    default:
      if (formats.has("pptx")) return "PowerPoint テンプレート";
      if (formats.has("xlsx")) return "Excel テンプレート";
      return "テンプレート";
  }
}

/** 有料記事の draft.md。 */
function renderPaidDraft(
  article: NoteArticlePlan,
  members: readonly ProductDefinition[],
  attachments: readonly NoteAttachment[],
  provenance: readonly ProductProvenance[],
): string {
  const audience = uniq(members.flatMap((p) => p.audience));
  const compat = uniq(members.flatMap((p) => p.compatibility));
  const formats = uniq(members.flatMap((p) => p.formats));
  const noun = deliverableNoun(article, members);
  const licenseId = members[0]?.licenseId ?? "single-corporate";
  const lic = LICENSE_REGISTRY[licenseId as LicenseId];

  const free = [
    `# ${article.title}`,
    "",
    "## こんな作業をしていませんか",
    `${article.readerJob}——そんなときに、そのまま使えるテンプレートと手順をまとめました。`,
    "",
    "## この記事で手に入るもの",
    ...members.map((p) => `- ${p.name}：${p.jobToBeDone}`),
    `- ${noun}なので、47 都道府県ぶんのデータを差し替えるだけで自分のテーマに応用できます。`,
    "",
    "## 完成イメージ",
    `![完成イメージ：${article.title}](images/completion.png)`,
    `（この記事の${noun}で作れる成果物のイメージです。表紙・図版は images-plan に沿って用意します。）`,
    "",
    "## 対象者・対象外",
    `- 想定読者: ${audience.join("・")}`,
    "- 対象外: プログラミングでの自作を前提にする方（本商品はテンプレート提供です）",
    "",
    "## データ・出典・動作環境",
    ...provenanceBlock(provenance),
    `- 対応環境: ${compat.join(" / ")}`,
    `- 形式: ${formats.join(" / ")}`,
    "",
    "## 無料でできること",
    `${noun}を使わなくても、次のデータは stats47 で無料で確認できます。`,
    ...stats47LinksBlock(article),
    `この記事の有料部分では、上記を自分の資料に落とし込む${noun}と、差し替え・操作の手順を提供します。`,
    "",
    "## 有料部分に含まれるもの",
    `- ${noun}一式（添付ファイルの version と hash を明記）`,
    "- 導入・データ差し替え・Office 操作の手順",
    "- 出典表記のルールと、よくあるエラーの対処",
    "",
    "<!-- paid:start -->",
    "",
    "## 添付ファイル",
    ...attachmentBullets(attachments),
    "",
    "## 導入手順",
    "1. 添付ファイルをダウンロードし、任意のフォルダに展開します。",
    `2. ${formats.includes("pptx") ? "PowerPoint" : "Excel"} で本体ファイルを開きます。`,
    "3. サンプルデータの並びを確認し、自分のデータに置き換えます。",
    "",
    "## データ差し替え手順",
    "- data.csv または本体のデータ範囲を、47 都道府県ぶん同じ並び順で入れ替えます。",
    "- 都道府県コードで結合しているため、県名の表記ゆれがあってもコードが一致すれば反映されます。",
    "",
    formats.includes("pptx")
      ? "## PowerPoint 固有の操作\n- 地図は県ごとに色を変更できる図形です。図形を選んで塗りつぶし色を変えます。\n- 埋め込みグラフはデータを編集すると再描画されます。"
      : "## Excel 固有の操作\n- 数値を入れ替えると順位・グラフが再計算されます。\n- 一部の地図・グラフは Microsoft 365 の機能が前提です（対応環境を確認してください）。",
    "",
    "## 出典と加工の表示",
    "- 成果物には SOURCES.csv の出典（調査名・年・加工方法）を残してください。",
    "- e-Stat を基にした独自集計であり、行政の公認ではない旨を明記してください。",
    "",
    "## よくあるエラー",
    "- 図が崩れる: 対応環境外（Web/モバイル版）で開いていないか確認してください。",
    "- 色が変わらない: 画像ではなく図形を選択しているか確認してください。",
    "",
    "## 利用許諾・免責",
    `- ライセンス: ${lic?.name ?? licenseId}（${lic?.scope ?? ""}）`,
    "- テンプレート・図形・元データ単体の再販売／再配布は禁止です。",
    "- データの正確性・利用結果について保証するものではありません。ご自身で確認のうえご利用ください。",
    "",
    "## 更新条件・サポート",
    "- 収録データは基準年固定の買い切りです（自動更新はありません）。",
    "- 不明点は購入者ページからご質問ください（対応範囲は商品により異なります）。",
    "",
  ];
  return `${frontmatter(article)}\n\n${free.join("\n")}`;
}

/** 無料記事 (J=サービス誘導 / K=比較 / L=サンプル) の draft.md。 */
function renderFreeDraft(
  article: NoteArticlePlan,
  members: readonly ProductDefinition[],
): string {
  const audience = uniq(members.flatMap((p) => p.audience));
  const isService = article.series === "custom-analysis-services";
  const isLicense = article.series === "license-guide";

  const cta = isService
    ? [
        "## 依頼の流れ",
        "- ご相談内容（対象テーマ・地域・指標・納期）をお知らせください。",
        "- 見本の範囲・工数・お見積りをご提示します。",
        "- 制作はココナラの取引画面で進めます（プラットフォーム外での直接取引はお受けしていません）。",
      ]
    : isLicense
      ? [
          "## 選び方の目安",
          "- まず「無料で試す」→「基準年固定の買い切り」→「更新版」の順で検討すると失敗しにくいです。",
          "- クライアント納品に使う場合はクライアントワーク可ライセンスを選んでください。",
        ]
      : [
          "## 無料サンプルの使い方",
          "- ダウンロードして、実際に色や項目を変更できるか確認してください。",
          "- 使い勝手が合えば、同じ形式の有料版をご検討ください。",
        ];

  const body = [
    `# ${article.title}`,
    "",
    "## こんなときに",
    `${article.readerJob}`,
    "",
    "## この記事の内容",
    ...members.map((p) => `- ${p.name}：${p.jobToBeDone}`),
    "",
    "## 対象者",
    `- ${audience.join("・")}`,
    "",
    "## まず無料で確認できるデータ",
    ...stats47LinksBlock(article),
    "",
    ...cta,
    "",
    "## 注意",
    "- 掲載データは e-Stat を基にした独自集計で、行政の公認・推奨ではありません。",
    "- 相関がある指標でも、それだけで因果を示すものではありません。",
    "",
  ];
  return `${frontmatter(article)}\n\n${body.join("\n")}`;
}

export function renderDraft(
  article: NoteArticlePlan,
  products: readonly ProductDefinition[],
  attachments: readonly NoteAttachment[],
  provenance: readonly ProductProvenance[],
): string {
  const byId = new Map(products.map((p) => [p.id, p]));
  const members = memberList(article, byId);
  if (article.access === "paid") return renderPaidDraft(article, members, attachments, provenance);
  return renderFreeDraft(article, members);
}
