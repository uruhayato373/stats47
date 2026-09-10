#!/usr/bin/env node
/** Facts-only local builder. Raw HTML/PDF never enters the public R2 layout. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
const require = createRequire(import.meta.url);
const {
  CULTURAL_HERITAGE_SOURCE: source,
} = require("../../../packages/data-configs/src/theme-catalog/cultural-heritage-source.ts");
const {
  verifyCulturalHeritageSnapshot,
} = require("../../../apps/web/src/features/cultural-heritage/lib/cultural-heritage-snapshot.ts");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sha256 = (body) => createHash("sha256").update(body).digest("hex");
export function assertPrivateSourcePath(
  sourceDir,
  publicRoot = resolve(root, ".local/r2"),
) {
  const canonicalSource = existsSync(sourceDir)
    ? realpathSync(sourceDir)
    : resolve(sourceDir);
  const canonicalPublic = existsSync(publicRoot)
    ? realpathSync(publicRoot)
    : resolve(publicRoot);
  const rel = relative(canonicalPublic, canonicalSource);
  assert(
    rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel),
    "raw source must be outside public R2",
  );
}
export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      "source-dir": {
        type: "string",
        default: "/tmp/stats47-cultural-heritage-source",
      },
      "output-dir": {
        type: "string",
        default: "/tmp/stats47-cultural-heritage-output",
      },
      download: { type: "boolean", default: false },
      "write-local": { type: "boolean", default: false },
    },
  });
  const sourceDir = resolve(values["source-dir"]);
  const outputDir = resolve(values["output-dir"]);
  await mkdir(sourceDir, { recursive: true, mode: 0o700 });
  assertPrivateSourcePath(realpathSync(sourceDir));
  assert(
    sourceDir !== outputDir,
    "keep raw sources separate from generated facts",
  );
  await mkdir(outputDir, { recursive: true });
  const definitionPath = resolve(outputDir, "source-definition.json");
  const extractedPath = resolve(outputDir, "extracted.json");
  await writeFile(definitionPath, JSON.stringify(source));
  execFileSync(
    "python3",
    [
      resolve(root, ".claude/scripts/themes/cultural-heritage-source.py"),
      "--definition",
      definitionPath,
      "--prefectures",
      resolve(root, "packages/area/src/data/prefectures.json"),
      "--source-dir",
      sourceDir,
      "--output",
      extractedPath,
      ...(values.download ? ["--download"] : []),
    ],
    { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 4 * 1024 * 1024 },
  );
  const extracted = JSON.parse(await readFile(extractedPath, "utf8"));
  const manifestBody = JSON.stringify(extracted.manifest, null, 2) + "\n";
  const snapshot = await verifyCulturalHeritageSnapshot({
    schemaVersion: 1,
    seriesKey: source.seriesKey,
    scope: source.scope,
    observedDate: source.observedDate,
    generatedAt: new Date().toISOString(),
    source: {
      title: source.title,
      url: source.url,
      factsSha256: source.factsSha256,
      rawManifestSha256: sha256(manifestBody),
    },
    records: extracted.records,
  });
  assert(
    snapshot,
    "strict scope, fact hash, duplicates, geography and evidence gate",
  );
  const body = JSON.stringify(snapshot, null, 2) + "\n";
  const proof = {
    status: "PASS",
    verifiedAt: new Date().toISOString(),
    checks: extracted.checks,
    counts: source.counts,
    payloadSha256: sha256(body),
    r2Key: source.r2Key,
    factsSha256: source.factsSha256,
    rawManifestSha256: sha256(manifestBody),
    rights: source.rights.map(({ url, textSha256 }) => ({ url, textSha256 })),
    limitations: source.notes,
    sourcePublication:
      "Metadata-only manifest: source URLs, actual acquisition times, body SHA/bytes and public search parameters. No raw HTML, imagery or descriptive text.",
  };
  await writeFile(resolve(outputDir, "cultural-heritage-locations.json"), body);
  await writeFile(resolve(outputDir, "source-manifest.json"), manifestBody);
  await writeFile(
    resolve(outputDir, "verification.json"),
    JSON.stringify(proof, null, 2) + "\n",
  );
  if (values["write-local"]) {
    const target = resolve(root, ".local/r2", source.r2Key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
    const lineageDir = resolve(dirname(target), "cultural-heritage-locations");
    await mkdir(lineageDir, { recursive: true });
    await writeFile(resolve(lineageDir, "source-manifest.json"), manifestBody);
    await writeFile(
      resolve(lineageDir, "verification.json"),
      JSON.stringify(proof, null, 2) + "\n",
    );
  }
  return proof;
}
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  main().then((proof) =>
    process.stdout.write(
      JSON.stringify({
        status: proof.status,
        records: proof.counts.uniqueRecords,
        payloadSha256: proof.payloadSha256,
      }) + "\n",
    ),
  );
}
