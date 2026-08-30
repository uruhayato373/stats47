/** Build the read-only GeoAI acquisition catalog from git TS + the real R2 inventory. */
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { OPEN_DATASETS, OPEN_DATA_SOURCES } from "@stats47/data-configs";
import { listFromR2WithSize, type R2ListedObject } from "@stats47/r2-storage/tooling";
import { config } from "dotenv";

import { GIS_DATASETS, type GisDatasetMeta } from "../datasets";
import {
  EXPECTED_PUBLIC_ACQUISITION_COUNT,
  EXPECTED_UNREGISTERED_POLICY_COUNT,
  PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS,
  UNREGISTERED_KSJ_OFFICIAL_POLICY,
  type KsjOfficialPolicy,
} from "../official-policy";
import { KSJ_CODE_CONFIG } from "../registry";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
config({ path: path.join(PROJECT_ROOT, ".env.local"), quiet: true });

const CANDIDATE_PATH = path.join(PROJECT_ROOT, "packages/database/seed/ksj-catalog.json");
const LOCAL_GIS_ROOT = path.join(PROJECT_ROOT, ".local/r2/gis/mlit-ksj");
const LOCAL_GEO_ROOT = path.join(PROJECT_ROOT, ".local/r2/app/geo");
const LOCAL_OPEN_DATA_ROOT = path.join(PROJECT_ROOT, ".local/r2/gis/open-data");
const OUTPUT_PATH = path.join(LOCAL_GEO_ROOT, "data-catalog/items.json");
const R2_PREFIX = "gis/mlit-ksj/";
const OPEN_DATA_R2_PREFIX = "gis/open-data/";

type Candidate = {
  id: string;
  name: string;
  description: string;
  category1_name: string;
  category2_name: string;
  source_url: string;
};

type CatalogState =
  | "acquired"
  | "analysis-source"
  | "ready-to-acquire"
  | "license-review"
  | "local-only"
  | "metadata-incomplete"
  | "ready-to-register"
  | "candidate";

export type R2Inventory = {
  versions: string[];
  fileCount: number;
  completionManifestCount: number;
  totalBytes: number;
  featureCount: number | null;
  latestModifiedAt: string | null;
};

type CatalogItem = {
  dataId: string;
  aliases: string[];
  name: string;
  description: string;
  category: GisDatasetMeta["category"] | null;
  categoryLabel: string | null;
  subcategoryLabel: string | null;
  geometryType: GisDatasetMeta["geometryType"] | null;
  coverage: GisDatasetMeta["coverage"] | null;
  license: GisDatasetMeta["license"] | null;
  sourcePageUrl: string | null;
  downloadUrlPattern: string | null;
  registered: boolean;
  latestVersion: string | null;
  hasCodeConfig: boolean;
  isRankingTarget: boolean;
  publicationPolicy: "unassessed" | "local-only" | "review-required" | "public-r2-eligible";
  state: CatalogState;
  usedInAnalyses: string[];
  compliance: { publicMirrorPolicyMismatch: boolean };
  r2: R2Inventory & { prefix: string | null; expectedManifestCount: number | null };
};

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return [];
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walkFiles(target)));
    else if (entry.isFile()) result.push(target);
  }
  return result;
}

async function localObjects(): Promise<R2ListedObject[]> {
  const files = await walkFiles(LOCAL_GIS_ROOT);
  return Promise.all(
    files.map(async (file) => {
      const info = await stat(file);
      return {
        key: `${R2_PREFIX}${path.relative(LOCAL_GIS_ROOT, file).split(path.sep).join("/")}`,
        size: info.size,
        lastModified: info.mtime,
      };
    }),
  );
}

async function localOpenDataObjects(): Promise<R2ListedObject[]> {
  const files = await walkFiles(LOCAL_OPEN_DATA_ROOT);
  return Promise.all(
    files.map(async (file) => {
      const info = await stat(file);
      return {
        key: `${OPEN_DATA_R2_PREFIX}${path.relative(LOCAL_OPEN_DATA_ROOT, file).split(path.sep).join("/")}`,
        size: info.size,
        lastModified: info.mtime,
      };
    }),
  );
}

function hasR2Credentials(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_S3_ENDPOINT,
  );
}

