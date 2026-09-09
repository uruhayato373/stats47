import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const { THEME_CATALOGS } = require('../../../packages/data-configs/src/theme-catalog/index.ts');
const { values: options } = parseArgs({ options: {
  url: { type: 'string', default: 'http://127.0.0.1:3011' },
  out: { type: 'string', default: '.local/verification/themes/first-batch/browser' },
  'stage-dir': { type: 'string', default: '.local/r2' },
} });
const plan = JSON.parse(await readFile('.claude/skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json', 'utf8'));
const out = resolve(options.out);
await mkdir(out, { recursive: true });
const result = { observedAt: new Date().toISOString(), pages: [], rankings: [], areaPages: [], pass: false };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    for (const batch of plan.firstBatch) {
      const context = await browser.newContext({ viewport, locale: 'ja-JP', reducedMotion: 'reduce' });
      const observed = { themeKey: batch.themeKey, viewport, pageErrors: [], consoleErrors: [], comparisons: [], pass: false };
      result.pages.push(observed);
      try {
        await context.addCookies([{ name: 'stats47_consent', value: 'denied', url: options.url }, { name: 'preferred-prefecture', value: '13000', url: options.url }]);
        await context.addInitScript(() => localStorage.setItem('stats47_cookie_consent', 'denied'));
        await context.route(/(?:google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com)/, (route) => route.abort());
        const page = await context.newPage();
        page.on('pageerror', (error) => observed.pageErrors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') observed.consoleErrors.push(message.text()); });
        const response = await page.goto(`${options.url}/themes/${batch.themeKey}?pref=all`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        assert.equal(response?.status(), 200);
        await page.getByRole('table').first().waitFor({ timeout: 45000 });
        const catalog = THEME_CATALOGS[batch.themeKey];
        for (const prefecture of [null, '28000']) {
          if (prefecture) {
            await page.getByRole('combobox', { name: '都道府県を選択' }).first().click();
            await page.getByRole('option', { name: '兵庫県', exact: true }).click();
            await page.waitForURL(/pref=28000/);
          }
          for (const section of catalog.sections) {
            const chapter = page.locator(`#theme-section-${section.key}`);
            for (const groupKey of section.metricGroupKeys) {
              const group = catalog.metricGroups.find((item) => item.key === groupKey);
              for (const key of group.rankingKeys) {
                if (group.rankingKeys.length > 1) await chapter.getByRole('button', { name: catalog.metrics.find((metric) => metric.rankingKey === key).shortLabel, exact: true }).click();
                const data = JSON.parse(await readFile(resolve(options['stage-dir'], `app/ranking/${key}/values.json`), 'utf8'));
                const expected = data.partitions.find((partition) => partition.yearCode === group.comparisonYear).values.filter((row) => !prefecture || row.areaCode === prefecture);
                const table = chapter.getByRole('table');
                await table.locator('tbody tr').first().waitFor();
                const actual = await table.locator('tbody tr').allTextContents();
                assert.equal(actual.length, expected.length, `${key}: row count`);
                for (const value of expected) {
                  const row = table.locator('tbody tr').filter({ has: page.getByRole('cell', { name: value.areaName, exact: true }) });
                  const cells = await row.getByRole('cell').allTextContents();
                  assert.deepEqual(cells, [value.areaName, value.yearName, `${value.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} ${value.unit}`], `${key}/${value.areaCode}`);
                }
                observed.comparisons.push({ metricKey: key, comparisonYear: group.comparisonYear, prefecture, matchedRows: expected.length });
                await chapter.getByRole('button', { name: '棒グラフ', exact: true }).click();
                const bars = chapter.getByRole('region', { name: /棒グラフ$/ });
                assert.equal(await bars.locator('[style]').count(), expected.length);
                assert.ok((await bars.innerText()).includes(expected[0].areaName));
                if (group.comparisonMap) {
                  await chapter.getByRole('button', { name: 'タイル地図', exact: true }).click();
                  await chapter.locator('.pref-box').first().waitFor();
                  await page.waitForFunction(() => [...document.querySelectorAll('.pref-label')].length === 47 && [...document.querySelectorAll('.pref-label')].every((node) => Number(node.getAttribute('opacity')) === 1));
                  const cells = await chapter.locator('.pref-box').evaluateAll((nodes) => nodes.map((node) => ({ areaCode: String(node.__data__.id).padStart(2, '0') + '000', value: node.__data__.value })));
                  const all = data.partitions.find((partition) => partition.yearCode === group.comparisonYear).values;
                  assert.equal(cells.length, 47);
                  for (const cell of cells) assert.equal(cell.value, all.find((row) => row.areaCode === cell.areaCode).value);
                  observed.comparisons.push({ metricKey: key, comparisonYear: group.comparisonYear, view: 'map', prefecture, matchedRows: 47 });
                  await page.evaluate(() => window.scrollTo(0, 0));
                  await page.screenshot({ path: resolve(out, `${batch.themeKey}-${viewport.width}-${prefecture ?? 'all'}-map.png`), fullPage: true });
                }
                await chapter.getByRole('button', { name: '表', exact: true }).click();
              }
            }
          }
          assert.equal(await page.locator('h1').count(), 1);
          if (prefecture) assert.match(await page.locator('h1').innerText(), /兵庫県/);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({ path: resolve(out, `${batch.themeKey}-${viewport.width}-${prefecture ?? 'all'}.png`), fullPage: true });
        }
        await page.waitForTimeout(1200);
        assert.deepEqual(observed.pageErrors, []);
        observed.pass = true;
      } catch (error) { observed.error = error.stack ?? String(error); }
      finally { await context.close(); }
      await writeFile(resolve(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
      console.log(JSON.stringify({ theme: observed.themeKey, width: viewport.width, pass: observed.pass, error: observed.error }));
    }
  }
  for (const metric of plan.firstBatch.flatMap((batch) => batch.metrics).filter((metric) => metric.proposedMetricKey)) {
    const response = await fetch(`${options.url}/ranking/${metric.metricKey}`, { headers: { 'User-Agent': 'Googlebot' } });
    result.rankings.push({ metricKey: metric.metricKey, http: response.status, pass: response.ok });
  }
  for (const batch of plan.firstBatch) {
    const response = await fetch(`${options.url}/areas/28000/${batch.themeKey}`);
    const html = await response.text();
    result.areaPages.push({ themeKey: batch.themeKey, http: response.status, pass: response.ok && html.includes(`兵庫県の${THEME_CATALOGS[batch.themeKey].title}`) });
  }
  result.pass = result.pages.length === plan.firstBatch.length * 2 && result.pages.every((page) => page.pass) && result.rankings.every((page) => page.pass) && result.areaPages.every((page) => page.pass);
} finally {
  await browser.close();
  result.finishedAt = new Date().toISOString();
  await writeFile(resolve(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
}
process.exitCode = result.pass ? 0 : 1;
