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
  codeRevision: string;
  uncommittedCode: boolean;
  sourceAcquisitionStatus: 'unknown';
  verificationAt: string;
}

const archiveDate = new Date('1980-01-01T00:00:00.000Z');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const pipelinePath = path.join(repoRoot, '.local/geo-content-pipeline/items.json');
const outputRoot = path.join(repoRoot, '.local/geo-products');
const remoteBase = process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const args = process.argv.slice(2);
const command = args[0] ?? 'plan';
const gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const uncommittedCode = execFileSync('git', ['status', '--porcelain', '--untracked-files=normal', '--', 'packages/gis', 'packages/data-configs', 'packages/product-factory', 'package.json', 'package-lock.json'], { cwd: repoRoot, encoding: 'utf8' }).trim().length > 0;
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
    return '住宅地点の座標を1km人口メッシュへ包含判定で接続し、地価上昇と将来人口減少の重なりを地点単位で照合します。未接続・変動率欠測・基準人口0は分母から除外。地点割合は人口割合ではありません。地価は2025→2026年、人口は2020→2050年で期間が異なり、因果関係や将来価格を示しません。';
  }
  return '推計値は将来実績を保証せず、都道府県集計を市区町村・個別地点へ外挿できません。';
}

interface StationStageSummary {
  stationGroups: number;
  prefectureStationOccurrences: number;
  uniqueDisplayedStationGroups: number;
  crossPrefectureExtraOccurrences: number;
  undisplayedStationGroups: number;
}

function stationStageSummary(aggregate: Record<string, unknown>): StationStageSummary {
  const dataQuality = aggregate.dataQuality;
  if (typeof dataQuality !== 'object' || dataQuality === null) {
    throw new Error('station aggregate dataQuality missing');
  }
  const inputCounts = (dataQuality as Record<string, unknown>).inputCounts;
  if (typeof inputCounts !== 'object' || inputCounts === null) {
    throw new Error('station aggregate inputCounts missing');
  }
  const stationGroups = Number((inputCounts as Record<string, unknown>).stationGroups);
  if (!Number.isInteger(stationGroups) || stationGroups <= 0) {
    throw new Error(`stationGroups invalid: ${stationGroups}`);
  }

  const detailDir = path.join(repoRoot, '.local/r2/app/geo/population-station-access/pref');
  const detailFiles = fs.readdirSync(detailDir).filter((name) => /^\d{2}\.json$/.test(name)).sort();
  if (detailFiles.length !== 47) {
    throw new Error(`station detail count must be 47: ${detailFiles.length}`);
  }
  const stationIds: string[] = [];
  for (const name of detailFiles) {
    const detail = JSON.parse(fs.readFileSync(path.join(detailDir, name), 'utf8')) as { stations?: unknown[] };
    if (!Array.isArray(detail.stations)) throw new Error(`${name}: stations missing`);
    for (const station of detail.stations) {
      if (!Array.isArray(station) || typeof station[0] !== 'string') {
        throw new Error(`${name}: station tuple invalid`);
      }
      stationIds.push(station[0]);
    }
  }
  const uniqueDisplayedStationGroups = new Set(stationIds).size;
  if (uniqueDisplayedStationGroups > stationGroups) {
    throw new Error('displayed station groups exceed national input');
  }
  return {
    stationGroups,
    prefectureStationOccurrences: stationIds.length,
    uniqueDisplayedStationGroups,
    crossPrefectureExtraOccurrences: stationIds.length - uniqueDisplayedStationGroups,
    undisplayedStationGroups: stationGroups - uniqueDisplayedStationGroups,
  };
}

function stationCountExplanation(item: PipelineItem, aggregate: Record<string, unknown>): string {
  if (item.analysisSlug !== 'population-station-access') return '';
  const summary = stationStageSummary(aggregate);
  return `## 駅グループ件数の意味\n\n` +
    `- 全国入力の ${summary.stationGroups.toLocaleString('ja-JP')} は、距離判定前に駅グループコードで重複をまとめたユニーク駅グループ数です。\n` +
    `- 47県の途中artifactにある \`stations\` は、当該県の人口メッシュ判定に寄与した表示用部分集合です。合計 ${summary.prefectureStationOccurrences.toLocaleString('ja-JP')} 件、ユニーク ${summary.uniqueDisplayedStationGroups.toLocaleString('ja-JP')} 駅グループです。\n` +
    `- 県境をまたいで表示される重複分が ${summary.crossPrefectureExtraOccurrences.toLocaleString('ja-JP')} 件あり、人口メッシュ中心点から直線800m以内にない ${summary.undisplayedStationGroups.toLocaleString('ja-JP')} 駅グループは県別表示に現れません。都道府県別駅数ではありません。\n\n`;
}

