#!/usr/bin/env node
/**
 * 開いたままの自動アラート Issue (label auto-generated) が回収されているかを検査する。
 * staleDays (review-wiring.json の alertTriage) を過ぎたアラートは、コメントに
 * 「→ 振り分け: <カード ID / EXP-NNN / #Issue / 見送り>」が必要。判定は lib/alert-triage.mjs。
 *
 * 使い方:
 *   node .claude/scripts/management/check-alert-triage.mjs                 # 人間向け (error があれば exit 1)
 *   node .claude/scripts/management/check-alert-triage.mjs --json          # 機械向け (常に exit 0)
 *   node .claude/scripts/management/check-alert-triage.mjs --body-out /tmp/x.md  # CI: 本文をファイルへ・errors=N を GITHUB_OUTPUT へ
 *   node .claude/scripts/management/check-alert-triage.mjs --input issues.json   # gh を使わず保存済みの一覧で判定
 * gh CLI (GH_TOKEN) が要る。週次レビュー・月次レビューの手順と review-cadence-guard.yml (毎朝) から呼ぶ。
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatTriage, triageAlerts } from "./lib/alert-triage.mjs";
import { loadIdIndex, loadWiring } from "./lib/review-cadence.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const wiring = loadWiring(ROOT);
const conf = wiring.alertTriage;
const marker = wiring.handoffRouting.marker;
const issues = value("--input")
  ? JSON.parse(readFileSync(value("--input"), "utf8"))
  : JSON.parse(
      execFileSync(
        "gh",
        ["issue", "list", "--label", conf.label, "--state", "open", "--limit", "200", "--json", "number,title,createdAt,comments,labels"],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      ),
    );
const rows = triageAlerts(issues, { staleDays: conf.staleDays, marker, ids: loadIdIndex(ROOT) });
const { body, errors } = formatTriage(rows, { staleDays: conf.staleDays, marker });

if (args.includes("--body-out")) {
  writeFileSync(value("--body-out"), `${body}\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `errors=${errors}\n`);
  console.log(`errors=${errors}`);
} else if (args.includes("--json")) {
  process.stdout.write(`${JSON.stringify({ rows, errors }, null, 2)}\n`);
} else {
  console.log(body);
  process.exitCode = errors ? 1 : 0;
}
