import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUSINESS_PLAN_2026, buildKpiTree } from '../src/business-plan';
import { datasetDir } from "../../../config/datasets.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const outputPath = path.join(
  repoRoot,
  `${datasetDir("business-plan.state")}/latest.json`
);
const snapshot = process.argv.includes('--snapshot');
const KPI_TREE_PATH = `${datasetDir("business-plan.state")}/kpi-tree.json`;

function newestMtime(rel: string): string | null {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  if (stat.isFile()) return stat.mtime.toISOString();
  const mtimes = fs
    .readdirSync(full, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map(
      (entry) => fs.statSync(path.join(entry.parentPath, entry.name)).mtimeMs
    );
  return mtimes.length > 0
    ? new Date(Math.max(...mtimes)).toISOString()
    : stat.mtime.toISOString();
}

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/**
 * データが最後に変わった時刻。git はファイルの更新時刻を保存しないので、clone・checkout 直後の mtime は
 * 取得時刻ではなく checkout 時刻になる (BUSINESS-PLAN-FRESHNESS-MTIME-01)。最後にコミットした時刻を使い、
 * 未コミットの変更があるときと git が使えないときだけ mtime に戻す。
 */
function lastChanged(rel: string): string | null {
  if (!fs.existsSync(path.join(repoRoot, rel))) return null;
  if (git(['status', '--porcelain', '--', rel])) return newestMtime(rel);
  const committed = git(['log', '-1', '--format=%cI', '-M', '--diff-filter=AM', '--', rel]); // 改名だけのコミットは数えない
  return committed ? new Date(committed).toISOString() : newestMtime(rel);
}

const sourceFreshness: Record<string, string | null> = {
  ga4: lastChanged(datasetDir("ga4.history")),
  x: lastChanged(datasetDir("sns.drafts")),
  note: lastChanged(datasetDir("note.cover-rollout")),
  affiliate: lastChanged(datasetDir("affiliate.audits")),
  products: lastChanged(datasetDir("products.publication-receipts")),
  ci: lastChanged(datasetDir("ci.health")),
};

const statusCounts = BUSINESS_PLAN_2026.decisions.reduce<
  Record<string, number>
>((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});
const eventCounts = BUSINESS_PLAN_2026.events.reduce<Record<string, number>>(
  (acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  },
  {}
);
const nextActions = BUSINESS_PLAN_2026.initiatives
  .filter((item) => item.status === 'ready' || item.status === 'in-progress')
  .map((item) => ({
    id: item.id,
    title: item.title,
    owner: item.owner,
    gate: item.readinessGate,
  }));

const state = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  catalogId: BUSINESS_PLAN_2026.id,
  catalogVersion: BUSINESS_PLAN_2026.version,
  sourceSha256: BUSINESS_PLAN_2026.source.sourceSha256,
  coverage: {
    decisions: BUSINESS_PLAN_2026.decisions.length,
    documents: BUSINESS_PLAN_2026.documents.length,
    initiatives: BUSINESS_PLAN_2026.initiatives.length,
    pilotSpecs: BUSINESS_PLAN_2026.pilotSpecs.length,
    contentOpportunities: BUSINESS_PLAN_2026.contentOpportunities.length,
    xIdeas: BUSINESS_PLAN_2026.xIdeas.length,
    noteProducts: BUSINESS_PLAN_2026.noteProducts.length,
    metrics: BUSINESS_PLAN_2026.metrics.length,
    events: BUSINESS_PLAN_2026.events.length,
    m1Routes: BUSINESS_PLAN_2026.m1.routes.length,
    m1XPosts: BUSINESS_PLAN_2026.m1.xPosts.length,
    m1NoteProducts: BUSINESS_PLAN_2026.m1.noteProducts.length,
    m1Tasks: BUSINESS_PLAN_2026.m1.tasks.length,
  },
  statusCounts,
  eventCounts,
  sourceFreshness,
  nextActions,
  measurementWarning:
    '未計測・手動・部分計測を0として扱わない。GA4イベントはコード・登録台帳・反映確認の3点が揃って初めてmeasuredとする。',
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
// KPI ツリーは .mjs / .cjs (計測サイクル・CI ゲート・docs:check) が TS を import せずに読むための写し。
// 時刻を含めない決定的出力にし、catalog とのずれは validate-business-plan.ts が検出する。
const kpiTreePath = path.join(repoRoot, KPI_TREE_PATH);
fs.writeFileSync(
  kpiTreePath,
  `${JSON.stringify({ schemaVersion: 1, source: 'packages/data-configs/src/business-plan/catalog.ts', nodes: buildKpiTree(BUSINESS_PLAN_2026.metrics) }, null, 2)}\n`,
  'utf8'
);
if (snapshot) {
  const day = state.generatedAt.slice(0, 10);
  const snapshotPath = path.join(
    repoRoot,
    `${datasetDir("business-plan.history")}/${day}.json`
  );
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

console.log(
  `✅ business plan state: ${path.relative(repoRoot, outputPath)}${snapshot ? ' + daily snapshot' : ''}`
);
