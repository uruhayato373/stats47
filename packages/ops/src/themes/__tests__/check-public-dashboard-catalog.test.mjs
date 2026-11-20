import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadCatalog,
  validateCatalog,
} from '../check-public-dashboard-catalog.mjs';

function cloneCatalog() {
  return structuredClone(loadCatalog());
}

test('committed public dashboard catalog satisfies the contract', () => {
  const result = validateCatalog(loadCatalog());

  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.resasStories, 40);
  assert.equal(result.summary.themeKeys, 20);
  assert.ok(result.summary.dashboards >= 15);
  assert.ok(result.summary.stories >= 71);
  assert.ok(result.summary.localDashboards >= 7);
});

test('missing RESAS menu item fails closed', () => {
  const catalog = cloneCatalog();
  catalog.stories = catalog.stories.filter(
    (story) => story.id !== 'resas-medical-supply-demand'
  );

  const result = validateCatalog(catalog);

  assert.ok(
    result.errors.some((error) =>
      error.includes('RESAS inventory must contain 40 stories')
    )
  );
  assert.ok(
    result.errors.some((error) =>
      error.includes('RESAS story missing: 医療需給分析')
    )
  );
});

test('non-official source URL fails closed', () => {
  const catalog = cloneCatalog();
  catalog.stories[0].sourceUrl = 'https://example.com/unverified-dashboard';

  const result = validateCatalog(catalog);

  assert.ok(
    result.errors.some((error) =>
      error.includes('sourceUrl is not an allowlisted official HTTPS URL')
    )
  );
});

test('duplicate story id fails closed', () => {
  const catalog = cloneCatalog();
  catalog.stories[1].id = catalog.stories[0].id;

  const result = validateCatalog(catalog);

  assert.ok(
    result.errors.some((error) => error.includes('duplicate story id'))
  );
});

test('every current stats47 theme must retain a dashboard story', () => {
  const catalog = cloneCatalog();
  const portStory = catalog.stories.find(
    (story) => story.id === 'mlit-port-infrastructure-utilization'
  );
  portStory.stats47ThemeKeys = [];

  const result = validateCatalog(catalog);

  assert.ok(
    result.errors.some((error) =>
      error.includes('stats47 theme has no dashboard story: ports')
    )
  );
});
