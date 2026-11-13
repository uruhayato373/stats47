import fs from "node:fs";
import path from "node:path";

import { assertDatasetShape } from "../../../../.claude/scripts/lib/dataset-shape.mjs";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";
import { resolveProductThemeReferences, type ProductThemeReference } from "../../../../packages/product-factory/src/analysis/theme-references";

import type { StorefrontProduct, StorefrontShowcaseSection } from "../../src/features/products/types";

interface LandingContent {
  productId: string;
  articleKey: string;
  displayTitle: string;
  description: string;
  useCases: NonNullable<StorefrontProduct["useCases"]>;
  purchaseNotes: readonly string[];
  examples: readonly { id: string; heading: string; lead: string; metricKeys: readonly string[]; preferredTemplate: string; themeRefs: ProductThemeReference[] }[];
}

export interface LandingFigure {
  file: string;
  alt: string;
  template: string;
  sha256: string;
}

export interface AnalysisDelivery {
  productId: string;
  status: "prepared" | "published";
  version: string;
  sourceManifestSha256: string;
  planSha256: string;
  archive: { bucket: string; key: string; sha256: string; bytes: number };
  attachmentName: string;
  snapshot: {
    description: string;
    included: string[];
    useCases: NonNullable<StorefrontProduct["useCases"]>;
    purchaseNotes: string[];
    showcase: (Omit<StorefrontShowcaseSection, "figures"> & { id: string; figures: LandingFigure[] })[];
    showcaseNote: string;
  };
  verification?: {
    noteUrl: string;
    verifiedAt: string;
    priceYen: number;
    attachmentName: string;
    paidBodySha256: string;
  };
}

export interface LandingEvidence {
  productId: string;
  included: readonly string[];
  examples: readonly { id: string; figures: readonly LandingFigure[] }[];
  filePreview: { heading: string; lead: string; figures: readonly LandingFigure[] };
  showcaseNote: string;
  analysisDelivery?: AnalysisDelivery;
}

/** 公開コピーに制作中の案内や、実証の無いOffice互換性の主張を流さない。 */
export function assertPublishedAnalysisCopy(value: unknown) {
  if (/未公開|改訂候補|改訂案|分析候補|公開中の固定版には含まれていません|(?:Office|Excel|PowerPoint).{0,15}(?:互換性検証済み|実機確認済み)/.test(JSON.stringify(value))) {
    throw Error("分析追加版に公開前の文言または未実証のOffice検証表記があります");
  }
}

/** コピーと実納品の根拠をIDで結合。見本が未整備の商品を黙って簡易表示に戻さない。 */
export function readProductLanding(root: string, productId: string, articleKey: string, options: { includePreparedAnalysis?: boolean } = {}) {
  const read = <T>(dataset: string): T => {
    const file = path.join(datasetDir(dataset), `${productId.toLowerCase()}.json`);
    const value = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    assertDatasetShape(dataset, value);
    if (value.productId !== productId) throw Error(`商品ID不一致: ${file}`);
    return value as T;
  };
  const content = read<LandingContent>("products.landings");
  const evidence = read<LandingEvidence>("products.landing-evidence");
  if (content.articleKey !== articleKey) throw Error(`記事への接続が不一致: ${productId}`);
  const expected = content.examples.map(({ id }) => id);
  const actual = evidence.examples.map(({ id }) => id);
  if (new Set(expected).size !== expected.length || new Set(actual).size !== actual.length ||
      expected.length !== actual.length || expected.some((id) => !actual.includes(id))) {
    throw Error(`作成例のコピーと画像が一致しません: ${productId}`);
  }
  const templates = new Set((JSON.parse(fs.readFileSync(path.join(root, datasetPath("content.image-templates")), "utf8")) as
    { templates: { id: string }[] }).templates.map(({ id }) => id));
  const usedFiles = new Set<string>();
  const figures = (items: readonly LandingFigure[]) => items.map(({ file, alt, template }) => {
    if (!templates.has(template) || template === "unclassified" || usedFiles.has(file)) {
      throw Error(`画像の型または重複が不正: ${productId}/${file}`);
    }
    usedFiles.add(file);
    return { file, alt };
  });
  const showcase: StorefrontShowcaseSection[] = content.examples.map(({ id, heading, lead, themeRefs }) => ({
    id, kind: "chart", heading, lead, themeRefs: resolveProductThemeReferences(themeRefs),
    figures: figures(evidence.examples.find((example) => example.id === id)!.figures),
  }));
  showcase.push({ kind: "file", ...evidence.filePreview, figures: figures(evidence.filePreview.figures) });
  const fixed = {
    title: content.displayTitle,
    displayTitle: content.displayTitle,
    description: content.description,
    included: evidence.included,
    useCases: content.useCases,
    purchaseNotes: content.purchaseNotes,
    showcase,
    showcaseNote: evidence.showcaseNote,
  };
  const delivery = evidence.analysisDelivery;
  if (!delivery) return fixed;
  if (delivery.productId !== productId) throw Error(`分析追加版の商品ID不一致: ${productId}`);
  const expectedKey = `note/product-analysis-archives/${productId}/${delivery.version}/${delivery.archive.sha256}.zip`;
  if (delivery.archive.key !== expectedKey) throw Error(`分析追加版の保存参照が不正: ${productId}`);
  if (delivery.status === "prepared" && !options.includePreparedAnalysis) return fixed;
  if (delivery.status === "published" && (!delivery.verification || delivery.verification.attachmentName !== delivery.attachmentName)) throw Error(`分析追加版のnote確認がありません: ${productId}`);
  if (delivery.status === "published") {
    const articles = JSON.parse(fs.readFileSync(path.join(root, datasetPath("note.articles")), "utf8")).articles as
      { key: string; status: string; isPaid: boolean; noteUrl: string; priceJpy: number }[];
    const article = articles.find(item => item.key === articleKey);
    if (!article || article.status !== "published" || !article.isPaid || article.noteUrl !== delivery.verification!.noteUrl || article.priceJpy !== delivery.verification!.priceYen) {
      throw Error(`分析追加版のnote確認と販売先・価格が一致しません: ${productId}`);
    }
  }
  assertPublishedAnalysisCopy(delivery.snapshot);
  const ids = new Set(showcase.flatMap(section => section.id ? [section.id] : []));
  const extra = delivery.snapshot.showcase.map(section => {
    if (ids.has(section.id)) throw Error(`作成例IDが重複しています: ${productId}/${section.id}`);
    ids.add(section.id);
    if (section.figures.some(figure => !figure.file.startsWith(`${delivery.version}-`))) throw Error(`分析追加版の画像に版の接頭辞がありません: ${productId}`);
    return { ...section, figures: figures(section.figures) };
  });
  // Snapshot is immutable delivery evidence, independent of the next analysis regeneration.
  return {
    ...fixed,
    analysisVersion: delivery.version,
    description: `${fixed.description} ${delivery.snapshot.description}`,
    included: [...new Set([...fixed.included, ...delivery.snapshot.included])],
    useCases: [...fixed.useCases, ...delivery.snapshot.useCases],
    purchaseNotes: [...fixed.purchaseNotes, ...delivery.snapshot.purchaseNotes],
    showcase: [...showcase, ...extra],
    showcaseNote: `基本の指標セット：${fixed.showcaseNote} 追加分析：${delivery.snapshot.showcaseNote}`,
  };
}
