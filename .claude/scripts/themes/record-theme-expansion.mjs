#!/usr/bin/env node
/** Record catalog wiring only; runtime/data results belong to their executed probes. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { inspectExpansionWiring } from './theme-expansion-core.mjs';

const require = createRequire(import.meta.url);
const { THEME_CATALOGS } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
const { EXISTING_THEME_SECTION_EXTENSIONS } = require('../../../packages/data-configs/src/theme-catalog/expanded.ts');
const root = resolve(import.meta.dirname, '../../..');
const planRef = '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json';
const planPath = resolve(root, planRef);
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const recordedAt = new Date().toISOString();
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date(recordedAt));
const wiring = inspectExpansionWiring(plan, THEME_CATALOGS, EXISTING_THEME_SECTION_EXTENSIONS);
for (const row of wiring.candidates) {
  const candidate = plan.themes.find((theme) => theme.id === row.candidateId);
  const decision = candidate.decision;
  if (row.disposition === 'hold') continue;
  decision.implementationStatus = row.status;
  if (row.disposition === 'new-theme') {
    if (row.themeKey) decision.implementedThemeKey = row.themeKey;
    else delete decision.implementedThemeKey;
    // Canonical field checked by validateDecisions.
    delete candidate.implementedThemeKey;
  }
  decision.implementationEvidence = row.themeKey ? [
    'packages/data-configs/src/theme-catalog/index.ts',
    `packages/types/src/indicator-sets/${row.themeKey}.ts`,
    ...(row.sectionKey ? [`theme:${row.themeKey}#${row.sectionKey}`] : []),
  ] : [];
}
plan.asOf = day;
plan.handoff = {
  ...plan.handoff,
  lastImplementationCheckpoint: `${day} observed catalog wiring`,
  catalogWiringStatus: 'structural-only-data-and-scope-pending',
  catalogWiringCounts: wiring.counts,
  dataValidationGate: 'pending-per-metric-and-source',
};
await writeFile(planPath, JSON.stringify(plan, null, 2) + '\n');
const statePath = resolve(root, `.claude/state/metrics/themes/${day}-all-expansion.json`);
await mkdir(dirname(statePath), { recursive: true });
const previous = await readFile(statePath, 'utf8').then(JSON.parse).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return {};
});
await writeFile(statePath, JSON.stringify({
  ...previous,
  schemaVersion: 1, recordedAt, status: 'local-catalog-wired-data-validation-pending', plan: planRef,
  themeCount: Object.keys(THEME_CATALOGS).length,
  adoptedCandidates: plan.themes.filter((theme) => theme.decision.disposition !== 'hold').length,
  ...wiring,
  reproduction: {
    ...(typeof previous.reproduction === 'object' ? previous.reproduction : {}),
    catalogCommand: 'node --import tsx .claude/scripts/themes/record-theme-expansion.mjs',
  },
  limitation: 'Wiring is structural evidence only. Candidate scope, source definitions, data, rendered values and publication require separate verification. No test pass is inferred by this recorder.',
}, null, 2) + '\n');
console.log(JSON.stringify({ counts: wiring.counts, themeCount: Object.keys(THEME_CATALOGS).length, state: statePath }));
