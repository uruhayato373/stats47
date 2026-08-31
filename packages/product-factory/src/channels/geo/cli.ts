import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

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

const archiveDate = new Date('1980-01-01T00:00:00.000Z');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const pipelinePath = path.join(repoRoot, '.local/r2/app/geo/content-pipeline/items.json');
const outputRoot = path.join(repoRoot, '.local/geo-products');
const remoteBase = process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const args = process.argv.slice(2);
const command = args[0] ?? 'plan';
const gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const articleKeyIndex = args.indexOf('--article-key');
const requestedArticleKey = articleKeyIndex >= 0 ? args[articleKeyIndex + 1] : null;
if (articleKeyIndex >= 0 && !requestedArticleKey) throw new Error('--article-key requires a value');

function loadPipeline(): Pipeline {
  if (!fs.existsSync(pipelinePath)) {
    throw new Error('Geo content pipelineがありません。先に npm run geo:export-content-pipeline を実行してください。');
  }
  return JSON.parse(fs.readFileSync(pipelinePath, 'utf8')) as Pipeline;
}

function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function archiveName(articleKey: string): string {
  return `${articleKey}.zip`;
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

function limitations(item: PipelineItem): string {
  if (item.analysisSlug === 'population-flood-risk') {
    return '1kmメッシュ中心点の包含判定なので、区域との部分的な重なりやメッシュ内人口分布を精密には表しません。浸水深・発生確率・被害額・避難経路を含む総合リスクではなく、区域外や0件は安全を意味しません。';
  }
  if (item.analysisSlug === 'population-station-access') {
    return '駅代表点からメッシュ中心点までの大円距離800m判定です。道路距離、徒歩時間、入口位置、運行本数、バリアフリー条件は含みません。';
  }
  if (item.analysisSlug === 'population-land-price') {
    return '人口メッシュの県合計と住宅地の地価公示地点中央値を県コードで結合した分析です。相関は因果を示さず、個別地点の将来価格を保証しません。';
  }
  return '推計値は将来実績を保証せず、都道府県集計を市区町村・個別地点へ外挿できません。';
}

function readme(item: PipelineItem): string {
  const layers = item.sourceLayers.map((layer) => `- ${layer.label}（${layer.geometry} / ${layer.role}）`).join('\n');
  return `# ${item.title} 再現・記事制作パック\n\n` +
    `販売予定価格: ${item.paid.priceYen.toLocaleString('ja-JP')}円\n\n` +
    `## このパックでできること\n\n${item.paid.readerOutcome}\n\n` +
    `## 無料で確認できる結論\n\n- https://stats47.jp${item.free.canonicalPath}\n- https://stats47.jp${item.free.methodPath}\n\n` +
    `## 同梱物\n\n- analysis.csv: 47都道府県の加工済み集計\n- analysis.json: 集計の機械可読版\n- DATA-DICTIONARY.md: 指標・入力・演算の辞書\n- MANIFEST.json: 他の同梱4ファイルのSHA-256と参照元\n\n` +
    `## 入力レイヤー\n\n${layers}\n\n` +
    `## 利用上の注意\n\nこの商品は公開データの結論を隠して販売するものではありません。再現可能な加工済みデータ、辞書、検証経路を提供します。各一次資料の利用条件と出典表示は購入者側の二次利用でも維持してください。${limitations(item)}\n`;
}

interface MetricDefinition {
  key: string;
  label: string;
  unit: string;
  format: string;
  description: string;
}

function sourceLabelForMetric(key: string, aggregate: Record<string, unknown>): string | null {
  if (!Array.isArray(aggregate.sources)) return null;
  const sources = aggregate.sources.filter(
    (value): value is Record<string, unknown> => typeof value === 'object' && value !== null,
  );
  const lower = key.toLowerCase();
  const datasetId = lower.includes('landprice') || key === 'sampleCount'
    ? 'L01'
    : lower.includes('flood') || lower.includes('exposed')
      ? 'A31b'
      : lower.includes('station') || lower.includes('accessible')
        ? 'S12'
        : 'mesh1000r6';
  const source = sources.find((value) => value.datasetId === datasetId);
  return source?.name ? String(source.name) : null;
}

function sourceSummary(aggregate: Record<string, unknown>, datasetIds: string[]): string {
  if (!Array.isArray(aggregate.sources)) return '';
  const sources = aggregate.sources.filter(
    (value): value is Record<string, unknown> => typeof value === 'object' && value !== null,
  );
  return datasetIds.map((datasetId) => {
    const source = sources.find((value) => value.datasetId === datasetId);
    if (!source) throw new Error(`source definition missing: ${datasetId}`);
    return `${String(source.name)}（datasetId=${datasetId}, version=${String(source.version)}）`;
  }).join(' + ');
}

function exactMetricDescription(
  item: PipelineItem,
  key: string,
  fallback: string,
  aggregate: Record<string, unknown>,
): string {
  const population = sourceSummary(aggregate, ['mesh1000r6']);
  if (item.analysisSlug === 'population-flood-risk') {
    const both = sourceSummary(aggregate, ['mesh1000r6', 'A31b']);
    const definitions: Record<string, string> = {
      floodExposureShare2050: `中心点が想定最大規模の区域内にあるメッシュの2050年人口合計 ÷ 都道府県内の全人口メッシュ2050年人口合計 × 100。入力: ${both}`,
      floodExposureShare2020: `中心点が想定最大規模の区域内にあるメッシュの2020年人口合計 ÷ 都道府県内の全人口メッシュ2020年人口合計 × 100。入力: ${both}`,
      exposedPopulation2050: `中心点が想定最大規模の区域内にある1kmメッシュの2050年人口合計。入力: ${both}`,
      populationChangeRate: `都道府県内の全人口メッシュについて（2050年人口合計 - 2020年人口合計）÷ 2020年人口合計 × 100。入力: ${population}`,
      exposedMeshCount: `中心点が想定最大規模の区域内にある人口メッシュ件数。入力: ${both}`,
    };
    return definitions[key] ?? fallback;
  }
  if (item.analysisSlug === 'population-station-access') {
    const both = sourceSummary(aggregate, ['mesh1000r6', 'S12']);
    const definitions: Record<string, string> = {
      stationAccessShare2050: `駅グループ代表点から大円距離800m以内のメッシュの2050年人口合計 ÷ 都道府県内の全人口メッシュ2050年人口合計 × 100。入力: ${both}`,
      stationAccessShare2020: `駅グループ代表点から大円距離800m以内のメッシュの2020年人口合計 ÷ 都道府県内の全人口メッシュ2020年人口合計 × 100。入力: ${both}`,
      accessiblePopulation2050: `駅グループ代表点から大円距離800m以内の1kmメッシュの2050年人口合計。入力: ${both}`,
      populationChangeRate: `都道府県内の全人口メッシュについて（2050年人口合計 - 2020年人口合計）÷ 2020年人口合計 × 100。入力: ${population}`,
      accessibleMeshCount: `駅グループ代表点から大円距離800m以内の人口メッシュ件数。入力: ${both}`,
    };
    return definitions[key] ?? fallback;
  }
  return fallback;
}

function metricDefinitions(item: PipelineItem, aggregate: Record<string, unknown>): MetricDefinition[] {
  if (Array.isArray(aggregate.metrics)) {
    const byKey = new Map(
      aggregate.metrics
        .filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null)
        .map((value) => [String(value.key), value]),
    );
    return item.metricKeys.map((key) => {
      const value = byKey.get(key);
      if (!value) throw new Error(`metric definition missing: ${item.analysisSlug}/${key}`);
      const sourceLabel = sourceLabelForMetric(key, aggregate);
      const baseDescription = String(value.description ?? '').replace(/[。\s]+$/, '');
      const exactDescription = exactMetricDescription(item, key, baseDescription, aggregate);
      return {
        key,
        label: String(value.label ?? ''),
        unit: String(value.unit ?? ''),
        format: String(value.format ?? ''),
        description: exactDescription === baseDescription
          ? `${baseDescription}${sourceLabel ? `。入力: ${sourceLabel}` : ''}`
          : exactDescription,
      };
    });
  }

  if (item.metricKeys.length === 1 && item.metricKeys[0] === aggregate.metricKey) {
    const rows = rowsOf(aggregate);
    const first = rows[0] ?? {};
    const years = typeof aggregate.meta === 'object' && aggregate.meta !== null
      && Array.isArray((aggregate.meta as Record<string, unknown>).yearRange)
      ? (aggregate.meta as { yearRange: unknown[] }).yearRange.map(String).join('–')
      : '2050';
    return [{
      key: item.metricKeys[0],
      label: '2050年将来人口増減率',
      unit: String(first.unit ?? '％'),
      format: 'signedPercent2',
      description: `${years}年の推計値。2020年人口を基準とする増減率を都道府県単位で収録`,
    }];
  }

  throw new Error(`aggregate metric definitions missing: ${item.analysisSlug}`);
}

