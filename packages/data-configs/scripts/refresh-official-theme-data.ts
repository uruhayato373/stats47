#!/usr/bin/env tsx
/**
 * Official releases newer than SSDS → local stats + ranking staging. Never uploads.
 *
 * node --conditions=react-server --import tsx packages/data-configs/scripts/refresh-official-theme-data.ts
 *   --stage-dir .local/r2 --artifact-dir /tmp/stats47-official-theme-data
 * Optional: --offline --history-estat-json /tmp/official-ssds-response.json
 * Python: OFFICIAL_THEME_PYTHON (default python3), with pdfplumber and openpyxl.
 * Install: python3 -m pip install -r packages/data-configs/scripts/lib/requirements-official-theme-data.txt
 * A changed document hash, column, history or prefecture coverage stops all writes.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import prefectures from "../../area/src/data/prefectures.json";
import { parseStatsValuesPayload } from "../../stats-r2/src/schemas";
import type { SingleEntityRow, StatsValuesPayload } from "../../stats-r2/src/types";
import { agriculturalOutput } from "../src/metrics/agricultural-output";
import { healthyLifeExpectancyMale } from "../src/metrics/healthy-life-expectancy-male";
import { healthyLifeExpectancyFemale } from "../src/metrics/healthy-life-expectancy-female";
import { applyValueScale, checkMoneyUnitScale } from "../src/money-unit";
import { buildRecipe, parseRecipe } from "../src/recipe";
import { mergeOfficialRows, parseAgriculturalHistory } from "../src/provenance/official-release-staging";
import { AGRICULTURAL_OUTPUT_RELEASE, HEALTHY_LIFE_RELEASE } from "../src/provenance/official-theme-releases";
import type { YearSpec } from "../src/types";

// CLI-only runtime dependency: the ranking package's public type barrel also loads
// visualization JSX types, which do not belong in data-configs' non-UI compilation.
const { buildPartitions } = require("../../ranking/src/scripts/generate-ranking-values") as {
  buildPartitions: (key: string, rows: readonly SingleEntityRow[], years: YearSpec) => Array<{
    yearCode: string; count: number; values: Array<SingleEntityRow & { metricKey: string; areaType: string }>;
  }>;
};

const REPO_ROOT = resolve(__dirname, "../../..");
const METRICS = [healthyLifeExpectancyMale, healthyLifeExpectancyFemale, agriculturalOutput];
const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
const option = (name: string, fallback: string) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith("--")) throw new Error(`${name} needs a value`);
  return process.argv[index + 1];
};

function assertNotTrackedOutput(path: string): void {
  const rel = relative(REPO_ROOT, path);
  if (!rel.startsWith("..") && !isAbsolute(rel) && rel !== ".local/r2" && !rel.startsWith(".local/r2/")) {
    throw new Error("Observations and source documents must be staged outside the repository or inside .local/r2");
  }
}

function readAppId(): string {
  const value = process.env.NEXT_PUBLIC_ESTAT_APP_ID ?? process.env.ESTAT_APP_ID;
  if (value) return value;
  const env = join(REPO_ROOT, ".env.local");
  const line = existsSync(env) ? readFileSync(env, "utf8").split("\n").find((entry) => entry.startsWith("NEXT_PUBLIC_ESTAT_APP_ID=")) : undefined;
  const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("Set NEXT_PUBLIC_ESTAT_APP_ID or pass --history-estat-json with an official API response");
  return id;
}

async function main(): Promise<void> {
  const stageDir = resolve(option("--stage-dir", join(REPO_ROOT, ".local/r2")));
  const artifactDir = resolve(option("--artifact-dir", join(tmpdir(), "stats47-official-theme-data")));
  assertNotTrackedOutput(stageDir);
  assertNotTrackedOutput(artifactDir);
  const offline = process.argv.includes("--offline");
  await mkdir(artifactDir, { recursive: true });

  async function acquire(url: string, name: string, expectedHash?: string): Promise<{ path: string; sha256: string }> {
    const path = join(artifactDir, name);
    if (!offline) {
      const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
      if (!response.ok) throw new Error(`Official download failed: HTTP ${response.status} (${name})`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (expectedHash && sha256(buffer) !== expectedHash) throw new Error(`Official source changed: ${name}; review the release before changing its pin`);
      await writeFile(path, buffer);
    }
    const hash = sha256(await readFile(path));
    if (expectedHash && hash !== expectedHash) throw new Error(`Official source hash mismatch: ${name}`);
    return { path, sha256: hash };
  }

  const [pdf, workbook] = await Promise.all([
    acquire(HEALTHY_LIFE_RELEASE.sourceUrl, "healthy-2022.pdf", HEALTHY_LIFE_RELEASE.sha256),
    acquire(AGRICULTURAL_OUTPUT_RELEASE.sourceUrl, "agriculture-2024.xlsx", AGRICULTURAL_OUTPUT_RELEASE.sha256),
  ]);
  const historyArgument = option("--history-estat-json", "");
  let historyPath: string;
  if (historyArgument) {
    historyPath = resolve(historyArgument);
  } else {
    const query = new URLSearchParams({ appId: offline ? "unused" : readAppId(),
      statsDataId: AGRICULTURAL_OUTPUT_RELEASE.history.statsDataId,
      cdCat01: AGRICULTURAL_OUTPUT_RELEASE.history.cdCat01, limit: "100000" });
    historyPath = (await acquire(`https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${query}`, "agricultural-history.json")).path;
  }
  const historyRaw = await readFile(historyPath, "utf8");
  const history = parseAgriculturalHistory(JSON.parse(historyRaw));
  const prior = new Map<string, StatsValuesPayload>();
  for (const metric of METRICS) {
    const stagedPath = join(stageDir, "app/stats", metric.key, "values.json");
    const path = existsSync(stagedPath) ? stagedPath : (await acquire(
      `https://storage.stats47.jp/app/stats/${metric.key}/values.json`, `${metric.key}-existing.json`,
    )).path;
    const existing = parseStatsValuesPayload(JSON.parse(await readFile(path, "utf8")));
    if (existing.metricKey !== metric.key || existing.entityKind !== "prefecture") throw new Error("Existing stats identity mismatch");
    prior.set(metric.key, existing);
  }
  const jobs = METRICS.map((metric) => {
    if (metric.source.kind !== "external" || metric.source.fetcherKey !== "manual") throw new Error("Official release requires manual source config");
    return { key: metric.key, path: metric.key === agriculturalOutput.key ? workbook.path : pdf.path, spec: metric.source.config.extraction };
  });
  const extraction = spawnSync(process.env.OFFICIAL_THEME_PYTHON ?? "python3", [join(__dirname, "lib/extract-official-theme-data.py")], {
    input: JSON.stringify({ prefectures, jobs }), encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  });
  if (extraction.status !== 0) throw new Error(`Official extraction failed: ${extraction.error?.message ?? extraction.stderr}`);
  const extracted = JSON.parse(extraction.stdout) as Record<string, { rows: SingleEntityRow[]; evidence: unknown }>;
  const generatedAt = new Date().toISOString();
  const pending: { path: string; text: string }[] = [];
  const manifest: Record<string, unknown>[] = [];
  for (const metric of METRICS) {
    const isAgriculture = metric.key === agriculturalOutput.key;
    let rows = extracted[metric.key].rows;
    if (isAgriculture) {
      const spec = AGRICULTURAL_OUTPUT_RELEASE;
      const verdict = checkMoneyUnitScale({ sourceUnit: spec.sourceUnit, configUnit: metric.unit, declaredScale: spec.valueScale });
      if (verdict.kind !== "ok") throw new Error("Agricultural output unit scale gate failed");
      if (rows.some((row) => row.unit !== spec.sourceUnit)) throw new Error("Agricultural output source unit mismatch");
      rows = [...history, ...rows.map((row) => ({ ...row, value: applyValueScale(row.value, verdict.expectedScale), unit: metric.unit }))];
    }
    const years = isAgriculture ? Array.from({ length: AGRICULTURAL_OUTPUT_RELEASE.year - AGRICULTURAL_OUTPUT_RELEASE.history.from + 1 },
      (_, index) => AGRICULTURAL_OUTPUT_RELEASE.history.from + index) : HEALTHY_LIFE_RELEASE.columns.map((column) => column.year);
    const existing = prior.get(metric.key)!;
    rows = mergeOfficialRows(metric.key, existing.rows, rows, years, metric.unit);
    const recipe = buildRecipe(metric);
    if (JSON.stringify(parseRecipe(recipe)) !== JSON.stringify(recipe)) throw new Error("Recipe round-trip failed");
    // The existing ranking generator derives ranks and filters years from the same config.
    const partitions = buildPartitions(metric.key, rows, metric.years);
    const ranks = new Map(partitions.flatMap((part) => part.values.map((row) => [`${row.yearCode}/${row.areaCode}`, row.rank] as const)));
    rows = rows.map((row) => ({ ...row, rank: ranks.get(`${row.yearCode}/${row.areaCode}`) }));
    const stats: StatsValuesPayload = { metricKey: metric.key, entityKind: "prefecture", rows,
      meta: { rowCount: rows.length, areaCount: 47, yearRange: [String(years[0]), String(years[years.length - 1])], generatedAt, recipe } };
    const ranking = { generatedAt, rankingKey: metric.key, areaType: "prefecture",
      partitions: buildPartitions(metric.key, stats.rows, metric.years) };
    if (ranking.partitions.reduce((sum, part) => sum + part.count, 0) !== rows.length) throw new Error("Ranking generation removed observations");
    const statsText = JSON.stringify(stats);
    const rankingText = JSON.stringify(ranking);
    pending.push({ path: join(stageDir, "app/stats", metric.key, "values.json"), text: statsText },
      { path: join(stageDir, "app/ranking", metric.key, "values.json"), text: rankingText });
    manifest.push({ key: metric.key, years, rowCount: rows.length, previousRowCount: existing.rows.length,
      previousRecipe: existing.meta.recipe, recipe, previousValuesMatched: existing.rows.length,
      source: isAgriculture ? { url: AGRICULTURAL_OUTPUT_RELEASE.sourceUrl, sha256: workbook.sha256,
        history: { ...AGRICULTURAL_OUTPUT_RELEASE.history, sha256: sha256(historyRaw) } } : { url: HEALTHY_LIFE_RELEASE.sourceUrl, sha256: pdf.sha256 },
      extraction: jobs.find((job) => job.key === metric.key)?.spec, evidence: extracted[metric.key].evidence,
      outputs: { stats: { sha256: sha256(statsText), recipeHash: recipe.configHash },
        ranking: { sha256: sha256(rankingText), inputRecipeHash: recipe.configHash } } });
  }
  // Validate the entire batch before replacing even one staged stats file.
  for (const output of pending) {
    await mkdir(resolve(output.path, ".."), { recursive: true });
    await writeFile(`${output.path}.tmp`, output.text);
    await rename(`${output.path}.tmp`, output.path);
  }
  await writeFile(join(artifactDir, "manifest.json"), JSON.stringify({ generatedAt, stageDir, metrics: manifest }, null, 2));
  console.log(JSON.stringify({ status: "PASS", stageDir, manifest: join(artifactDir, "manifest.json"), metrics: manifest.map(({ key, rowCount, previousValuesMatched }) => ({ key, rowCount, previousValuesMatched })) }, null, 2));
}

if (process.argv[1]?.includes("refresh-official-theme-data")) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
