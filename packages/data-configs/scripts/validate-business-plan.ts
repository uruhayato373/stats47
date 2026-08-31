import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BUSINESS_PLAN_2026,
  BUSINESS_PLAN_DECISION_STATUSES,
  BUSINESS_PLAN_MEASUREMENT_STATUSES,
  BUSINESS_PLAN_WORK_STATUSES,
  buildM1XCanonicalUrl,
} from '../src/business-plan';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const errors: string[] = [];

function unique<T>(items: readonly T[], label: string): void {
  if (new Set(items).size !== items.length)
    errors.push(`${label}: 重複があります`);
}

function walkSkills(dir: string): Map<string, string> {
  const found = new Map<string, string>();
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [name, skillPath] of walkSkills(full))
        found.set(name, skillPath);
    } else if (entry.name === 'SKILL.md') {
      const text = fs.readFileSync(full, 'utf8');
      const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim();
      if (name) found.set(name, path.relative(repoRoot, full));
    }
  }
  return found;
}

const agentIds = new Set(
  fs
    .readdirSync(path.join(repoRoot, '.claude/agents'))
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => name.replace(/\.md$/, ''))
);
const skillMap = walkSkills(path.join(repoRoot, '.claude/skills'));
const metricIds = new Set(
  BUSINESS_PLAN_2026.metrics.map((metric) => metric.id)
);

if (BUSINESS_PLAN_2026.decisions.length !== 25) {
  errors.push(
    `decisions: expected 25, got ${BUSINESS_PLAN_2026.decisions.length}`
  );
}
if (BUSINESS_PLAN_2026.contentOpportunities.length !== 100) {
  errors.push(
    `contentOpportunities: expected 100, got ${BUSINESS_PLAN_2026.contentOpportunities.length}`
  );
}
if (BUSINESS_PLAN_2026.xIdeas.length !== 30) {
  errors.push(`xIdeas: expected 30, got ${BUSINESS_PLAN_2026.xIdeas.length}`);
}
if (BUSINESS_PLAN_2026.noteProducts.length !== 15) {
  errors.push(
    `noteProducts: expected 15, got ${BUSINESS_PLAN_2026.noteProducts.length}`
  );
}
if (BUSINESS_PLAN_2026.m1.xPosts.length !== 15) {
  errors.push(
    `m1.xPosts: expected 15, got ${BUSINESS_PLAN_2026.m1.xPosts.length}`
  );
}
if (BUSINESS_PLAN_2026.m1.noteProducts.length !== 15) {
  errors.push(
    `m1.noteProducts: expected 15, got ${BUSINESS_PLAN_2026.m1.noteProducts.length}`
  );
}

unique(
  BUSINESS_PLAN_2026.decisions.map((item) => item.chapter),
  'decision.chapter'
);
unique(
  BUSINESS_PLAN_2026.m1.xPosts.map((item) => item.id),
  'm1.xPost.id'
);
unique(
  BUSINESS_PLAN_2026.m1.xPosts.map((item) => item.contentKey),
  'm1.xPost.contentKey'
);
unique(
  BUSINESS_PLAN_2026.m1.analyses.map((item) => item.id),
  'm1.analysis.id'
);
unique(
  BUSINESS_PLAN_2026.m1.noteProducts.map((item) => item.articleKey),
  'm1.noteProduct.articleKey'
);
unique(
  BUSINESS_PLAN_2026.m1.tasks.map((item) => item.id),
  'm1.task.id'
);
unique(
  BUSINESS_PLAN_2026.documents.map((item) => item.id),
  'document.id'
);
unique(
  BUSINESS_PLAN_2026.metrics.map((item) => item.id),
  'metric.id'
);
unique(
  BUSINESS_PLAN_2026.events.map((item) => item.id),
  'event.id'
);
unique(
  BUSINESS_PLAN_2026.initiatives.map((item) => item.id),
  'initiative.id'
);
unique(
  BUSINESS_PLAN_2026.pilotSpecs.map((item) => item.id),
  'pilotSpec.id'
);
unique(
  BUSINESS_PLAN_2026.contentOpportunities.map((item) => item.id),
  'content.id'
);
unique(
  BUSINESS_PLAN_2026.geoContentLifecycle.map((item) => item.contentId),
  'geoContent.contentId'
);
unique(
  BUSINESS_PLAN_2026.xIdeas.map((item) => item.id),
  'xIdea.id'
);
unique(
  BUSINESS_PLAN_2026.noteProducts.map((item) => item.id),
  'noteProduct.id'
);

