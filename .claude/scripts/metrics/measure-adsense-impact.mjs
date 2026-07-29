#!/usr/bin/env node
/**
 * measure-adsense-impact.mjs — AdSense 施策の before/after を自動 surface する
 *
 * ブログの measure-gsc-impact.mjs の AdSense 版。deploy 日を持つ AdSense 施策ごとに、
 * `history.csv`（アカウント合算）+ `history-devices.csv`（デバイス別）を入力に before→after
 * の差分を機械計算し、標準出力に表として出す。
 *
 * ★このツールは「surface（可視化）」であって「judgment（判定）」ではない:
 *   - effect/* ラベルの付与・status 更新は improvement-triage の排他責務（本ツールは書き込まない）
 *   - 同一計測窓に複数の AdSense 施策が乗っていれば ⚠ 交絡として明示し、単独帰属を主張しない
 *   - 十分な post-deploy 週が無ければ「まだ計測不能」と正直に出す（偽の before/after を作らない）
 *   （方針: .claude/rules/evidence-based-judgment.md）
 *
 * 使い方:
 *   node .claude/scripts/metrics/measure-adsense-impact.mjs
 *     → docs/todo/04_改善バックログ.md の metric=adsense 施策のうち deploy 日を持つものを自動計測
 *   node .claude/scripts/metrics/measure-adsense-impact.mjs --all
 *     → 判定済み（effect/none 等）も含めて再計測
 *   node .claude/scripts/metrics/measure-adsense-impact.mjs --deployed 2026-07-03 --label ANCHOR-01
 *     → 単発計測（backlog に無い日付を手動指定）
 *   --min-weeks N  … after が deploy 週から N 週以上経過していなければ「計測不能」（既定 1）
 *
 * 入力:
 *   - docs/todo/04_改善バックログ.md              （施策 → deploy 日）
 *   - .claude/state/metrics/adsense/history.csv         （週次アカウント）
 *   - .claude/state/metrics/adsense/history-devices.csv （週次デバイス別）
 * 出力: 標準出力のみ（改善ログ/バックログには書かない = triage の境界を侵さない）
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..", "..");
const BACKLOG = join(PROJECT_ROOT, "docs/todo/04_改善バックログ.md");
const HISTORY = join(PROJECT_ROOT, ".claude/state/metrics/adsense/history.csv");
const DEVICE_HISTORY = join(PROJECT_ROOT, ".claude/state/metrics/adsense/history-devices.csv");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);
const includeAll = hasFlag("--all");
const manualDeployed = getArg("--deployed");
const manualLabel = getArg("--label", "manual");
const minWeeks = parseInt(getArg("--min-weeks", "1"), 10);
const outPath = getArg("--out"); // 指定時はレポートをファイルにも書く（cron の commit 用）

// ── CSV ──
function readCsv(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return null;
  const lines = raw.split("\n");
  const header = lines[0].split(",");
  const rows = lines.slice(1).map((l) => {
    const cells = l.split(",");
    const o = {};
    header.forEach((h, i) => (o[h] = cells[i]));
    return o;
  });
  return { header, rows };
}
function num(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── ISO 週 ──
function isoWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // その週の木曜
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
const weekIdx = (w) => {
  const [y, wk] = w.split("-W").map(Number);
  return y * 100 + wk;
};

// ── 履歴ロード ──
const acct = readCsv(HISTORY);
if (!acct) {
  console.error(`[error] ${HISTORY} が無い。先に metrics:digest を実行`);
  process.exit(1);
}
const dev = readCsv(DEVICE_HISTORY);
const acctByWeek = new Map(acct.rows.map((r) => [r.week, r]));
const acctWeeks = acct.rows.map((r) => r.week).sort((a, b) => weekIdx(a) - weekIdx(b));
// week -> platform -> row
const devIndex = new Map();
if (dev) {
  for (const r of dev.rows) {
    if (!devIndex.has(r.week)) devIndex.set(r.week, new Map());
    devIndex.get(r.week).set(r.platform, r);
  }
}
const platformOf = (week, kind) => {
  const m = devIndex.get(week);
  if (!m) return null;
  for (const [name, row] of m) {
    if (kind === "desktop" && /desktop/i.test(name)) return row;
    if (kind === "mobile" && /mobile/i.test(name)) return row;
  }
  return null;
};

// ── backlog パース（metric=adsense + deploy 日） ──
function extractDeploy(desc) {
  // 「slotId 記入待ち」「空文字の間は非描画」「未デプロイ」= 実質未稼働 → 計測対象外
  if (/未デプロイ|空文字の間は非描画|slotId を記入/.test(desc)) return null;
  // deployed / デプロイ済 / 実装済 のいずれか + 日付
  const m = desc.match(/(?:deployed|デプロイ済?|実装済)\s*[（(:：]?\s*(20\d\d-\d\d-\d\d)/i);
  return m ? m[1] : null;
}
function parseBacklog() {
  if (!existsSync(BACKLOG)) return { candidates: [], unparseable: [] };
  const content = readFileSync(BACKLOG, "utf-8");
  const candidates = [];
  const unparseable = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*ID\s*\|/.test(line) || /^\|[-| ]+\|$/.test(line)) continue;
    const cols = line.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cols.length < 6) continue;
    const [id, title, status, , , metric] = cols;
    if (!id || id === "ID" || metric !== "adsense") continue;
    // done / 判定済み (effect/* で pending 以外) は既定で対象外（infra 完了・判定済みを毎週出さない）
    if (!includeAll && (status === "done" || (status.startsWith("effect/") && status !== "effect/pending"))) continue;
    const deployDate = extractDeploy(title);
    if (!deployDate) {
      unparseable.push({ id, status, reason: /未デプロイ|slotId|空文字/.test(title) ? "未稼働（人間タスク/未デプロイ）" : "deploy 日を抽出できず" });
      continue;
    }
    candidates.push({ id, status, deployDate, deployWeek: isoWeek(deployDate) });
  }
  return { candidates, unparseable };
}

// ── before/after 解決 ──
function resolveWindows(deployWeek) {
  const dIdx = weekIdx(deployWeek);
  const before = acctWeeks.filter((w) => weekIdx(w) < dIdx).pop() || null;
  const afters = acctWeeks.filter((w) => weekIdx(w) > dIdx);
  const after = afters.length ? afters[afters.length - 1] : null;
  const elapsed = after ? weekIdx(after) - dIdx : 0;
  return { before, after, elapsed };
}

// ── 整形ヘルパー ──
const pctStr = (cur, prv) => {
  const c = num(cur), p = num(prv);
  if (p === 0) return "";
  const d = ((c - p) / p) * 100;
  return ` (${d >= 0 ? "+" : ""}${d.toFixed(0)}%)`;
};
const ppStr = (cur, prv) => {
  const d = (num(cur) - num(prv)) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}pp`;
};

function acctLine(bw, aw) {
  const b = acctByWeek.get(bw), a = acctByWeek.get(aw);
  const impPv = (r) => (num(r.page_views) > 0 ? (num(r.impressions) / num(r.page_views)).toFixed(2) : "—");
  return [
    `  account : RPM ¥${num(b.rpm).toFixed(0)}→¥${num(a.rpm).toFixed(0)}${pctStr(a.rpm, b.rpm)}` +
      ` | viewability ${(num(b.viewability) * 100).toFixed(1)}%→${(num(a.viewability) * 100).toFixed(1)}% (${ppStr(a.viewability, b.viewability)})` +
      ` | earnings ¥${num(b.earnings).toFixed(0)}→¥${num(a.earnings).toFixed(0)}${pctStr(a.earnings, b.earnings)}` +
      ` | imp/PV ${impPv(b)}→${impPv(a)}`,
  ].join("\n");
}
function deviceLine(kind, bw, aw) {
  const b = platformOf(bw, kind), a = platformOf(aw, kind);
  if (!b || !a) return `  ${kind.padEnd(7)}: (デバイス履歴なし)`;
  const label = kind === "desktop" ? "Desktop" : "Mobile ";
  return (
    `  ${label}: RPM ¥${num(b.rpm).toFixed(0)}→¥${num(a.rpm).toFixed(0)}${pctStr(a.rpm, b.rpm)}` +
    ` | viewability ${(num(b.viewability) * 100).toFixed(1)}%→${(num(a.viewability) * 100).toFixed(1)}% (${ppStr(a.viewability, b.viewability)})` +
    // schema v2: 旧 cpc (earnings/clicks) は公式 CPC ではないため後方互換の legacy 列を参照する。
    // v2 移行前の行は旧 cpc 列に値が残る可能性があるため fallback する。
    ` | 収益/click(legacy) ¥${num(b.earnings_per_click_legacy ?? b.cpc).toFixed(2)}→¥${num(a.earnings_per_click_legacy ?? a.cpc).toFixed(2)}` +
    (a.cost_per_click ? ` | 公式CPC ¥${num(a.cost_per_click).toFixed(2)}` : "")
  );
}

// ── メイン ──
function main() {
  const out = [];
  const p = (s = "") => out.push(s);

  let items;
  let unparseable = [];
  if (manualDeployed) {
    items = [{ id: manualLabel, status: "(manual)", deployDate: manualDeployed, deployWeek: isoWeek(manualDeployed) }];
  } else {
    const parsed = parseBacklog();
    items = parsed.candidates;
    unparseable = parsed.unparseable;
  }

  p(`# AdSense 施策 before/after（surface のみ・判定は improvement-triage）`);
  p(`# 最新スナップショット週: ${acctWeeks[acctWeeks.length - 1] ?? "(なし)"} / min-weeks=${minWeeks}`);
  p("");

  if (items.length === 0) {
    p("計測対象の deploy 済み adsense 施策なし。");
  }

  for (const it of items) {
    // 同一計測窓の交絡（deploy 週が ±1 週の他 adsense 施策 = 同時投入）
    const coDeployed = items
      .filter((o) => o.id !== it.id && Math.abs(weekIdx(o.deployWeek) - weekIdx(it.deployWeek)) <= 1)
      .map((o) => o.id);
    const confTag = coDeployed.length ? `  ⚠ 交絡: ${coDeployed.join(", ")} と同時投入（単独帰属不可）` : "";
    p(`## ${it.id} — deployed ${it.deployDate} (${it.deployWeek})  [status: ${it.status}]${confTag}`);

    const { before, after, elapsed } = resolveWindows(it.deployWeek);
    if (!before) {
      p("  → before 週が履歴に無い（deploy 週以前のデータ不足）。計測不能。");
      p("");
      continue;
    }
    if (!after || elapsed < minWeeks) {
      const need = weekIdx(it.deployWeek) + minWeeks;
      p(
        `  → まだ計測不能: post-deploy 週が不足（before=${before} はあるが after が ${elapsed}週 < min ${minWeeks}週）。` +
          ` W${String(need % 100).padStart(2, "0")}+ の snapshot 到着後に再実行。`
      );
      p("");
      continue;
    }
    // 計測窓（deploy 週〜after 週）の途中で投入された後発施策 = after を汚染する
    const laterContaminators = items
      .filter((o) => o.id !== it.id && weekIdx(o.deployWeek) > weekIdx(it.deployWeek) && weekIdx(o.deployWeek) <= weekIdx(after))
      .map((o) => `${o.id}@${o.deployWeek}`);
    const contaminated = coDeployed.length > 0 || laterContaminators.length > 0;

    p(`  window: before=${before} → after=${after}（${elapsed}週経過）`);
    if (laterContaminators.length) {
      p(`  ⚠ after 窓を後発施策が汚染: ${laterContaminators.join(", ")}（この差分は本施策単独の効果ではない）`);
    }
    p(acctLine(before, after));
    p(deviceLine("desktop", before, after));
    p(deviceLine("mobile", before, after));
    // シグナルの向き（判定でなく注意喚起）
    const b = acctByWeek.get(before), a = acctByWeek.get(after);
    const earnDelta = num(a.earnings) - num(b.earnings);
    const impDelta = num(a.impressions) - num(b.impressions);
    let signal = "";
    if (earnDelta < 0 && impDelta > 0) signal = "収益↓ なのに imp↑ = dilution の兆候（NEGATIVE 方向・要 triage 確認）";
    else if (earnDelta > 0) signal = "収益↑（POSITIVE 方向・要 triage 確認）";
    else signal = "収益ほぼ横ばい";
    p(`  signal : ${signal}${contaminated ? "  ※交絡/汚染ありのため単独判定不可（triage 参照）" : ""}`);
    p("");
  }

  if (unparseable.length) {
    p("---");
    p("## 自動計測から除外（no silent drop）");
    for (const u of unparseable) p(`- ${u.id} [${u.status}]: ${u.reason}`);
  }

  const text = out.join("\n") + "\n";
  process.stdout.write(text);
  if (outPath) {
    writeFileSync(outPath, text, "utf-8");
    process.stderr.write(`\n[measure-adsense-impact] wrote ${outPath}\n`);
  }
}

main();
