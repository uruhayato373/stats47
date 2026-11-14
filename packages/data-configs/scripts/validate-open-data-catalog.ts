/**
 * validate-open-data-catalog.ts — open-data-catalog の構造・参照整合 validator。
 * 正典: .claude/agents/open-data-curator.md §運用 (初期実装仕様 doc 37 は消化済・git 履歴参照)
 *
 * ネットワークを使わない決定的検証のみ (URL 到達性は check-open-data-links.ts)。
 * 実行: npm run validate:open-data-catalog --workspace packages/data-configs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import Ajv from "ajv";
import recipeSchema from "../../../config/schema/open-data.fetch-recipes.schema.json";
import snapshotSchema from "../../../config/schema/open-data.snapshots.schema.json";
import expansionSchema from "../../../config/schema/open-data.expansion.schema.json";
import type { OpenDataFetchRecipe, OpenDataSnapshot, OpenDataExpansion } from "../src/open-data-catalog";
import {
  OPEN_DATA_SOURCES,
  OPEN_DATASETS,
  OPEN_DATA_SOURCE_KINDS,
  ACCESS_METHODS,
  DATA_FORMATS,
  GEOGRAPHIC_LEVELS,
  VERIFICATION_STATUSES,
  STATS47_USES,
  GEOMETRY_TYPES,
  UPDATE_FREQUENCIES,
  DATASET_COVERAGES,
} from "../src/open-data-catalog";
import { CATEGORY_KEYS } from "../src/types";
import { METRICS_REGISTRY } from "../src/registry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// KSJ 台帳 (カタログ id geo.ksj-datasets) は型結合せず JSON のキーから dataId を読む
// (open-data catalog は発見・評価層。KSJ 運用メタを import して二重管理しない)
function loadKsjDataIds(): Set<string> {
  const doc = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../..", datasetPath("geo.ksj-datasets")), "utf8")) as { datasets: Record<string, unknown> };
  return new Set(Object.keys(doc.datasets));
}

const errors: string[] = [];
const warns: string[] = [];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkUrl(owner: string, label: string, url: string | undefined, required: boolean) {
  if (url === undefined) {
    if (required) errors.push(`${owner}: ${label} がありません`);
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    errors.push(`${owner}: ${label} が URL として不正です: ${url}`);
    return;
  }
  if (parsed.protocol !== "https:") {
    errors.push(`${owner}: ${label} が HTTPS ではありません: ${url}`);
  }
}

// ── source 検証 ─────────────────────────────────────────────────────────────
const sourceIds = new Set<string>();
const sourceDatasetIdRefs = new Map<string, Set<string>>();
for (const s of OPEN_DATA_SOURCES) {
  const owner = `source:${s.id}`;
  if (sourceIds.has(s.id)) errors.push(`${owner}: id が重複しています`);
  sourceIds.add(s.id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) errors.push(`${owner}: id が kebab-case ではありません`);
  if (!OPEN_DATA_SOURCE_KINDS.includes(s.kind)) errors.push(`${owner}: kind が不正です: ${s.kind}`);
  if (!VERIFICATION_STATUSES.includes(s.status)) errors.push(`${owner}: status が不正です: ${s.status}`);
  if (s.isOfficial !== true) errors.push(`${owner}: isOfficial が true ではありません`);
  if (!ISO_DATE.test(s.lastVerifiedAt)) errors.push(`${owner}: lastVerifiedAt が ISO 日付ではありません`);
  checkUrl(owner, "homepageUrl", s.homepageUrl, true);
  checkUrl(owner, "termsUrl", s.termsUrl, true);
  checkUrl(owner, "catalogUrl", s.catalogUrl, false);
  checkUrl(owner, "apiDocsUrl", s.apiDocsUrl, false);
  sourceDatasetIdRefs.set(s.id, new Set(s.datasetIds));
  const dup = s.datasetIds.length !== new Set(s.datasetIds).size;
  if (dup) errors.push(`${owner}: datasetIds に重複があります`);
}

// ── dataset 検証 ────────────────────────────────────────────────────────────
const ksjIds = loadKsjDataIds();
const datasetIds = new Set<string>();
const categoryKeySet = new Set<string>(CATEGORY_KEYS);
for (const d of OPEN_DATASETS) {
  const owner = `dataset:${d.id}`;
  if (datasetIds.has(d.id)) errors.push(`${owner}: id が重複しています`);
  datasetIds.add(d.id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) errors.push(`${owner}: id が kebab-case ではありません`);

  // sourceId 参照整合 + 双方向一致
  const src = OPEN_DATA_SOURCES.find((s) => s.id === d.sourceId);
  if (!src) {
    errors.push(`${owner}: sourceId が sources に存在しません: ${d.sourceId}`);
  } else {
    if (!sourceDatasetIdRefs.get(d.sourceId)?.has(d.id)) {
      errors.push(`${owner}: source ${d.sourceId} の datasetIds に載っていません (双方向不一致)`);
    }
    if (src.status === "deprecated" && !d.stats47Uses.every((u) => u === "not-suitable" || u === "research-only")) {
      errors.push(`${owner}: deprecated source の dataset を採用候補 (ranking/theme/map/area) にしています`);
    }
  }

  checkUrl(owner, "landingPageUrl", d.landingPageUrl, true);
  checkUrl(owner, "downloadUrl", d.downloadUrl, false);
  checkUrl(owner, "license.termsUrl", d.license.termsUrl, true);

  for (const a of d.accessMethods) {
    if (!ACCESS_METHODS.includes(a)) errors.push(`${owner}: accessMethod が不正です: ${a}`);
  }
  if (d.accessMethods.length === 0) errors.push(`${owner}: accessMethods が空です`);
  for (const f of d.formats) {
    if (!DATA_FORMATS.includes(f)) errors.push(`${owner}: format が不正です: ${f}`);
  }
  for (const g of d.geographicLevels) {
    if (!GEOGRAPHIC_LEVELS.includes(g)) errors.push(`${owner}: geographicLevel が不正です: ${g}`);
  }
  if (!DATASET_COVERAGES.includes(d.coverage)) errors.push(`${owner}: coverage が不正です: ${d.coverage}`);
  if (!UPDATE_FREQUENCIES.includes(d.updateFrequency)) {
    errors.push(`${owner}: updateFrequency が不正です: ${d.updateFrequency}`);
  }

  // GIS 整合
  if (d.hasGeometry) {
    if (!d.geometryTypes || d.geometryTypes.length === 0) {
      errors.push(`${owner}: hasGeometry=true なのに geometryTypes がありません`);
    } else {
      for (const g of d.geometryTypes) {
        if (!GEOMETRY_TYPES.includes(g)) errors.push(`${owner}: geometryType が不正です: ${g}`);
      }
    }
  } else if (d.geometryTypes && d.geometryTypes.length > 0) {
    errors.push(`${owner}: hasGeometry=false なのに geometryTypes があります`);
  }

  // stats47 適合性
  for (const u of d.stats47Uses) {
    if (!STATS47_USES.includes(u)) errors.push(`${owner}: stats47Use が不正です: ${u}`);
  }
  if (d.stats47Uses.length === 0) errors.push(`${owner}: stats47Uses が空です`);
  const isAdoptionCandidate = d.stats47Uses.some(
    (u) => u === "ranking" || u === "theme" || u === "map" || u === "area",
  );
  // coverage=all-japan で prefecture 比較不能 (=not-suitable のみ) は矛盾しやすいので warn
  if (
    d.coverage === "all-japan" &&
    d.geographicLevels.includes("prefecture") &&
    d.stats47Uses.length === 1 &&
    d.stats47Uses[0] === "not-suitable"
  ) {
    warns.push(`${owner}: coverage=all-japan + prefecture 粒度なのに not-suitable のみ (理由を verification.notes に)`);
  }
  // ライセンス
  if (d.license.commercialUse === "unknown" && isAdoptionCandidate) {
    errors.push(`${owner}: commercialUse=unknown のまま採用候補 (ranking/theme/map/area) にしています`);
  }
  for (const c of d.suggestedCategories) {
    if (!categoryKeySet.has(c)) errors.push(`${owner}: suggestedCategory が 17 軸外です: ${c}`);
  }
  for (const k of d.existingMetricKeys) {
    if (!(k in METRICS_REGISTRY)) errors.push(`${owner}: existingMetricKey が registry に存在しません: ${k}`);
  }
  for (const g of d.existingGisDataIds) {
    if (!ksjIds.has(g)) errors.push(`${owner}: existingGisDataId が KSJ SSOT に存在しません: ${g}`);
  }

  // 検証状態
  if (!VERIFICATION_STATUSES.includes(d.verification.status)) {
    errors.push(`${owner}: verification.status が不正です`);
  }
  if (!ISO_DATE.test(d.verification.verifiedAt)) {
    errors.push(`${owner}: verification.verifiedAt が ISO 日付ではありません`);
  }
  if (d.verification.status === "verified" && d.verification.verifiedFromUrls.length === 0) {
    errors.push(`${owner}: verified なのに verifiedFromUrls (公式根拠 URL) がありません`);
  }
  for (const u of d.verification.verifiedFromUrls) checkUrl(owner, "verifiedFromUrls", u, true);
}

// source.datasetIds → dataset 実在
for (const s of OPEN_DATA_SOURCES) {
  for (const id of s.datasetIds) {
    if (!datasetIds.has(id)) {
      errors.push(`source:${s.id}: datasetIds の ${id} が datasets に存在しません`);
    }
  }
}

// ── 原本保全 (段1: recipe 未登録は warn、未知 ID は error) ───────────────────
const root = path.resolve(__dirname, "../../..");
const ajv = new Ajv({ allErrors: true });
function readLedger<T>(file: string, schema: object): T | undefined {
  const doc: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  const validate = ajv.compile(schema);
  if (!validate(doc)) {
    errors.push(`${file}: Schema ${ajv.errorsText(validate.errors)}`);
    return undefined;
  }
  return doc as T;
}
const recipes = readLedger<{ recipes: OpenDataFetchRecipe[] }>(path.join(root, datasetPath("open-data.fetch-recipes")), recipeSchema)?.recipes ?? [];
const recipeIds = new Set<string>();
const recipeUrlOwners = new Map<string, string>();
for (const recipe of recipes) {
  if (!datasetIds.has(recipe.datasetId)) errors.push(`recipe: 未知の datasetId ${recipe.datasetId}`);
  if (recipeIds.has(recipe.datasetId)) errors.push(`recipe: 重複 datasetId ${recipe.datasetId}`);
  recipeIds.add(recipe.datasetId);
  const urls = recipe.fetch.type === "http-file" ? recipe.fetch.urls : recipe.fetch.type === "http-index" ? [recipe.fetch.indexUrl] : [];
  for (const url of urls) {
    const owner = recipeUrlOwners.get(url);
    if (owner && owner !== recipe.datasetId) errors.push(`Duplicate recipe URL: ${owner} / ${recipe.datasetId}: ${url}`);
    recipeUrlOwners.set(url, recipe.datasetId);
  }
  const dataset = OPEN_DATASETS.find((d) => d.id === recipe.datasetId);
  if (recipe.fetch.type !== "skip" && recipe.version === "latest-published-at" && !dataset?.latestPublishedAt) errors.push(`recipe:${recipe.datasetId}: latestPublishedAt がありません`);
  try {
    if (recipe.fetch.type === "http-index") new RegExp(recipe.fetch.linkPattern);
    for (const table of recipe.normalize?.tables ?? []) new RegExp(table.filePattern);
  } catch { errors.push(`recipe:${recipe.datasetId}: 不正な正規表現`); }
}
for (const id of datasetIds) if (!recipeIds.has(id)) warns.push(`dataset:${id}: recipe 未登録 (段2で必須化)`);
const snapshotsDir = path.join(root, datasetDir("open-data.snapshots"));
for (const file of fs.readdirSync(snapshotsDir).filter((name) => name.endsWith(".json"))) {
  const snapshot = readLedger<OpenDataSnapshot>(path.join(snapshotsDir, file), snapshotSchema);
  if (!snapshot) continue;
  if (file !== `${snapshot.datasetId}.json` || !recipeIds.has(snapshot.datasetId)) errors.push(`snapshot:${file}: datasetId/recipe が一致しません`);
  const versions = new Set<string>();
  for (const version of snapshot.versions) {
    if (version.datasetId !== snapshot.datasetId || versions.has(version.version)) errors.push(`snapshot:${file}: 版の重複/帰属不一致`);
    versions.add(version.version);
    const prefix = `open-data/raw/${snapshot.datasetId}/${version.version}/`;
    if (version.manifestKey !== `${prefix}manifest.json` || version.files.some((f) => !f.key.startsWith(prefix))) errors.push(`snapshot:${file}: R2 key が帰属外`);
  }
}
const expansion = readLedger<OpenDataExpansion>(path.join(root, datasetPath("open-data.expansion")), expansionSchema);
for (const entry of expansion?.entries ?? []) {
  const recipe = recipes.find((r) => r.datasetId === entry.datasetId);
  if (!recipe?.normalize?.tables.some((t) => t.table === entry.table)) errors.push(`expansion:${entry.datasetId}: 正規化表がありません`);
  if (!(entry.metricKey in METRICS_REGISTRY)) errors.push(`expansion:${entry.datasetId}: 未知の metricKey ${entry.metricKey}`);
}

// ── 結果 ────────────────────────────────────────────────────────────────────
for (const w of warns) console.warn(`⚠️  ${w}`);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(`\n❌ open-data-catalog 検証: error ${errors.length} / warn ${warns.length}`);
  process.exitCode = 1;
} else {
  console.log(
    `✅ open-data-catalog 検証: ${OPEN_DATA_SOURCES.length} sources / ${OPEN_DATASETS.length} datasets / error 0 / warn ${warns.length}`,
  );
}