function dictionary(item: PipelineItem, aggregate: Record<string, unknown>): string {
  const definitions = metricDefinitions(item, aggregate);
  const metrics = definitions.map((metric) =>
    `| \`${metric.key}\` | ${metric.label} | ${metric.description} | ${metric.unit} | \`${metric.format}\` |`,
  ).join('\n');
  const evidence = item.evidence?.manifestKey;
  const evidenceLines = evidence
    ? `- evidence manifest key: \`${evidence}\`\n- evidence manifest URL: ${remoteBase}/${evidence}`
    : '- evidence: 都道府県ランキングの出典情報を参照';
  const reproduction = item.analysisSlug === 'population-flood-risk'
    ? `## 決定的な空間演算の再実行\n\n次の公開commitを固定して実行します。人口47入力と洪水94入力を取得・照合し、メッシュ中心点のpoint-in-polygon、県別途中artifact、47県aggregate、保存則監査を順に実行します。\n\n- repository: https://github.com/uruhayato373/stats47\n- verified revision: \`${gitRevision}\`\n- working directory: clone後の \`stats47/\`\n\n\`\`\`bash\ngit clone https://github.com/uruhayato373/stats47.git\ncd stats47\ngit checkout ${gitRevision}\nnpm ci\nnpm run geo:build-flood-analysis\nnpm run geo:export-content-pipeline\nnpm run products:geo:generate --workspace packages/product-factory -- --article-key ${item.paid.articleKey}\nnpm run products:geo:validate --workspace packages/product-factory\n\`\`\`\n\n実装: \`packages/gis/src/mlit-ksj/scripts/build-geo-cross-snapshots.ts\`\n\n`
    : '';
  return `# データ辞書\n\n## 指標定義\n\n| キー | 表示名 | 定義・時点・集計法 | 単位 | 表示形式 |\n|---|---|---|---|---|\n${metrics}\n\n` +
    `## 行の識別子\n\n- \`areaCode\`: 5桁の都道府県コード\n- \`areaName\`: 都道府県名\n- \`rank\`: 主指標を降順で並べた順位（同値処理はanalysis.jsonの生成結果に従う）\n\n` +
    `## 空間演算\n\n${item.spatialOperations.length > 0 ? item.spatialOperations.map((op) => `- ${op}`).join('\n') : '- 単一指標の都道府県集計（空間横断ではありません）'}\n\n` +
    reproduction +
    `## 検証経路\n\n- canonical: https://stats47.jp${item.free.canonicalPath}\n- method: https://stats47.jp${item.free.methodPath}\n${evidenceLines}\n`;
}

