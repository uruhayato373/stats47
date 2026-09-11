/** Current catalog + public R2 -> repeatable, read-only theme quality observations. */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { THEME_CATALOGS, collectChartDependencies } from "../../../packages/data-configs/src/theme-catalog/index";
import { getMetricConfig } from "../../../packages/data-configs/src/registry";
import { buildRecipe } from "../../../packages/data-configs/src/recipe";
import { inspectThemePayload, compareThemeObservation, selectLastGoodObservations, inspectThemeStructure, inspectChartYears, summarizeThemeFindings } from "./theme-quality-core.mjs";
import { readThemeQualityState, writeThemeQualityState } from "./theme-quality-state.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DEFAULT_OUTPUT = path.join(ROOT, ".claude/state/themes/quality.json");
const argv = process.argv.slice(2);
const { values: cli } = parseArgs({ args: argv, options: {
  json: { type: "string" }, previous: { type: "string" },
  "staged-dir": { type: "string" }, offline: { type: "boolean" },
} });
function option(name: string, fallback: string): string {
  const value = cli[name.slice(2) as keyof typeof cli];
  return typeof value === "string" ? value : fallback;
}
type Finding = { code: string; severity: string; detail?: string; themeKey?: string; componentKey?: string; metricKey?: string; namespace?: string; [key: string]: unknown };
type Observation = ReturnType<typeof inspectThemePayload> & { namespace: string; key: string; url?: string; observedAt?: string; sha256?: string; httpStatus?: number; error?: string };
type Previous = { observations?: Observation[]; lastGoodObservations?: Observation[]; findings?: Finding[]; summary?: Record<string, unknown> };

async function fetchObservation(key: string, namespace: string): Promise<Observation> {
  const base = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
  const url = `${base.replace(/\/+$/, "")}/app/${namespace}/${key}/values.json`;
  const observedAt = new Date().toISOString();
  const stagedDir = option("--staged-dir", "");
  if (stagedDir) {
    const filename = path.join(stagedDir, "app", namespace, key, "values.json");
    if (fs.existsSync(filename)) {
      const raw = fs.readFileSync(filename, "utf8");
      return { key, namespace, url: `staged:${path.relative(stagedDir, filename)}`, observedAt, sha256: createHash("sha256").update(raw).digest("hex"), ...inspectThemePayload(JSON.parse(raw), namespace) };
    }
  }
  let error = "unknown";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) {
        error = `HTTP ${response.status}`;
        if (response.status < 500 && response.status !== 429) break;
      } else {
        const raw = await response.text();
        return { key, namespace, url, observedAt, httpStatus: response.status, sha256: createHash("sha256").update(raw).digest("hex"), ...inspectThemePayload(JSON.parse(raw), namespace) };
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "fetch/parse error";
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  return { key, namespace, url, observedAt, status: "error", error, rowCount: 0, years: [], latestYear: null, latestCoverage: 0, latestMissingCodes: [], units: [], duplicateAreaYears: 0, coverageByYear: {} };
}

