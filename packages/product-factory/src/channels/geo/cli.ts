import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PipelineItem {
  contentId: string;
  analysisSlug: string;
  title: string;
  analysisKind: 'baseline' | 'spatial-cross';
  metricKeys: string[];
  aggregateKey: string | null;
  spatialOperations: string[];
  sourceLayers: Array<{ id: string; label: string; geometry: string; role: string }>;
  free: { canonicalPath: string; methodPath: string };
  paid: {
    productId: string;
    articleKey: string;
    priceYen: number;
    readerOutcome: string;
    deliverables: string[];
  };
  evidence: { manifestKey: string; sha256: string } | null;
  publicationReady: boolean;
}

interface Pipeline {
  schemaVersion: number;
  generatedAt: string;
  items: PipelineItem[];
}

interface ProductManifest {
  schemaVersion: number;
  productId: string;
  articleKey: string;
  analysisSlug: string;
  rowCount: number;
  canonicalPath: string;
  sourceArtifact: string;
  generatedAt: string;
  files: Array<{ name: string; sha256: string; bytes: number }>;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const pipelinePath = path.join(repoRoot, '.local/r2/app/geo/content-pipeline/items.json');
const outputRoot = path.join(repoRoot, '.local/geo-products');
const remoteBase = process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const args = process.argv.slice(2);
const command = args[0] ?? 'plan';

function loadPipeline(): Pipeline {
  if (!fs.existsSync(pipelinePath)) {
    throw new Error('Geo content pipelineがありません。先に npm run geo:export-content-pipeline を実行してください。');
  }
  return JSON.parse(fs.readFileSync(pipelinePath, 'utf8')) as Pipeline;
}

function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsOf(aggregate: Record<string, unknown>): Array<Record<string, unknown>> {
  const candidate = aggregate.rows;
  if (!Array.isArray(candidate)) throw new Error('aggregate.rows がありません');
  return candidate as Array<Record<string, unknown>>;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n') + '\n';
}

async function loadAggregate(item: PipelineItem): Promise<{ source: string; value: Record<string, unknown> }> {
  if (item.aggregateKey) {
    const local = path.join(repoRoot, '.local/r2', item.aggregateKey);
    if (!fs.existsSync(local)) throw new Error(`aggregate missing: ${item.aggregateKey}`);
    return { source: item.aggregateKey, value: JSON.parse(fs.readFileSync(local, 'utf8')) };
  }
  const rankingKey = item.metricKeys[0];
  const source = `app/stats/${rankingKey}/values.json`;
  const response = await fetch(`${remoteBase}/${source}`);
  if (!response.ok) throw new Error(`baseline fetch failed: ${response.status} ${source}`);
  return { source, value: await response.json() as Record<string, unknown> };
}

function readme(item: PipelineItem): string {
  const layers = item.sourceLayers.map((layer) => `- ${layer.label}（${layer.geometry} / ${layer.role}）`).join('\n');
  return `# ${item.title} 再現・記事制作パック\n\n` +
    `販売予定価格: ${item.paid.priceYen.toLocaleString('ja-JP')}円\n\n` +
    `## このパックでできること\n\n${item.paid.readerOutcome}\n\n` +
    `## 無料で確認できる結論\n\n- https://stats47.jp${item.free.canonicalPath}\n- https://stats47.jp${item.free.methodPath}\n\n` +
    `## 同梱物\n\n- analysis.csv: 47都道府県の加工済み集計\n- analysis.json: 集計の機械可読版\n- DATA-DICTIONARY.md: 指標・入力・演算の辞書\n- MANIFEST.json: 入力と同梱物のSHA-256\n\n` +
    `## 入力レイヤー\n\n${layers}\n\n` +
    `## 利用上の注意\n\nこの商品は公開データの結論を隠して販売するものではありません。再現可能な加工済みデータ、辞書、検証経路を提供します。各一次資料の利用条件と出典表示は購入者側の二次利用でも維持してください。推計値・包含判定・直線距離は個別地点の将来、安全性、徒歩経路、因果を保証しません。\n`;
}

function dictionary(item: PipelineItem): string {
  return `# データ辞書\n\n## 指標キー\n\n${item.metricKeys.map((key) => `- \`${key}\``).join('\n')}\n\n` +
    `## 空間演算\n\n${item.spatialOperations.length > 0 ? item.spatialOperations.map((op) => `- ${op}`).join('\n') : '- 単一指標の都道府県集計（空間横断ではありません）'}\n\n` +
    `## 検証経路\n\n- canonical: ${item.free.canonicalPath}\n- method: ${item.free.methodPath}\n- evidence manifest: ${item.evidence?.manifestKey ?? '都道府県ランキングの出典情報を参照'}\n`;
}

