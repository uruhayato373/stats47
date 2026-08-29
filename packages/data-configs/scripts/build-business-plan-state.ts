import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUSINESS_PLAN_2026 } from '../src/business-plan';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const outputPath = path.join(
  repoRoot,
  '.claude/state/business-plan/latest.json'
);
const snapshot = process.argv.includes('--snapshot');

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

const sourceFreshness: Record<string, string | null> = {
  ga4: newestMtime('.claude/state/metrics/ga4'),
  x: newestMtime('.claude/state/metrics/sns'),
  note: newestMtime('.claude/state/metrics/note'),
  affiliate: newestMtime('.claude/state/metrics/affiliate'),
  products: newestMtime('.claude/state/products'),
  ci: newestMtime('.claude/state/ci'),
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
if (snapshot) {
  const day = state.generatedAt.slice(0, 10);
  const snapshotPath = path.join(
    repoRoot,
    `.claude/state/business-plan/history/${day}.json`
  );
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

console.log(
  `✅ business plan state: ${path.relative(repoRoot, outputPath)}${snapshot ? ' + daily snapshot' : ''}`
);
