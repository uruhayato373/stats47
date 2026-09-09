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
for (const file of manifest.files) {
  if (!file.key.startsWith('app/') || file.key.split('/').some((part) => ['..', '.', ''].includes(part))) throw new Error('Invalid staged key');
  const bytes = await readFile(resolve(options['stage-dir'], file.key));
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256 || bytes.length !== file.bytes) throw new Error(`Staged file changed: ${file.key}`);
  staged.set(file.key, bytes);
}
const server = http.createServer(async (req, res) => {
  try {
    const key = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).slice(1);
    if (!['GET', 'HEAD'].includes(req.method) || !key.startsWith('app/') || key.includes('..')) { res.writeHead(404).end(); return; }
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (staged.has(key)) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Theme-Preview-Source': 'staged' });
      res.end(req.method === 'HEAD' ? undefined : staged.get(key));
      return;
    }
    const upstream = await fetch(`https://storage.stats47.jp/${key}`, { method: req.method, signal: AbortSignal.timeout(20000) });
    res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json', 'X-Theme-Preview-Source': 'public' });
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer()));
  } catch { res.writeHead(502).end('Preview data unavailable'); }
});
server.listen(Number(options.port), '127.0.0.1', () => console.log(`Theme release preview http://127.0.0.1:${options.port}; ${staged.size} verified files`));