function readme(item: PipelineItem, aggregate: Record<string, unknown>): string {
  const layers = item.sourceLayers.map((layer) => `- ${layer.label}（${layer.geometry} / ${layer.role}）`).join('\n');
  return `# ${item.title} 再現・記事制作パック\n\n` +
    `販売予定価格: ${item.paid.priceYen.toLocaleString('ja-JP')}円\n\n` +
    `## このパックでできること\n\n${item.paid.readerOutcome}\n\n` +
    `## 無料で確認できる結論\n\n- https://stats47.jp${item.free.canonicalPath}\n- https://stats47.jp${item.free.methodPath}\n\n` +
    `## 同梱物\n\n- analysis.csv: 47都道府県の加工済み集計\n- analysis.json: 集計の機械可読版\n- DATA-DICTIONARY.md: 指標・入力・演算の辞書\n- MANIFEST.json: 他の同梱4ファイルのSHA-256と参照元\n\n` +
    `## 入力レイヤー\n\n${layers}\n\n` +
    stationCountExplanation(item, aggregate) +
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

export function reproductionInstructions(slug: string, articleKey: string, revision: string, dirty: boolean): string {
  const recipes: Record<string, { explanation: string; command: string }> = {
    'population-flood-risk': {
      explanation: '人口47入力と洪水201入力（河川区分10の107ファイル、区分20の94ファイル）を取得・照合します。ZIP名の河川区分10は洪水予報河川・水位周知河川、20はその他の河川です。両区分からZIP内部の想定最大規模20を使い、包含結果を和集合として人口を二重加算せず集計します。',
      command: 'npm run geo:build-flood-analysis',
    },
    'population-station-access': {
      explanation: '人口47入力とS12全国TopoJSONのbytes・SHA-256を照合し、駅代表点と人口メッシュ中心点の大円距離800m判定、県別途中artifact、47県aggregate、保存則を生成します。S12 input URL: ' + remoteBase + '/gis/mlit-ksj/S12/25/national.topojson。S12 expected bytes: 10,639,010。S12 expected SHA-256: 3e69811eee825cc1346ff17340f5ee224562478f71879f7b34d0da6fc7d49fc9。',
      command: 'npm run geo:build-station-access',
    },
    'population-land-price': {
      explanation: '人口47入力と2026年住宅地価地点を照合し、同じ県の1km人口メッシュへ地点を包含結合します。西・南を含み東・北を含まない境界でpointMeshIdsを記録し、未接続・変動率欠測・2020年人口0を比較分母から除きます。地価2025→2026年の上昇と人口2020→2050年の減少が重なる地点を数え、県別途中artifact・47県aggregate・保存則を検証します。',
      command: 'npx tsx packages/gis/src/mlit-ksj/scripts/build-geo-cross-snapshots.ts --land-price-only\nnpm run geo:audit-analysis',
    },
  };
  const recipe = recipes[slug];
  if (!recipe) return '';
  const state = dirty
    ? '未コミットの生成コードを含む確認用成果物です。以下のHEADだけでは今回の結果を再現できません。公開commit確定後に再生成・検証してから配布してください。'
    : '生成コードのcommitを記録しています。公開リポジトリからこのcommitを取得できることと再現結果は、配布前に別途確認してください。';
  return `## 決定的な空間演算の再実行\n\n${state}\n\n${recipe.explanation}\n\n- repository: https://github.com/uruhayato373/stats47\n- source revision: \`${revision}\`\n- uncommitted code: ${dirty}\n- working directory: clone後の \`stats47/\`\n\n\`\`\`bash\ngit clone https://github.com/uruhayato373/stats47.git\ncd stats47\ngit checkout ${revision}\nnpm ci\n${recipe.command}\nnpm run geo:export-content-pipeline\nnpm run products:geo:generate --workspace packages/product-factory -- --article-key ${articleKey}\nnpm run products:geo:validate --workspace packages/product-factory -- --article-key ${articleKey}\n\`\`\`\n\n実装: \`packages/gis/src/mlit-ksj/scripts/build-geo-cross-snapshots.ts\`\n\n`;
}

export function sourceHistoryNotice(verificationAt: string): string {
  return `初回原典取得日時は旧パイプラインで未記録です。固定した版・出典URL・SHA-256は入力の同一性を確かめる情報であり、取得日時の記録ではありません。\n\n今回の商品生成時の確認日時（verificationAt）は ${verificationAt} です。同梱データの47行とファイルSHAを確認した今回の日時であり、原典取得日時や旧入力の変換日時ではありません。`;
}

function dictionary(item: PipelineItem, aggregate: Record<string, unknown>, verificationAt: string): string {
  const definitions = metricDefinitions(item, aggregate);
  const metrics = definitions.map((metric) =>
    `| \`${metric.key}\` | ${metric.label} | ${metric.description} | ${metric.unit} | \`${metric.format}\` |`,
  ).join('\n');
  const evidence = item.evidence?.manifestKey;
  const evidenceLines = evidence
    ? `- evidence manifest key: \`${evidence}\`\n- evidence manifest URL: ${remoteBase}/${evidence}`
    : '- evidence: 都道府県ランキングの出典情報を参照';
  const reproduction = reproductionInstructions(item.analysisSlug, item.paid.articleKey, gitRevision, uncommittedCode);
  return `# データ辞書\n\n## 取得日時と今回の確認日時\n\n${sourceHistoryNotice(verificationAt)}\n\n` +
    `## この辞書の用語\n\ncanonicalは結果の正規の参照ページ、artifactは入力・途中結果・集計を保存したデータファイル、aggregateは県別にまとめた最終集計、lineageは入力から加工を経て最終集計へ至る経路の記録です。\n\n` +
    `## 指標定義\n\n| キー | 表示名 | 定義・時点・集計法 | 単位 | 表示形式 |\n|---|---|---|---|---|\n${metrics}\n\n` +
    `## 行の識別子\n\n- \`areaCode\`: 5桁の都道府県コード\n- \`areaName\`: 都道府県名\n- \`rank\`: 主指標を降順で並べた順位（同値処理はanalysis.jsonの生成結果に従う）\n\n` +
    `## 地図境界へ結合するとき\n\n「47地物」の検算は、境界を都道府県コードで統合（dissolve）し、1県を1地物にした後に行います。離島も削除せず同じ県のMultiPolygon（複数の離れた面を持つ一つの地物）へ含めます。統合前の島別・区域別の地物数が47であることは要求しません。\n\n` +
    `## 空間演算\n\n${item.spatialOperations.length > 0 ? item.spatialOperations.map((op) => `- ${op}`).join('\n') : '- 単一指標の都道府県集計（空間横断ではありません）'}\n\n` +
    stationCountExplanation(item, aggregate) +
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
  const verificationAt = new Date().toISOString();
  const dir = path.join(outputRoot, item.paid.articleKey);
  fs.mkdirSync(dir, { recursive: true });
  const payloads = new Map<string, string>([
    ['README.md', readme(item, aggregate.value)],
    ['DATA-DICTIONARY.md', dictionary(item, aggregate.value, verificationAt)],
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
    codeRevision: gitRevision,
    uncommittedCode,
    sourceAcquisitionStatus: 'unknown',
    verificationAt,
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
    if (manifest.sourceAcquisitionStatus !== 'unknown' || !Number.isFinite(Date.parse(manifest.verificationAt))) {
      failures.push(`${item.paid.articleKey}: missing source acquisition status / product verification timestamp`);
    }
    if (item.analysisKind === 'spatial-cross' && (manifest.uncommittedCode !== false || !manifest.codeRevision)) {
      failures.push(`${item.paid.articleKey}: uncommitted/unrecorded reproduction code; regenerate after commit before distribution`);
    }
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
    if (fs.existsSync(readmePath) && /市区町村(?:別データ|別集計|データを提供)/.test(fs.readFileSync(readmePath, 'utf8'))) {
      failures.push(`${item.paid.articleKey}: 47都道府県商品に市区町村表記があります`);
    }
    if (item.analysisSlug === 'population-station-access' && fs.existsSync(readmePath)) {
      const body = fs.readFileSync(readmePath, 'utf8');
      for (const forbidden of ['駅徒歩圏', '駅数との違い']) {
        if (body.includes(forbidden)) failures.push(`${item.paid.articleKey}: READMEに誤認表現 ${forbidden}`);
      }
      for (const required of ['直線800m判定', '全国入力の 9,080', '都道府県別駅数ではありません']) {
        if (!body.includes(required)) failures.push(`${item.paid.articleKey}: README missing ${required}`);
      }
    }
    const dictionaryPath = path.join(dir, 'DATA-DICTIONARY.md');
    if (fs.existsSync(dictionaryPath)) {
      const body = fs.readFileSync(dictionaryPath, 'utf8');
      if (!body.includes(sourceHistoryNotice(manifest.verificationAt))) {
        failures.push(`${item.paid.articleKey}: dictionary source history mismatch`);
      }
      for (const key of item.metricKeys) {
        if (!body.includes(`\`${key}\``)) failures.push(`${item.paid.articleKey}: dictionary missing ${key}`);
      }
      if (item.evidence?.manifestKey && !body.includes(`${remoteBase}/${item.evidence.manifestKey}`)) {
        failures.push(`${item.paid.articleKey}: dictionary evidence URL missing`);
      }
      if (item.analysisSlug === 'population-station-access') {
        for (const required of [
          'repository: https://github.com/uruhayato373/stats47',
          'source revision:',
          'npm run geo:build-station-access',
          'S12 expected SHA-256',
          '県別途中artifact',
        ]) {
          if (!body.includes(required)) failures.push(`${item.paid.articleKey}: dictionary missing ${required}`);
        }
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