const referencedOwners = new Set<string>();
const referencedSkills = new Set<string>();
for (const decision of BUSINESS_PLAN_2026.decisions) {
  if (!BUSINESS_PLAN_DECISION_STATUSES.includes(decision.status)) {
    errors.push(`decision:${decision.chapter}: status が不正です`);
  }
  if (decision.chapter < 1 || decision.chapter > 25) {
    errors.push(`decision:${decision.chapter}: chapter が1〜25ではありません`);
  }
  decision.owners.forEach((owner) => referencedOwners.add(owner));
  decision.skills.forEach((skill) => referencedSkills.add(skill));
  for (const metricId of decision.metricIds) {
    if (!metricIds.has(metricId))
      errors.push(
        `decision:${decision.chapter}: metric ${metricId} が未定義です`
      );
  }
  for (const rel of decision.canonicalPaths) {
    if (!fs.existsSync(path.join(repoRoot, rel))) {
      errors.push(
        `decision:${decision.chapter}: canonical path がありません: ${rel}`
      );
    }
  }
}

for (const doc of BUSINESS_PLAN_2026.documents) {
  referencedOwners.add(doc.owner);
  if (!fs.existsSync(path.join(repoRoot, doc.path)))
    errors.push(`document:${doc.id}: path がありません: ${doc.path}`);
}
for (const metric of BUSINESS_PLAN_2026.metrics) {
  if (!BUSINESS_PLAN_MEASUREMENT_STATUSES.includes(metric.measurementStatus)) {
    errors.push(`metric:${metric.id}: measurementStatus が不正です`);
  }
}
for (const event of BUSINESS_PLAN_2026.events) {
  referencedOwners.add(event.owner);
  if (!BUSINESS_PLAN_MEASUREMENT_STATUSES.includes(event.status)) {
    errors.push(`event:${event.id}: status が不正です`);
  }
  if (!fs.existsSync(path.join(repoRoot, event.implementationPath))) {
    errors.push(
      `event:${event.id}: implementationPath がありません: ${event.implementationPath}`
    );
  }
}
for (const initiative of BUSINESS_PLAN_2026.initiatives) {
  referencedOwners.add(initiative.owner);
  initiative.skills.forEach((skill) => referencedSkills.add(skill));
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(initiative.status)) {
    errors.push(`initiative:${initiative.id}: status が不正です`);
  }
  for (const metricId of initiative.metricIds) {
    if (!metricIds.has(metricId))
      errors.push(
        `initiative:${initiative.id}: metric ${metricId} が未定義です`
      );
  }
}
const contentIds = new Set(
  BUSINESS_PLAN_2026.contentOpportunities.map((item) => item.id)
);
const m1AnalysisIds = new Set(
  BUSINESS_PLAN_2026.m1.analyses.map((analysis) => analysis.id)
);
for (const content of BUSINESS_PLAN_2026.geoContentLifecycle) {
  if (!contentIds.has(content.contentId)) {
    errors.push(`geoContent:${content.contentId}: content opportunity が未定義です`);
  }
  if (!m1AnalysisIds.has(content.analysisId)) {
    errors.push(`geoContent:${content.contentId}: analysis が未定義です`);
  }
  if (content.free.canonicalPath !== `/geo/${content.analysisSlug}`) {
    errors.push(`geoContent:${content.contentId}: canonicalPath がslugと不一致です`);
  }
  if (content.themeKeys.length === 0) {
    errors.push(`geoContent:${content.contentId}: themeKeys が空です`);
  }
  if (content.paid.priceYen <= 0 || content.paid.deliverables.length === 0) {
    errors.push(`geoContent:${content.contentId}: 有料価値の定義が不十分です`);
  }
  if (content.publicationGates.length < 5) {
    errors.push(`geoContent:${content.contentId}: publicationGates が不足しています`);
  }
}
for (const pilot of BUSINESS_PLAN_2026.pilotSpecs) {
  referencedOwners.add(pilot.owner);
  if (!contentIds.has(pilot.contentId))
    errors.push(`pilot:${pilot.id}: contentId ${pilot.contentId} が未定義です`);
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(pilot.status))
    errors.push(`pilot:${pilot.id}: status が不正です`);
  if (pilot.dataRefs.length === 0 || pilot.qualityGates.length === 0)
    errors.push(`pilot:${pilot.id}: dataRefs/qualityGates が空です`);
}
const eventIds = new Set(BUSINESS_PLAN_2026.events.map((event) => event.id));
for (const eventId of BUSINESS_PLAN_2026.m1.eventIds) {
  if (!eventIds.has(eventId))
    errors.push(`m1.eventId が未定義です: ${eventId}`);
}
for (const task of BUSINESS_PLAN_2026.m1.tasks) {
  referencedOwners.add(task.owner);
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(task.status)) {
    errors.push(`m1.task:${task.id}: status が不正です`);
  }
}
for (const route of BUSINESS_PLAN_2026.m1.routes) {
  if (!route.path.startsWith('/geo'))
    errors.push(`m1.route が /geo 配下ではありません: ${route.path}`);
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(route.status)) {
    errors.push(`m1.route:${route.path}: status が不正です`);
  }
}
const m1Analyses = new Map(
  BUSINESS_PLAN_2026.m1.analyses.map((analysis) => [analysis.id, analysis])
);
for (const analysis of BUSINESS_PLAN_2026.m1.analyses) {
  if (analysis.sourceLayers.length === 0) {
    errors.push(`m1.analysis:${analysis.id}: sourceLayers が空です`);
  }
  if (analysis.spatialOperations.length === 0) {
    errors.push(`m1.analysis:${analysis.id}: spatialOperations が空です`);
  }
  if (!analysis.metricKeys.includes(analysis.primaryMetricKey)) {
    errors.push(`m1.analysis:${analysis.id}: primaryMetricKey がmetricKeys外です`);
  }
  for (const layer of analysis.sourceLayers) {
    if (
      (layer.role === 'calculation-input' && !layer.usedInCalculation) ||
      (layer.role === 'context-only' && layer.usedInCalculation)
    ) {
      errors.push(
        `m1.analysis:${analysis.id}: layer ${layer.id} のroleとusedInCalculationが矛盾しています`
      );
    }
  }
  const calculationInputs = analysis.sourceLayers.filter(
    (layer) => layer.role === 'calculation-input'
  );
  if (
    analysis.analysisKind === 'spatial-cross' &&
    (calculationInputs.length < 2 ||
      calculationInputs.every((layer) => layer.geometry === 'prefecture'))
  ) {
    errors.push(
      `m1.analysis:${analysis.id}: spatial-cross は複数レイヤーと空間geometryが必要です`
    );
  }
  if (
    Boolean(analysis.evidenceManifestKey) !==
    Boolean(analysis.detailR2KeyPattern)
  ) {
    errors.push(
      `m1.analysis:${analysis.id}: evidenceManifestKeyとdetailR2KeyPatternは同時に定義してください`
    );
  }
}
const geoRoleCounts = new Map<string, number>();
const crossAnalysisCounts = new Map<string, number>();
for (const post of BUSINESS_PLAN_2026.m1.xPosts) {
  if ((post.caption.match(/\{\{url\}\}/g) ?? []).length !== 1) {
    errors.push(`m1.xPost:${post.id}: {{url}} は1個必要です`);
  }
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(post.status)) {
    errors.push(`m1.xPost:${post.id}: status が不正です`);
  }
  geoRoleCounts.set(post.geoRole, (geoRoleCounts.get(post.geoRole) ?? 0) + 1);
  if (post.imageKind !== 'geo-insight-card') {
    errors.push(`m1.xPost:${post.id}: Geo投稿にランキング画像を使えません`);
  }
  if (post.analysisIds.length === 0) {
    errors.push(`m1.xPost:${post.id}: analysisIds が空です`);
    continue;
  }
  const analyses = post.analysisIds
    .map((analysisId) => m1Analyses.get(analysisId))
    .filter((analysis) => analysis !== undefined);
  if (analyses.length !== post.analysisIds.length) {
    errors.push(`m1.xPost:${post.id}: 未定義analysisIdを参照しています`);
  }
  const availableMetricKeys = new Set(
    analyses.flatMap((analysis) => analysis.metricKeys)
  );
  if (!availableMetricKeys.has(post.claimMetricKey)) {
    errors.push(`m1.xPost:${post.id}: claimMetricKey が分析snapshot外です`);
  }
  if (!post.metricKeys.includes(post.claimMetricKey)) {
    errors.push(`m1.xPost:${post.id}: claimMetricKey をmetricKeysへ含めてください`);
  }
  const primaryAnalysis = analyses[0];
  const expectedUrl = buildM1XCanonicalUrl({
    analysisCount: post.analysisIds.length,
    geoRole: post.geoRole,
    analysisSlug: primaryAnalysis?.slug ?? '',
    highlightAreaCodes: post.visual.highlightAreaCodes,
  });
  if (post.canonicalUrl !== expectedUrl) {
    errors.push(`m1.xPost:${post.id}: canonicalUrl が分析と一致しません`);
  }
  if (post.geoRole === 'baseline') {
    if (
      post.analysisIds.length !== 1 ||
      primaryAnalysis?.analysisKind !== 'baseline' ||
      !['baseline-choropleth', 'focus'].includes(post.visual.mapMode)
    ) {
      errors.push(`m1.xPost:${post.id}: baseline契約に違反しています`);
    }
  } else if (post.geoRole === 'cross-analysis') {
    if (
      post.analysisIds.length !== 1 ||
      primaryAnalysis?.analysisKind !== 'spatial-cross' ||
      post.visual.mapMode === 'baseline-choropleth'
    ) {
      errors.push(`m1.xPost:${post.id}: cross-analysis契約に違反しています`);
    }
    if (primaryAnalysis) {
      crossAnalysisCounts.set(
        primaryAnalysis.id,
        (crossAnalysisCounts.get(primaryAnalysis.id) ?? 0) + 1
      );
    }
  } else if (post.analysisIds.length < 2) {
    errors.push(`m1.xPost:${post.id}: method/decision は複数分析が必要です`);
  }
  const expectedMediaPath = `.local/r2/sns/geo/${post.contentKey}/x/stills/${post.contentKey}.png`;
  if (post.mediaPath !== expectedMediaPath) {
    errors.push(`m1.xPost:${post.id}: mediaPath が規約外です`);
  }
  if (
    post.visual.highlightAreaCodes.some((areaCode) => !/^\d{5}$/.test(areaCode))
  ) {
    errors.push(`m1.xPost:${post.id}: highlightAreaCodes は5桁コードです`);
  }
  if (
    ['statement', 'method', 'layers'].includes(post.visual.panelKind) &&
    (post.visual.panelItems?.length ?? 0) === 0
  ) {
    errors.push(`m1.xPost:${post.id}: panelItems が必要です`);
  }
}
const expectedGeoRoleCounts = {
  baseline: 3,
  'cross-analysis': 9,
  method: 2,
  decision: 1,
} as const;
for (const [role, expected] of Object.entries(expectedGeoRoleCounts)) {
  const actual = geoRoleCounts.get(role) ?? 0;
  if (actual !== expected) {
    errors.push(`m1.xPosts:${role}: expected ${expected}, got ${actual}`);
  }
}
for (const analysis of BUSINESS_PLAN_2026.m1.analyses.filter(
  (item) => item.analysisKind === 'spatial-cross'
)) {
  const actual = crossAnalysisCounts.get(analysis.id) ?? 0;
  if (actual !== 3) {
    errors.push(`m1.xPosts:${analysis.id}: cross投稿は3件必要です: ${actual}`);
  }
}
for (const product of BUSINESS_PLAN_2026.m1.noteProducts) {
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(product.status)) {
    errors.push(`m1.noteProduct:${product.id}: status が不正です`);
  }
}
for (const item of [
  ...BUSINESS_PLAN_2026.contentOpportunities,
  ...BUSINESS_PLAN_2026.xIdeas,
  ...BUSINESS_PLAN_2026.noteProducts,
]) {
  if (!BUSINESS_PLAN_WORK_STATUSES.includes(item.status)) {
    errors.push(`${item.id}: status が不正です`);
  }
}

for (const owner of referencedOwners) {
  if (!agentIds.has(owner)) errors.push(`owner agent がありません: ${owner}`);
}
for (const skill of referencedSkills) {
  if (!skillMap.has(skill)) errors.push(`skill がありません: ${skill}`);
}

const dbConflict = BUSINESS_PLAN_2026.decisions.find(
  (decision) =>
    decision.chapter === 15 &&
    decision.status === 'adopted' &&
    /\b(?:D1|PostGIS)\b/i.test(`${decision.summary} ${decision.rationale}`)
);
if (dbConflict)
  errors.push(
    'chapter 15: D1/PostGISをadoptedにできません (完全DBレス正典と競合)'
  );

if (errors.length > 0) {
  console.error(errors.map((error) => `❌ ${error}`).join('\n'));
  console.error(`\n事業計画カタログ検証: ${errors.length} error(s)`);
  process.exitCode = 1;
} else {
  console.log(
    `✅ 事業計画カタログ: 25 decisions / 100 content / 30 X / 15 note products / ${referencedOwners.size} owners / ${referencedSkills.size} skills`
  );
}
