#!/usr/bin/env tsx
/** Immutable note household snapshots → the same single-image layout for note, X and Instagram. */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { HOUSEHOLD_LAYOUT_VERSION, HOUSEHOLD_NOTE_VERSION, householdInputSchema, type Slide } from '../../../apps/remotion/src/features/note-household/model';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const hash = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
async function main() {
  const { values } = parseArgs({ options: { input: { type: 'string', multiple: true }, out: { type: 'string' }, 'note-only': { type: 'boolean', default: false } } });
  if (!values.input?.length || !values.out) throw Error('--input <固定snapshot.json>（複数指定可） --out <新しいdirectory>');
  const inputs = values.input.map(file => {
    const bytes = readFileSync(resolve(file)), input = householdInputSchema.parse(JSON.parse(bytes.toString()));
    return { input, bytes, sha256: hash(bytes) };
  });
  if (new Set(inputs.map(i => i.input.sourceArticle.key)).size !== inputs.length) throw Error('記事keyが重複しています');
  const out = resolve(values.out);
  if (existsSync(out)) throw Error('既存成果物を保護しました。新しい --out を指定してください');
  const rendererPaths = ['apps/remotion/src/features/note-household/model.ts', 'apps/remotion/src/features/note-household/HouseholdNote.tsx', 'apps/remotion/src/features/note-household/entry.tsx', 'apps/web/src/features/ogp/brand.ts', 'apps/remotion/src/features/buzz-map/useBuzzMapFonts.ts'];
  const rendererFiles = rendererPaths.map(file => ({ file, sha256: hash(readFileSync(join(ROOT, file))), source: readFileSync(join(ROOT, file), 'utf8') }));
  const fontRoot = join(ROOT, 'apps/remotion/public/buzz-map/fonts');
  const fontFiles = readdirSync(fontRoot).filter(f => f.endsWith('.woff2')).map(file => ({ file, sha256: hash(readFileSync(join(fontRoot, file))) }));
  const temp = mkdtempSync(join(tmpdir(), 'stats47-household-layout-'));
  cpSync(fontRoot, join(temp, 'public/buzz-map/fonts'), { recursive: true });
  const serveUrl = await bundle({ entryPoint: join(ROOT, rendererPaths[2]), publicDir: join(temp, 'public'), outDir: join(temp, 'bundle'), enableCaching: false });
  const browser = await openBrowser('chrome', { browserExecutable: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const focusByKey: Record<string, string[]> = { 'a-kakei-aichi': ['住居', '被服及び履物'], 'a-kakei-aomori': ['光熱・水道', '教育'], 'a-kakei-hokkaido': ['住居', '光熱・水道'] };
  try {
    for (const source of inputs) {
      const key = source.input.sourceArticle.key, focus = focusByKey[key];
      if (!focus) throw Error('導入の費目を指定していない記事です: ' + key);
      const target = join(out, key);
      mkdirSync(target, { recursive: true });
      writeFileSync(join(target, 'source-input.json'), source.bytes);
      const outputs: { file: string; slide: Slide; platform: string; sha256: string; width: number; height: number }[] = [];
      const targets: [string, Slide[]][] = values['note-only'] ? [['note', ['note']]] : [['x', ['x']], ['instagram', ['x']]];
      for (const [platform, slides] of targets) {
        for (const slide of slides) {
          const file = `${platform}/stills/household-bars-1080x1350.png`;
          const inputProps = { input: source.input, focus, slide };
          const composition = await selectComposition({ serveUrl, id: platform === 'note' ? 'NoteHousehold-Note' : 'NoteHousehold', inputProps, puppeteerInstance: browser, timeoutInMilliseconds: 60000 });
          mkdirSync(dirname(join(target, file)), { recursive: true });
          await renderStill({ serveUrl, composition, inputProps, output: join(target, file), imageFormat: 'png', puppeteerInstance: browser, timeoutInMilliseconds: 60000 });
          outputs.push({ file, platform, slide, sha256: hash(readFileSync(join(target, file))), width: composition.width, height: composition.height });
        }
      }
      if (outputs.length !== (values['note-only'] ? 1 : 2) || new Set(outputs.map(o => o.sha256)).size !== 1) throw Error('共通型の画像が媒体間で一致しません');
      const version = values['note-only'] ? HOUSEHOLD_NOTE_VERSION : HOUSEHOLD_LAYOUT_VERSION;
      writeFileSync(join(target, 'production.json'), JSON.stringify({ schemaVersion: 1, version, sourceInputSha256: source.sha256, sourceArticle: source.input.sourceArticle, input: source.input, focus, rendererFiles, fontFiles, outputs }, null, 2) + '\n');
      console.log(JSON.stringify({ key, outputs: outputs.length, version }));
    }
  } finally { await browser.close({ silent: true }); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
