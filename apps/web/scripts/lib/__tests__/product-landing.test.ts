import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readProductLanding } from "../product-landing";

const root = path.resolve(__dirname, "../../../../..");
const articleKey = "prefecture-population-household-pack";
const evidenceFile = path.join(root, "data/products/landing-evidence/p-01.json");

afterEach(() => vi.restoreAllMocks());

function changeEvidence(change: (value: {
  examples: { figures: { template: string }[] }[];
  sourceArticle?: { manifestSha256?: string };
  sourceArchive?: unknown;
}) => void, fileToChange = evidenceFile) {
  const original = fs.readFileSync.bind(fs);
  const value = JSON.parse(original(fileToChange, "utf8"));
  change(value);
  vi.spyOn(fs, "readFileSync").mockImplementation(((file: Parameters<typeof fs.readFileSync>[0], options: Parameters<typeof fs.readFileSync>[1]) =>
    String(file) === fileToChange ? JSON.stringify(value) : original(file, options)) as typeof fs.readFileSync);
}

describe("LPのコピーと固定納品の接続", () => {
  it("別商品の記事へ誤って接続しない", () => {
    expect(() => readProductLanding(root, "P-01", "wrong-article")).toThrow("記事への接続");
  });
  it("画像が欠けた作成例を黙って省略しない", () => {
    changeEvidence((value) => { value.examples.pop(); });
    expect(() => readProductLanding(root, "P-01", articleKey)).toThrow("作成例");
  });
  it("共通型の台帳に無い画像を配信しない", () => {
    changeEvidence((value) => { value.examples[0].figures[0].template = "hand-drawn"; });
    expect(() => readProductLanding(root, "P-01", articleKey)).toThrow("画像の型");
  });
  it.each(["article-manifest", "archive"])("保存原稿の見本は元の保存版とZIPの両方を必要とする: %s", (missing) => {
    changeEvidence((value) => {
      if (missing === "article-manifest") delete value.sourceArticle!.manifestSha256;
      else delete value.sourceArchive;
    }, path.join(root, "data/products/landing-evidence/muni-manufacturing.json"));
    expect(() => readProductLanding(root, "MUNI-MANUFACTURING", "muni-manufacturing-shipment-data")).toThrow();
  });
});