async function generate(item: PipelineItem): Promise<ProductManifest> {
  if (!item.publicationReady) throw new Error(`publication gate not ready: ${item.analysisSlug}`);
  const aggregate = await loadAggregate(item);
  const rows = rowsOf(aggregate.value);
  if (rows.length !== 47) throw new Error(`row count must be 47: ${item.analysisSlug}=${rows.length}`);
  const aggregateMeta = aggregate.value.meta;
  const generatedAt = typeof aggregate.value.generatedAt === 'string'
    ? aggregate.value.generatedAt
    : typeof aggregateMeta === 'object' && aggregateMeta !== null && typeof (aggregateMeta as Record<string, unknown>).generatedAt === 'string'
      ? (aggregateMeta as Record<string, string>).generatedAt
      : null;
  if (!generatedAt) throw new Error(`source generatedAt missing: ${item.analysisSlug}`);
  const dir = path.join(outputRoot, item.paid.articleKey);
  fs.mkdirSync(dir, { recursive: true });
  const payloads = new Map<string, string>([
    ['README.md', readme(item)],
    ['DATA-DICTIONARY.md', dictionary(item, aggregate.value)],
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
    generatedAt,
    files,
  };
  const manifestBody = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(path.join(dir, 'MANIFEST.json'), manifestBody, 'utf8');

  const zip = new JSZip();
  for (const [name, body] of [...payloads, ['MANIFEST.json', manifestBody] as const]) {
    zip.file(name, body, {
      date: archiveDate,
      createFolders: false,
      unixPermissions: 0o100644,
    });
  }
  const archive = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    platform: 'UNIX',
    streamFiles: false,
  });
  fs.writeFileSync(path.join(dir, archiveName(item.paid.articleKey)), archive);
  return manifest;
}

