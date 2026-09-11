/** Public page checks; raw failures are CI artifacts, never a new data source. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { THEME_CATALOGS } from '../../../packages/data-configs/src/theme-catalog/index';
import { runtimeFindings } from './theme-followup-core.mjs';

async function main() {
  const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const { values: cli } = parseArgs({
    options: {
      url: { type: 'string', default: 'https://stats47.jp' },
      themes: { type: 'string' },
    },
  });
  const base = new URL(cli.url!);
  if (
    base.origin !== 'https://stats47.jp' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
  )
    throw new Error('Unsupported audit origin');
  const requested = cli.themes?.split(',');
  if (requested?.some((k) => !Object.hasOwn(THEME_CATALOGS, k)))
    throw new Error('Unknown theme');
  const catalogs = Object.values(THEME_CATALOGS).filter(
    (c) => !requested || requested.includes(c.key)
  );
  const out = path.join(ROOT, '.local/ci/theme-followup');
  await fs.mkdir(out, { recursive: true });
  type Chart = {
    key: string | null;
    state: string | null;
    type: string | null;
    text: string;
  };
  type Case = {
    themeKey: string;
    width: number;
    url: string;
    http: number | null;
    htmlClosed: boolean;
    htmlIntegrity: string | null;
    buildId: string | null;
    headers: Record<string, string>;
    h1: string[];
    sections: {
      key: string;
      count: number;
      cards: number;
      expectedCards: number;
    }[];
    expectedChartKeys: string[];
    cards: { state: string | null }[];
    charts: Chart[];
    pageErrors: string[];
    networkErrors: {
      url: string;
      status: number;
      headers: Record<string, string>;
    }[];
    scrollWidth: number;
    selectors: number;
    findings: string[];
    pass: boolean;
  };
  const result = {
    schemaVersion: 1,
    startedAt: new Date().toISOString(),
    finishedAt: null as string | null,
    cases: [] as Case[],
    summary: { expected: catalogs.length * 2, checked: 0, failed: 0 },
  };
  const save = () =>
    fs.writeFile(
      path.join(out, 'runtime.json'),
      JSON.stringify(result, null, 2) + '\n'
    );
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390])
      for (const catalog of catalogs) {
        const r: Case = {
          themeKey: catalog.key,
          width,
          url: `${base.origin}/themes/${catalog.key}?pref=all`,
          http: null,
          htmlClosed: false,
          htmlIntegrity: null,
          buildId: null,
          headers: {},
          h1: [],
          sections: [],
          expectedChartKeys: catalog.charts
            .filter(
              (c) => !['kpi-card', 'markdown-section'].includes(c.componentType)
            )
            .map((c) => c.componentKey),
          cards: [],
          charts: [],
          pageErrors: [],
          networkErrors: [],
          scrollWidth: 0,
          selectors: 0,
          findings: [],
          pass: false,
        };
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 1000 },
          locale: 'ja-JP',
          reducedMotion: 'reduce',
        });
        let html = '';
        const page = await context.newPage();
        const pending: Promise<void>[] = [];
        try {
          await context.addCookies([
            { name: 'stats47_consent', value: 'denied', url: base.origin },
          ]);
          await context.addInitScript(() =>
            localStorage.setItem('stats47_cookie_consent', 'denied')
          );
          await context.route(
            /google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com/,
            (route) => route.abort()
          );
          page.on('pageerror', (e) => r.pageErrors.push(e.message));
          page.on('response', (response) => {
            if (
              response.status() < 400 ||
              new URL(response.url()).origin !== base.origin
            )
              return;
            pending.push(
              (async () => {
                const headers = await response.allHeaders();
                const n = r.networkErrors.length;
                r.networkErrors.push({
                  url: response.url(),
                  status: response.status(),
                  headers: {
                    'cf-ray': headers['cf-ray'] ?? '',
                    'content-type': headers['content-type'] ?? '',
                    'cf-cache-status': headers['cf-cache-status'] ?? '',
                  },
                });
                const body = await response
                  .body()
                  .catch(() => Buffer.from('Response body unavailable'));
                await fs.writeFile(
                  path.join(out, `${catalog.key}-${width}-http-${n}.txt`),
                  body.subarray(0, 1024 * 1024)
                );
              })().catch((error) => {
                r.findings.push(`response-capture:${String(error)}`);
              })
            );
          });
          const response = await page.goto(r.url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
          r.http = response?.status() ?? null;
          if (response) {
            const headers = await response.allHeaders();
            r.headers = Object.fromEntries(
              [
                'cf-ray',
                'cf-cache-status',
                'content-type',
                'x-html-integrity',
              ].map((k) => [k, headers[k] ?? ''])
            );
            html = await response.text();
            r.htmlClosed = /<\/html>/i.test(html.slice(-2048));
            r.htmlIntegrity = headers['x-html-integrity'] ?? null;
            r.buildId =
              html
                .replaceAll('\\"', '"')
                .match(/"b":"([A-Za-z0-9_-]+)"/)?.[1] ?? null;
          }
          await page.locator('h1').first().waitFor({ timeout: 15000 });
          for (const section of catalog.sections ?? []) {
            const locator = page.locator(`#theme-section-${section.key}`);
            const count = await locator.count();
            r.sections.push({
              key: section.key,
              count,
              cards: -1,
              expectedCards: section.metricGroupKeys.length,
            });
            if (count) await locator.first().scrollIntoViewIfNeeded();
          }
          await page
            .waitForFunction(
              () =>
                !document.querySelector(
                  '[data-theme-chart="true"][data-data-state="loading"]'
                ),
              {},
              { timeout: 20000 }
            )
            .catch(() => {});
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve))
              )
          );
          for (const section of r.sections) {
            section.cards = await page
              .locator(
                `#theme-section-${section.key} [data-theme-component-type="kpi-card"]`
              )
              .count();
          }
          r.h1 = await page.locator('h1').allTextContents();
          r.cards = await page
            .locator('[data-theme-component-type="kpi-card"]')
            .evaluateAll((nodes) =>
              nodes.map((el) => ({ state: el.getAttribute('data-data-state') }))
            );
          r.charts = await page
            .locator('[data-theme-chart="true"]')
            .evaluateAll((nodes) =>
              nodes.map((el) => ({
                key: el.getAttribute('data-theme-component-key'),
                state: el.getAttribute('data-data-state'),
                type: el.getAttribute('data-theme-component-type'),
                text: (el.textContent ?? '').slice(0, 500),
              }))
            );
          r.scrollWidth = await page.evaluate(
            () => document.documentElement.scrollWidth
          );
          r.selectors = await page
            .getByRole('combobox', { name: '都道府県を選択' })
            .count();
        } catch (error) {
          r.findings.push(String(error));
        } finally {
          await Promise.all(pending);
          r.findings.push(...runtimeFindings(r));
          r.pass = r.findings.length === 0;
          if (!r.pass) {
            await fs.writeFile(
              path.join(out, `${catalog.key}-${width}-document.html`),
              html
            );
            await page
              .screenshot({
                path: path.join(out, `${catalog.key}-${width}.png`),
                fullPage: false,
              })
              .catch(() => {});
          }
          await context.close();
          result.cases.push(r);
          result.summary.checked++;
          if (!r.pass) result.summary.failed++;
          await save();
          console.log(
            JSON.stringify({
              themeKey: r.themeKey,
              width,
              pass: r.pass,
              findings: r.findings,
            })
          );
        }
      }
  } finally {
    await browser.close();
    result.finishedAt = new Date().toISOString();
    await save();
  }
  if (
    result.summary.failed ||
    result.summary.checked !== result.summary.expected
  )
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
