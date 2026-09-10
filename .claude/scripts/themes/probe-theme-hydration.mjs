import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';

// Read-only browser regression probe. Artifacts stay in the ignored local directory.
const { values: options } = parseArgs({ options: {
  url: { type: 'string', default: 'http://127.0.0.1:3000' },
  out: { type: 'string', default: '.local/verification/themes/hydration' },
  prefix: { type: 'string', default: 'ui-hydration' },
  mobile: { type: 'boolean', default: false },
  scenarios: { type: 'string' },
  diagnostic: { type: 'string' },
  timeout: { type: 'string', default: '60000' },
} });
const baseUrl = options.url.replace(/\/$/, '');
const outPath = resolve(options.out);
await mkdir(outPath, { recursive: true });
const outDir = pathToFileURL(outPath + '/');
const artifactPrefix = options.prefix;
if (!/^[a-zA-Z0-9_-]+$/.test(artifactPrefix)) throw new Error('Invalid artifact prefix');
const navigationTimeout = Number(options.timeout);
const viewport = options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
const scenarioFilter = options.scenarios?.split(',');
const scenarios = [
  { name: 'fresh-context' },
  { name: 'after-real-income', previous: 'real-income' },
  { name: 'same-prefecture-cookie', cookie: '28000' },
  { name: 'different-prefecture-cookie', cookie: '13000' },
].filter((scenario) => !scenarioFilter || scenarioFilter.includes(scenario.name));
if (!scenarios.length) throw new Error('No matching probe scenarios');
const output = { startedAt: new Date().toISOString(), probes: [] };
const save = () => writeFile(new URL(`${artifactPrefix}-probe.json`, outDir), JSON.stringify(output, null, 2) + '\n');
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', locale: 'ja-JP' });
    const result = { scenario: scenario.name, viewport, pageErrors: [], consoleErrors: [] };
    try {
      await context.addCookies([{ name: 'stats47_consent', value: 'denied', url: baseUrl }, ...(scenario.cookie ? [{ name: 'preferred-prefecture', value: scenario.cookie, url: baseUrl }] : [])]);
      await context.addInitScript(() => localStorage.setItem('stats47_cookie_consent', 'denied'));
      await context.route(/(?:google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com)/, (route) => route.abort());
      if (options.diagnostic) {
        const diagnostic = await import(pathToFileURL(resolve(options.diagnostic)).href);
        await diagnostic.default(context);
      }
      if (scenario.previous) {
        const previous = await context.newPage();
        result.previousPageErrors = [];
        result.previousConsoleErrors = [];
        previous.on('pageerror', (error) => result.previousPageErrors.push({ message: error.message, stack: error.stack }));
        previous.on('console', (message) => { if (message.type() === 'error') result.previousConsoleErrors.push({ text: message.text(), location: message.location() }); });
        const previousResponse = await previous.goto(`${baseUrl}/themes/${scenario.previous}?pref=28000`, { waitUntil: 'domcontentloaded', timeout: navigationTimeout });
        if (!previousResponse?.ok()) throw new Error(`Previous page HTTP ${previousResponse?.status()}`);
        await previous.locator('h1').waitFor({ timeout: 45000 });
        await previous.waitForTimeout(3000);
        await previous.close();
      }
      result.beforeCookies = (await context.cookies()).filter((cookie) => ['preferred-prefecture', 'stats47_consent'].includes(cookie.name)).map(({ name, value }) => ({ name, value }));
      const page = await context.newPage();
      page.on('pageerror', (error) => result.pageErrors.push({ message: error.message, stack: error.stack }));
      page.on('console', async (message) => {
        if (message.type() !== 'error') return;
        const args = await Promise.all(message.args().map((argument) => argument.evaluate((value) => value instanceof Error ? { message: value.message, stack: value.stack } : value).catch(() => null)));
        result.consoleErrors.push({ text: message.text(), location: message.location(), args });
      });
      const response = await page.goto(`${baseUrl}/themes/roads?pref=28000`, { waitUntil: 'domcontentloaded', timeout: navigationTimeout });
      if (!response?.ok()) throw new Error(`Roads page HTTP ${response?.status()}`);
      await page.locator('h1').waitFor({ timeout: 45000 });
      const html = await response.text();
      result.status = response.status();
      result.ssr = { sha256: createHash('sha256').update(html).digest('hex'), bytes: Buffer.byteLength(html), h1: [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((match) => match[1]) };
      await page.waitForTimeout(6000);
      result.client = { h1: await page.locator('h1').allTextContents(), controls: await page.getByRole('combobox').allTextContents(), url: page.url(), localStorage: await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]))) };
      result.afterCookies = (await context.cookies()).filter((cookie) => ['preferred-prefecture', 'stats47_consent'].includes(cookie.name)).map(({ name, value }) => ({ name, value }));
      result.pass = result.status === 200 && result.pageErrors.length === 0 && result.client.h1.length === 1 && result.client.h1[0] === '兵庫県の道路';
      if (result.pageErrors.length) {
        await writeFile(new URL(`${artifactPrefix}-${scenario.name}-server.html`, outDir), html);
        await writeFile(new URL(`${artifactPrefix}-${scenario.name}-client.html`, outDir), await page.content());
      }
    } catch (error) { result.error = String(error); result.pass = false; }
    finally { await context.close(); output.probes.push(result); await save(); console.log(JSON.stringify({ scenario: result.scenario, pass: result.pass, pageErrors: result.pageErrors, error: result.error })); }
  }
} finally {
  await browser?.close();
  output.finishedAt = new Date().toISOString();
  output.pass = output.probes.length === scenarios.length && output.probes.every((probe) => probe.pass);
  await save();
}
process.exitCode = output.pass ? 0 : 1;