async function inventoryObjects(): Promise<{ mode: "remote-r2" | "local-r2"; objects: R2ListedObject[] }> {
  if (hasR2Credentials()) {
    // This build audits the real bucket whenever credentials are available.
    if (process.env.NODE_ENV === "development") process.env.NODE_ENV = "production";
    return { mode: "remote-r2", objects: await listFromR2WithSize(R2_PREFIX) };
  }
  return { mode: "local-r2", objects: await localObjects() };
}

function inventoryByDataId(objects: R2ListedObject[]): Map<string, R2Inventory> {
  const grouped = new Map<string, R2ListedObject[]>();
  for (const object of objects) {
    if (object.key.endsWith("/")) continue;
    const parts = object.key.split("/");
    if (parts.length < 5 || parts[0] !== "gis" || parts[1] !== "mlit-ksj") continue;
    grouped.set(parts[2], [...(grouped.get(parts[2]) ?? []), object]);
  }
  return new Map(
    [...grouped].map(([dataId, files]) => {
      const versions = [...new Set(files.map((file) => file.key.split("/")[3]))].sort();
      const modified = files
        .map((file) => file.lastModified?.toISOString() ?? null)
        .filter((value): value is string => value !== null)
        .sort();
      return [
        dataId,
        {
          versions,
          fileCount: files.length,
          completionManifestCount: files.filter((file) => file.key.endsWith("/manifest.json")).length,
          totalBytes: files.reduce((sum, file) => sum + file.size, 0),
          featureCount: null,
          latestModifiedAt: modified.length > 0 ? modified[modified.length - 1] : null,
        },
      ];
    }),
  );
}

function openDataInventoryById(objects: R2ListedObject[]): Map<string, R2Inventory> {
  const grouped = new Map<string, R2ListedObject[]>();
  for (const object of objects) {
    const parts = object.key.split("/");
    if (parts.length < 5 || parts[0] !== "gis" || parts[1] !== "open-data") continue;
    grouped.set(parts[2], [...(grouped.get(parts[2]) ?? []), object]);
  }
  return new Map(
    [...grouped].map(([dataId, files]) => {
      const versions = [...new Set(files.map((file) => file.key.split("/")[3]))].sort();
      const modified = files
        .map((file) => file.lastModified?.toISOString() ?? null)
        .filter((value): value is string => value !== null)
        .sort();
      return [dataId, {
        versions,
        fileCount: files.length,
        completionManifestCount: files.filter((file) => file.key.endsWith("/manifest.json")).length,
        totalBytes: files.reduce((sum, file) => sum + file.size, 0),
        featureCount: null,
        latestModifiedAt: modified.length > 0 ? modified[modified.length - 1] : null,
      }];
    }),
  );
}

async function analysisUsage(): Promise<Map<string, string[]>> {
  const usage = new Map<string, string[]>();
  if (!(await exists(LOCAL_GEO_ROOT))) return usage;
  for (const entry of await readdir(LOCAL_GEO_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "data-catalog") continue;
    const snapshotPath = path.join(LOCAL_GEO_ROOT, entry.name, "item.json");
    if (!(await exists(snapshotPath))) continue;
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as {
      sources?: Array<{ datasetId?: string }>;
    };
    for (const source of snapshot.sources ?? []) {
      if (!source.datasetId) continue;
      usage.set(source.datasetId, [...(usage.get(source.datasetId) ?? []), entry.name]);
    }
  }
  return usage;
}

function publicationPolicy(
  meta: GisDatasetMeta | undefined,
  official: KsjOfficialPolicy | undefined,
) {
  const license = meta?.license ?? official?.license;
  if (!license) return "unassessed" as const;
  if (license === "non-commercial") return "local-only" as const;
  if (license === "cc-by-4.0-partial") return "review-required" as const;
  return "public-r2-eligible" as const;
}

export function isAcquisitionComplete(dataId: string, inventory: R2Inventory): boolean {
  const expectedManifestCount = PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(dataId);
  return expectedManifestCount === undefined
    ? inventory.fileCount > 0
    : inventory.completionManifestCount === expectedManifestCount;
}

