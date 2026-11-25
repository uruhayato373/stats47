import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { scopedState } from './sources.mjs';

export function unattended() {
  return Boolean(process.env.MEASUREMENT_BROWSER_SOURCE);
}

/**
 * A fresh browser per collector; credentials are supplied only as an ephemeral file.
 * 取得後のセッションの書き出し (refreshed.json) と認証済みの印 (.verified) は 2026-11-24 に外した。
 * collect.mjs がどちらも読まず、書くだけだったため (DOCS-DRIFT-FOLLOWUP-01)。
 */
export async function measurementContext(source, { acceptDownloads = true } = {}) {
  if (!unattended()) return null;
  if (source !== process.env.MEASUREMENT_BROWSER_SOURCE) throw new Error('session_source_mismatch');
  const state = scopedState(source, JSON.parse(readFileSync(process.env.MEASUREMENT_BROWSER_STATE_PATH, 'utf8')));
  const browser = await chromium.launch({ headless: !process.env.DISPLAY });
  let context;
  try {
    context = await browser.newContext({ storageState: state, acceptDownloads, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', viewport: { width: 1440, height: 1000 } });
  } catch (error) { await browser.close(); throw error; }
  const close = context.close.bind(context);
  let closed = false;
  context.close = async () => {
    if (closed) return;
    closed = true;
    try { await close(); } finally { await browser.close(); }
  };
  return context;
}
