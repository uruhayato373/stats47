#!/usr/bin/env node
/** Read-only dashboard collector. Shell entry delegates here; remove the wrapper when scheduled callers use this CLI directly. */
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { extractDashboardDom, collectDashboardPages } from "./lib/dashboard-dom.mjs";
import { buildDashboardSnapshot, buildCoverMetricsReport, coverMetricsCsv, defaultPeriod, validatePeriod } from "./lib/dashboard-metrics.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const run = promisify(execFile);
const pause = ms => new Promise(r => setTimeout(r, ms));
const options = { ...defaultPeriod(), outputDir: join(ROOT, ".claude/state/metrics/note/dashboard"),
  coverAudit: join(ROOT, ".claude/state/metrics/note-cover-audit-latest.json"), profile: "Profile 5" };
const flags = { "--start": "start", "--end": "end", "--output-dir": "outputDir", "--cover-audit": "coverAudit", "--profile": "profile" };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--help") {
    console.log("Usage: npm run note:metrics:fetch -- [--start YYYY-MM-DD --end YYYY-MM-DD] [--output-dir PATH] [--cover-audit PATH]\nDefault: yesterday-ending 28 days (JST). Read-only. Exit 0=complete, 2=incomplete/error. New PV never overwrites legacy views.");
    process.exit(0);
  }
  const key = flags[process.argv[i]];
  if (!key || !process.argv[i + 1] || process.argv[i + 1].startsWith("--")) {
    console.error(`Invalid argument: ${process.argv[i]}`); process.exit(2);
  }
  options[key] = process.argv[++i];
}
const period = { start: options.start, end: options.end };
try { validatePeriod(period); } catch (error) { console.error(error.message); process.exit(2); }
const cliDefault = join(homedir(), ".browser-use-env/bin/browser-use");
const cli = process.env.BROWSER_USE_BIN || (existsSync(cliDefault) ? cliDefault : "browser-use");
const session = `note-metrics-${process.pid}-${Date.now()}`;
const outputDir = resolve(options.outputDir);
let closed = false;

async function browser(command, ...args) {
  const { stdout } = await run(cli, ["--session", session, "--json", ...(command === "open" ? ["--headed", "--profile", options.profile] : []), command, ...args],
    { timeout: 45_000, maxBuffer: 12_000_000 });
  const reply = JSON.parse(stdout);
  if (!reply.success) throw new Error(`browser_${command}_failed: ${JSON.stringify(reply.error ?? reply.data)}`);
  return reply.data;
}
async function evaluate(code) {
  const data = await browser("eval", code);
  return typeof data.result === "string" ? JSON.parse(data.result) : data.result;
}
async function until(read, accept, label) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (accept(value)) return value;
    await pause(400);
  }
  throw new Error(`timeout: ${label}`);
}
function processList() {
  return execFileSync("ps", ["-axo", "pid=,ppid=,command="], { encoding: "utf8" }).split("\n")
    .map(line => line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/)).filter(Boolean)
    .map(m => ({ pid: Number(m[1]), ppid: Number(m[2]), command: m[3] }));
}
async function cleanup() {
  if (closed) return;
  closed = true;
  // Own named session only. Never pkill another task's browser/daemon or close user's tabs.
  const before = processList();
  const daemon = before.find(p => p.command.includes("browser_use.skill_cli.daemon") && p.command.split(/\s+/).includes(session));
  const owned = new Set(daemon ? [daemon.pid] : []);
  for (let changed = true; changed;) {
    changed = false;
    for (const p of before) if (owned.has(p.ppid) && !owned.has(p.pid)) { owned.add(p.pid); changed = true; }
  }
  const profiles = before.filter(p => owned.has(p.pid)).map(p => p.command.match(/--user-data-dir=([^ ]*browser-use-user-data-dir-[^ ]*)/)?.[1]).filter(Boolean);
  try { await run(cli, ["--session", session, "--json", "close"], { timeout: 15_000 }); } catch { /* own process fallback below */ }
  await pause(400);
  const remaining = processList().filter(p => owned.has(p.pid) && before.some(b => b.pid === p.pid && b.command === p.command));
  for (const p of remaining.reverse()) { try { process.kill(p.pid, "SIGKILL"); } catch { /* already closed */ } }
  for (const dir of new Set(profiles)) rmSync(dir, { recursive: true, force: true });
  const leaked = processList().some(p => p.command.includes("browser_use.skill_cli.daemon") && p.command.split(/\s+/).includes(session));
  if (leaked) throw new Error("cleanup_failed");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { cleanup().finally(() => process.exit(2)); });
