/**
 * R2 (観測値) + git TS (prefecture master) → apps/remotion/public/<feature>/*.json を
 * 生成するエントリポイント。完全DBレス (docs/01_技術設計/19): D1 は読まない。
 *
 * 使い方:
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature migration-flow
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all
 *   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --dry-run
 *
 * 詳細: .claude/skills/db/export-d1-to-remotion-static/SKILL.md
 *
 * 注: prefecture master (packages/area/src/data/prefectures.json) は git TS の SSOT。
 * 以前は master feature が D1 から再生成していたが Phase C で廃止 (静的 Reference 化)。
 */
import { exportMigrationFlow } from "./exporters/migration-flow.js";
import { exportPopulationYoy47 } from "./exporters/population-yoy-47.js";
import { exportStationPassengers } from "./exporters/station-passengers.js";

type FeatureName =
  | "migration-flow"
  | "population-yoy-47"
  | "station-passengers"
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
  (year?: number) => Promise<{ files: number; skipped: string[] }>
> = {
  "migration-flow": (year) => exportMigrationFlow(year),
  "population-yoy-47": () => exportPopulationYoy47(),
  "station-passengers": () => exportStationPassengers(),
};

async function main(): Promise<void> {
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
    const { files, skipped } = await fn(args.year);
    totalFiles += files;
    console.log(`  ✓ wrote ${files} file(s)`);
    if (skipped.length > 0) {
      hadSkip = true;
      for (const s of skipped) console.log(`  ⚠ ${s}`);
    }
  }

  console.log(`\ndone. total files: ${totalFiles}${hadSkip ? " (warnings)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