function catalogState(
  dataId: string,
  meta: GisDatasetMeta | undefined,
  official: KsjOfficialPolicy | undefined,
  inventory: R2Inventory,
  usedInAnalyses: string[],
): CatalogState {
  if (isAcquisitionComplete(dataId, inventory)) return "acquired";
  if (usedInAnalyses.length > 0) return "analysis-source";
  const policy = publicationPolicy(meta, official);
  if (!meta) {
    if (policy === "local-only") return "local-only";
    if (policy === "review-required") return "license-review";
    if (policy === "public-r2-eligible") return "ready-to-register";
    return "candidate";
  }
  if (policy === "local-only") return "local-only";
  if (policy === "review-required") return "license-review";
  if (meta.latestVersion && KSJ_CODE_CONFIG.has(meta.dataId)) return "ready-to-acquire";
  return "metadata-incomplete";
}

function buildOpenDataCatalog(
  acquiredIds: Set<string>,
  directInventories: Map<string, R2Inventory>,
) {
  const items = OPEN_DATASETS.map((dataset) => {
    const mirroredIds = dataset.existingGisDataIds.filter((id) => acquiredIds.has(id));
    const direct = directInventories.get(dataset.id);
    const publicSiteUse = dataset.stats47Uses.some((use) =>
      use === "ranking" || use === "theme" || use === "map" || use === "area"
    );
    const acquisitionState = dataset.stats47Uses.includes("not-suitable")
      ? "excluded-not-suitable"
      : !dataset.hasGeometry
        ? "non-spatial"
        : !publicSiteUse
          ? "research-reference"
          : direct?.fileCount
            ? "acquired-r2"
            : mirroredIds.length > 0
              ? "mirrored-via-ksj"
              : dataset.license.commercialUse !== "allowed"
                ? "license-review"
                : dataset.sourceId === "mlit-reinfolib"
                  ? "credentials-required"
                  : dataset.downloadUrl
                    ? "ready-to-acquire"
                    : dataset.accessMethods.some((method) => method === "api" || method === "tile-service")
                      ? "adapter-required"
                      : "source-resolution-required";
    return {
      id: dataset.id,
      sourceId: dataset.sourceId,
      name: dataset.name,
      description: dataset.description,
      landingPageUrl: dataset.landingPageUrl,
      downloadUrl: dataset.downloadUrl ?? null,
      hasGeometry: dataset.hasGeometry,
      geometryTypes: dataset.geometryTypes ?? [],
      accessMethods: dataset.accessMethods,
      formats: dataset.formats,
      coverage: dataset.coverage,
      license: dataset.license,
      stats47Uses: dataset.stats47Uses,
      verification: dataset.verification,
      existingGisDataIds: dataset.existingGisDataIds,
      mirroredGisDataIds: mirroredIds,
      acquisitionState,
      r2: {
        prefix: direct?.fileCount ? `${OPEN_DATA_R2_PREFIX}${dataset.id}/` : null,
        ...(direct ?? {
          versions: [],
          fileCount: 0,
          completionManifestCount: 0,
          totalBytes: 0,
          featureCount: null,
          latestModifiedAt: null,
        }),
      },
    };
  });
  const count = (predicate: (item: (typeof items)[number]) => boolean) => items.filter(predicate).length;
  return {
    sourceCount: OPEN_DATA_SOURCES.length,
    datasetCount: items.length,
    geometryDatasetCount: count((item) => item.hasGeometry),
    mirroredViaKsj: count((item) => item.acquisitionState === "mirrored-via-ksj"),
    acquiredR2: count((item) => item.acquisitionState === "acquired-r2"),
    readyToAcquire: count((item) => item.acquisitionState === "ready-to-acquire"),
    adapterRequired: count((item) => item.acquisitionState === "adapter-required"),
    credentialsRequired: count((item) => item.acquisitionState === "credentials-required"),
    licenseReview: count((item) => item.acquisitionState === "license-review"),
    actionRequired: count((item) =>
      item.acquisitionState === "ready-to-acquire" ||
      item.acquisitionState === "adapter-required" ||
      item.acquisitionState === "credentials-required" ||
      item.acquisitionState === "source-resolution-required"
    ),
    note:
      "direct downloadには自治体標準オープンデータセットの仕様書等も含む。観測データ実体ではないため、分析用R2取得済みとは数えない。",
    items,
  };
}

