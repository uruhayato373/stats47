/**
 * データブック商品ビルダー。複数の実データセット (各指標・基準年固定) を 1 商品に束ね、
 * 宣言された formats (xlsx / csv / pdf 等) の成果物を `.local/data-packs/<id>/<version>/`
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
import { SITE } from "@stats47/data-configs";
import type { SourceRow } from "../data/sources";
import { compareSeriesWithDataset, fetchSeriesForDatasets, withRoundingNote, type MetricTimeSeries } from "../data/time-series";
import { PREFECTURE_BOUNDARY_NOTICE, prefectureBoundarySourceRow } from "../maps/prefecture-boundary";
import {
  MAX_INDICATORS_PER_PART,
  NOTE_ATTACHMENT_LIMIT_BYTES,
  measureZipBreakdown,
  measureZipBytes,
  writeBundleFiles,
  type ZipBreakdown,
  type BundleResult,
} from "./pack-bundle";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/data-packs");

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
  if (snap) return { title: snap.title, datasets: snap.datasets, excluded: snap.excluded };
  return DATABOOKS[product.id] ?? null;
}

/** 「比較表 + 時系列 + 塗り分け地図」のバンドルを作る指定。 */
export interface DatabookBundleOptions {
  /** 時系列 (datasets と同じ並び)。省略すると公開 R2 から取る。テスト用。 */
  readonly series?: readonly MetricTimeSeries[];
  readonly onProgress?: (done: number, total: number) => void;
}

export interface DatabookBuildOptions extends ProductBuildOptions {
  readonly bundle?: DatabookBundleOptions;
}

interface BundleReadiness {
  readonly result: BundleResult;
  readonly zipBytes: number;
  /** 全体が上限を超えるときだけ: 分野ごとに ZIP を分けた場合の大きさ。 */
  readonly breakdown?: ZipBreakdown;
}

/** パート (分野・50 指標ごと) ごとに ZIP を分けた場合の大きさ (共通のファイルを足した値)。上限を超えるパートがあれば明記する。 */
function zipBreakdownLines(z: ZipBreakdown): string[] {
  const mb = (n: number): string => `${(n / 1024 / 1024).toFixed(1)} MB`;
  const rows = [...z.byPart].map(([key, bytes]) => ({ key, total: bytes + z.commonBytes }));
  const over = rows.filter((r) => r.total > NOTE_ATTACHMENT_LIMIT_BYTES);
  const biggest = rows.reduce((m, r) => (r.total > m.total ? r : m), rows[0]);
  return [
    `- パートごとに ZIP を分けた場合（共通のファイル ${mb(z.commonBytes)} を各 ZIP に足す）: ${rows.length} 本・最大 ${biggest.key} ${mb(biggest.total)}`,
    over.length > 0
      ? `  - **上限を超えるパート: ${over.map((r) => r.key).join("、")}**（さらに分割が要る）`
      : `  - どのパートも上限に収まる。note の添付のアップロードは 1 日 10 回までなので、${rows.length} 本を 1 つの記事に付けるなら複数日に分ける`,
    `  - 全パート: ${rows.map((r) => `${r.key} ${mb(r.total)}`).join(" / ")}`,
  ];
}

