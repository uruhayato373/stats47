/**
 * プロジェクト現況ダッシュボードの collector 集 (読み取り専用・依存ゼロ)
 *
 * SSOT (state JSON / metrics csv / 改善バックログ md / 戦略 md) をリクエスト時に
 * ライブ読みして集計値を返す。ダッシュボード側に独自の状態を持たない (SSOT 二重化の禁止)。
 * 各 collector は失敗時に { error } を返し、他セクションの描画を巻き込まない。
 *
 * 消費者: .claude/scripts/gallery/server.mjs (GET /api/dashboard/summary)
 * 正典: .claude/rules/data-storage.md (state の配置) / sns-content-standards.md §5.5 (コンソール)
 */
import fs from "node:fs";
import path from "node:path";

const TITLE_TRUNC = 200; // バックログのタイトルセルは数千字あるため表示用に切る

// ─── 汎用パーサ ──────────────────────────────────────
function readJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

/** ヘッダ行付き csv → オブジェクト配列 (数値セルは Number 化)。 */
function readCsv(fp) {
  const lines = fs.readFileSync(fp, "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => {
      const v = cells[i] ?? "";
      row[h] = v !== "" && !Number.isNaN(Number(v)) ? Number(v) : v;
    });
    return row;
  });
}

/** markdown の見出し regex 以降で最初に現れる pipe テーブルを行配列 (セル配列) で返す。 */
function mdTableAfter(md, headingRe) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return null;
  const rows = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      inTable = true;
      if (/^\|[\s:-]+\|/.test(l.replace(/-/g, "-"))) continue; // 区切り行
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

function wrap(fn) {
  try {
    return fn();
  } catch (e) {
    return { error: e.message };
  }
}

// ─── 進捗キュー ──────────────────────────────────────
export function readBlogQueue(root) {
  return wrap(() => {
    const q = readJson(path.join(root, ".claude/state/blog/remediation-queue.json"));
    const top = q.queue
      .filter((e) => e.status !== "done" && e.lane === "must-fix")
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .slice(0, 10)
      .map((e) => ({
        slug: e.slug,
        status: e.status,
        blockers: e.quality?.blockers ?? 0,
        impressions: e.gsc?.impressions ?? 0,
        score: e.combinedScore,
      }));
    return { generatedAt: q.generatedAt, gscWeek: q.gscWeek, summary: q.summary, topMustFix: top };
  });
}

export function readAiContentQueue(root) {
  return wrap(() => {
    const q = readJson(path.join(root, ".claude/state/ai-content/remediation-queue.json"));
    const top = q.entries
      .filter((e) => e.status !== "done")
      .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
      .slice(0, 10)
      .map((e) => ({
        rankingKey: e.rankingKey,
        impressions: e.impressions ?? 0,
        reason: e.reason,
        reviewTier: e.reviewTier ?? null,
      }));
    return { generatedAt: q.generatedAt, summary: q.summary, topNeeds: top };
  });
}

export function readTopicQueue(root) {
  return wrap(() => {
    const q = readJson(path.join(root, ".claude/state/blog/topic-queue.json"));
    const top = q.queue
      .filter((e) => e.status === "pending")
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .slice(0, 10)
      .map((e) => ({ label: e.label, archetype: e.archetype, lane: e.lane }));
    return { generatedAt: q.generatedAt, summary: q.summary, topPending: top };
  });
}

export function readWinningPatterns(root) {
  return wrap(() => {
    const w = readJson(path.join(root, ".claude/state/blog/winning-patterns.json"));
    return {
      generatedAt: w.generatedAt,
      gscWeek: w.gscWeek,
      sample: w.sample,
      winner: { medianCtr: w.winnerProfile?.medianCtr, medianPosition: w.winnerProfile?.medianPosition },
      loser: { medianCtr: w.loserProfile?.medianCtr, medianPosition: w.loserProfile?.medianPosition },
    };
  });
}

export function readSnsPosts(root) {
  return wrap(() => {
    const data = readJson(path.join(root, ".claude/state/sns/posts.json"));
    const posts = (data.posts || []).filter((p) => p.status !== "deleted");
    const by = (s) => posts.filter((p) => p.status === s).length;
    const byPlatform = {};
    for (const p of posts) byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    const lastPosted = posts
      .map((p) => p.posted_at)
      .filter(Boolean)
      .sort()
      .pop();
    return { total: posts.length, posted: by("posted"), scheduled: by("scheduled"), draft: by("draft"), byPlatform, lastPosted };
  });
}

