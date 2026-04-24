/**
 * PSI 日次 digest 更新スクリプト
 *
 * 最新の psi-batch-*.json を読み、以下を更新する:
 *   - .claude/state/metrics/psi/history.csv    : append-only の日次履歴（URL × strategy × 日）
 *   - .claude/state/metrics/psi/LATEST.md      : 人間向け最新レポート（前日比矢印 + 閾値違反強調）
 *
 * CI では fetch-psi-audit.mjs → psi-threshold-check.mjs → psi-update-digest.mjs の順で呼ぶ。
 * psi-update-digest.mjs は threshold-check の結果を引数で受け取らず、自分で再計算する
 * （独立に動かせるため）。
 *
 * Usage:
 *   node .claude/scripts/psi/psi-update-digest.mjs
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/performance-improvement/budgets.json"
);
const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/psi");
const HISTORY_CSV = join(STATE_DIR, "history.csv");
const LATEST_MD = join(STATE_DIR, "LATEST.md");

const HISTORY_HEADER =
  "date,url,strategy,page_type,score_performance,lcp_ms,cls,tbt_ms,fcp_ms,ttfb_ms,violations_error,violations_warning";

function loadBudgets() {
  const raw = JSON.parse(readFileSync(BUDGETS_PATH, "utf-8"));
  return raw.budgets || [];
}

function inferPageType(url) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/ranking")) return "ranking";
  if (path.startsWith("/areas")) return "area";
  if (path.startsWith("/themes")) return "theme";
  if (path.startsWith("/blog")) return "blog";
  return "other";
}

function selectBudgetsFor(pageType, strategy, budgets) {
  const applicable = budgets.filter(
    (b) => (b.strategy === strategy || b.strategy === "both") &&
      (b.page_type === pageType || b.page_type === "all")
  );
  const byMetric = new Map();
  for (const b of applicable) {
    const existing = byMetric.get(b.metric_key);
    if (!existing || (b.page_type === pageType && existing.page_type !== pageType)) {
      byMetric.set(b.metric_key, b);
    }
  }
  return [...byMetric.values()];
}

function compareOperator(actual, threshold, op) {
  switch (op) {
    case ">=":
      return actual >= threshold;
    case ">":
      return actual > threshold;
    case "<=":
      return actual <= threshold;
    case "<":
      return actual < threshold;
    default:
      return true;
  }
}

function extractMetrics(result) {
  const s = result.scores || {};
  const lab = result.lab_data || {};
  return {
    score_performance: s.performance,
    lcp_ms: lab.LCP_ms,
    cls: lab.CLS,
    tbt_ms: lab.TBT_ms,
    fcp_ms: lab.FCP_ms,
    ttfb_ms: lab.TTFB_ms,
  };
}

function countViolations(result, budgets) {
  if (result.error) return { error: 1, warning: 0 };
  const pageType = inferPageType(result.url);
  const applicable = selectBudgetsFor(pageType, result.strategy, budgets);
  const s = result.scores || {};
  const lab = result.lab_data || {};
  const values = {
    score_performance: s.performance,
    lcp_ms: lab.LCP_ms,
    cls: lab.CLS,
    tbt_ms: lab.TBT_ms,
    fcp_ms: lab.FCP_ms,
    ttfb_ms: lab.TTFB_ms,
  };
  let err = 0, warn = 0;
  for (const b of applicable) {
    const actual = values[b.metric_key];
    if (actual == null) continue;
    if (!compareOperator(actual, b.threshold, b.operator)) {
      if (b.severity === "error") err++;
      else warn++;
    }
  }
  return { error: err, warning: warn };
}

function loadLatestBatch() {
  const files = readdirSync(STATE_DIR)
    .filter((f) => f.startsWith("psi-batch-") && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) throw new Error(`No psi-batch-*.json in ${STATE_DIR}`);
  const latest = files[0];
  const data = JSON.parse(readFileSync(join(STATE_DIR, latest), "utf-8"));
  return { file: latest, results: data.results || [], generated_at: data.generated_at };
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function appendHistory(batch, budgets) {
  const date = batch.generated_at.slice(0, 10);
  const rows = [];
  for (const r of batch.results) {
    const m = extractMetrics(r);
    const pageType = inferPageType(r.url);
    const v = countViolations(r, budgets);
    rows.push(
      [
        date,
        r.url,
        r.strategy,
        pageType,
        m.score_performance ?? "",
        m.lcp_ms != null ? Math.round(m.lcp_ms) : "",
        m.cls != null ? m.cls.toFixed(3) : "",
        m.tbt_ms != null ? Math.round(m.tbt_ms) : "",
        m.fcp_ms != null ? Math.round(m.fcp_ms) : "",
        m.ttfb_ms != null ? Math.round(m.ttfb_ms) : "",
        v.error,
        v.warning,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  if (!existsSync(HISTORY_CSV)) {
    writeFileSync(HISTORY_CSV, HISTORY_HEADER + "\n" + rows.join("\n") + "\n", "utf-8");
  } else {
    appendFileSync(HISTORY_CSV, rows.join("\n") + "\n", "utf-8");
  }
  return rows.length;
}

// history.csv を読み、同一 URL × strategy の直近前日値を引く
function loadHistoryMap() {
  if (!existsSync(HISTORY_CSV)) return new Map();
  const lines = readFileSync(HISTORY_CSV, "utf-8").trim().split("\n");
  if (lines.length < 2) return new Map();
  const header = lines[0].split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const byKey = new Map(); // key = url|strategy, value = [{date, metrics}]
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length !== header.length) continue;
    const key = `${cells[idx.url]}|${cells[idx.strategy]}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({
      date: cells[idx.date],
      score_performance: numOrNull(cells[idx.score_performance]),
      lcp_ms: numOrNull(cells[idx.lcp_ms]),
      cls: numOrNull(cells[idx.cls]),
      tbt_ms: numOrNull(cells[idx.tbt_ms]),
      ttfb_ms: numOrNull(cells[idx.ttfb_ms]),
    });
  }
  return byKey;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function numOrNull(s) {
  if (s == null || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function arrow(current, prev, betterLow) {
  if (current == null || prev == null) return "";
  const diff = current - prev;
  if (Math.abs(diff) < (betterLow ? 1 : 0.5)) return " ·";
  const improved = betterLow ? diff < 0 : diff > 0;
  return improved ? " ▲" : " ▼";
}

function fmtDelta(current, prev, fmt = (v) => String(v)) {
  if (current == null || prev == null) return "";
  const diff = current - prev;
  if (Math.abs(diff) < 0.1) return "";
  const sign = diff > 0 ? "+" : "";
  return ` (${sign}${fmt(Math.round(diff * 100) / 100)})`;
}

function buildLatestMd(batch, budgets) {
  const date = batch.generated_at.slice(0, 10);
  const history = loadHistoryMap();
  const today = date;

  // 今日以前の最新エントリを prev とする（同じ日があっても除外）
  const getPrev = (url, strategy) => {
    const rows = history.get(`${url}|${strategy}`) || [];
    const before = rows.filter((r) => r.date < today).sort((a, b) => (a.date < b.date ? 1 : -1));
    return before[0] || null;
  };

  let errTotal = 0, warnTotal = 0;
  for (const r of batch.results) {
    const v = countViolations(r, budgets);
    errTotal += v.error;
    warnTotal += v.warning;
  }

  const lines = [];
  lines.push(`# PSI Latest — ${date}`);
  lines.push("");
  lines.push(`生成時刻: ${batch.generated_at}`);
  lines.push("");
  lines.push(`**しきい値違反: error ${errTotal} / warning ${warnTotal}**`);
  lines.push("");
  lines.push("矢印の見方: ▲ 改善 / ▼ 悪化 / · 変化なし（前回計測との比較）");
  lines.push("");

  // Mobile / Desktop 別にテーブルを出す
  for (const strategy of ["mobile", "desktop"]) {
    const subset = batch.results.filter((r) => r.strategy === strategy);
    if (subset.length === 0) continue;
    lines.push(`## ${strategy === "mobile" ? "📱 Mobile" : "💻 Desktop"}`);
    lines.push("");
    lines.push("| URL | Perf | LCP | CLS | TBT | TTFB |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of subset) {
      const path = r.url.replace(/^https?:\/\/[^/]+/, "") || "/";
      if (r.error) {
        lines.push(`| ${path} | ERROR | | | | |`);
        continue;
      }
      const m = extractMetrics(r);
      const prev = getPrev(r.url, strategy);
      const v = countViolations(r, budgets);
      const marker = v.error > 0 ? " 🚨" : v.warning > 0 ? " ⚠️" : "";
      lines.push(
        `| ${path}${marker} | ${m.score_performance ?? "-"}${arrow(m.score_performance, prev?.score_performance, false)}${fmtDelta(m.score_performance, prev?.score_performance)} | ${m.lcp_ms != null ? Math.round(m.lcp_ms) + "ms" : "-"}${arrow(m.lcp_ms, prev?.lcp_ms, true)} | ${m.cls != null ? m.cls.toFixed(3) : "-"}${arrow(m.cls, prev?.cls, true)} | ${m.tbt_ms != null ? Math.round(m.tbt_ms) + "ms" : "-"}${arrow(m.tbt_ms, prev?.tbt_ms, true)} | ${m.ttfb_ms != null ? Math.round(m.ttfb_ms) + "ms" : "-"}${arrow(m.ttfb_ms, prev?.ttfb_ms, true)} |`
      );
    }
    lines.push("");
  }

  lines.push("## 全履歴");
  lines.push("");
  lines.push("長期トレンドは [`history.csv`](./history.csv) を参照（GitHub が自動でテーブル表示）。");
  lines.push("");

  return lines.join("\n");
}

function main() {
  const budgets = loadBudgets();
  const batch = loadLatestBatch();
  const rowsAdded = appendHistory(batch, budgets);
  console.log(`history.csv に ${rowsAdded} 行追加`);
  const md = buildLatestMd(batch, budgets);
  writeFileSync(LATEST_MD, md, "utf-8");
  console.log(`LATEST.md 更新: ${LATEST_MD}`);
}

main();