export async function buildCatalog() {
  const candidates = JSON.parse(await readFile(CANDIDATE_PATH, "utf8")) as Candidate[];
  const aliasToCanonical = new Map<string, string>();
  for (const meta of GIS_DATASETS) {
    for (const alias of meta.candidateAliases ?? []) aliasToCanonical.set(alias, meta.dataId);
  }
  const candidateById = new Map<string, Candidate>();
  for (const candidate of candidates) {
    candidateById.set(aliasToCanonical.get(candidate.id) ?? candidate.id, candidate);
  }
  const registeredById = new Map(GIS_DATASETS.map((item) => [item.dataId, item]));
  const usage = await analysisUsage();
  const inventorySource = await inventoryObjects();
  const openDataObjects = hasR2Credentials()
    ? await listFromR2WithSize(OPEN_DATA_R2_PREFIX)
    : await localOpenDataObjects();
  const inventories = inventoryByDataId(inventorySource.objects);
  const openDataInventories = openDataInventoryById(openDataObjects);
  const emptyInventory: R2Inventory = {
    versions: [],
    fileCount: 0,
    completionManifestCount: 0,
    totalBytes: 0,
    featureCount: null,
    latestModifiedAt: null,
  };
  const ids = [...new Set([...candidateById.keys(), ...registeredById.keys()])].sort();
  const items: CatalogItem[] = ids.map((dataId) => {
    const candidate = candidateById.get(dataId);
    const meta = registeredById.get(dataId);
    const official = UNREGISTERED_KSJ_OFFICIAL_POLICY.get(dataId);
    const inventory = inventories.get(dataId) ?? emptyInventory;
    const usedInAnalyses = [...new Set(usage.get(dataId) ?? [])].sort();
    const policy = publicationPolicy(meta, official);
    const configEntry = KSJ_CODE_CONFIG.get(dataId);
    return {
      dataId,
      aliases: [...(meta?.candidateAliases ?? [])],
      name: meta?.name ?? candidate?.name ?? dataId,
      description: candidate?.description ?? "",
      category: meta?.category ?? null,
      categoryLabel: candidate?.category1_name ?? null,
      subcategoryLabel: candidate?.category2_name ?? null,
      geometryType: meta?.geometryType ?? null,
      coverage: meta?.coverage ?? null,
      license: meta?.license ?? official?.license ?? null,
      sourcePageUrl: meta?.sourcePageUrl ?? candidate?.source_url ?? null,
      downloadUrlPattern: configEntry?.downloadUrlPattern ?? null,
      registered: Boolean(meta),
      latestVersion: meta?.latestVersion ?? null,
      hasCodeConfig: Boolean(configEntry),
      isRankingTarget: meta?.isRankingTarget ?? false,
      publicationPolicy: policy,
      state: catalogState(dataId, meta, official, inventory, usedInAnalyses),
      usedInAnalyses,
      compliance: {
        publicMirrorPolicyMismatch: policy === "local-only" && inventory.fileCount > 0,
      },
      r2: {
        prefix: inventory.fileCount > 0 ? `${R2_PREFIX}${dataId}/` : null,
        expectedManifestCount: PUBLIC_KSJ_EXPECTED_ARCHIVE_COUNTS.get(dataId) ?? null,
        ...inventory,
      },
    };
  });

  const count = (predicate: (item: CatalogItem) => boolean) => items.filter(predicate).length;
  const acquiredIds = new Set(
    items
      .filter((item) => isAcquisitionComplete(item.dataId, item.r2))
      .map((item) => item.dataId),
  );
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source: {
      candidateCatalog: "packages/database/seed/ksj-catalog.json",
      registeredCatalog: "packages/gis/src/mlit-ksj/datasets.ts",
      openDataCatalog: "packages/data-configs/src/open-data-catalog/",
      r2Prefix: R2_PREFIX,
      inventoryMode: inventorySource.mode,
    },
    policy: {
      acquisitionComplete:
        "new public KSJ datasets require the expected official archive count to match R2 manifest.json count; legacy datasets require at least one R2 object",
      partialLicense: "manual review required before new public publication",
      nonCommercial: "local-only; existing public mirror is reported as a compliance mismatch",
      openData:
        "catalog visibility is not acquisition: APIs/tiles need an adapter and specification workbooks are not observation data",
    },
    summary: {
      candidateCatalog: candidates.length,
      unionCatalog: items.length,
      registered: GIS_DATASETS.length,
      r2Acquired: count((item) => isAcquisitionComplete(item.dataId, item.r2)),
      registeredMissingR2: count(
        (item) => item.registered && !isAcquisitionComplete(item.dataId, item.r2),
      ),
      analysisSources: count((item) => item.usedInAnalyses.length > 0),
      readyToAcquire: count((item) => item.state === "ready-to-acquire"),
      readyToRegister: count((item) => item.state === "ready-to-register"),
      licenseReview: count((item) => item.state === "license-review"),
      localOnly: count((item) => item.publicationPolicy === "local-only"),
      candidatesUnregistered: count((item) => item.state === "candidate"),
      sourceUrlComplete: count((item) => item.registered && item.sourcePageUrl !== null),
      complianceMismatches: count((item) => item.compliance.publicMirrorPolicyMismatch),
      totalR2Bytes: items.reduce((sum, item) => sum + item.r2.totalBytes, 0),
    },
    openDataCatalog: buildOpenDataCatalog(acquiredIds, openDataInventories),
    items,
  };
}

