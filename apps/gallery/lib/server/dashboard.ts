import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * プロジェクト現況ダッシュボードの collector 集 (読み取り専用)。
 * .claude/scripts/gallery/dashboard-data.mjs を TypeScript に忠実移植する。
 * 各 collector は失敗時に { error } を返し、他セクションの描画を巻き込まない。
 * 60 秒 TTL キャッシュ (globalThis で HMR 二重化を防ぐ)。
 */

const TITLE_TRUNC = 200;

type Wrapped<T> = T | { error: string };

// ─── 汎用パーサ ──────────────────────────────────────
function readJson(fp: string): unknown {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

/** ヘッダ行付き csv → オブジェクト配列 (数値セルは Number 化)。 */
function readCsv(fp: string): Array<Record<string, string | number>> {
  const lines = fs.readFileSync(fp, "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string | number> = {};
    header.forEach((h, i) => {
      const v = cells[i] ?? "";
      row[h] = v !== "" && !Number.isNaN(Number(v)) ? Number(v) : v;
    });
    return row;
  });
}

/** markdown の見出し regex 以降で最初に現れる pipe テーブルを行配列で返す。 */
function mdTableAfter(
  md: string,
  headingRe: RegExp,
): { header: string[]; rows: string[][] } | null {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return null;
  const rows: string[][] = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      inTable = true;
      // ★`l.replace(/-/g, "-")` を挟んでいたが `-` を `-` に置換する no-op で、
      //   判定結果は素の `l` と常に同一 (CodeQL js/identity-replacement が指摘)。
      //   全角ダッシュ (—–−) の正規化を意図していた可能性はあるが、それは挙動を変える
      //   別の判断なので推測で実装しない。ここでは死んだ置換だけを外す。
      if (/^\|[\s:-]+\|/.test(l)) continue; // 区切り行
      const cells = l
        .split("|")
        .slice(1, -1)
        .map((c) => c.replace(/\*\*/g, "").trim());
      rows.push(cells);
    } else if (inTable) break;
  }
  if (rows.length < 2) return null;
  return { header: rows[0], rows: rows.slice(1) };
}