function bundleReadinessLines(b: BundleReadiness): string[] {
  const mb = (n: number): string => `${(n / 1024 / 1024).toFixed(1)} MB`;
  const s = b.result.summary;
  const fits = b.zipBytes <= NOTE_ATTACHMENT_LIMIT_BYTES;
  return [
    "",
    "## 比較表・時系列・塗り分け地図のバンドル",
    `- 時系列: ${s.indicators} 指標（のべ ${s.seriesYearsTotal} 指標年）を CSV と Excel（分野ごと・${MAX_INDICATORS_PER_PART} 指標ごと）に収録。注記のある指標 ${s.seriesWithNotes} 件（timeseries/NOTES.csv）`,
    `- 地図: PowerPoint ${s.pptxFiles} ファイル（分野ごと・${MAX_INDICATORS_PER_PART} 指標ごと・1 指標 1 スライド）と SVG ${s.svgFiles} ファイル。対応表は maps/INDEX.csv`,
    `- 地図の境界: ${PREFECTURE_BOUNDARY_NOTICE}（SOURCES.csv・LICENSE-ja.txt・README.md に出どころを記載）`,
    `- 全ファイルを ZIP（deflate）にした大きさ: ${mb(b.zipBytes)} ／ note の添付の上限 ${mb(NOTE_ATTACHMENT_LIMIT_BYTES)} → ${fits ? "収まる" : "**超える。分野ごとに ZIP を分けるか、添付を複数に分ける**"}`,
    ...(b.breakdown ? zipBreakdownLines(b.breakdown) : []),
    "- 時系列と比較表の基準年の値が全指標・全県で一致することを生成時に検査済み（不一致があれば生成が止まる）",
    "- [ ] **PowerPoint（Windows/Mac 365）で実機確認**: 各スライドの県をクリックして塗りつぶし色を変えられるか・選択ウィンドウに県名が出るか・凡例の表示・日本語フォント（OOXML 構造の検査と実機検証は別。実機は未確認）",
    "- [ ] SVG を Illustrator / Inkscape / ブラウザで開き、県ごとの id（pref-<5 桁コード>）で色を変えられるか",
  ];
}

