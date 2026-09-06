/**
 * データブック商品ビルダー。複数の実データセット (各指標・基準年固定) を 1 商品に束ね、
 * 宣言された formats (xlsx / csv / pdf 等) の成果物を `.local/coconala-products/<id>/<version>/`
 * に書き出す (git 管理外)。単一デモデータの汎用ビルダー (build-product.ts) とは別経路で、
 * 他 173 商品の挙動は変えない。
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { ProductDefinition, ProductFormat } from "../catalog/types";
import type { Databook } from "../data/databook";
import { DATABOOKS } from "../data/databook";
import { loadPackSnapshotDatasets } from "../data/pack-snapshot";
import { loadPrefectureGeometry, JAPAN_CLIP, type PrefectureGeometry } from "../maps/prefecture-geometry";
import { classifyChoropleth } from "../charts/chart-spec";
import { renderChoroplethSvg } from "../generators/svg-map";
import { serializeSourcesCsv } from "../data/sources";
import { serializeDatabookCsv } from "../generators/databook-csv";
import { renderLicenseText } from "../licenses/license-text";
import { renderListing } from "../generators/listing";
import { buildDatabookXlsx } from "../generators/databook-xlsx";
import { buildDatabookPdf } from "../generators/databook-pdf";
import { buildDatabookPptx } from "../generators/databook-pptx";
import { LICENSE_REGISTRY, type LicenseId } from "../catalog/licenses";
import { buildInputHash, sha256, type ProductManifest, type ManifestFile } from "../generators/manifest";
import { reserveProductVersion, type ProductBuildOptions, type ProductBuildResult } from "./build-product";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/coconala-products");

const SUPPORTED: ReadonlySet<ProductFormat> = new Set<ProductFormat>(["pptx", "xlsx", "csv", "pdf", "svg", "png"]);

/**
 * pptx は 1 指標 3 スライドのため、大規模パックは全指標をスライド化しない。この上限を超えるパックは
 * 先頭 PPTX_HIGHLIGHT 指標の「ハイライト版」pptx を作る (データ本体は csv/xlsx/pdf で全指標収録)。
 */
const PPTX_HIGHLIGHT = 30;

/**
 * パックの実データソースを解決する。pack snapshot (全部入り) を最優先し、無ければ従来の
 * DATABOOKS (手編集の代表 4〜6 指標)、それも無ければ null。
 */
export function resolveDatabook(product: ProductDefinition): Databook | null {
  const snap = loadPackSnapshotDatasets(product.id);
  if (snap) return { title: snap.title, datasets: snap.datasets };
  return DATABOOKS[product.id] ?? null;
}