async function generate(item: PipelineItem): Promise<ProductManifest> {
  if (!item.publicationReady) throw new Error(`publication gate not ready: ${item.analysisSlug}`);
  const aggregate = await loadAggregate(item);
  const rows = rowsOf(aggregate.value);
  if (rows.length !== 47) throw new Error(`row count must be 47: ${item.analysisSlug}=${rows.length}`);
  const dir = path.join(outputRoot, item.paid.articleKey);
  fs.mkdirSync(dir, { recursive: true });
  const payloads = new Map<string, string>([
    ['README.md', readme(item)],
    ['DATA-DICTIONARY.md', dictionary(item)],
    ['analysis.csv', toCsv(rows)],
    ['analysis.json', `${JSON.stringify(aggregate.value, null, 2)}\n`],
  ]);
  for (const [name, body] of payloads) fs.writeFileSync(path.join(dir, name), body, 'utf8');
  const files = [...payloads].map(([name, body]) => ({
    name,
    sha256: sha256(body),
    bytes: Buffer.byteLength(body),
  }));
  const manifest: ProductManifest = {
    schemaVersion: 1,
    productId: item.paid.productId,
    articleKey: item.paid.articleKey,
    analysisSlug: item.analysisSlug,
    rowCount: rows.length,
    canonicalPath: item.free.canonicalPath,
    sourceArtifact: aggregate.source,
    generatedAt: new Date().toISOString(),
    files,
  };
  fs.writeFileSync(path.join(dir, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

function validate(items: PipelineItem[]): void {
  const failures: string[] = [];
  for (const item of items) {
    const dir = path.join(outputRoot, item.paid.articleKey);
    const manifestPath = path.join(dir, 'MANIFEST.json');
    if (!fs.existsSync(manifestPath)) {
      failures.push(`${item.paid.articleKey}: MANIFEST missing`);
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ProductManifest;
    if (manifest.rowCount !== 47 || manifest.canonicalPath !== item.free.canonicalPath) {
      failures.push(`${item.paid.articleKey}: row/canonical mismatch`);
    }
    for (const file of manifest.files) {
      const filePath = path.join(dir, file.name);
      if (!fs.existsSync(filePath) || sha256(fs.readFileSync(filePath)) !== file.sha256) {
        failures.push(`${item.paid.articleKey}: ${file.name} hash mismatch`);
      }
    }
  }
  if (failures.length > 0) throw new Error(failures.join('\n'));
  console.log(`✅ Geo product validate: ${items.length}/${items.length} packs, 47 rows each, hashes PASS`);
}

async function main(): Promise<void> {
  const items = loadPipeline().items;
  if (command === 'plan') {
    for (const item of items) {
      console.log(`${item.paid.productId}\t${item.paid.articleKey}\t${item.paid.priceYen}\t${item.publicationReady ? 'buildable' : 'gated'}\t${item.free.canonicalPath}`);
    }
    return;
  }
  if (command === 'generate') {
    for (const item of items) {
      const manifest = await generate(item);
      console.log(`✅ ${manifest.articleKey}: ${manifest.rowCount} rows → ${path.relative(repoRoot, path.join(outputRoot, manifest.articleKey))}`);
    }
    return;
  }
  if (command === 'validate') {
    validate(items);
    return;
  }
  throw new Error('usage: geo/cli.ts <plan|generate|validate>');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
