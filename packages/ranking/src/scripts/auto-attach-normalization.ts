#!/usr/bin/env tsx
/**
 * ベース指標に per_population / per_area / per_household の normalizationOptions を一括付与する。
 *
 * 既に normalizationOptions を持つ metric は merge (既存 type は尊重、新規 type のみ追加)。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/auto-attach-normalization.ts --dry-run
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ranking/src/scripts/auto-attach-normalization.ts --apply
 *
 * Options:
 *   --dry-run   DB に書き込まず、対象一覧サマリを表示
 *   --apply     DB に UPDATE をかける
 *   --key K     特定 metric key のみ対象 (デバッグ用)
 */

import { getDrizzle, metrics } from "@stats47/database/server";
import { eq } from "drizzle-orm";

import type { CalculationConfig, NormalizationOption } from "../types/ranking-item";
import { isBaseMetric } from "../utils/is-base-metric";

interface CliArgs {
  dryRun: boolean;
  apply: boolean;
  keyFilter?: string;
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const keyIdx = argv.indexOf("--key");
  const keyFilter = keyIdx !== -1 ? argv[keyIdx + 1] : undefined;
  return { dryRun, apply, keyFilter };
}

function buildStandardOptions(baseUnit: string): NormalizationOption[] {
  return [
    {
      type: "per_population",
      label: "人口10万人あたり",
      unit: `${baseUnit}/10万人`,
      scaleFactor: 100000,
      decimalPlaces: 2,
    },
    {
      type: "per_area",
      label: "面積100km²あたり",
      unit: `${baseUnit}/100km²`,
      scaleFactor: 100,
      decimalPlaces: 2,
    },
    {
      type: "per_household",
      label: "1世帯あたり",
      unit: `${baseUnit}/世帯`,
      scaleFactor: 1,
      decimalPlaces: 4,
    },
  ];
}

function parseCalculationConfig(json: string | null): CalculationConfig {
  if (!json) return { isCalculated: false };
  try {
    return JSON.parse(json) as CalculationConfig;
  } catch {
    return { isCalculated: false };
  }
}

function mergeOptions(existing: NormalizationOption[], standard: NormalizationOption[]): NormalizationOption[] {
  const existingTypes = new Set(existing.map((opt) => opt.type));
  const merged = [...existing];
  for (const opt of standard) {
    if (!existingTypes.has(opt.type)) merged.push(opt);
  }
  return merged;
}

async function main() {
  const args = parseArgs();

  if (!args.dryRun && !args.apply) {
    console.error("Specify --dry-run or --apply");
    process.exit(1);
  }

  const db = getDrizzle();

  const allRows = await db
    .select({
      key: metrics.key,
      unit: metrics.unit,
      groupKey: metrics.groupKey,
      calculationConfigJson: metrics.calculationConfigJson,
      isActive: metrics.isActive,
    })
    .from(metrics);

  const candidates = args.keyFilter ? allRows.filter((r) => r.key === args.keyFilter) : allRows;

  let baseCount = 0;
  let skippedNonBase = 0;
  let skippedAlreadyComplete = 0;
  let updated = 0;
  let updateFailed = 0;
  const examples: string[] = [];

  for (const row of candidates) {
    if (!row.isActive) {
      skippedNonBase++;
      continue;
    }

    const calc = parseCalculationConfig(row.calculationConfigJson);

    const base = isBaseMetric({
      key: row.key,
      unit: row.unit,
      groupKey: row.groupKey,
      calculation: calc,
    });

    if (!base) {
      skippedNonBase++;
      continue;
    }

    baseCount++;

    const standard = buildStandardOptions(row.unit || "");
    const existing = calc.normalizationOptions ?? [];
    const merged = mergeOptions(existing, standard);

    if (merged.length === existing.length) {
      skippedAlreadyComplete++;
      continue;
    }

    if (examples.length < 5) {
      examples.push(`${row.key} (${row.unit}) +${merged.length - existing.length} types`);
    }

    if (args.apply) {
      const nextCalc: CalculationConfig = {
        ...calc,
        isCalculated: calc.isCalculated ?? false,
        normalizationOptions: merged,
      };
      try {
        await db
          .update(metrics)
          .set({ calculationConfigJson: JSON.stringify(nextCalc) })
          .where(eq(metrics.key, row.key));
        updated++;
      } catch (err) {
        updateFailed++;
        console.error(`UPDATE failed for ${row.key}:`, err);
      }
    } else {
      updated++;
    }
  }

  console.log("");
  console.log("=== auto-attach-normalization summary ===");
  console.log(`mode:                  ${args.apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`total rows scanned:    ${candidates.length}`);
  console.log(`base metrics:          ${baseCount}`);
  console.log(`skipped (non-base):    ${skippedNonBase}`);
  console.log(`skipped (complete):    ${skippedAlreadyComplete}`);
  console.log(`updated:               ${updated}${args.apply ? "" : " (would be)"}`);
  if (updateFailed > 0) {
    console.log(`UPDATE failed:         ${updateFailed}`);
  }
  console.log("");
  console.log("examples:");
  for (const ex of examples) console.log(`  ${ex}`);
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