function renderDatabookReadiness(product: ProductDefinition, databook: Databook): string {
  const lic = LICENSE_REGISTRY[product.licenseId as LicenseId];
  const n = databook.datasets.length;
  const LIST_CAP = 30;
  const shown = databook.datasets.slice(0, LIST_CAP);
  const more = n - shown.length;
  const indicators = `全 ${n} 指標（${shown.map((d) => `${d.indicator}（${d.year}）`).join(" / ")}${more > 0 ? ` ほか ${more} 指標` : ""}）`;
  const pptxHighlighted = product.formats.includes("pptx") && n > PPTX_HIGHLIGHT;
  const officeCheck = product.formats.includes("pptx")
    ? "**PowerPoint（Windows/Mac 365）で実機確認**: 県クリック→塗りつぶし色変更 / チャート編集→再計算 / 表示崩れ / 日本語フォント"
    : product.formats.includes("xlsx") ? "**Excel（Windows/Mac 365）で実機確認**: カテゴリ別シートの値編集→順位（RANK）再計算 / 「一覧」シートの表示 / 表示崩れ / 日本語フォント"
    : "PDF・PNGの文字切れと47地域の値を確認（Officeファイルは非同梱。編集互換性の見本ではありません）";
  const lines = [
    `# 出品前チェックリスト — ${product.id} ${product.name}`,
    "",
    `- 収録データ: ${indicators} ／ 実データ（データブック・複数指標・基準年固定）`,
    ...shown.map((d) => `  - ${d.indicator}: ${d.source.surveyName}（statsDataId ${d.source.statsDataId}・${d.year}）`),
    ...(more > 0 ? [`  - ほか ${more} 指標（全出典は SOURCES.csv を参照）`] : []),
    ...(pptxHighlighted
      ? [`- 注記: pptx は先頭 ${PPTX_HIGHLIGHT} 指標のハイライト版です（全 ${n} 指標のデータ本体は xlsx / csv / pdf に収録）。`]
      : []),
    `- ライセンス: ${lic.name}`,
    "",
    "## 自動で満たした項目（生成パイプライン）",
    "- [x] 実データ収録（架空サンプルではない）",
    "- [x] 全指標で 47 都道府県すべてを都道府県コードで結合（欠損 0 埋めなし・null 保持）",
    "- [x] 全指標の出典・調査名・statsDataId・年次・取得日・加工式を SOURCES.csv に収録",
    "- [x] 利用許諾（再販売禁止・出典義務・免責）を LICENSE-ja.txt に収録",
    "- [x] data.csv は UTF-8 BOM・複数指標を横並び（日本語 Excel で文字化けしない）",
    ...(product.formats.includes("xlsx") ? ["- [x] Excel は値編集で順位（RANK）が再計算する数式を収録（実機の再計算は未確認）"] : ["- Excelは非同梱"]),
    ...(product.formats.includes("pdf") ? ["- [x] PDF は指標ごとの 47 県ランキング表を実データで収録"] : []),
    "- [x] 販売文（listing.md）の納品物を実際の形式（xlsx/csv/pdf）で記述",
    "- [x] 620×620 サムネイル生成（代表指標のコロプレス地図）",
    "- [x] e-Stat の公認・推奨と誤認させる表現なし",
    "",
    "## あなた（オーナー）が確認・実施する項目",
    `- [ ] ${officeCheck}`,
    "- [ ] 各指標の基準年が用途に照らして妥当か（基準年は指標ごとに固定・SOURCES.csv で確認）",
    "- [ ] 単位表記が販売文とデータ（SOURCES.csv / 各シートのヘッダ）で一致しているか目視",
    "- [ ] ココナラの最新手数料・禁止事項・対応形式（.xlsx / .pdf / .csv）を再確認",
    `- [ ] 価格の最終決定（カタログ想定 ${product.price.initialYen} 円〜）と採算ライン`,
    "- [ ] サムネイル・商品説明文の最終調整",
    "- [ ] **ココナラへの出品（アップロード）** ← アカウント操作。私（Claude）は実行しません",
    "",
    "## 免責",
    "- 公的統計の概況整理であり、医療・投資・防災等の意思決定結果を保証しません。",
    `- 利用範囲: ${lic.scope}（テンプレート・素材単体の再販売・再配布は禁止）。`,
    "",
  ];
  return lines.join("\n");
}

