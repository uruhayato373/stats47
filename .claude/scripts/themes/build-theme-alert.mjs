/** Stable issue body: no timestamps, unchanged warnings do not notify every week. */
import fs from "node:fs";
const arg = (name) => process.argv[process.argv.indexOf(name) + 1];
const read = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const quality = read(".claude/state/themes/quality.json", { findings: [], summary: { added: [] } });
const live = read(".claude/state/theme-charts/live-audit.json", { results: [] });
const errors = quality.findings.filter((f) => f.severity === "error");
// Partial coverage and stable definition warnings require editorial review, not weekly duplicate alerts.
const freshWarnings = quality.summary.added.filter((f) => f.severity === "warn");
const liveFailures = live.results.filter((r) => r.status !== "ok");
const followup = read(".claude/state/themes/ci-followup.json", null);
const followupFailed = process.argv.includes("--followup-code") && (arg("--followup-code") !== "0" || !followup || followup.status !== "pass");
const failed = followupFailed || arg("--live-code") !== "0" || arg("--quality-code") !== "0";
const lines = ["# テーマ品質監査", "", ...errors.map((f) => `- ${f.themeKey ?? f.metricKey}: ${f.code} ${f.detail ?? ""}`), ...liveFailures.map((f) => `- 配信値: ${f.metricKey ?? f.key ?? f.statsDataId} ${f.status} ${f.detail ?? ""}`)];
if (followupFailed && followup) lines.push(...followup.problems.map(p => `- 表示検査: ${p}`));
if (failed && !errors.length && !liveFailures.length) lines.push("- 監査実行または判定ゲートが失敗しました。workflowログを確認してください。");
lines.push("", "表示検査のHTML・応答・cf-ray・画像: workflowのtheme-followup-evidence artifact（30日保持）", "", "結果: `.claude/state/themes/quality.json` / `.claude/state/theme-charts/live-audit.json`", "", "再現: `npm run theme:portfolio:audit` と `node .claude/scripts/audit/theme-chart-live-audit.mjs`。修正は担当ownerのcatalog/config/UIへ反映し、生成・対象テスト・型検査・localhost確認を通す。本番反映は公開フローに従う。");
fs.writeFileSync(arg("--output"), `${lines.join("\n")}\n`);
console.log(`alert_open=${failed || errors.length > 0 || liveFailures.length > 0}`);
console.log(`new_warnings=${freshWarnings.length}`);