function renderDatabookReadiness(product: ProductDefinition, databook: Databook, bundle?: BundleReadiness): string {
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
    ...(databook.excluded && databook.excluded.length > 0
      ? [
          "",
          `## 権利状態が要確認のため収録から除外した指標（${databook.excluded.length} 件）`,
          "- metric config の license 欄が「[要確認]」（再配布・商用利用の許諾が確認できない）の指標は有料パックに入れません。",
          ...databook.excluded.map((e) => `  - ${e.indicator}（${e.rankingKey}）: ${e.reason}`),
        ]
      : []),
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
    `- [ ] 価格の最終決定（カタログ想定 ${product.price.initialYen} 円〜）と採算ライン`,
    "- [ ] サムネイル・商品説明文の最終調整",
    "- [ ] **note への公開** ← アカウント操作。公開は note-manager がオーナー承認後に行う",
    "",
    ...(bundle ? bundleReadinessLines(bundle) : []),
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
  opts: DatabookBuildOptions = {},
): Promise<ProductBuildResult> {
  const version = opts.version ?? "v1";
  const outRoot = opts.outRoot ?? OUT_ROOT_DEFAULT;
  const generatedAt = opts.generatedAt ?? new Date().toISOString();
  const geo: PrefectureGeometry = opts.geo ?? loadPrefectureGeometry(1000, JAPAN_CLIP);
  const outDir = join(outRoot, product.id, version);
  const datasets = databook.datasets;

  // バンドル: 時系列を先に取り、比較表と食い違えば版のディレクトリを作る前に止める (欠けた版を残さない)
  let series: readonly MetricTimeSeries[] | undefined;
  if (opts.bundle) {
    const fetched = opts.bundle.series ?? (await fetchSeriesForDatasets(datasets, { onProgress: opts.bundle.onProgress }));
    if (fetched.length !== datasets.length) throw new Error(`バンドル: 時系列 ${fetched.length} 指標 ≠ 比較表 ${datasets.length} 指標`);
    const mismatches: string[] = [];
    series = fetched.map((sr, i) => {
      const { mismatch, roundedDecimals } = compareSeriesWithDataset(sr, datasets[i]);
      if (mismatch) mismatches.push(`${mismatch.rankingKey}: ${mismatch.reason}`);
      return roundedDecimals === null ? sr : withRoundingNote(sr, datasets[i], roundedDecimals);
    });
    if (mismatches.length > 0) {
      throw new Error(`時系列が比較表と一致しない ${mismatches.length} 指標 (R2 の取り直し後に pack-snapshot を作り直す):\n- ${mismatches.slice(0, 10).join("\n- ")}`);
    }
  }

  reserveProductVersion(outRoot, product.id, version);
  mkdirSync(join(outDir, "preview"), { recursive: true });
  mkdirSync(join(outDir, "listing"), { recursive: true });

  const built: ProductFormat[] = [];
  const skipped: ProductFormat[] = [];
  const files: string[] = [];
  const has = (f: ProductFormat): boolean => product.formats.includes(f);

  // 常時同梱: 出典 (全指標) / 許諾 / 販売文 / データ本体 (横並び csv) / サムネイル
  const sourceRows: SourceRow[] = datasets.map((d) => d.source);
  if (opts.bundle) sourceRows.push(prefectureBoundarySourceRow());
  writeFileSync(join(outDir, "SOURCES.csv"), serializeSourcesCsv(sourceRows));
  files.push("SOURCES.csv");
  writeFileSync(
    join(outDir, "LICENSE-ja.txt"),
    renderLicenseText(product.licenseId, sourceRows, opts.bundle ? [`地図の境界: ${PREFECTURE_BOUNDARY_NOTICE}。`] : []),
  );
  files.push("LICENSE-ja.txt");
  writeFileSync(
    join(outDir, "listing", "listing.md"),
    renderListing(product, datasets) +
      (opts.bundle
        ? "\n## 同梱の時系列と塗り分け地図\n- 時系列: 取れる全年を CSV（縦持ち）と Excel（指標ごとに年を列にしたシート）で収録\n- 塗り分け地図: 全指標を PowerPoint（県ごとに色を変えられる図形・1 指標 1 スライド）と SVG で収録\n- 地図の境界は e-Stat の国勢調査の境界データを加工したものです（出どころは README.md・LICENSE-ja.txt に記載）\n"
        : ""),
  );
  files.push("listing/listing.md");
  writeFileSync(join(outDir, "data.csv"), serializeDatabookCsv(datasets));
  files.push("data.csv");
  if (has("csv")) built.push("csv");

  // パック定義の代表指標を優先する。snapshot の並びは主題順とは限らない。
  const primary = product.datasets.map((key) => datasets.find((d) => d.rankingKey === key)).find((d) => d !== undefined) ?? datasets[0];
  const choropleth = classifyChoropleth(primary, { classes: 5, paletteId: "blues-sequential" });
  const svg = renderChoroplethSvg(geo, choropleth, {
    width: 620,
    title: `${primary.indicator}（${primary.year}）`,
    footer: `出典：${primary.source.surveyName}／${SITE.domain}`,
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

  // ② 時系列 ③ 塗り分け地図 ④ README
  let bundle: BundleReadiness | undefined;
  if (opts.bundle && series) {
    const result = await writeBundleFiles(outDir, { packName: product.name, formats: product.formats, datasets, series, geo });
    files.push(...result.files);
    const zipBytes = await measureZipBytes(outDir, files);
    bundle = { result, zipBytes, breakdown: zipBytes > NOTE_ATTACHMENT_LIMIT_BYTES ? await measureZipBreakdown(outDir, files) : undefined };
  }

  // manifest
  const inputHash = buildInputHash({
    productId: product.id,
    licenseId: product.licenseId,
    price: product.price,
    formats: product.formats,
    version,
    clip: JAPAN_CLIP,
    datasets: datasets.map((d) => ({ indicator: d.indicator, unit: d.unit, year: d.year, source: d.source, values: d.values })),
    ...(series ? { bundle: { geometry: sha256(JSON.stringify(geo.shapes)), series: series.map((sr) => ({ key: sr.rankingKey, unit: sr.unit, years: sr.years })) } } : {}),
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
    notice: `実データ（データブック・${datasets.length} 指標・基準年固定${bundle ? "・時系列と塗り分け地図つき" : ""}）。購入者情報・メッセージ本文は保存しません。`,
    files: manifestFiles,
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  writeFileSync(join(outDir, "READINESS.md"), renderDatabookReadiness(product, databook, bundle));

  return { productId: product.id, family: product.theme, outDir, formatsBuilt: built, skippedFormats: skipped, manifest };
}
