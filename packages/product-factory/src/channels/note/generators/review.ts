/**
 * REVIEW.md ジェネレータ (仕様 §8・§17)。
 * 公開前の人間ゲート項目と、機械検出済みの注意 (未検証添付・claims) を 1 枚にまとめる。
 * 生成時点では reviewer/verdict は pending。critic / 人間が公開前に埋める。
 */
import type { NoteArticlePlan } from "../types";
import type { NoteAttachment } from "./attachments";
import { scanText } from "../validators/claims";

export function renderReview(
  article: NoteArticlePlan,
  draftMarkdown: string,
  attachments: readonly NoteAttachment[],
): string {
  const claimIssues = scanText(draftMarkdown, article.slug);
  const unverified = attachments.filter((a) => !a.verified).map((a) => a.productId);
  const unverifiedUniq = [...new Set(unverified)];

  const lines = [
    "---",
    `slug: ${article.slug}`,
    "reviewer: (pending)",
    "verdict: (pending)",
    `access: ${article.access}`,
    "ready_to_publish: false",
    "---",
    "",
    `# レビュー — ${article.title}`,
    "",
    "## 機械検出",
    claimIssues.length === 0
      ? "- 禁止表現・markdown 表: 検出なし"
      : claimIssues.map((i) => `- [${i.code}] ${i.message}`).join("\n"),
    article.access === "paid"
      ? unverifiedUniq.length === 0
        ? "- 添付商品: すべて検証済み"
        : `- 未検証の添付商品 (実機検証まで販売添付を保留): ${unverifiedUniq.join(", ")}`
      : "- 無料記事のため有料添付なし",
    "",
    "## 公開前チェック (人間が確認して埋める・仕様 §17)",
    "- [ ] 添付 Office ファイルを実機 (PowerPoint / Excel 365) で開ける",
    "- [ ] 無料部分だけで購入判断に十分な情報がある",
    article.access === "paid" ? "- [ ] 有料ライン (`<!-- paid:start -->`) より後ろに添付物がある" : "- [ ] 無料記事として送客先が正しい",
    "- [ ] note 版とココナラ版の価格・ライセンス・更新条件の差が明確",
    "- [ ] 価格・返金・更新・サポート範囲が妥当",
    "- [ ] 出典と加工表示が正しい",
    "- [ ] 規約確認日が記録されている",
    "- [ ] AI 生成原稿を人間または critic がレビュー済み",
    "",
    "> ready_to_publish は上記すべてを満たしてから true にする。生成物 (draft) は派生物であり手編集の正典にしない。",
    "",
  ];
  return lines.join("\n");
}
