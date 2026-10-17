#!/usr/bin/env node
/** Local materials → existing IDs or pending candidates. Dry-run by default. No publish/schedule. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { findMaterialPost, materialKey, prepareMaterial } from './lib/material-reconciliation.mjs';
import { archiveFile, resolveDriveRoot, verifyArchivedAssets } from './lib/sns-drive-assets.mjs';

const { values } = parseArgs({ options: {
  input: { type: 'string' }, root: { type: 'string' }, report: { type: 'string' },
  apply: { type: 'boolean', default: false },
}});
if (!values.input) throw new Error('--input <JSON配列> が必要です。platform/domain/content_key/batch と任意の title/caption/origin/note');
const root = path.resolve(values.root ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..'));
const require = createRequire(import.meta.url);
const store = require(path.join(root, '.claude/scripts/lib/sns-posts-store.cjs'));
const input = JSON.parse(fs.readFileSync(values.input, 'utf8'));
if (!Array.isArray(input) || input.some(m => !/^\d{4}-\d{2}-\d{2}$/.test(m.batch))) throw new Error('input は batch (YYYY-MM-DD) を持つ配列にしてください');
if (new Set(input.map(materialKey)).size !== input.length) throw new Error('入力の素材キーが重複しています');
const beforeBytes = fs.readFileSync(store.STORE_PATH);
const before = store.loadAll();
const prepared = input.map(m => prepareMaterial(root, m));
// Resolve the entire batch before any writes; ambiguous matches fail closed.
const plan = prepared.map(m => ({ ...m, existing: findMaterialPost(before, m, m.files) }));
const rows = [];
const fresh = [];
if (values.apply) {
  const driveRoot = null; // New images are preserved in R2; videos resolve Drive lazily.
  // Concurrent work must not be overwritten by a stale plan.
  if (!fs.readFileSync(store.STORE_PATH).equals(beforeBytes)) throw new Error('台帳が更新されました。再度dry-runしてください');
  fs.writeFileSync(path.join('/tmp', `sns-posts-before-${Date.now()}.json`), beforeBytes, { flag: 'wx' });
  for (const m of plan) {
    const key = materialKey(m);
    let post = m.existing ? store.getById(m.existing.id) : null;
    if (post) {
      if (!post.material_keys?.includes(key)) post = store.updateById(post.id, {
        material_keys: [...(post.material_keys ?? []), key],
      });
    } else {
      // Archive before insert: a failed copy never leaves a half-registered draft.
      const ledgerBytes = fs.readFileSync(store.STORE_PATH);
      const ledger = JSON.parse(ledgerBytes);
      const id = Math.max(Math.max(...ledger.posts.map(p => p.id), 0) + 1, ledger._meta?.nextId ?? 1);
      const assets = [];
      for (const [index, file] of m.files.entries()) {
        assets.push(await archiveFile({ driveRoot, platform: m.platform, id,
          role: m.record.planning.preview_only ? 'thumbnail' : file.endsWith('.mp4') ? 'video' : m.platform === 'instagram' && m.files.length > 1 ? 'slide' : 'image',
          order: index + 1, sourceFile: path.join(root, file), source: file,
        }));
      }
      if (!fs.readFileSync(store.STORE_PATH).equals(ledgerBytes)) throw new Error('保全中に台帳が更新されました。再実行してください');
      post = store.insert({ ...m.record, assets });
      if (post.id !== id) throw new Error('採番が一致しません');
      fresh.push(post);
    }
    rows.push({ material_key: key, id: post.id, action: m.existing ? 'linked-existing' : 'registered', status: post.status, preview_only: post.planning?.preview_only ?? false });
  }
  const check = await verifyArchivedAssets(fresh);
  if (check.errors.length) throw new Error(check.errors.join('\n'));
} else {
  for (const m of plan) rows.push({ material_key: materialKey(m), id: m.existing?.id ?? null, action: m.existing ? 'link-existing' : 'register', title: m.record.planning.title, media: m.files.length, preview_only: m.record.planning.preview_only });
}
const report = { generated_at: new Date().toISOString(), applied: values.apply,
  input_sha256: createHash('sha256').update(fs.readFileSync(values.input)).digest('hex'),
  total: rows.length, linked: plan.filter(m => m.existing).length, registered: plan.filter(m => !m.existing).length, rows };
if (values.report) fs.writeFileSync(values.report, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ total: report.total, linked: report.linked, registered: report.registered, applied: values.apply, report: values.report }, null, 2));
