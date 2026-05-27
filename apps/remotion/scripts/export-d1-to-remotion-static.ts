/**
 * D1 → apps/remotion/public/<feature>/*.json を生成するエントリポイント。
 *
 * 使い方:
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature migration-flow
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --dry-run
 *
 * 詳細: .claude/skills/db/export-d1-to-remotion-static/SKILL.md
 */
import { exportMigrationFlow } from "./exporters/migration-flow.js";
import { exportPopulationYoy47 } from "./exporters/population-yoy-47.js";
import { exportStationPassengers } from "./exporters/station-passengers.js";
import { exportMaster } from "./exporters/master.js";

type FeatureName =
  | "migration-flow"
  | "population-yoy-47"
  | "station-passengers"
  | "master"
  | "all";

interface Args {
  feature: FeatureName;
  year?: number;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { feature: "all", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--feature") {
      out.feature = argv[++i] as FeatureName;
    } else if (a === "--year") {
      out.year = Number(argv[++i]);
    } else if (a === "--dry-run") {
      out.dryRun = true;
    }
  }
  return out;
}

const FEATURES: Record<
  Exclude<FeatureName, "all">,
  (year?: number) => { files: number; skipped: string[] }
> = {
  "migration-flow": (year) => exportMigrationFlow(year),
  "population-yoy-47": () => exportPopulationYoy47(),
  "station-passengers": () => exportStationPassengers(),
  master: () => exportMaster(),
};

function main(): void {
  const args = parseArgs();
  const targets: Array<Exclude<FeatureName, "all">> =
    args.feature === "all"
      ? (Object.keys(FEATURES) as Array<Exclude<FeatureName, "all">>)
      : [args.feature as Exclude<FeatureName, "all">];

  if (args.dryRun) {
    console.log(`[dry-run] would export: ${targets.join(", ")}`);
    return;
  }

  let totalFiles = 0;
  let hadSkip = false;
  for (const t of targets) {
    process.stdout.write(`\n=== ${t} ===\n`);
    const fn = FEATURES[t];
    if (!fn) {
      console.warn(`unknown feature: ${t}`);
      continue;
    }
    const { files, skipped } = fn(args.year);
    totalFiles += files;
    console.log(`  ✓ wrote ${files} file(s)`);
    if (skipped.length > 0) {
      hadSkip = true;
      for (const s of skipped) console.log(`  ⚠ ${s}`);
    }
  }

  console.log(`\ndone. total files: ${totalFiles}${hadSkip ? " (warnings)" : ""}`);
}

main();
