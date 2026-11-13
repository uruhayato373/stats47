// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { afterEach, expect, it } from 'vitest';
import { inspectAnalysisRelease, prepareAnalysisDelivery, publishAnalysisDelivery, verifyAnalysisNote, type AnalysisNoteVerification } from '../../../../../.claude/scripts/products/release-analysis-pack';
import { readProductLanding } from '../product-landing';

const root = path.resolve(__dirname, '../../../../..');
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const temporaries: string[] = [];
afterEach(() => { for (const directory of temporaries.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

async function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-release-test-'));
  temporaries.push(directory);
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const write = (file: string, bytes: string | Buffer) => { fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true }); fs.writeFileSync(path.join(directory, file), bytes); };
  const landing = read('data/products/landings/p-01.json');
  const evidence = read('data/products/landing-evidence/p-01.json');
  delete evidence.analysisDelivery;
  const version = landing.analysisRevision.version;
  const archiveDirectory = `.local/data-packs/P-01/${version}`;
  const candidate = { id: 'P-01', slug: `data-p-01-${version}`, channel: 'note', description: '時系列の追加ファイルです。', included: ['追加CSV'],
    useCases: [{ title: '推移', description: '同じ条件で比較します。' }], purchaseNotes: ['Excel実機での互換性は未確認です。'], showcaseNote: '同梱値から計算しています。',
    showcase: [{ id: 'extra-trend', kind: 'chart', heading: '推移', lead: '同じ条件の年を比較します。', figures: [{ file: 'extra.png', alt: '推移の図' }] }] };
  const contents = new Map<string, Buffer>([
    ['README.md', Buffer.from('分析データ追加版です。Excel実機での互換性は未確認です。')],
    ['images/extra.png', Buffer.from('image-bytes')],
    ['figure-specs.json', Buffer.from(json({ figures: [{ file: 'extra.png', template: 'bar' }] }))],
  ]);
  const zip = new JSZip();
  for (const [file, bytes] of contents) zip.file(file, bytes);
  contents.set('analysis-pack.zip', await zip.generateAsync({ type: 'nodebuffer' }));
  contents.set('preview-product.json', Buffer.from(json(candidate)));
  const manifest = { ...evidence.analysisRevision, productId: 'P-01', version, planSha256: hash(JSON.stringify(landing.analysisRevision)),
    files: [...contents].map(([file, bytes]) => ({ file, sha256: hash(bytes), bytes: bytes.length })) };
  evidence.analysisRevision = manifest;
  write('data/products/landings/p-01.json', json(landing));
  write('data/products/landing-evidence/p-01.json', json(evidence));
  write('data/content-operations/image-templates.json', fs.readFileSync(path.join(root, 'data/content-operations/image-templates.json')));
  write('data/note/articles.json', fs.readFileSync(path.join(root, 'data/note/articles.json')));
  for (const [file, bytes] of contents) write(`${archiveDirectory}/${file}`, bytes);
  write(`${archiveDirectory}/manifest.json`, json(manifest));
  return { directory, landing, evidence, write, archiveDirectory };
}

it('dry-runは台帳・公開画像・非公開ZIPへ書かず、note確認後だけ公開できる', async () => {
  const setup = await fixture();
  const original = fs.readFileSync(path.join(setup.directory, 'data/products/landing-evidence/p-01.json'), 'utf8');
  const dry = await prepareAnalysisDelivery(setup.directory, 'P-01');
  expect(dry.warnings).toEqual([]);
  expect(dry.committed).toBe(false);
  expect(fs.existsSync(path.join(setup.directory, '.local/r2'))).toBe(false);
  expect(fs.readFileSync(path.join(setup.directory, 'data/products/landing-evidence/p-01.json'), 'utf8')).toBe(original);
  const objects = new Map<string, Buffer>();
  const store = { get: async (key: string) => objects.get(key) ?? null, put: async (key: string, bytes: Buffer) => { if (objects.has(key)) throw Error('write once'); objects.set(key, bytes); } };
  const prepared = await prepareAnalysisDelivery(setup.directory, 'P-01', { commit: true, store });
  expect(prepared.delivery.status).toBe('prepared');
  expect(objects.size).toBe(1);
  expect(readProductLanding(setup.directory, 'P-01', setup.landing.articleKey).included).not.toContain('追加CSV');
  const article = JSON.parse(fs.readFileSync(path.join(setup.directory, 'data/note/articles.json'), 'utf8')).articles.find((item: {key: string}) => item.key === setup.landing.articleKey);
  const delivery = prepared.delivery;
  const verification: AnalysisNoteVerification = { productId: 'P-01', version: delivery.version, sourceManifestSha256: delivery.sourceManifestSha256,
    planSha256: delivery.planSha256, archiveSha256: delivery.archive.sha256, noteUrl: article.noteUrl, priceYen: article.priceJpy,
    verifiedAt: new Date().toISOString(), attachmentName: delivery.attachmentName, paidBodySha256: 'b'.repeat(64) };
  for (const changed of [{ productId: 'P-02' }, { sourceManifestSha256: 'c'.repeat(64) }, { archiveSha256: 'c'.repeat(64) }, { priceYen: 1 }]) {
    expect(() => verifyAnalysisNote(delivery, { ...verification, ...changed }, { id: 'P-01', externalUrl: article.noteUrl, priceYen: article.priceJpy })).toThrow('一致');
  }
  expect(() => verifyAnalysisNote(delivery, { ...verification, unexpected: true } as AnalysisNoteVerification, { id: 'P-01', externalUrl: article.noteUrl, priceYen: article.priceJpy })).toThrow('shape');
  await publishAnalysisDelivery(setup.directory, 'P-01', verification, { commit: true, store });
  expect(readProductLanding(setup.directory, 'P-01', setup.landing.articleKey).included).toContain('追加CSV');
  expect(fs.readdirSync(path.join(setup.directory, '.local/r2/app/products/data-p-01/showcase'))).toEqual([`${delivery.version}-extra.png`]);
});

it('manifest変更・重複・商品ID不一致を停止する', async () => {
  const setup = await fixture();
  const file = `${setup.archiveDirectory}/manifest.json`;
  setup.write(file, json({ ...setup.evidence.analysisRevision, productId: 'P-02' }));
  await expect(inspectAnalysisRelease(setup.directory, 'P-01')).rejects.toThrow('manifest');
  const duplicate = { ...setup.evidence.analysisRevision, files: [...setup.evidence.analysisRevision.files, setup.evidence.analysisRevision.files[0]] };
  setup.write(file, json(duplicate));
  setup.write('data/products/landing-evidence/p-01.json', json({ ...setup.evidence, analysisRevision: duplicate }));
  await expect(inspectAnalysisRelease(setup.directory, 'P-01')).rejects.toThrow('重複');
});