function writeJson(name, data) {
  writeAtomic(name, `${JSON.stringify(data, null, 2)}\n`);
}
function writeAtomic(name, data) {
  mkdirSync(outputDir, { recursive: true });
  const destination = join(outputDir, name);
  const temp = `${destination}.${process.pid}.tmp`;
  writeFileSync(temp, data);
  renameSync(temp, destination);
}

let snapshot;
let joined;
try {
  const catalog = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", join(ROOT, ".claude/scripts/note/catalog/dump-circulation-json.ts")],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 8_000_000 }));
  console.log("[note-metrics] checking stats47 account");
  await browser("open", "https://note.com/settings/account");
  await until(() => evaluate('JSON.stringify({account:/note ID\\s*stats47\\b/.test(document.body.innerText),login:location.pathname.includes("login")})'),
    state => { if (state.login) throw new Error("login_required"); return state.account; }, "stats47 account");
  // URL parameters were observed after selecting this custom period in the live UI.
  const url = new URL("https://note.com/dashboard");
  url.search = new URLSearchParams({ period: "CUSTOM", date: period.start, to: period.end }).toString();
  await browser("open", url.href);
  const extract = () => evaluate(`JSON.stringify((${extractDashboardDom.toString()})())`);
  const initial = await until(extract, state => state.tableCount === 1 && state.rows.length > 0 && state.articleAggregatedAt, "dashboard ready");
  const paginated = await collectDashboardPages({ initial, read: extract, settle: () => pause(1000),
    loadMore: async previousCount => {
      await until(() => evaluate(`(()=>{const buttons=[...document.querySelectorAll('table[aria-label="記事一覧"]')][0].closest('section').querySelectorAll('button');const b=[...buttons].find(e=>e.textContent.trim()==='もっとみる');if(!b||b.disabled)return false;b.click();return true})()`), Boolean, "more ready");
      return until(extract, next => next.rows.length > previousCount, "pagination progress");
    }, onProgress: (pages, count) => console.log(`[note-metrics] page ${pages}: ${count} articles`) });
  const raw = { ...paginated, account: "stats47" };
  snapshot = buildDashboardSnapshot({ raw, catalog, period });
  snapshot.raw = raw;
  try {
    const cover = JSON.parse(readFileSync(resolve(options.coverAudit), "utf8"));
    joined = buildCoverMetricsReport(snapshot, cover);
  } catch (error) {
    joined = { schemaVersion: 1, generatedAt: new Date().toISOString(), period: snapshot.period,
      status: "incomplete", issues: [`cover_audit_unavailable:${error.message}`], articles: [] };
  }
} catch (error) {
  snapshot ??= { schemaVersion: 2, metricDefinition: "note-dashboard-2026-09-08", account: "stats47",
    fetchedAt: new Date().toISOString(), period, status: "incomplete", coverage: { complete: false }, articles: [], issues: [] };
  snapshot.status = "incomplete";
  snapshot.issues.push({ code: "collection_failed", message: error.message });
} finally {
  try { await cleanup(); } catch (error) {
    snapshot.status = "incomplete"; snapshot.issues.push({ code: "cleanup_failed", message: error.message });
  }
}
joined ??= { schemaVersion: 1, generatedAt: new Date().toISOString(), status: "incomplete", issues: ["metrics_unavailable"], articles: [] };
if (snapshot.status !== "pass") joined.status = "incomplete";
const stamp = snapshot.fetchedAt.replaceAll(/[:.]/g, "-");
writeJson(`${period.start}_${period.end}_${stamp}.json`, snapshot);
writeJson("latest.json", snapshot); // latest attempt, including failures; never silently show old success.
writeJson("cover-metrics-latest.json", joined);
writeAtomic("cover-metrics-latest.csv", coverMetricsCsv(joined));
console.log(JSON.stringify({ status: snapshot.status, period: snapshot.period, coverage: snapshot.coverage,
  totals: snapshot.totals, issues: snapshot.issues, coverJoin: joined.status, coverIssues: joined.issues, outputDir }, null, 2));
process.exitCode = snapshot.status === "pass" && joined.status === "pass" ? 0 : 2;