async function main() {
  const output = path.resolve(option("--json", DEFAULT_OUTPUT));
  const offline = argv.includes("--offline");
  const preview = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp").hostname);
  const staged = argv.includes("--staged-dir") || preview;
  if ((offline || staged) && (!argv.includes("--json") || output === DEFAULT_OUTPUT)) {
    throw new Error("Offline/staged audits require a separate --json output; the live baseline must be preserved");
  }
  const previousPath = option("--previous", output);
  const previous: Previous = fs.existsSync(previousPath) ? readThemeQualityState(previousPath) : {};
  const catalogs = Object.values(THEME_CATALOGS);
  const findings: Finding[] = [];
  const requests = new Map<string, { key: string; namespace: string }>();
  for (const catalog of catalogs) {
    findings.push(...inspectThemeStructure(catalog).map((f) => ({ ...f, themeKey: catalog.key })));
    for (const metric of catalog.metrics) {
      requests.set(`ranking/${metric.rankingKey}`, { key: metric.rankingKey, namespace: "ranking" });
      const config = getMetricConfig(metric.rankingKey);
      if (!config || config.isActive === false) findings.push({ themeKey: catalog.key, metricKey: metric.rankingKey, severity: "error", code: "unavailable-metric", detail: config ? "inactive" : "unregistered" });
      if (config && !config.entities.includes("prefecture")) findings.push({ themeKey: catalog.key, metricKey: metric.rankingKey, severity: "error", code: "non-prefecture-metric", detail: config.entities.join(",") });
      if (metric.role !== "context" && !metric.selection) findings.push({ themeKey: catalog.key, metricKey: metric.rankingKey, severity: "warn", code: "missing-selection", detail: "主表示の選定根拠がない" });
      if (metric.rankingKey === "employment-rate" && /就業率/.test(metric.shortLabel)) findings.push({ themeKey: catalog.key, metricKey: metric.rankingKey, severity: "error", code: "incorrect-definition-label", detail: "就職率を就業率と表示" });
      if (config && /所定内給与/.test(config.subtitle ?? "") && /年収/.test(metric.shortLabel)) findings.push({ themeKey: catalog.key, metricKey: metric.rankingKey, severity: "error", code: "incorrect-period-label", detail: "所定内給与月額を年収と表示" });
    }
    for (const chart of catalog.charts) {
      for (const ref of collectChartDependencies(chart).metricRefs) requests.set(`stats/${ref.metricKey}`, { key: ref.metricKey, namespace: "stats" });
    }
    for (const group of catalog.metricGroups ?? []) {
      for (const key of group.rankingKeys) requests.set(`stats/${key}`, { key, namespace: "stats" });
    }
  }
  const observations: Observation[] = [];
  if (!offline) {
    const pending = [...requests.values()];
    let cursor = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (cursor < pending.length) {
        const request = pending[cursor++];
        observations.push(await fetchObservation(request.key, request.namespace));
      }
    }));
    const before = new Map(selectLastGoodObservations(previous).map((o) => [`${o.namespace}/${o.key}`, o]));
    for (const observation of observations) {
      const context = { metricKey: observation.key, namespace: observation.namespace };
      if (observation.status !== "ok") {
        findings.push({ ...context, severity: "error", code: "payload-unavailable", detail: observation.error ?? observation.status });
        continue;
      }
      if (observation.duplicateAreaYears) findings.push({ ...context, severity: "error", code: "duplicate-area-year", detail: String(observation.duplicateAreaYears) });
      if (observation.latestCoverage < 47) findings.push({ ...context, severity: "warn", code: "partial-coverage", detail: `${observation.latestCoverage}/47。対象外・秘匿・欠測を一次資料で区別` });
      const config = getMetricConfig(observation.key);
      if (config && observation.units.some((unit) => unit !== config.unit.normalize("NFKC").trim())) findings.push({ ...context, severity: "warn", code: "unit-metadata-drift", detail: `${config.unit} / ${observation.units.join(",")}` });
      findings.push(...compareThemeObservation(before.get(`${observation.namespace}/${observation.key}`), observation).map((f) => ({ ...f, ...context })));
    }
    const stats = new Map(observations.filter((o) => o.namespace === "stats").map((o) => [o.key, o]));
    for (const catalog of catalogs) {
      for (const chart of catalog.charts) {
        const deps = collectChartDependencies(chart);
        const result = inspectChartYears(chart, deps.metricRefs, stats);
        findings.push(...result.map((f) => ({ ...f, themeKey: catalog.key, componentKey: chart.componentKey, runtime: catalog.key === "local-finance" ? "catalog-only" : "shared-dashboard" })));
      }
    }
  }
  findings.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const summary = { themes: catalogs.length, metricReferences: catalogs.reduce((n, t) => n + t.metrics.length, 0), expectedRequests: requests.size, observedRequests: observations.length, mode: offline ? "structure-only" : staged ? "structure-and-staged-data" : "structure-and-public-data", ...summarizeThemeFindings(findings, previous.findings ?? []) };
  const result = {
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    summary,
    themes: catalogs.map((t) => ({ key: t.key, runtime: t.key === "local-finance" ? "dedicated-finance-ui" : "shared-dashboard", metricKeys: t.metrics.map((m) => m.rankingKey), chapters: (t.sections ?? []).map((s) => s.key) })),
    definitions: [...new Set([...requests.values()].map((r) => r.key))].map((key) => {
      const config = getMetricConfig(key);
      return { key, title: config?.title, source: config?.source, recipeHash: config ? buildRecipe(config).configHash : null };
    }),
    observations: observations.sort((a, b) => `${a.namespace}/${a.key}`.localeCompare(`${b.namespace}/${b.key}`)),
    // Keep the last valid baseline after failures, so repeated regressions cannot look recovered.
    lastGoodObservations: selectLastGoodObservations(previous, observations, findings),
    findings,
    limitations: ["全国専用系列・GIS専用payloadと実画面の全操作は別の表示監査で確認する", "公式統計に未取得の新年があるかは月次の一次資料確認で判定する", "地方財政のCatalog定義は専用UIの表示成否を意味しない", "coverage不足や単年そのものは不具合と断定しない", "GSC/GA4の効果・統廃合はこの品質検査だけでは判断しない"],
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (output === DEFAULT_OUTPUT) writeThemeQualityState(output, result);
  else fs.writeFileSync(output, `${JSON.stringify(result)}\n`);
  console.log(`Theme quality: ${summary.themes} themes, ${summary.observedRequests}/${summary.expectedRequests} payloads, errors ${summary.errors}, warnings ${summary.warnings}, new ${summary.added.length}, resolved ${summary.resolved.length}`);
  console.log(`Result: ${path.relative(ROOT, output)}`);
  for (const finding of summary.added.filter((f) => f.severity === "error").slice(0, 20)) console.log(`${finding.themeKey ?? finding.metricKey}: ${finding.code} ${finding.detail ?? ""}`);
  if (summary.errors) process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "theme audit failed"); process.exitCode = 1; });
