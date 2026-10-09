#!/usr/bin/env node
/**
 * SNS 投稿台帳の「1 id から全部たどれる」契約を検査する (npm run sns:trace:check)。
 * 検査の中身は lib/post-trace-core.mjs。error があれば exit 1 (PR CI で blocking)。
 *
 *   node .claude/scripts/sns/check-post-trace.mjs                 # 台帳・台本・指標時系列の検査
 *   node .claude/scripts/sns/check-post-trace.mjs --verify-drive  # + Drive 上の素材の実体と sha256 (Mac のみ)
 *   node .claude/scripts/sns/check-post-trace.mjs --json          # summary を JSON で出す
 *
 * 契約の正典: .claude/rules/sns-content-standards.md §3
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { checkPostTrace } from "./lib/post-trace-core.mjs";
import { verifyArchivedAssets } from "./lib/sns-drive-assets.mjs";
import { datasetPath } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const store = require("../lib/sns-posts-store.cjs");
const metricsStore = require("../lib/sns-metrics-store.cjs");

const args = new Set(process.argv.slice(2));

const ledger = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, datasetPath("sns.posts")), "utf8"));
const readScript = (scriptPath) => {
  const file = path.join(PROJECT_ROOT, scriptPath);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
};
const metricRows = metricsStore
  .readByRange("0000-00-00", "9999-12-31")
  .map((r) => ({ ...r, date: String(r.fetched_at).slice(0, 10) }));

const { errors, warnings, summary } = checkPostTrace({
  ledger,
  readScript,
  metricRows,
  externalIdOf: store.externalIdOf,
});

if (args.has("--verify-drive")) {
  const drive = await verifyArchivedAssets(ledger.posts);
  summary.drive = { checked: drive.checked };
  errors.push(...drive.errors);
}

if (args.has("--json")) {
  console.log(JSON.stringify({ errors, warnings, summary }, null, 2));
} else {
  console.log(`SNS 投稿台帳: ${summary.posts} 件`);
  console.log(`  承認: ${Object.entries(summary.approval).map(([k, v]) => `${k} ${v}`).join(" / ")}`);
  console.log(`  外部 ID (posted): たどれる ${summary.externalId.traced} / たどれない ${summary.externalId.untraced}`);
  console.log(
    `  素材: 保全済みの行 ${summary.assets.archivedRows} / 未保全の posted 行 ${summary.assets.notArchivedPostedRows} / missing ${summary.assets.missingAssets}`,
  );
  console.log(
    `  指標行: 結び付き ${summary.metrics.linked} / 未結合 ${summary.metrics.unlinked} / 台帳に無い id ${summary.metrics.dangling}`,
  );
  if (summary.drive) console.log(`  Drive 照合: ${summary.drive.checked} 件`);
  for (const w of warnings) console.log(`⚠ ${w}`);
  for (const e of errors.slice(0, 50)) console.log(`✗ ${e}`);
  if (errors.length > 50) console.log(`✗ ... ほか ${errors.length - 50} 件`);
  console.log(errors.length ? `✗ error ${errors.length} 件` : "✓ error 0 件");
}
process.exit(errors.length ? 1 : 0);
