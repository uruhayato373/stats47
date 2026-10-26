import fs from 'node:fs';
import path from 'node:path';

const shardName = /^link-card-sites-\d{3}\.json$/;
const cached = new Map();
function read(file) { const text = fs.readFileSync(file, 'utf8'); cached.set(file, text); return JSON.parse(text); }
function validate(ledger) {
  if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.entries) || ledger.entries.some(e => !e.id) || new Set(ledger.entries.map(e => e.id)).size !== ledger.entries.length) throw Error('Invalid/duplicate rollout ledger');
}
export function readLinkCardLedger(file) {
  const ledger = read(file); validate(ledger);
  if (ledger.siteShards) {
    if (!Array.isArray(ledger.siteShards) || new Set(ledger.siteShards).size !== ledger.siteShards.length) throw Error('Invalid site shards');
    for (const name of ledger.siteShards) {
      if (!shardName.test(name)) throw Error('Invalid shard path');
      const shard = read(path.join(path.dirname(file), name));
      if (shard.schemaVersion !== 1 || !Array.isArray(shard.entries) || shard.entries.length > 500 || shard.entries.some(e => !e.id?.startsWith('site:'))) throw Error('Invalid site shard');
      ledger.entries.push(...shard.entries);
    }
    validate(ledger);
  }
  return ledger;
}
export function writeLinkCardLedger(file, ledger) {
  validate(ledger);
  const directory = path.dirname(file);
  const sites = ledger.entries.filter(e => e.id.startsWith('site:'));
  const root = { ...ledger, entries: ledger.entries.filter(e => !e.id.startsWith('site:')), siteShards: [] };
  const outputs = [];
  for (let offset = 0; offset < sites.length; offset += 500) {
    const name = `link-card-sites-${String(offset / 500).padStart(3, '0')}.json`;
    root.siteShards.push(name);
    outputs.push([path.join(directory, name), { schemaVersion: 1, entries: sites.slice(offset, offset + 500) }]);
  }
  outputs.push([file, root]);
  const serialized = outputs.map(([target, value]) => [target, JSON.stringify(value, null, 2) + '\n']);
  if (serialized.some(([, text]) => Buffer.byteLength(text) > 1024 * 1024)) throw Error('Rollout shard exceeds 1 MiB');
  fs.mkdirSync(directory, { recursive: true });
  for (const [target, text] of serialized) {
    if (cached.get(target) === text) continue;
    fs.writeFileSync(`${target}.pending`, text);
    fs.renameSync(`${target}.pending`, target);
    cached.set(target, text);
  }
  for (const name of ledger.siteShards || []) {
    if (shardName.test(name) && !root.siteShards.includes(name)) { const old = path.join(directory, name); if (fs.existsSync(old)) fs.unlinkSync(old); cached.delete(old); }
  }
  ledger.siteShards = root.siteShards;
}
