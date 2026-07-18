/**
 * images-plan.json ジェネレータ (仕様 §11)。
 * 画像種・入力・alt・caption・生成担当を記録する。既存の商品プレビュー
 * (.local/coconala-products/<id>/<version>/preview/) を再利用し、同じ画像を複製しない。
 */
import type { NoteArticlePlan } from "../types";

export interface NoteImagePlanEntry {
  readonly kind: "cover" | "completion" | "free-paid-diff" | "file-structure";
  readonly filename: string;
  /** 入力の参照 (再利用元 or 生成指示)。 */
  readonly input: string;
  readonly alt: string;
  readonly caption: string;
  /** 生成担当 (chart-author / image-prompt-curator / 再利用)。 */
  readonly generator: "reuse-product-preview" | "chart-author" | "image-prompt-curator";
}

export function buildImagesPlan(article: NoteArticlePlan): string {
  const firstMember = article.memberProductIds[0];
  const entries: NoteImagePlanEntry[] = [
    {
      kind: "cover",
      filename: "images/cover.png",
      input: "note 表紙 1280×670 (既存 note 画像フローを再利用)",
      alt: `${article.title}の表紙`,
      caption: article.title,
      generator: "image-prompt-curator",
    },
  ];
  if (article.access === "paid" && firstMember) {
    entries.push({
      kind: "completion",
      filename: "images/completion.png",
      input: `.local/coconala-products/${firstMember}/v1/preview/thumbnail-620x620.png`,
      alt: "完成イメージ：都道府県データの地図",
      caption: "テンプレートで作れる完成イメージ",
      generator: "reuse-product-preview",
    });
    entries.push({
      kind: "free-paid-diff",
      filename: "images/free-vs-paid.png",
      input: "無料でできること / 有料で手に入るものの対比図 (markdown 表は画像化)",
      alt: "無料部分と有料部分の違い",
      caption: "無料でできること・有料で手に入るもの",
      generator: "chart-author",
    });
    entries.push({
      kind: "file-structure",
      filename: "images/file-structure.png",
      input: "添付ファイル構成図 (attachments.json を図示)",
      alt: "添付ファイルの構成",
      caption: "同梱ファイルの構成",
      generator: "chart-author",
    });
  }
  const payload = {
    slug: article.slug,
    note: "markdown 表は PNG 化する。商品プレビューは複製せず参照する。",
    images: entries,
  };
  return JSON.stringify(payload, null, 2) + "\n";
}
