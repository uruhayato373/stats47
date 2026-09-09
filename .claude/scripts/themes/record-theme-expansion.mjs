#!/usr/bin/env node
/** Record the deterministic catalog wiring checkpoint for the 128-theme plan. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');
const planPath = resolve(root, '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const newKeys = new Set([
  'construction-industry', 'land-property-market', 'agriculture-production', 'forestry-timber',
  'retail-commerce', 'local-services', 'information-industry', 'business-demography',
  'innovation-patents', 'childcare-services', 'single-parent-households', 'long-term-care',
  'disability-support', 'public-assistance', 'health-checkups', 'daily-time-use',
  'household-assets-debt', 'freight-logistics', 'regional-transport', 'geographic-access',
  'water-services', 'communication-access', 'regional-energy', 'waste-recycling',
  'environmental-quality', 'natural-environment', 'earthquake-exposure', 'landslide-exposure',
  'tsunami-exposure', 'cultural-participation', 'sports-participation', 'local-government-digital',
  'gender-participation', 'community-participation',
]);
const existingKeys = new Set(['living-housing', 'manufacturing', 'local-economy', 'tourism', 'labor-mobility', 'labor-wages', 'population-dynamics', 'aging-society', 'local-finance', 'education-culture', 'healthcare', 'real-income', 'consumer-prices', 'ports', 'safety', 'roads', 'climate', 'foreign-residents']);
const byId = new Map(plan.themes.map((theme) => [theme.id, theme]));
const counts = { newThemeCatalogWired: 0, existingSectionWired: 0, mergeWired: 0, hold: 0, dataValidationPending: 0 };
for (const theme of plan.themes) {
  const decision = theme.decision ?? {};
  if (decision.disposition === 'new-theme') {
    const key = theme.implementedThemeKey ?? decision.targetThemeKey ?? ({
      1: 'construction-industry', 15: 'information-industry', 100: 'waste-recycling',
    }[theme.id]);
    if (key && newKeys.has(key)) {
      // The first implemented themes already keep this field under decision.
      // Preserve that existing shape while recording the top-level field for
      // newly wired candidates that do not have one yet.
      if (decision.implementedThemeKey !== key) theme.implementedThemeKey = key;
      decision.implementationStatus = 'catalog-wired-data-validation-pending';
      decision.implementationEvidence = [`packages/data-configs/src/theme-catalog/index.ts`, `packages/types/src/indicator-sets/${key}.ts`, `apps/web/scripts/data/page-components/theme/${key}.json`];
      counts.newThemeCatalogWired += 1;
      counts.dataValidationPending += 1;
    }
  } else if (decision.disposition === 'existing-section') {
    if (existingKeys.has(decision.targetThemeKey)) {
      decision.implementationStatus = 'catalog-section-wired-data-validation-pending';
      decision.implementationEvidence = [`packages/data-configs/src/theme-catalog/index.ts`, `packages/types/src/indicator-sets/${decision.targetThemeKey}.ts`];
      counts.existingSectionWired += 1;
      counts.dataValidationPending += 1;
    }
  } else if (decision.disposition === 'merge-candidate') {
    const target = byId.get(decision.targetCandidateId);
    if (target?.decision?.targetThemeKey) {
      decision.implementationStatus = 'merged-into-target-catalog';
      decision.implementationEvidence = [`packages/data-configs/src/theme-catalog/index.ts`, `candidate:${decision.targetCandidateId}`];
      counts.mergeWired += 1;
    }
  } else if (decision.disposition === 'hold') {
    counts.hold += 1;
  }
}
plan.asOf = '2026-09-09';
plan.handoff = {
  ...(plan.handoff ?? {}),
  lastImplementationCheckpoint: '2026-09-09 catalog wiring',
  catalogWiringStatus: 'local-verified',
  catalogWiringCounts: counts,
  dataValidationGate: 'pending-per-metric-and-source',
};
await writeFile(planPath, JSON.stringify(plan, null, 2) + '\n');
const statePath = resolve(root, '.claude/state/metrics/themes/2026-09-09-all-expansion.json');
await mkdir(dirname(statePath), { recursive: true });
await writeFile(statePath, JSON.stringify({
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  status: 'local-catalog-wired-data-validation-pending',
  plan: '.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json',
  themeCount: newKeys.size + 21,
  adoptedCandidates: 34 + 67 + 19,
  counts,
  holdCandidateIds: plan.themes.filter((theme) => theme.decision?.disposition === 'hold').map((theme) => theme.id),
  verification: [
    'npm run validate:catalog --workspace=@stats47/data-configs',
    'npm run type-check --workspace packages/types',
    'npm run type-check --workspace apps/web',
    'npm run docs:check',
    'npm run build --workspace apps/web',
  ],
  runtimeVerification: {
    build: { status: 'passed', staticPages: 1637 },
    themeHttp: { status: 'passed', count: 55, ok: 55, artifact: '.local/verification/themes/2026-09-09-all-theme-http.json' },
    hydration: {
      status: 'passed',
      scenarios: ['fresh-context', 'after-real-income', 'same-prefecture-cookie', 'different-prefecture-cookie'],
      pageErrors: 0,
      consoleErrors: 0,
      artifact: '.local/verification/themes/2026-09-09-hydration-final.json',
    },
  },
  limitation: 'R2 observations, source-specific official adapters, and production publication remain gated until the consolidated data gate passes.',
}, null, 2) + '\n');
console.log(JSON.stringify({ counts, themeCount: newKeys.size + 21, state: statePath }));