export async function buildDatabook(
  product: ProductDefinition,
  databook: Databook,
  opts: ProductBuildOptions = {},
): Promise<ProductBuildResult> {
  const version = opts.version ?? "v1";
  const outRoot = opts.outRoot ?? OUT_ROOT_DEFAULT;
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const geo: PrefectureGeometry = opts.geo ?? loadPrefectureGeometry(1000, JAPAN_CLIP);
  const outDir = join(outRoot, product.id, version);
  reserveProductVersion(outRoot, product.id, version);
  mkdirSync(join(outDir, "preview"), { recursive: true });
  mkdirSync(join(outDir, "listing"), { recursive: true });

  const datasets = databook.datasets;
  const built: ProductFormat[] = [];
  const skipped: ProductFormat[] = [];
  const files: string[] = [];
  const has = (f: ProductFormat): boolean => product.formats.includes(f);

  // 常時同梱: 出典 (全指標) / 許諾 / 販売文 / データ本体 (横並び csv) / サムネイル
  writeFileSync(join(outDir, "SOURCES.csv"), serializeSourcesCsv(datasets.map((d) => d.source)));
  files.push("SOURCES.csv");
  writeFileSync(join(outDir, "LICENSE-ja.txt"), renderLicenseText(product.licenseId));
  files.push("LICENSE-ja.txt");
  writeFileSync(join(outDir, "listing", "listing.md"), renderListing(product, datasets));
  files.push("listing/listing.md");
  writeFileSync(join(outDir, "data.csv"), serializeDatabookCsv(datasets));
  files.push("data.csv");
  if (has("csv")) built.push("csv");

  // 代表指標 (先頭 = 人口) のコロプレスをサムネイルに使う
  const primary = datasets[0];
  const choropleth = classifyChoropleth(primary, { classes: 5, paletteId: "blues-sequential" });
  const svg = renderChoroplethSvg(geo, choropleth, {
    width: 620,
    title: `${primary.indicator}（${primary.year}）`,
    footer: `出典：${primary.source.surveyName}／stats47.jp`,
  });
  const previewPng = await sharp(Buffer.from(svg)).resize(620, 620, { fit: "contain", background: "#ffffff" }).png().toBuffer();
  writeFileSync(join(outDir, "preview", "thumbnail-620x620.png"), previewPng);
  files.push("preview/thumbnail-620x620.png");

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
  if (has("pptx")) {
    const pptxDatasets = datasets.length > PPTX_HIGHLIGHT ? datasets.slice(0, PPTX_HIGHLIGHT) : datasets;
    const pptxTitle =
      pptxDatasets.length < datasets.length ? `${product.name}（ハイライト ${pptxDatasets.length} 指標）` : product.name;
    await buildDatabookPptx(pptxDatasets, geo, join(outDir, "product.pptx"), pptxTitle);
    files.push("product.pptx");
    built.push("pptx");
  }
  if (has("xlsx")) {
    await buildDatabookXlsx(product.name, datasets, join(outDir, "product.xlsx"));
    files.push("product.xlsx");
    built.push("xlsx");
  }
  if (has("pdf")) {
    await buildDatabookPdf(product, product.name, datasets, join(outDir, "databook.pdf"));
    files.push("databook.pdf");
    built.push("pdf");
  }
  for (const f of product.formats) if (!SUPPORTED.has(f)) skipped.push(f);

  // manifest
  const inputHash = buildInputHash({
    productId: product.id,
    licenseId: product.licenseId,
    price: product.price,
    formats: product.formats,
    version,
    clip: JAPAN_CLIP,
    datasets: datasets.map((d) => ({ indicator: d.indicator, unit: d.unit, year: d.year, source: d.source, values: d.values })),
  });
  const manifestFiles: ManifestFile[] = files.map((rel) => {
    const buf = readFileSync(join(outDir, rel));
    return { path: rel, bytes: buf.length, sha256: sha256(buf) };
  });
  const indicatorSummary =
    datasets.length > 20
      ? `${datasets.slice(0, 20).map((d) => d.indicator).join("・")}・ほか ${datasets.length - 20} 指標`
      : datasets.map((d) => d.indicator).join("・");
  const years = [...new Set(datasets.map((d) => d.year))].sort().join("・");
  const manifest: ProductManifest = {
    productId: product.id,
    family: product.theme,
    version,
    generatedAt,
    inputHash,
    indicator: indicatorSummary,
    unit: "複数指標",
    year: years,
    notice: `実データ（データブック・${datasets.length} 指標・基準年固定）。購入者情報・メッセージ本文は保存しません。`,
    files: manifestFiles,
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  writeFileSync(join(outDir, "READINESS.md"), renderDatabookReadiness(product, databook));

  return { productId: product.id, family: product.theme, outDir, formatsBuilt: built, skippedFormats: skipped, manifest };
}
