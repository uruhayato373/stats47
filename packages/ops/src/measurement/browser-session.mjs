import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { scopedState } from './sources.mjs';

export function unattended() {
  return Boolean(process.env.MEASUREMENT_BROWSER_SOURCE);
}

export function markMeasurementAuthenticated(source) {
  if (!unattended()) return;
  if (source !== process.env.MEASUREMENT_BROWSER_SOURCE) throw new Error('session_source_mismatch');
  writeFileSync(`${process.env.MEASUREMENT_BROWSER_OUTPUT_STATE_PATH}.verified`, source, { mode: 0o600 });
}

/** A fresh browser per collector; credentials are supplied only as an ephemeral file. */
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
    try {
      const next = scopedState(source, await context.storageState({ indexedDB: true }));
      writeFileSync(process.env.MEASUREMENT_BROWSER_OUTPUT_STATE_PATH, JSON.stringify(next), { mode: 0o600 });
    } finally { await close(); await browser.close(); }
  };
  return context;
}