async function validate(items: PipelineItem[]): Promise<void> {
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
    const readmePath = path.join(dir, 'README.md');
    if (fs.existsSync(readmePath) && fs.readFileSync(readmePath, 'utf8').includes('市区町村')) {
      failures.push(`${item.paid.articleKey}: 47都道府県商品に市区町村表記があります`);
    }
    const dictionaryPath = path.join(dir, 'DATA-DICTIONARY.md');
    if (fs.existsSync(dictionaryPath)) {
      const body = fs.readFileSync(dictionaryPath, 'utf8');
      for (const key of item.metricKeys) {
        if (!body.includes(`\`${key}\``)) failures.push(`${item.paid.articleKey}: dictionary missing ${key}`);
      }
      if (item.evidence?.manifestKey && !body.includes(`${remoteBase}/${item.evidence.manifestKey}`)) {
        failures.push(`${item.paid.articleKey}: dictionary evidence URL missing`);
      }
    }

    const archivePath = path.join(dir, archiveName(item.paid.articleKey));
    if (!fs.existsSync(archivePath)) {
      failures.push(`${item.paid.articleKey}: archive missing`);
      continue;
    }
    const archiveBytes = fs.statSync(archivePath).size;
    if (archiveBytes > 50 * 1024 * 1024) {
      failures.push(`${item.paid.articleKey}: archive exceeds note 50MB limit`);
      continue;
    }
    const zip = await JSZip.loadAsync(fs.readFileSync(archivePath));
    const expected = [...manifest.files.map((file) => file.name), 'MANIFEST.json'].sort();
    const actual = Object.keys(zip.files).filter((name) => !zip.files[name]?.dir).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${item.paid.articleKey}: archive entries mismatch`);
      continue;
    }
    for (const name of expected) {
      const zipped = await zip.file(name)?.async('nodebuffer');
      if (!zipped || sha256(zipped) !== sha256(fs.readFileSync(path.join(dir, name)))) {
        failures.push(`${item.paid.articleKey}: archive ${name} hash mismatch`);
      }
    }
  }
  if (failures.length > 0) throw new Error(failures.join('\n'));
  console.log(`✅ Geo product validate: ${items.length}/${items.length} packs, 47 rows each, files + ZIP hashes PASS`);
}

async function main(): Promise<void> {
  const allItems = loadPipeline().items;
  const items = requestedArticleKey
    ? allItems.filter((item) => item.paid.articleKey === requestedArticleKey)
    : allItems;
  if (items.length === 0) throw new Error(`article key not found: ${requestedArticleKey}`);
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
    await validate(requestedArticleKey ? items : allItems);
    return;
  }
  throw new Error('usage: geo/cli.ts <plan|generate|validate>');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