export function readExperiments(root) {
  return wrap(() => {
    const data = readJson(path.join(root, ".claude/state/experiments.json"));
    const list = (data.experiments || []).map((e) => ({ id: e.id, title: e.title, status: e.status }));
    return { updatedAt: data.updated_at, experiments: list };
  });
}

// ─── メトリクス ──────────────────────────────────────
export function readMetricsHistory(root) {
  return wrap(() => {
    const gsc = readCsv(path.join(root, ".claude/state/metrics/gsc/history.csv"));
    const ga4 = readCsv(path.join(root, ".claude/state/metrics/ga4/history.csv"));
    let adsense = null;
    try {
      adsense = readCsv(path.join(root, ".claude/state/metrics/adsense/history.csv"));
    } catch {}
    return { gsc, ga4, adsense };
  });
}

export function parsePsiLatest(root) {
  return wrap(() => {
    const md = fs.readFileSync(path.join(root, ".claude/state/metrics/psi/LATEST.md"), "utf8");
    const date = md.match(/# PSI Latest — ([\d-]+)/)?.[1] ?? null;
    const m = md.match(/しきい値違反: error (\d+) \/ warning (\d+)/);
    return { date, errors: m ? Number(m[1]) : null, warnings: m ? Number(m[2]) : null };
  });
}

export function readGscCoverage(root) {
  return wrap(() => {
    const q = readJson(path.join(root, ".claude/state/gsc/coverage-remediation-queue.json"));
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

// ─── TODO (改善バックログ md — 6 列 pipe テーブルが安定していることを実測確認済) ──
export function parseBacklogMd(root) {
  return wrap(() => {
    const md = fs.readFileSync(path.join(root, "docs/02_実装計画/03_改善バックログ.md"), "utf8");
    const lines = md.split(/\r?\n/);
    let tier = null;
    const rows = [];
    for (const l of lines) {
      const h = l.match(/^## (Tier \d+)/);
      if (h) {
        tier = h[1];
        continue;
      }
      if (!tier || !/^\|/.test(l)) continue;
      const cells = l.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length !== 6 || cells[0] === "ID" || /^-+$/.test(cells[0].replace(/[:\s]/g, "-"))) continue;
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
    const byStatus = {};
    for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    const updated = md.match(/^updated: ([\d-]+)/m)?.[1] ?? null;
    return { updated, total: rows.length, byStatus, rows };
  });
}

// ─── 戦略 (STP md をパース。md が SSOT、ここは表示ミラー) ─────────────
export function parseStrategyDocs(root) {
  return wrap(() => {
    const stpPath = "docs/04_レビュー/2026-07-07-stp-analysis.md";
    const mkPath = "docs/00_プロジェクト管理/03_マーケティング戦略.md";
    const stp = fs.readFileSync(path.join(root, stpPath), "utf8");
    const mk = fs.readFileSync(path.join(root, mkPath), "utf8");

    const statement = mk.match(/^> \*\*「(.+?)」\*\*/m)?.[1] ?? null;

    // §4 ターゲティング判定 (セグメント | 判定 | 役割)
    const targeting = mdTableAfter(stp, /^## 4\./);
    const segments = (targeting?.rows ?? []).map(([seg, verdict, role]) => ({ seg, verdict, role }));

    // §6 提言 (# | 提言 | 反映先 | 反映状況)
    const teigenTable = mdTableAfter(stp, /^## 6\./);
    const teigen = (teigenTable?.rows ?? []).map(([n, title, target, state]) => ({ n, title, target, state }));

    return {
      statement,
      segments,
      teigen,
      sources: [stpPath, mkPath, "docs/00_プロジェクト管理/04_ターゲットペルソナ.md", "docs/02_実装計画/16_月間100万PVロードマップ.md"],
    };
  });
}

// ─── 集約 ────────────────────────────────────────────
export function collectDashboard(root) {
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
    strategy: parseStrategyDocs(root),
  };
}