function wrap<T>(fn: () => T): Wrapped<T> {
  try {
    return fn();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ─── 進捗キュー ──────────────────────────────────────
export function readBlogQueue(root: string) {
  return wrap(() => {
    const q = readJson(
      path.join(root, ".claude/state/blog/remediation-queue.json"),
    ) as {
      queue: Array<Record<string, unknown>>;
      generatedAt?: string;
      gscWeek?: string;
      summary?: unknown;
    };
    const top = q.queue
      .filter((e) => e.status !== "done" && e.lane === "must-fix")
      .sort(
        (a, b) =>
          ((a.priority as number) ?? 999) - ((b.priority as number) ?? 999),
      )
      .slice(0, 10)
      .map((e) => ({
        slug: e.slug,
        status: e.status,
        blockers: (e.quality as { blockers?: number })?.blockers ?? 0,
        impressions: (e.gsc as { impressions?: number })?.impressions ?? 0,
        score: e.combinedScore,
      }));
    return { generatedAt: q.generatedAt, gscWeek: q.gscWeek, summary: q.summary, topMustFix: top };
  });
}

export function readAiContentQueue(root: string) {
  return wrap(() => {
    const q = readJson(
      path.join(root, ".claude/state/ai-content/remediation-queue.json"),
    ) as { entries: Array<Record<string, unknown>>; generatedAt?: string; summary?: unknown };
    const top = q.entries
      .filter((e) => e.status !== "done")
      .sort((a, b) => ((b.impressions as number) ?? 0) - ((a.impressions as number) ?? 0))
      .slice(0, 10)
      .map((e) => ({
        rankingKey: e.rankingKey,
        impressions: (e.impressions as number) ?? 0,
        reason: e.reason,
        reviewTier: e.reviewTier ?? null,
      }));
    return { generatedAt: q.generatedAt, summary: q.summary, topNeeds: top };
  });
}

export function readTopicQueue(root: string) {
  return wrap(() => {
    const q = readJson(path.join(root, ".claude/state/blog/topic-queue.json")) as {
      queue: Array<Record<string, unknown>>;
      generatedAt?: string;
      summary?: unknown;
    };
    const top = q.queue
      .filter((e) => e.status === "pending")
      .sort(
        (a, b) =>
          ((a.priority as number) ?? 999) - ((b.priority as number) ?? 999),
      )
      .slice(0, 10)
      .map((e) => ({ label: e.label, archetype: e.archetype, lane: e.lane }));
    return { generatedAt: q.generatedAt, summary: q.summary, topPending: top };
  });
}

export function readWinningPatterns(root: string) {
  return wrap(() => {
    const w = readJson(path.join(root, ".claude/state/blog/winning-patterns.json")) as {
      generatedAt?: string;
      gscWeek?: string;
      sample?: unknown;
      winnerProfile?: { medianCtr?: number; medianPosition?: number };
      loserProfile?: { medianCtr?: number; medianPosition?: number };
    };
    return {
      generatedAt: w.generatedAt,
      gscWeek: w.gscWeek,
      sample: w.sample,
      winner: { medianCtr: w.winnerProfile?.medianCtr, medianPosition: w.winnerProfile?.medianPosition },
      loser: { medianCtr: w.loserProfile?.medianCtr, medianPosition: w.loserProfile?.medianPosition },
    };
  });
}

export function readSnsPosts(root: string) {
  return wrap(() => {
    const data = readJson(path.join(root, ".claude/state/sns/posts.json")) as {
      posts?: Array<Record<string, unknown>>;
    };
    const posts = (data.posts || []).filter((p) => p.status !== "deleted");
    const by = (s: string) => posts.filter((p) => p.status === s).length;
    const byPlatform: Record<string, number> = {};
    for (const p of posts) {
      const plat = p.platform as string;
      byPlatform[plat] = (byPlatform[plat] || 0) + 1;
    }
    const lastPosted = posts
      .map((p) => p.posted_at as string | undefined)
      .filter(Boolean)
      .sort()
      .pop();
    return {
      total: posts.length,
      posted: by("posted"),
      scheduled: by("scheduled"),
      draft: by("draft"),
      byPlatform,
      lastPosted,
    };
  });
}

export function readExperiments(root: string) {
  return wrap(() => {
    const data = readJson(path.join(root, ".claude/state/experiments.json")) as {
      experiments?: Array<{ id: string; title: string; status: string }>;
      updated_at?: string;
    };
    const list = (data.experiments || []).map((e) => ({ id: e.id, title: e.title, status: e.status }));
    return { updatedAt: data.updated_at, experiments: list };
  });
}

// ─── メトリクス ──────────────────────────────────────
export function readMetricsHistory(root: string) {
  return wrap(() => {
    // KPI/WoW 表示は確定7日 (非重複) 系列。旧 history.csv はローリング28日/基盤混在のため
    // カードの週次 WoW には使わない。列名は UI 互換の clicks/impressions 等へ写像する。
    const gscFin = readCsvOrNull(
      path.join(root, ".claude/state/metrics/gsc/history-finalized7d.csv"),
    );
    const gsc = gscFin
      ? gscFin.map((r) => ({
          week: r.week,
          clicks: r.clicks_finalized7d,
          impressions: r.impressions_finalized7d,
          ctr: r.ctr_finalized7d,
          position: r.position_finalized7d,
        }))
      : null;
    const ga4Fin = readCsvOrNull(
      path.join(root, ".claude/state/metrics/ga4/history-finalized7d.csv"),
    );
    const ga4 = ga4Fin
      ? ga4Fin.map((r) => ({
          week: r.week,
          active_users: r.active_users_jp7d,
          sessions: r.sessions_jp7d,
          pageviews: r.pageviews_jp7d,
        }))
      : readCsvOrNull(path.join(root, ".claude/state/metrics/ga4/history.csv"));
    let adsense: Array<Record<string, string | number>> | null = null;
    try {
      adsense = readCsv(path.join(root, ".claude/state/metrics/adsense/history.csv"));
    } catch {
      // adsense は無い環境がある
    }
    return { gsc, ga4, adsense };
  });
}

function readCsvOrNull(p: string) {
  try {
    const rows = readCsv(p);
    return rows && rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

export function parsePsiLatest(root: string) {
  return wrap(() => {
    const md = fs.readFileSync(path.join(root, ".claude/state/metrics/psi/LATEST.md"), "utf8");
    const date = md.match(/# PSI Latest — ([\d-]+)/)?.[1] ?? null;
    const m = md.match(/しきい値違反: error (\d+) \/ warning (\d+)/);
    return { date, errors: m ? Number(m[1]) : null, warnings: m ? Number(m[2]) : null };
  });
}

export function readGscCoverage(root: string) {
  return wrap(() => {
    const q = readJson(
      path.join(root, ".claude/state/gsc/coverage-remediation-queue.json"),
    ) as {
      week?: string;
      generated_at?: string;
      summary?: {
        tracked_urls?: number;
        pending_actionable?: number;
        by_action?: unknown;
      };
      gsc_category_totals?: unknown;
    };
    return {
      week: q.week,
      generatedAt: q.generated_at,
      tracked: q.summary?.tracked_urls,
      pendingActionable: q.summary?.pending_actionable,
      byAction: q.summary?.by_action,
      categoryTotals: q.gsc_category_totals,
    };
  });
}

// ─── TODO 表 (.claude/todo/04_改善バックログ.md — 6 列 pipe テーブル) ──
export function parseBacklogMd(root: string) {
  return wrap(() => {
    const md = fs.readFileSync(path.join(root, ".claude/todo/04_改善バックログ.md"), "utf8");
    const lines = md.split(/\r?\n/);
    let tier: string | null = null;
    const rows: Array<{
      tier: string;
      id: string;
      title: string;
      status: string;
      due: string;
      owner: string;
      metric: string;
    }> = [];
    for (const l of lines) {
      const h = l.match(/^## (Tier \d+)/);
      if (h) {
        tier = h[1];
        continue;
      }
      if (!tier || !/^\|/.test(l)) continue;
      const cells = l.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length !== 6 || cells[0] === "ID" || /^-+$/.test(cells[0].replace(/[:\s]/g, "-"))) {
        continue;
      }
      const [id, title, status, due, owner, metric] = cells;
      rows.push({
        tier,
        id,
        title: title.length > TITLE_TRUNC ? `${title.slice(0, TITLE_TRUNC)}…` : title,
        status,
        due,
        owner,
        metric,
      });
    }
    const byStatus: Record<string, number> = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    const updated = md.match(/^updated: ([\d-]+)/m)?.[1] ?? null;
    return { updated, total: rows.length, byStatus, rows };
  });
}

// ─── TODO 表 (.claude/todo/05_機能バックログ.md) ──
interface FeatureBacklogRow {
  section: string;
  id: string;
  title: string;
  tier: string;
  status: string;
  created: string;
}

export function parseFeatureBacklogMd(root: string) {
  return wrap(() => {
    const md = fs.readFileSync(path.join(root, ".claude/todo/05_機能バックログ.md"), "utf8");
    const lines = md.split(/\r?\n/);
    let section: string | null = null;
    let cur: FeatureBacklogRow | null = null;
    const rows: FeatureBacklogRow[] = [];
    for (const l of lines) {
      const h2 = l.match(/^## (.+)/);
      if (h2) {
        const t = h2[1];
        section = /^P0\b/.test(t)
          ? "P0 緊急"
          : /^P1\b/.test(t)
            ? "P1 今月"
            : /^P2\b/.test(t)
              ? "P2 次"
              : /^P3\b/.test(t)
                ? "P3 条件付き保留"
                : null;
        cur = null;
        continue;
      }
      const h3 = l.match(/^### (.+)/);
      if (h3) {
        if (!section) {
          cur = null;
          continue;
        }
        const raw = h3[1];
        const idM = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
        const hashM = raw.match(/^(#\d+)\s+(.*)$/);
        const id = idM ? idM[1] : hashM ? hashM[1] : "";
        let title = (idM ? idM[2] : hashM ? hashM[2] : raw).trim();
        if (title.length > TITLE_TRUNC) title = `${title.slice(0, TITLE_TRUNC)}…`;
        cur = { section, id, title, tier: "", status: "", created: "" };
        rows.push(cur);
        continue;
      }
      if (!cur) continue;
      const b = l.match(/^- \*\*(tier|status|created)\*\*:\s*(.+)$/);
      if (b && !cur[b[1] as "tier" | "status" | "created"]) {
        let v = b[2].replace(/\*\*/g, "").trim();
        if (v.length > 80) v = `${v.slice(0, 80)}…`;
        cur[b[1] as "tier" | "status" | "created"] = v;
      }
    }
    const bySection: Record<string, number> = {};
    for (const r of rows) bySection[r.section] = (bySection[r.section] || 0) + 1;
    const updated = md.match(/^updated: ([\d-]+)/m)?.[1] ?? null;
    return { updated, total: rows.length, bySection, rows };
  });
}

// ─── 戦略 (マーケティング戦略 SSOT をパース) ─────────────
export function parseStrategyDocs(root: string) {
  return wrap(() => {
    const mkPath = "docs/00_プロジェクト管理/03_マーケティング戦略.md";
    const mk = fs.readFileSync(path.join(root, mkPath), "utf8");

    const statement = mk.match(/^> \*\*「(.+?)」\*\*/m)?.[1] ?? null;

    const targeting = mdTableAfter(mk, /^### セグメント評価/);
    const segments = (targeting?.rows ?? []).map(([seg, verdict, role]) => ({ seg, verdict, role }));

    const teigenTable = mdTableAfter(mk, /^### STP実行状況/);
    const teigen = (teigenTable?.rows ?? []).map(([n, title, target, state]) => ({
      n,
      title,
      target,
      state,
    }));

    return {
      statement,
      segments,
      teigen,
      sources: [
        mkPath,
        "docs/00_プロジェクト管理/04_ターゲットペルソナ.md",
        ".claude/todo/04_改善バックログ.md",
      ],
    };
  });
}

// ─── 集約 (60 秒 TTL・globalThis) ─────────────────────
export interface DashboardData {
  generatedAt: string;
  blogQueue: unknown;
  aiContent: unknown;
  topicQueue: unknown;
  winningPatterns: unknown;
  sns: unknown;
  experiments: unknown;
  metrics: unknown;
  psi: unknown;
  coverage: unknown;
  backlog: unknown;
  featureBacklog: unknown;
  strategy: unknown;
}

export function collectDashboard(root: string): DashboardData {
  return {
    generatedAt: new Date().toISOString(),
    blogQueue: readBlogQueue(root),
    aiContent: readAiContentQueue(root),
    topicQueue: readTopicQueue(root),
    winningPatterns: readWinningPatterns(root),
    sns: readSnsPosts(root),
    experiments: readExperiments(root),
    metrics: readMetricsHistory(root),
    psi: parsePsiLatest(root),
    coverage: readGscCoverage(root),
    backlog: parseBacklogMd(root),
    featureBacklog: parseFeatureBacklogMd(root),
    strategy: parseStrategyDocs(root),
  };
}

interface DashCache {
  at: number;
  data: DashboardData;
}
const g = globalThis as unknown as { __galleryDashCache?: DashCache | null };
const DASH_TTL_MS = 60 * 1000;

export function dashboardSummary(): DashboardData {
  const cached = g.__galleryDashCache;
  if (cached && Date.now() - cached.at < DASH_TTL_MS) return cached.data;
  const data = collectDashboard(projectRoot());
  g.__galleryDashCache = { at: Date.now(), data };
  return data;
}
