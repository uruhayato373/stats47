import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';
import type { GeoAnalysisEvidenceManifest, GeoAnalysisSnapshot, GeoLandPricePrefDetail } from '@stats47/gis';
import { GIS_DATASETS_BY_ID, assertKsjPublicStructuredOutputAllowed } from '@stats47/gis/mlit-ksj';
import { assertDeliveryDetail, buildDelivery, digest } from './delivery';
import { GEO_SERVICE_OFFER as offer } from './service-offer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const r2 = path.join(root, '.local/r2');
const base = `app/geo/${offer.analysisSlug}`;
const prefCodes = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'));

function readEvidence(key: string, sha256: string, bytes: number): Buffer {
  if (!key.startsWith(`${base}/`) || key.includes('..') || key.includes('\\')) throw new Error('unsafe evidence key');
  const body = fs.readFileSync(path.join(r2, key));
  if (body.length !== bytes || digest(body) !== sha256) throw new Error(`evidence bytes/SHA mismatch: ${key}`);
  return body;
}

export function validateManifestInputs(manifest: GeoAnalysisEvidenceManifest): void {
  const expected = [...prefCodes.map(p => `gis/mlit-ksj/mesh1000r6/24/${p}.topojson`), 'gis/mlit-ksj/L01/26/national.topojson'].sort();
  if (JSON.stringify(manifest.inputs.map(i => i.key).sort()) !== JSON.stringify(expected)) throw new Error('input set mismatch');
  for (const input of manifest.inputs) {
    const meta = GIS_DATASETS_BY_ID.get(input.datasetId);
    assertKsjPublicStructuredOutputAllowed({ dataId: input.datasetId, license: meta?.license, output: 'Geo delivery' });
    if (!meta || input.version !== meta.latestVersion || !input.key.startsWith(`gis/mlit-ksj/${input.datasetId}/${input.version}/`) || !input.usedInCalculation || input.role !== 'calculation-input' || !/^[a-f0-9]{64}$/.test(input.sha256) || !Number.isInteger(input.bytes) || input.bytes <= 0) throw new Error('invalid input contract');
  }
  if (manifest.slug !== offer.analysisSlug || manifest.quality.detailAreas !== 47 || manifest.aggregate.recordCount !== 47 || !manifest.stages.some(s => s.kind === 'spatial-operation' && s.id === 'land-price-mesh-join')) throw new Error('spatial contract missing');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--pref' || !prefCodes.includes(args[1])) throw new Error('usage: products:geo:delivery -- --pref 14 (local draft only)');
  const pref = args[1];
  const manifestBytes = fs.readFileSync(path.join(r2, base, 'manifest.json'));
  const manifest: GeoAnalysisEvidenceManifest = JSON.parse(manifestBytes.toString());
  validateManifestInputs(manifest);
  // 配信中のmanifestとローカル入力が同一のときだけ納品見本を作る。
  const response = await fetch(`https://storage.stats47.jp/${base}/manifest.json`, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok || digest(Buffer.from(await response.arrayBuffer())) !== digest(manifestBytes)) throw new Error('live/local manifest mismatch');
  const aggregate: GeoAnalysisSnapshot = JSON.parse(readEvidence(manifest.aggregate.key, manifest.aggregate.sha256, manifest.aggregate.bytes).toString());
  if (aggregate.rows.length !== 47 || JSON.stringify(aggregate.rows.map(r => r.areaCode).sort()) !== JSON.stringify(prefCodes.map(p => `${p}000`))) throw new Error('aggregate prefecture set mismatch');
  for (const s of aggregate.sources) {
    const meta = GIS_DATASETS_BY_ID.get(s.datasetId);
    if (!meta || meta.license !== 'cc-by-4.0' || s.version !== meta.latestVersion || s.license !== 'CC BY 4.0' || !s.url.startsWith('https://nlftp.mlit.go.jp/ksj/')) throw new Error('source attribution/version mismatch');
  }
  if (aggregate.sources.length !== 2 || new Set(aggregate.sources.map(s => s.datasetId)).size !== 2) throw new Error('sources missing');
  const details = new Map<string, GeoLandPricePrefDetail>();
  for (const code of prefCodes) {
    const key = `${base}/pref/${code}.json`;
    const stages = manifest.stages.filter(s => s.kind === 'source' || s.kind === 'spatial-operation');
    if (stages.length !== 3) throw new Error('missing source stages');
    let detail: GeoLandPricePrefDetail | undefined;
    for (const stage of stages) {
      const output = stage.outputs.filter(o => o.key === key && o.areaCode === `${code}000`);
      if (output.length !== 1) throw new Error(`missing/duplicate stage output: ${key}`);
      detail = JSON.parse(readEvidence(key, output[0].sha256, output[0].bytes).toString());
      if (!detail || output[0].recordCount !== (stage.id === 'population-mesh' ? detail.meshes.length : detail.landPricePoints.length)) throw new Error('stage record count mismatch');
    }
    if (!detail || detail.areaCode !== `${code}000`) throw new Error('pref identity mismatch');
    assertDeliveryDetail(detail, aggregate);
    details.set(code, detail);
  }
  const detail = details.get(pref)!;
  const payloads = buildDelivery(detail, aggregate);
  payloads.set('lineage.json', manifestBytes.toString());
  const stamp = new Date().toISOString();
  const codeRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceCodeFiles = ['delivery.ts','delivery-cli.ts','service-offer.ts'].map(name => ({ path: `packages/product-factory/src/channels/geo/${name}`, sha256: digest(fs.readFileSync(path.join(root, 'packages/product-factory/src/channels/geo', name))) }));
  const audit = {
    status: 'LOCAL_DRAFT_NOT_FOR_SALE', verifiedAt: stamp, pref, codeRevision, sourceCodeFiles,
    uncommittedCode: execFileSync('git', ['status', '--porcelain', '--', 'packages/product-factory'], { cwd: root, encoding: 'utf8' }).trim().length > 0,
    liveManifestSha256: digest(manifestBytes), nationalPrefecturesVerified: details.size,
    pointCount: detail.landPricePoints.length, meshCount: detail.meshes.length,
    sourceRawBytesRehashed: false, sourceRawVerification: '原典全量再取得は未実施。公開manifest同一性・全47県の途中artifactのSHA・空間結合・集計を検証。',
    externalPublished: false, priceApproved: true, approvedPriceYen: offer.priceYen,
    termsApprovedAt: offer.termsApprovedAt, demandVerified: false,
    files: [...payloads].map(([name, body]) => ({ name, bytes: Buffer.byteLength(body), sha256: digest(body) })),
  };
  payloads.set('MANIFEST.json', JSON.stringify(audit, null, 2) + '\n');
  const zip = new JSZip();
  for (const [name, body] of payloads) zip.file(name, body, { date: new Date('1980-01-01T00:00:00Z') });
  const zipBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const loaded = await JSZip.loadAsync(zipBytes);
  if (Object.keys(loaded.files).length !== payloads.size) throw new Error('ZIP entry count mismatch');
  for (const [name, body] of payloads) if (digest(await loaded.file(name)!.async('nodebuffer')) !== digest(body)) throw new Error(`ZIP mismatch: ${name}`);
  // 一意ディレクトリを作るため、既存納品物・note ZIPを上書きしない。
  const parent = path.join(root, '.local/coconala-products', offer.id);
  fs.mkdirSync(parent, { recursive: true });
  const out = fs.mkdtempSync(path.join(parent, `pref-${pref}-draft-`));
  for (const [name, body] of payloads) fs.writeFileSync(path.join(out, name), body);
  fs.writeFileSync(path.join(out, 'delivery.zip'), zipBytes);
  fs.writeFileSync(path.join(out, 'listing-draft.json'), JSON.stringify({ ...offer, samplePref: pref, deliveryArchiveSha256: digest(zipBytes), deliverables: [...payloads.keys()], published: false }, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'LISTING.md'), `# ${offer.title}\n\n下書き・未出品。承認済み価格: ${offer.priceYen.toLocaleString('ja-JP')}円。${offer.priceBasis}\n\n対象: ${offer.audience}\n\n${offer.outcome}\n\n## 納品範囲\n\n${offer.scope}。説明付きHTMLレポート、SVG模式図、地点対応CSV、メッシュCSV、辞書、検算JSONをZIPでお渡しする提案です。無料サイトで結論・途中結果は確認でき、有料サービスの価値は指定県の抽出・資料化・説明対応です。\n\n## 購入前に必要な情報\n\n対象都道府県を1つ、資料の用途、必要な開封環境をお知らせください。住所・氏名・顧客データは不要です。\n\n## 納期・修正\n\n必要事項の確定後${offer.deliveryBusinessDays}営業日、同一条件での表記修正${offer.revisions}回。${offer.support}\n\n## 非対応\n\n${offer.exclusions.map(s => `- ${s}`).join('\n')}\n\n利用条件: LICENSE-ja.txt（データ部分と独自説明部分の条件を分離）。自動更新・独占権の譲渡は含みません。\n`);
  fs.writeFileSync(path.join(out, 'READINESS.md'), `# ${offer.id} 出品前確認\n\n- 機械検証: 全国47県のSHA・空間結合・保存則、指定県のCSV行数、ZIPハッシュ PASS\n- 公開: 未実施 / 価格: 承認済み / 需要: 未確認\n- 検証日時: ${stamp}\n- ZIP SHA-256: ${digest(zipBytes)}\n- ソース初回取得日時: 未記録。原典全量の再取得・再ハッシュは今回未実施\n\n## オーナー確認\n\n- [ ] report.htmlの読みやすさ、CSVの開封を確認\n- [ ] 対象1県・固定条件・非対応事項・ライセンスを承認\n- [x] ${offer.priceYen.toLocaleString('ja-JP')}円・${offer.deliveryBusinessDays}営業日・修正${offer.revisions}回・7日サポートを承認（${offer.termsApprovedAt}）\n- [x] 需要確認後の1商品出品を承認\n- [ ] 既存noteの具体的な利用質問・購入反応を確認\n- [ ] カテゴリ・実入力・納品物の一致を確認\n\n${offer.launchPolicy}\n\nOfficeファイルは含まないためOffice互換性を標榜しません。QGIS実機での取り込みは未確認。顧客の支払いや購入操作は実施していません。\n`);
  console.log(JSON.stringify({ ...audit, files: audit.files.length, zipSha256: digest(zipBytes), zipBytes: zipBytes.length, output: out }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
