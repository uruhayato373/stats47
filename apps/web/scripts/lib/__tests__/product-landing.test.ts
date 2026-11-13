import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { readProductLanding, type AnalysisDelivery } from "../product-landing";

const root = path.resolve(__dirname, "../../../../..");
const articleKey = "prefecture-population-household-pack";
const evidenceFile = path.join(root, "data/products/landing-evidence/p-01.json");

afterEach(() => vi.restoreAllMocks());

function changeEvidence(change: (value: {
  examples: { figures: { template: string }[] }[];
  sourceArticle?: { manifestSha256?: string };
  sourceArchive?: unknown;
  analysisDelivery?: AnalysisDelivery;
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

function analysisDelivery(): AnalysisDelivery {
  const sha = 'a'.repeat(64);
  return { productId: 'P-01', status: 'prepared', version: 'analysis-20261113', sourceManifestSha256: sha, planSha256: sha,
    archive: { bucket: 'stats47-private', key: `note/product-analysis-archives/P-01/analysis-20261113/${sha}.zip`, sha256: sha, bytes: 1 },
    attachmentName: 'P-01-analysis-20261113-analysis.zip',
    snapshot: { description: '分析データ追加版です。', included: ['時系列CSV'], useCases: [{ title: '推移を見る', description: '同じ対象を比較します。' }],
      purchaseNotes: ['Office実機での互換性は未確認です。'], showcaseNote: '同梱値から計算しています。',
      showcase: [{ id: 'additional-trend', kind: 'chart', heading: '推移', lead: '年ごとに比較します。', figures: [{ file: 'analysis-20261113-trend.png', alt: '推移', template: 'bar', sha256: sha }] }] } };
}

describe('分析追加版の公開ゲート', () => {
  it('preparedは通常LPへ入れず、明示したnote原稿プレビューだけ同じ合成を使う', () => {
    changeEvidence(value => { delete value.analysisDelivery; });
    const fixed = readProductLanding(root, 'P-01', articleKey);
    vi.restoreAllMocks();
    changeEvidence(value => { value.analysisDelivery = analysisDelivery(); });
    expect(readProductLanding(root, 'P-01', articleKey)).toEqual(fixed);
    expect(readProductLanding(root, 'P-01', articleKey, { includePreparedAnalysis: true }).showcase).toHaveLength(fixed.showcase.length + 1);
  });
  it('note確認済の追加版だけ合成し、固定版の収録範囲・作成例・テーマ参照を保持する', () => {
    changeEvidence(value => { delete value.analysisDelivery; });
    const fixed = readProductLanding(root, 'P-01', articleKey);
    vi.restoreAllMocks();
    const delivery = analysisDelivery();
    delivery.status = 'published';
    const article = JSON.parse(fs.readFileSync(path.join(root, 'data/note/articles.json'), 'utf8')).articles.find((item: { key: string }) => item.key === articleKey);
    delivery.verification = { noteUrl: article.noteUrl, priceYen: article.priceJpy, attachmentName: delivery.attachmentName, verifiedAt: '2026-11-13T00:00:00Z', paidBodySha256: 'b'.repeat(64) };
    changeEvidence(value => { value.analysisDelivery = delivery; });
    const published = readProductLanding(root, 'P-01', articleKey);
    expect(published.title).toBe(fixed.title);
    expect(published.included.slice(0, fixed.included.length)).toEqual(fixed.included);
    expect(published.showcase.slice(0, fixed.showcase.length)).toEqual(fixed.showcase);
    expect(published).toHaveProperty('analysisVersion', delivery.version);
    expect(published.showcase.at(-1)?.figures[0].file).toMatch(/^analysis-20261113-/);
  });
  it('publishedなのにnote確認が無い台帳は拒否する', () => {
    changeEvidence(value => { value.analysisDelivery = { ...analysisDelivery(), status: 'published' }; });
    expect(() => readProductLanding(root, 'P-01', articleKey)).toThrow('dataset_shape_mismatch');
  });
  it('別商品ID・固定版と衝突する作成例・制作中の公開コピーを拒否する', () => {
    const delivery = analysisDelivery();
    delivery.productId = 'P-02';
    changeEvidence(value => { value.analysisDelivery = delivery; });
    expect(() => readProductLanding(root, 'P-01', articleKey)).toThrow('商品ID');
    vi.restoreAllMocks();
    delivery.productId = 'P-01';
    delivery.snapshot.showcase[0].id = 'population-scale';
    changeEvidence(value => { value.analysisDelivery = delivery; });
    expect(() => readProductLanding(root, 'P-01', articleKey, { includePreparedAnalysis: true })).toThrow('重複');
    vi.restoreAllMocks();
    delivery.snapshot.showcase[0].id = 'additional-trend';
    delivery.snapshot.description = '未公開の改訂候補';
    changeEvidence(value => { value.analysisDelivery = delivery; });
    expect(() => readProductLanding(root, 'P-01', articleKey, { includePreparedAnalysis: true })).toThrow('公開前');
  });
});
