import fs from "node:fs";
import path from "node:path";

import { assertDatasetShape } from "../../../../.claude/scripts/lib/dataset-shape.mjs";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

import type { StorefrontProduct, StorefrontShowcaseSection } from "../../src/features/products/types";

interface LandingContent {
  productId: string;
  articleKey: string;
  displayTitle: string;
  description: string;
  useCases: NonNullable<StorefrontProduct["useCases"]>;
  purchaseNotes: readonly string[];
  examples: readonly { id: string; heading: string; lead: string; metricKeys: readonly string[]; preferredTemplate: string }[];
}

interface LandingFigure {
  file: string;
  alt: string;
  template: string;
  sha256: string;
}

interface LandingEvidence {
  productId: string;
  included: readonly string[];
  examples: readonly { id: string; figures: readonly LandingFigure[] }[];
  filePreview: { heading: string; lead: string; figures: readonly LandingFigure[] };
  showcaseNote: string;
}

/** コピーと実納品の根拠をIDで結合。見本が未整備の商品を黙って簡易表示に戻さない。 */
export function readProductLanding(root: string, productId: string, articleKey: string) {
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
  const showcase: StorefrontShowcaseSection[] = content.examples.map(({ id, heading, lead }) => ({
    kind: "chart", heading, lead,
    figures: figures(evidence.examples.find((example) => example.id === id)!.figures),
  }));
  showcase.push({ kind: "file", ...evidence.filePreview, figures: figures(evidence.filePreview.figures) });
  return {
    displayTitle: content.displayTitle,
    description: content.description,
    included: evidence.included,
    useCases: content.useCases,
    purchaseNotes: content.purchaseNotes,
    showcase,
    showcaseNote: evidence.showcaseNote,
  };
}
