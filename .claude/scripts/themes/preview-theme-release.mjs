import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

// A localhost read-only gateway lets the real R2 readers preview an exact release manifest.
const { values: options } = parseArgs({ options: {
  manifest: { type: 'string' },
  'stage-dir': { type: 'string', default: '.local/r2' },
  port: { type: 'string', default: '4778' },
} });
if (!options.manifest) throw new Error('--manifest is required');
const manifest = JSON.parse(await readFile(resolve(options.manifest), 'utf8'));
const staged = new Map();
const stagedTsunamiKeys = new Set(manifest.files.map(file => file.key).filter(key => /^gis\/mlit-ksj\/A40\/\d{2}\/\d{2}\.zip$/.test(key)));
const validKey = (key) => (key.startsWith('app/') || stagedTsunamiKeys.has(key) || /^gis\/mlit-ksj\/(?:P05\/22\/\d{2}\.geojson|mesh1000r6\/24\/\d{2}\.topojson|(?:m250r6\/24|A22\/16|A33\/25)\/\d{2}\.zip)$/.test(key) || key === 'gis/tokushima/tsunami-inundation/2025/36.zip') && !key.split('/').some(part => ['..', '.', ''].includes(part));
for (const file of manifest.files) {
  if (!validKey(file.key)) throw new Error('Invalid staged key');
  const path = resolve(options['stage-dir'], file.key);
  const bytes = await readFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256 || bytes.length !== file.bytes) throw new Error(`Staged file changed: ${file.key}`);
  // Original GIS ZIPs are large. Pin their identity, not an in-memory duplicate.
  staged.set(file.key, { ...file, path });
}
const server = http.createServer(async (req, res) => {
  try {
    const key = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).slice(1);
    // Shared navigation reads this canonical category index from the public bucket.
    const readableKey = validKey(key) || key === 'categories/all.json';
    if (!['GET', 'HEAD'].includes(req.method) || !readableKey) { res.writeHead(404).end(); return; }
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (staged.has(key)) {
      const file = staged.get(key);
      const bytes = await readFile(file.path);
      if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Staged file changed');
      res.writeHead(200, { 'Content-Type': key.endsWith('.zip') ? 'application/zip' : 'application/json', 'X-Theme-Preview-Source': 'staged' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
      return;
    }
    const upstream = await fetch(`https://storage.stats47.jp/${key}`, { method: req.method, signal: AbortSignal.timeout(20000) });
    const body = req.method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json', 'X-Theme-Preview-Source': 'public' });
    res.end(body);
  } catch {
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) res.destroy();
    else res.writeHead(502).end('Preview data unavailable');
  }
});
server.listen(Number(options.port), '127.0.0.1', () => console.log(`Theme release preview http://127.0.0.1:${server.address().port}; ${staged.size} verified files`));
