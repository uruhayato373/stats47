/**
 * NSM 実験 state I/O
 *
 * `.claude/state/experiments.json` を single source of truth として実験ライフサイクルを管理する。
 * `/nsm-experiment` スキルから呼ばれる。
 *
 * CLI 使用:
 *   node .claude/scripts/lib/experiments-state.mjs list
 *   node .claude/scripts/lib/experiments-state.mjs list --status running
 *   node .claude/scripts/lib/experiments-state.mjs get EXP-001
 *   node .claude/scripts/lib/experiments-state.mjs pending
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const STATE_PATH = ".claude/state/experiments.json";

// ── I/O ──────────────────────────────────────────────────────────

export function readState() {
  if (!existsSync(STATE_PATH)) {
    return { version: 1, updated_at: null, experiments: [] };
  }
  return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
}

export function writeState(state) {
  const next = { ...state, updated_at: new Date().toISOString() };
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2) + "\n", "utf-8");
  return next;
}

// ── queries ──────────────────────────────────────────────────────

export function listByStatus(status) {
  return readState().experiments.filter((e) => e.status === status);
}

export function listActive() {
  const s = readState();
  return s.experiments.filter(
    (e) => e.status === "running" || e.status === "measuring",
  );
}

export function getExperiment(id) {
  const s = readState();
  return s.experiments.find((e) => e.id === id) || null;
}

// ── mutations ────────────────────────────────────────────────────

function nextId(state) {
  const ids = state.experiments
    .map((e) => e.id)
    .filter((id) => /^EXP-\d+$/.test(id))
    .map((id) => parseInt(id.slice(4), 10));
  const max = ids.length ? Math.max(...ids) : 0;
  return `EXP-${String(max + 1).padStart(3, "0")}`;
}

export function addExperiment(partial) {
  const state = readState();
  const now = new Date().toISOString();
  const id = partial.id || nextId(state);
  if (state.experiments.some((e) => e.id === id)) {
    throw new Error(`Experiment ${id} は既に存在します`);
  }
  const exp = {
    id,
    title: partial.title || "(untitled)",
    hypothesis: partial.hypothesis || "",
    target_metric: partial.target_metric || "",
    target_delta: partial.target_delta || "",
    rubric: partial.rubric || null,
    baseline: partial.baseline || null,
    status: "proposed",
    created_at: now,
    started_at: null,
    result: null,
    learnings: null,
    closed_at: null,
    actions: partial.actions || [],
    pending_user_actions: partial.pending_user_actions || [],
    next_check_date: partial.next_check_date || null,
    history: [{ date: now, action: "proposed" }],
  };
  state.experiments.push(exp);
  writeState(state);
  return exp;
}

export function updateExperiment(id, patch) {
  const state = readState();
  const idx = state.experiments.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error(`Experiment ${id} が見つかりません`);
  state.experiments[idx] = { ...state.experiments[idx], ...patch };
  writeState(state);
  return state.experiments[idx];
}

const ALLOWED = {
  proposed: ["running", "abandoned"],
  running: ["measuring", "running", "abandoned"],
  measuring: ["running", "done", "abandoned"],
  done: [],
  abandoned: [],
};

export function transitionStatus(id, newStatus, meta = {}) {
  const state = readState();
  const idx = state.experiments.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error(`Experiment ${id} が見つかりません`);
  const exp = state.experiments[idx];
  const allowed = ALLOWED[exp.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `status 遷移不正: ${exp.status} → ${newStatus}（許可: ${allowed.join(", ") || "なし"}）`,
    );
  }
  const now = new Date().toISOString();
  const entry = { date: now, action: newStatus, ...meta };
  exp.status = newStatus;
  if (newStatus === "running" && !exp.started_at) exp.started_at = now;
  if (newStatus === "done" && !exp.closed_at) exp.closed_at = now;
  exp.history = [...(exp.history || []), entry];
  state.experiments[idx] = exp;
  writeState(state);
  return exp;
}

// ── CLI ──────────────────────────────────────────────────────────

function fmtExpShort(e) {
  const pending = (e.pending_user_actions || []).length;
  const pendingStr = pending > 0 ? ` (pending ${pending})` : "";
  return `${e.id}  [${e.status}]  ${e.title}${pendingStr}`;
}

async function cli() {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === "help") {
    console.log(
      "usage: experiments-state.mjs {list [--status S] | get ID | pending | active}",
    );
    return;
  }
  if (cmd === "list") {
    let state = readState();
    let exps = state.experiments;
    const statusIdx = rest.indexOf("--status");
    if (statusIdx >= 0 && rest[statusIdx + 1]) {
      const s = rest[statusIdx + 1];
      exps = exps.filter((e) => e.status === s);
    }
    if (exps.length === 0) console.log("(実験はまだありません)");
    else exps.forEach((e) => console.log(fmtExpShort(e)));
    return;
  }
  if (cmd === "active") {
    const exps = listActive();
    if (exps.length === 0) console.log("(active 実験なし)");
    else exps.forEach((e) => console.log(fmtExpShort(e)));
    return;
  }
  if (cmd === "pending") {
    const exps = listActive().filter(
      (e) => (e.pending_user_actions || []).length > 0,
    );
    if (exps.length === 0) console.log("(継続作業が必要な実験なし)");
    else {
      exps.forEach((e) => {
        console.log(fmtExpShort(e));
        for (const a of e.pending_user_actions) console.log("  - " + a);
      });
    }
    return;
  }
  if (cmd === "get") {
    const id = rest[0];
    if (!id) throw new Error("ID が必要です");
    const e = getExperiment(id);
    if (!e) {
      console.error(`${id} が見つかりません`);
      process.exit(1);
    }
    console.log(JSON.stringify(e, null, 2));
    return;
  }
  throw new Error(`不明なコマンド: ${cmd}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cli().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
}
