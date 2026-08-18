import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  cached,
  fileExists,
  frontmatterValue,
  readCsv,
  readJson,
  readText,
  statePath,
  TTL,
  wrap,
  type Wrapped,
} from "./state-io";

/**
 * CI の健全性と、能力の台帳 (agents / skills / memory)。
 *
 * ★台帳は frontmatter だけ読む。agents 61 / skills 157 / memory 109 の本文まで読むと
 *   毎リクエスト数 MB を舐めることになる。ここで要るのは「何がいるか」の一覧で、
 *   中身の検査は `check-agent-skill-consistency.cjs` が別に持っている。
 */

export interface WorkflowHealth {
  workflow: string;
  unhealthy: boolean;
  failureStreak: number;
  lastSuccessAt: string | null;
  daysSinceSuccess: number | null;
  everSucceeded: boolean;
}

export interface LedgerEntry {
  name: string;
  description: string;
  /** agents のみ。skills は frontmatter に model を持たない */
  model?: string | null;
  /** skills のみ */
  primaryAgent?: string | null;
  /** memory のみ */
  type?: string | null;
  relPath: string;
}

export interface ClaudeUsageRow {
  date: string;
  workflow: string;
  limit: number | string;
  items: number | string;
  cost_usd: number | string;
  duration_ms: number | string;
  is_error: number | string;
  [k: string]: string | number;
}

export interface OpsSummary {
  ci: Wrapped<{
    generatedAt: string | null;
    checked: number;
    unhealthyCount: number;
    workflows: WorkflowHealth[];
  }>;
  r2Freshness: Wrapped<Array<{ key: string; status: string; ageDays: number | null; maxAgeDays: number | null }>>;
  usage: Wrapped<{ columns: string[]; rows: ClaudeUsageRow[] }>;
  agents: Wrapped<LedgerEntry[]>;
  skills: Wrapped<LedgerEntry[]>;
  memories: Wrapped<LedgerEntry[]>;
}

function readCi(): OpsSummary["ci"] {
  return wrap(() => {
    const d = readJson<Record<string, any>>(".claude/state/ci/workflow-health.json");
    const workflows: WorkflowHealth[] = (d.results ?? []).map((r: any) => ({
      workflow: r.workflow,
      unhealthy: Boolean(r.unhealthy),
      failureStreak: r.failureStreak ?? 0,
      lastSuccessAt: r.lastSuccessAt ?? null,
      daysSinceSuccess: r.daysSinceSuccess ?? null,
      everSucceeded: r.everSucceeded !== false,
    }));
    // 不健全を先頭に、連続失敗の多い順
    workflows.sort((a, b) =>
      a.unhealthy === b.unhealthy
        ? b.failureStreak - a.failureStreak
        : Number(b.unhealthy) - Number(a.unhealthy),
    );
    return {
      generatedAt: d.generatedAt ?? null,
      checked: d.checked ?? workflows.length,
      unhealthyCount: workflows.filter((w) => w.unhealthy).length,
      workflows,
    };
  });
}

function readR2Freshness(): OpsSummary["r2Freshness"] {
  return wrap(() => {
    const d = readJson<Record<string, any>>(".claude/state/ci/r2-freshness.json");
    return (d.results ?? []).map((r: any) => ({
      key: r.key,
      status: r.status ?? (r.error ? "error" : "unknown"),
      ageDays: r.ageDays ?? null,
      maxAgeDays: r.maxAgeDays ?? null,
    }));
  });
}

function readUsage(): OpsSummary["usage"] {
  return wrap(() => {
    const rel = ".claude/state/metrics/claude-usage/history.csv";
    if (!fileExists(rel)) throw new Error("history.csv が無い");
    const rows = readCsv(rel) as unknown as ClaudeUsageRow[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows: [...rows].reverse() }; // 新しい順
  });
}

/** frontmatter だけを読む (本文は読まない) */
function frontmatterOf(abs: string) {
  const head = readTextHead(abs, 4096);
  return {
    name: frontmatterValue(head, "name"),
    description: frontmatterValue(head, "description"),
    model: frontmatterValue(head, "model"),
    primaryAgent: frontmatterValue(head, "primary_agent"),
    type: frontmatterValue(head, "type"),
  };
}

/** 先頭 N バイトだけ読む (台帳は 300 ファイル超あるので全文は読まない) */
function readTextHead(abs: string, bytes: number): string {
  const fd = fs.openSync(abs, "r");
  try {
    const buf = Buffer.alloc(bytes);
    const read = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, read).toString("utf8");
  } finally {
    fs.closeSync(fd);
  }
}

function listMarkdown(dirRel: string, opts: { recursive?: boolean; fileName?: string } = {}) {
  const abs = statePath(dirRel);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (opts.recursive) walk(p);
        continue;
      }
      if (opts.fileName ? e.name === opts.fileName : e.name.endsWith(".md")) out.push(p);
    }
  };
  walk(abs);
  return out.sort();
}

function toEntries(files: string[], pick: (fm: ReturnType<typeof frontmatterOf>) => Partial<LedgerEntry>) {
  const root = statePath(".");
  return files
    .map((abs) => {
      const fm = frontmatterOf(abs);
      const relPath = path.relative(root, abs).split(path.sep).join("/");
      return {
        name: fm.name ?? path.basename(abs, ".md"),
        description: (fm.description ?? "").slice(0, 200),
        relPath,
        ...pick(fm),
      } as LedgerEntry;
    })
    .filter((e) => e.name !== "index");
}

export function opsSummary(): OpsSummary {
  return cached("ops", TTL.daily, () => ({
    ci: readCi(),
    r2Freshness: readR2Freshness(),
    usage: readUsage(),
    agents: wrap(() =>
      toEntries(listMarkdown(".claude/agents"), (fm) => ({ model: fm.model })).filter(
        (e) => e.name !== "README",
      ),
    ),
    skills: wrap(() =>
      toEntries(listMarkdown(".claude/skills", { recursive: true, fileName: "SKILL.md" }), (fm) => ({
        primaryAgent: fm.primaryAgent,
      })),
    ),
    memories: wrap(() =>
      toEntries(listMarkdown(".claude/memory"), (fm) => ({ type: fm.type })).filter(
        (e) => e.name !== "MEMORY",
      ),
    ),
  }));
}
