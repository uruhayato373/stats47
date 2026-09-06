/**
 * 汎用 商品ビルダー。商品定義 + データセットから、宣言された formats の成果物を
 * `.local/coconala-products/<id>/<version>/` に書き出す (git 管理外)。
 * 共通デモデータで全商品を生成し、形式・枠組み・販売文で差別化する
 * (商品ごとの個別テーマ接続は後段の磨き込み)。
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { ProductDefinition, ProductFormat } from "../catalog/types";
import type { Dataset } from "../data/dataset";
import { loadPrefectureGeometry, JAPAN_CLIP, type PrefectureGeometry } from "../maps/prefecture-geometry";
import { classifyChoropleth } from "../charts/chart-spec";
import { renderChoroplethSvg } from "../generators/svg-map";
import { serializeDatasetCsv } from "../generators/csv";
import { serializeSourcesCsv } from "../data/sources";
import { renderLicenseText } from "../licenses/license-text";
import { renderListing } from "../generators/listing";
import { renderReadiness } from "../generators/readiness";
import { buildProductPptx } from "../generators/pptx";
import { buildProductXlsx } from "../generators/xlsx";
import { buildManualPdf } from "../generators/manual";
import { buildInputHash, sha256, type ProductManifest, type ManifestFile } from "../generators/manifest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/coconala-products");

/** exceljs/pptxgenjs/pdf-lib/sharp で生成できる形式。docx / web は Phase 未対応。 */
const SUPPORTED: ReadonlySet<ProductFormat> = new Set<ProductFormat>(["pptx", "xlsx", "csv", "svg", "png", "pdf"]);

export interface ProductBuildOptions {
  readonly version?: string;
  readonly outRoot?: string;
  readonly generatedAt?: string;
  /** 共有ジオメトリ (バッチで 1 回だけ読み込む)。 */
  readonly geo?: PrefectureGeometry;
}

export interface ProductBuildResult {
  readonly productId: string;
  readonly family: string;
  readonly outDir: string;
  readonly formatsBuilt: readonly ProductFormat[];
  readonly skippedFormats: readonly ProductFormat[];
  readonly manifest: ProductManifest;
}

/** Existing delivery editions must remain immutable, including failed generation folders. */
export function reserveProductVersion(outRoot: string, id: string, version: string): void {
  if (!/^P-\d{2}$/.test(id) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(version)) throw new Error("unsafe product id/version");
  mkdirSync(join(outRoot, id), { recursive: true });
  mkdirSync(join(outRoot, id, version));
}

export async function buildProduct(
  product: ProductDefinition,
  ds: Dataset,
  opts: ProductBuildOptions = {},
): Promise<ProductBuildResult> {
  const version = opts.version ?? "v1";
  const outRoot = opts.outRoot ?? OUT_ROOT_DEFAULT;
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const geo = opts.geo ?? loadPrefectureGeometry(1000, JAPAN_CLIP);
  const outDir = join(outRoot, product.id, version);
  reserveProductVersion(outRoot, product.id, version);
  mkdirSync(join(outDir, "preview"), { recursive: true });
  mkdirSync(join(outDir, "listing"), { recursive: true });

  const built: ProductFormat[] = [];
  const skipped: ProductFormat[] = [];
  const files: string[] = [];
  const has = (f: ProductFormat): boolean => product.formats.includes(f);

  // 常時同梱 (出典・許諾・販売文・差し替え用データ・サムネイル)
  writeFileSync(join(outDir, "SOURCES.csv"), serializeSourcesCsv([ds.source]));
  files.push("SOURCES.csv");
  writeFileSync(join(outDir, "LICENSE-ja.txt"), renderLicenseText(product.licenseId));
  files.push("LICENSE-ja.txt");
  writeFileSync(join(outDir, "listing", "listing.md"), renderListing(product, [ds]));
  files.push("listing/listing.md");
  writeFileSync(join(outDir, "data.csv"), serializeDatasetCsv(ds));
  files.push("data.csv");

  const choropleth = classifyChoropleth(ds, { classes: 5, paletteId: "blues-sequential" });
  const footer = ds.isSample ? "架空サンプル／stats47.jp" : `出典：${ds.source.surveyName}／stats47.jp`;
  const svg = renderChoroplethSvg(geo, choropleth, { width: 620, title: `${ds.indicator}（${ds.year}）`, footer });
  const previewPng = await sharp(Buffer.from(svg)).resize(620, 620, { fit: "contain", background: "#ffffff" }).png().toBuffer();
  writeFileSync(join(outDir, "preview", "thumbnail-620x620.png"), previewPng);
  files.push("preview/thumbnail-620x620.png");

  // 形式別
  if (has("svg") || has("png")) mkdirSync(join(outDir, "assets"), { recursive: true });
  if (has("svg")) {
    writeFileSync(join(outDir, "assets", "choropleth-map.svg"), svg);
    files.push("assets/choropleth-map.svg");
    built.push("svg");
  }
  if (has("png")) {
    const png = await sharp(Buffer.from(svg)).resize(1600, undefined, { fit: "inside" }).png().toBuffer();
    writeFileSync(join(outDir, "assets", "choropleth-map.png"), png);
    files.push("assets/choropleth-map.png");
    built.push("png");
  }
  if (has("csv")) built.push("csv"); // data.csv は上で常時出力済
  if (has("pptx")) {
    await buildProductPptx(ds, geo, join(outDir, "product.pptx"), product.name);
    files.push("product.pptx");
    built.push("pptx");
  }
  if (has("xlsx")) {
    await buildProductXlsx(ds, product.name, join(outDir, "product.xlsx"));
    files.push("product.xlsx");
    built.push("xlsx");
  }
  // Office テンプレート (pptx/xlsx) には使い方マニュアルを同梱。pdf 宣言時は正式な成果物として計上。
  if (has("pptx") || has("xlsx") || has("pdf")) {
    await buildManualPdf(product, join(outDir, "manual.pdf"));
    files.push("manual.pdf");
    if (has("pdf")) built.push("pdf");
  }
  for (const f of product.formats) if (!SUPPORTED.has(f)) skipped.push(f); // docx / web

  // manifest (files = 同梱物、readiness/manifest は含めない)
  const inputHash = buildInputHash({
    productId: product.id,
    licenseId: product.licenseId,
    price: product.price,
    formats: product.formats,
    version,
    clip: JAPAN_CLIP,
    dataset: { indicator: ds.indicator, unit: ds.unit, year: ds.year, source: ds.source, values: ds.values },
  });
  const manifestFiles: ManifestFile[] = files.map((rel) => {
    const buf = readFileSync(join(outDir, rel));
    return { path: rel, bytes: buf.length, sha256: sha256(buf) };
  });
  const manifest: ProductManifest = {
    productId: product.id,
    family: product.theme,
    version,
    generatedAt,
    inputHash,
    indicator: ds.indicator,
    unit: ds.unit,
    year: ds.year,
    notice: ds.isSample
      ? "架空サンプル。実データではありません。購入者情報・メッセージ本文は保存しません。"
      : `実データ（${ds.source.surveyName}・${ds.year}・基準年固定）。購入者情報・メッセージ本文は保存しません。`,
    files: manifestFiles,
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // オーナー向け出品前チェックリスト (購入者には同梱しない)
  writeFileSync(join(outDir, "READINESS.md"), renderReadiness(product, ds));

  return {
    productId: product.id,
    family: product.theme,
    outDir,
    formatsBuilt: built,
    skippedFormats: skipped,
    manifest,
  };
}