function validateCatalog(catalog: Awaited<ReturnType<typeof buildCatalog>>, checkRemote: boolean): string[] {
  const errors: string[] = [];
  if (catalog.summary.candidateCatalog !== 126) errors.push("candidate catalogは126件である必要があります");
  if (UNREGISTERED_KSJ_OFFICIAL_POLICY.size !== EXPECTED_UNREGISTERED_POLICY_COUNT) {
    errors.push(`未登録KSJの公式利用条件は${EXPECTED_UNREGISTERED_POLICY_COUNT}件である必要があります`);
  }
  const registeredPublicTargets = [...UNREGISTERED_KSJ_OFFICIAL_POLICY]
    .filter(([, policy]) => policy.decision === "acquire")
    .filter(([dataId]) => catalog.items.some((item) => item.dataId === dataId && item.registered));
  if (registeredPublicTargets.length !== EXPECTED_PUBLIC_ACQUISITION_COUNT) {
    errors.push(`公開取得対象の登録は${EXPECTED_PUBLIC_ACQUISITION_COUNT}件である必要があります`);
  }
  if (catalog.summary.candidatesUnregistered !== 0) {
    errors.push("利用条件未判定のKSJ候補が残っています");
  }
  const registered = catalog.items.filter((item) => item.registered);
  const missingSource = registered.filter((item) => !item.sourcePageUrl).map((item) => item.dataId);
  const missingVersion = registered.filter((item) => !item.latestVersion).map((item) => item.dataId);
  const missingCode = registered.filter((item) => !item.hasCodeConfig).map((item) => item.dataId);
  if (missingSource.length > 0) errors.push(`一次資料URL不足: ${missingSource.join(", ")}`);
  if (missingVersion.length > 0) errors.push(`latestVersion不足: ${missingVersion.join(", ")}`);
  if (missingCode.length > 0) errors.push(`code config不足: ${missingCode.join(", ")}`);
  if (new Set(catalog.items.map((item) => item.dataId)).size !== catalog.items.length) {
    errors.push("dataIdが重複しています");
  }
  if (checkRemote && catalog.summary.registeredMissingR2 > 0) {
    const missing = registered
      .filter((item) => !isAcquisitionComplete(item.dataId, item.r2))
      .map((item) => item.dataId);
    errors.push(`R2未取得の登録データ: ${missing.join(", ")}`);
  }
  return errors;
}

async function main() {
  const command = process.argv[2] ?? "build";
  if (command !== "build" && command !== "check") throw new Error(`unknown command: ${command}`);
  const catalog = await buildCatalog();
  const checkRemote = catalog.source.inventoryMode === "remote-r2";
  const errors = validateCatalog(catalog, command === "check" && checkRemote);
  if (command === "build") {
    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }
  if (errors.length > 0) throw new Error(errors.join("\n"));
  console.log(
    `[geo-data-catalog] PASS inventory=${catalog.source.inventoryMode} candidates=${catalog.summary.candidateCatalog} registered=${catalog.summary.registered} acquired=${catalog.summary.r2Acquired} missing=${catalog.summary.registeredMissingR2} openGeo=${catalog.openDataCatalog.geometryDatasetCount}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[geo-data-catalog] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
