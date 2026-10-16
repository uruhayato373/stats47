import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import {
  filenameTemplate,
  resolveClassification,
  imageTasks,
  inventoryGaps,
  auditClassification,
} from '../lib/classification.mjs';
const basis = 'a'.repeat(64);
const classify = (patch) =>
  resolveClassification({ file: 'image-1.png', basis, ...patch });
test('topic and generic image names do not invent a chart type', () => {
  for (const file of ['image-01.png', 'chart-1.png', 'change.png'])
    assert.equal(filenameTemplate(file), 'unclassified');
  for (const [file, type] of [
    ['boxplot.png', 'boxplot'],
    ['infographic-1-model-radar.svg', 'radar'],
    ['infographic-2-cost-pie.png', 'pie'],
    ['table-1.svg', 'table'],
  ])
    assert.equal(filenameTemplate(file), type);
  assert.equal(
    classify({ file: 'app/blog/aging-heatmap/article.md#svg-1' }).status,
    'pending'
  );
  assert.equal(classify({ file: 'images/image-01.png' }).status, 'pending');
  assert.equal(classify({ file: 'choropleth-map.svg' }).status, 'suggested');
});
test('covers and non-chart slides are explicit types with separate roles', () => {
  const cover = classify({
    kind: 'cover',
    record: { templateId: 'household' },
  });
  assert.equal(cover.templateId, 'note-cover');
  assert.equal(cover.role, 'title');
  for (const [slide, type, role] of [
    ['cover', 'title-card', 'title'],
    ['source', 'source-card', 'source'],
    ['cta', 'cta-card', 'navigation'],
    ['caution', 'caution-card', 'caution'],
    ['highlights', 'summary-card', 'summary'],
  ]) {
    const result = classify({
      source: `slide-2-${slide}-1080x1350.png`,
      templateId: 'ranking',
    });
    assert.equal(result.templateId, type);
    assert.equal(result.role, role);
    assert.equal(result.status, 'recorded');
  }
});
test('manual decisions survive heuristics but become stale on new evidence', () => {
  const record = {
    templateId: 'diagram',
    classification: {
      role: 'diagram',
      basis,
      reason: '実画像で関係図と確認', purpose:'explanation', selection:'na',
      updatedAt: '2026-10-16',
    },
  };
  assert.equal(classify({ record, templateId: 'ranking' }).status, 'confirmed');
  assert.equal(classify({ record, basis: 'b'.repeat(64) }).status, 'stale');
  assert.equal(
    classify({ record, basis: 'b'.repeat(64) }).templateId,
    'diagram'
  );
});
test('current-image review does not imply that missing numeric inputs are preserved', () => {
  const image = {
    classification: classify({ templateId: 'bar', origin: 'contract' }),
    original: { sha256: basis },
    inputFiles: [{ name: 'article.md', role: 'article', sha256: basis }],
    policy: '',
    assessmentMatches: true,
    assessment: { status: 'pass' },
  };
  assert.deepEqual(imageTasks(image), ['inputs', 'kept']);
  assert.deepEqual(
    imageTasks({
      ...image,
      inputFiles: [{ name: 'chart-data.json', role: 'data', sha256: basis }],
    }),
    ['kept']
  );
  assert.ok(
    imageTasks({ ...image, assessmentMatches: false }).includes('candidate')
  );
});
test('no-assets decisions must match the current post and stale indexes stay visible', () => {
  const sources = {
    articles: [{ key: 'n', body: { manifest: { sha256: basis } } }],
    covers: [],
    posts: [{ id: 1, platform: 'x', assets: [] }],
  };
  const inventory = {
    articles: { n: { status: 'indexed', manifestSha: 'old' } },
  };
  const web = { items: [{ id: 'web/blog/a', indexComplete: false }] };
  const review = {
    'sns/1': {
      basis,
      imageInventory: 'no-assets',
      inventoryReason: '公開したテキスト投稿を確認',
    },
  };
  const gaps = inventoryGaps(sources, inventory, web, review, [
    { id: 'sns/1', basis },
  ]);
  assert.equal(gaps.filter((g) => g.owner === 'note/n').length, 2);
  assert.ok(gaps.some((g) => g.owner === 'web/blog/a'));
  assert.ok(!gaps.some((g) => g.owner === 'sns/1'));
  assert.ok(
    inventoryGaps(sources, inventory, web, review, [
      { id: 'sns/1', basis: 'new' },
    ]).some((g) => g.owner === 'sns/1')
  );
});
test('coverage gate fails if any image disappears from work queues or receives an unknown type', () => {
  const image = {
    id: 'test',
    templateId: 'unclassified',
    classification: classify({}),
    original: null,
    inputFiles: [],
    policy: '',
  };
  image.tasks = imageTasks(image);
  assert.equal(auditClassification([image], [{ id: 'unclassified' }]).total, 1);
  assert.throws(
    () =>
      auditClassification([{ ...image, tasks: [] }], [{ id: 'unclassified' }]),
    /Missing image task/
  );
  assert.throws(
    () =>
      auditClassification(
        [{ ...image, templateId: 'made-up' }],
        [{ id: 'unclassified' }]
      ),
    /classification contract/
  );
});

test('ledger-only PRs cannot skip the image coverage and regression gates', () => {
  const workflow = yaml.load(
    fs.readFileSync(
      new URL(
        '../../../../.github/workflows/pr-quality-check.yml',
        import.meta.url
      ),
      'utf8'
    )
  );
  const job = workflow.jobs['contract-tests'];
  assert.equal(job.if, undefined);
  const gate = job.steps.find((step) =>
    step.run?.includes('npm run media:check')
  );
  assert.ok(gate);
  assert.equal(gate.if, undefined);
  assert.notEqual(gate['continue-on-error'], true);
  assert.ok(gate.run.includes('npm run media:test'));
  assert.ok(workflow.jobs['quality-check'].needs.includes('contract-tests'));
});
