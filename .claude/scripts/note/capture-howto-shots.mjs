#!/usr/bin/env node
/**
 * capture-howto-shots.mjs — 操作手順の記事 (note の H シリーズなど) に使う画面のスクリーンショットを、
 * 撮影手順を書いた JSON から Playwright で撮る。注目箇所に赤枠を付け、マニフェスト (URL・撮影日時・SHA) を残す。
 *
 *   node .claude/scripts/note/capture-howto-shots.mjs --spec <shots.json> --out <dir>
 *
 * shots.json:
 *   { "baseUrl": "https://stats47.jp", "viewport": { "width": 1280, "height": 800 },
 *     "shots": [ { "name": "01-download-card", "url": "/ranking/total-population",
 *                  "steps": [ { "scrollTo": "text=このデータを使う" }, { "click": "text=ダウンロード" }, { "wait": 500 } ],
 *                  "highlight": ["a:has-text('ダウンロード')"], "clip": "section:has-text('このデータを使う')" } ] }
 *
 * - ログインが要るサイト・本人の画面は撮らない (公開ページだけ)。認証や CAPTCHA は扱わない。
 * - clip を省くとビューポート全体。"fullPage": true でページ全体。
 * - step に "optional": true を付けると、要素が無くても止めない (Cookie の同意バナーなど出たり出なかったりするもの)。
 *   Cookie バナーはプライバシーを守る側 (「拒否」) で閉じる。
 * - 読み込みは domcontentloaded の後に settleMs (既定 3000ms) 待つ。広告・計測が続くページは networkidle に届かないため。
 * - 出力は作業ディレクトリ (既定 .local/howto-shots/<spec 名>/)。note 記事に使うときは記事の作業コピーへ移し、
 *   `npm run note:article -- save <key>` で R2 へ保存する (画像を git に置かない: .claude/rules/note-image-assets.md)。
 * - ダウンロードを起こす click は、ブラウザのダウンロードを受けて捨てる (ファイルは保存しない)。
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);

const HIGHLIGHT_STYLE = 'outline: 4px solid #e53935 !important; outline-offset: 4px !important; border-radius: 2px;';
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const NAV_TIMEOUT_MS = 60_000;
const DEFAULT_SETTLE_MS = 3_000;
const STEP_TIMEOUT_MS = 15_000;

export function validateSpec(spec) {
  if (!spec || !Array.isArray(spec.shots) || spec.shots.length === 0) throw new Error('shots が空');
  if (!/^https:\/\//.test(spec.baseUrl ?? '')) throw new Error('baseUrl は https:// で始まる公開 URL にする');
  const names = new Set();
  for (const shot of spec.shots) {
    if (!/^[a-z0-9-]+$/.test(shot.name ?? '')) throw new Error(`name は英小文字・数字・ハイフン: ${shot.name}`);
    if (names.has(shot.name)) throw new Error(`name が重複: ${shot.name}`);
    names.add(shot.name);
    if (typeof shot.url !== 'string' || !shot.url.startsWith('/')) throw new Error(`url は / で始まる baseUrl からの相対パス: ${shot.name}`);
    for (const step of shot.steps ?? []) {
      const kinds = ['click', 'scrollTo', 'wait', 'fill'].filter((k) => k in step);
      if (kinds.length !== 1) throw new Error(`step は click / scrollTo / wait / fill のどれか 1 つ: ${shot.name}`);
    }
  }
  return spec;
}

async function runStep(page, step) {
  if (step.optional) {
    try { await runStep(page, { ...step, optional: false, timeoutMs: 3_000 }); } catch { /* 無ければ飛ばす */ }
    return undefined;
  }
  const timeout = step.timeoutMs ?? STEP_TIMEOUT_MS;
  if ('wait' in step) return page.waitForTimeout(Number(step.wait));
  if ('scrollTo' in step) return page.locator(step.scrollTo).first().scrollIntoViewIfNeeded({ timeout });
  if ('fill' in step) return page.locator(step.fill).first().fill(String(step.value ?? ''), { timeout });
  return page.locator(step.click).first().click({ timeout });
}

async function capture(spec, outDir) {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: spec.viewport ?? DEFAULT_VIEWPORT, locale: 'ja-JP', acceptDownloads: true });
  const results = [];
  try {
    for (const shot of spec.shots) {
      const page = await context.newPage();
      page.on('download', (d) => d.cancel().catch(() => {}));
      const url = new URL(shot.url, spec.baseUrl).toString();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
      await page.waitForTimeout(spec.settleMs ?? DEFAULT_SETTLE_MS);
      for (const step of shot.steps ?? []) await runStep(page, step);
      for (const selector of shot.highlight ?? []) {
        await page.locator(selector).first().evaluate((el, style) => el.setAttribute('style', `${el.getAttribute('style') ?? ''};${style}`), HIGHLIGHT_STYLE);
      }
      const file = path.join(outDir, `${shot.name}.png`);
      if (shot.clip) await page.locator(shot.clip).first().screenshot({ path: file, timeout: STEP_TIMEOUT_MS });
      else await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
      const bytes = readFileSync(file);
      results.push({ name: shot.name, file: path.basename(file), url, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
      console.log(`[shot] ${shot.name} ← ${url}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const manifest = { schemaVersion: 1, capturedAt: new Date().toISOString(), baseUrl: spec.baseUrl, viewport: spec.viewport ?? DEFAULT_VIEWPORT, shots: results };
  writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const specPath = arg('--spec');
  if (!specPath) { console.error('Usage: capture-howto-shots.mjs --spec <shots.json> [--out <dir>]'); process.exit(2); }
  const spec = validateSpec(JSON.parse(readFileSync(specPath, 'utf8')));
  const outDir = path.resolve(arg('--out') ?? path.join(ROOT, '.local/howto-shots', path.basename(specPath, '.json')));
  const manifest = await capture(spec, outDir);
  console.log(`[done] ${manifest.shots.length} shots → ${outDir}`);
}
