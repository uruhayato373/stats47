/** Shared article review and image workspace. Source ledgers retain ownership of publication. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import schema from '../../../../data/content-operations/quality.schema.json' with { type: 'json' };
import templateSchema from '../../../../data/content-operations/image-templates.schema.json' with { type: 'json' };
import { readArticleLedger } from '../../note/lib/article-ledger.mjs';
import { readCoverLedger } from '../../note/lib/cover-assets.mjs';
import { R2_PRIVATE_BUCKET } from '../../lib/site-config.cjs';
import { datasetPath } from '../../../../config/datasets.mjs';
import { readWebInventory,WEB_INVENTORY } from './web-inventory.mjs';
import { catalogTemplates } from './catalog.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const FILES = { quality: datasetPath('content.quality'), inventory: datasetPath('content.image-inventory'), templates: datasetPath('content.image-templates') };
export const CHECKS = ['data', 'images', 'placement', 'intro', 'sources', 'links'];
export const sha = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export const imageId = (owner, name) => 'IMG-' + sha([owner, name]).slice(0, 24);
export const safeName = name => typeof name === 'string' && !!name && !name.startsWith('/') && !/[\\:\x00]/.test(name) && name.split('/').every(p => p && p !== '.' && p !== '..');
export class WorkspaceError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);
const validateTemplates = ajv.compile(templateSchema);
const read = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
export function readQuality(root = ROOT) {
  const result = read(root, FILES.quality);
  validateQuality(result);
  return result;
}
export function validateQuality(result) {
  if (!validate(result)) throw new WorkspaceError('品質台帳の形式が不正です。',500);
  for (const record of Object.values(result.images)) {
    const ids=new Set();
    for (const revision of record.revisions) {
      if(ids.has(revision.id) || revision.id!==sha([revision.storage.sha256,revision.input.sha256]) ||
        revision.storage.key!==candidateKey(revision.storage.sha256,revision.storage.key.split('.').pop()) ||
        revision.input.key!==inputKey(revision.input.sha256))throw new WorkspaceError('候補画像の参照が不正です。',500);
      ids.add(revision.id);
    }
    for (const id of [record.candidateId,record.approvedId]) if(id&&!ids.has(id))throw new WorkspaceError('候補版が見つかりません。',500);
    if(record.approvedId && (record.approvedId!==record.candidateId || record.revisions.find(r=>r.id===record.approvedId)?.review?.status!=='pass'))
      throw new WorkspaceError('採用状態が確認記録と一致しません。',500);
  }
  return result;
}
export function readTemplates(root = ROOT) {
  const result = read(root, FILES.templates);
  for(const template of catalogTemplates())if(!result.templates.some(t=>t.id===template.id))result.templates.push(template);
  if (!validateTemplates(result) ||
      new Set(result.templates.map(t => t.id)).size !== result.templates.length ||
      result.templates.some(t => !/^[a-z-]+$/.test(t.id) || !Number.isInteger(t.version) || t.version < 1 ||
        typeof t.label !== 'string' || typeof t.policy !== 'string' || !['note','x','instagram'].every(p => typeof t.profiles?.[p] === 'string')))
    throw new WorkspaceError('画像方針の形式が不正です。', 500);
  return result;
}
export function atomicUpdate(root, rel, edit) {
  const file = path.join(root, rel), lock = file + '.lock';
  let fd;
  try { fd = fs.openSync(lock, 'wx'); } catch { throw new WorkspaceError('他の保存処理が実行中です。少し待って再試行してください。', 409); }
  const temp = file + '.' + process.pid + '.tmp';
  try {
    const data = read(root, rel);
    const result = edit(data);
    if (rel === FILES.quality) validateQuality(data);
    if (rel === FILES.templates && !validateTemplates(data)) throw new WorkspaceError('画像方針の形式が不正です。');
    fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
    fs.renameSync(temp, file);
    return result;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
export function readSources(root = ROOT) {
  return { articles: readArticleLedger(root).articles, posts: read(root, datasetPath('sns.posts')).posts, covers: readCoverLedger(root).articles };
}
export function sourceItems(root = ROOT) {
  const { articles, posts, covers } = readSources(root);
  const coverMap = new Map(covers.map(c => [c.articleKey, c]));
  const notes = articles.map(a => ({
    id: 'note/' + a.key, channel: 'note', key: a.key, title: a.title, category: a.vertical,
    status: a.status, url: a.noteUrl ?? null, publishedAt: a.publishedAt ?? null,
    bodyStore: a.body.store, bodySaved: !!a.body.manifest,
    basis: sha({ title: a.title, body: a.body, magazine: a.magazine, cover: coverMap.get(a.key)?.published }),
  }));
  const social = posts.filter(p => p.platform !== 'note' && p.status !== 'deleted').map(p => ({
    id: 'sns/' + p.id, channel: p.platform, key: String(p.id), title: (p.caption ?? p.content_key ?? String(p.id)).slice(0, 100),
    category: p.domain ?? '未分類', status: p.status, url: p.post_url ?? null, publishedAt: p.posted_at ?? p.scheduled_at ?? null,
    bodyStore: 'git', bodySaved: !!p.caption,
    basis: sha({ caption: p.caption, assets: p.assets, media: p.media_path, template: p.template }),
  }));
  return [...notes, ...social, ...readWebInventory(root).items];
}
export function defaultReview() { return { priority: 'normal', policy: '', checks: Object.fromEntries(CHECKS.map(c => [c, 'unchecked'])) }; }
export function workspaceItems(root = ROOT) {
  const quality = readQuality(root);
  return sourceItems(root).map(item => {
    const review = quality.reviews[item.id] ?? defaultReview();
    const stale = !!review.basis && review.basis !== item.basis;
    const states = Object.values(review.checks);
    const reviewState = stale ? 'stale' : states.includes('issue') ? 'issue' : states.every(s => ['pass','na'].includes(s)) ? 'checked' : states.some(s => s !== 'unchecked') ? 'partial' : 'unchecked';
    return { ...item, review, reviewState, stale, revision: sha([item.basis, quality.reviews[item.id] ?? null]) };
  });
}
export function saveReview(root, id, expected, review) {
  return atomicUpdate(root, FILES.quality, data => {
    const item = sourceItems(root).find(i => i.id === id);
    if (!item) throw new WorkspaceError('記事・投稿が見つかりません。', 404);
    if (sha([item.basis, data.reviews[id] ?? null]) !== expected) throw new WorkspaceError('本文または確認記録が変わりました。再読込してください。', 409);
    data.reviews[id] = { ...review, basis: item.basis, updatedAt: new Date().toISOString() };
  });
}
const raster = /\.(png|jpe?g|webp|gif|svg)$/i;
function inferTemplate(file, owner) {
  if (/kakei|household/i.test(owner)) return 'household';
  if (/choropleth|map|tile/i.test(file)) return 'map';
  if (/scatter|correlation/i.test(file)) return 'correlation';
  if (/time|trend|change/i.test(file)) return 'time-series';
  if (/chart|ranking|boxplot/i.test(file)) return 'ranking';
  return 'unclassified';
}
let libraryCache;
export function imageLibrary(root = ROOT) {
  const paths=[...Object.values(FILES),WEB_INVENTORY,datasetPath('sns.posts'),datasetPath('note.articles'),datasetPath('note.cover-assets')];
  const stamp=root+JSON.stringify(paths.map(f=>{const s=fs.statSync(path.join(root,f),{throwIfNoEntry:false});return [s?.mtimeMs,s?.size];}));
  if(libraryCache?.stamp===stamp)return libraryCache.value;
  const sources = readSources(root), inventory = read(root, FILES.inventory), quality = readQuality(root);
  const templates = readTemplates(root).templates, items = sourceItems(root), itemMap = new Map(items.map(i => [i.id, i]));
  const images = [];
  const add = (owner, file, original, extra = {}) => {
    const item = itemMap.get(owner);
    if (!item) return;
    const id = imageId(owner, file), record = quality.images[id];
    const templateId = record?.templateId ?? extra.templateId ?? inferTemplate(file, owner);
    const template = templates.find(t => t.id === templateId) ?? templates.find(t => t.id === 'unclassified');
    const basis = sha([item.basis, original, extra.inputFiles ?? [], extra.generation??null, template, record?.policy ?? '']);
    const candidate = record?.revisions.find(r => r.id === record.candidateId) ?? null;
    images.push({ ...extra, id, owner, file, title: item.title, channel: item.channel, category: item.category,
      original, templateId, policy: record?.policy ?? '', basis,
      revision: sha([basis, record ?? null]), record: record ?? null, candidate,
      candidateMatches: !!candidate && candidate.basis === basis,
      approved: !!candidate && candidate.id === record?.approvedId && candidate.basis === basis,
      usage:extra.usage??(extra.kind==='cover'?'cover':item.channel==='note'?'body':'social'),
      format:extra.format??path.extname(original?.key??file).slice(1)??'',
      pageUrl:item.url });
  };
  for (const a of sources.articles) {
    const owner = 'note/' + a.key, entry = inventory.articles[a.key];
    if (entry?.status === 'indexed' && entry.manifestSha === a.body.manifest?.sha256) {
      const inputFiles = entry.files.filter(f => /\.(json|csv|ts|tsx|mjs|svg)$/i.test(f.name) && !/cover|eyecatch|header/i.test(f.name)).map(f=>({...f,bucket:entry.bucket,key:a.r2Path+'/'+f.name,state:'article-saved',role:'input'}));
      for (const f of entry.files.filter(f => raster.test(f.name) && !/cover|eyecatch|header/i.test(f.name)))
        add(owner, f.name, { provider: a.body.store, bucket: entry.bucket, key: a.r2Path + '/' + f.name, sha256: f.sha256, bytes: f.bytes }, { inputFiles, inventoryStatus: 'indexed' });
    }
    const cover = sources.covers.find(c => c.articleKey === a.key);
    if (cover) {
      const published = cover.revisions.find(r => r.id === cover.published?.revisionId);
      add(owner, '@cover', published ? { ...published.storage, sha256: published.sha256, bytes: published.bytes } : null,
        { kind: 'cover', coverUrl: published ? '/note-cover/' + a.key + '?revision=' + published.id : cover.published?.url ?? null,
          coverCandidateUrl: cover.candidateRevisionId ? '/note-cover/' + a.key + '?revision=' + cover.candidateRevisionId : null,
          coverManagement: '/content/note/covers?view=gallery&q=' + encodeURIComponent(cover.production?.id ?? a.key),
          inputFiles: [], inventoryStatus: entry?.status ?? (a.body.manifest ? 'unindexed' : 'unavailable') });
    }
  }
  for (const post of sources.posts) {
    for (const asset of post.assets ?? []) {
      if (asset.role === 'video' || asset.mime?.startsWith('video/')) continue;
      const file = asset.role + '-' + asset.order;
      add('sns/' + post.id, file, asset.state === 'archived' ? {
        provider: asset.r2 ? 'r2-private' : 'drive', ...(asset.r2 ?? {}),
        sha256: asset.sha256, bytes: asset.bytes, drivePath: asset.drive_path ?? null,
      } : null, { inputFiles: [], inventoryStatus: asset.state, legacyUrl: asset.state === 'archived' ? '/sns-asset/' + post.id + '/' + encodeURIComponent(asset.drive_path?.split('/').pop() ?? (file + '.' + (asset.mime?.split('/')[1] ?? 'png'))) : null,
        format:asset.mime?.split('/')[1]??'',
        generation:post.template?{generator:post.template}:undefined,
        sourceLinks:asset.source?[{label:asset.source,relationship:'投稿台帳に記録された元素材。固定数値入力との対応は未確認。'}]:[],
        missingReason: asset.reason ?? null });
    }
  }
  const web=readWebInventory(root);
  for(const row of web.images){const {owner,file,original,...extra}=row;add(owner,file,original,extra);}
  const uses=new Map();
  for(const image of images){
    image.assetKey=image.original?.key?(image.original.bucket??'')+'/'+image.original.key:image.original?.url??(image.original?.path?'git/'+image.original.path:image.coverUrl??image.id);
    const list=uses.get(image.assetKey)??[];list.push({id:image.id,owner:image.owner,title:image.title,url:image.pageUrl,usage:image.usage});uses.set(image.assetKey,list);
  }
  // Return IDs rather than repeated article metadata, so a common site image does not make the response quadratic.
  for(const image of images)image.relatedImageIds=uses.get(image.assetKey).map(u=>u.id);
  const value={images,templates,inventoryUpdatedAt:inventory.updatedAt,webInventoryUpdatedAt:web.updatedAt,coverage:web.coverage};
  libraryCache={stamp,value};return value;
}
export function imageById(root, id) {
  const image = imageLibrary(root).images.find(i => i.id === id);
  if (!image) throw new WorkspaceError('画像が見つかりません。', 404);
  return image;
}
export function saveImagePlan(root, id, expected, plan) {
  return atomicUpdate(root, FILES.quality, data => {
    const current = imageById(root, id);
    if (current.kind === 'cover') throw new WorkspaceError('カバー制作画面で編集してください。');
    if (current.revision !== expected) throw new WorkspaceError('画像または方針が変わりました。再読込してください。', 409);
    if (!readTemplates(root).templates.some(t => t.id === plan.templateId)) throw new WorkspaceError('図の型が不正です。');
    data.images[id] = { revisions: [], candidateId: null, ...data.images[id], ...plan, approvedId: null };
  });
}
export function registerCandidate(root, id, expected, candidate) {
  return atomicUpdate(root, FILES.quality, data => {
    const current = imageById(root, id);
    if (current.kind === 'cover') throw new WorkspaceError('カバー制作画面を使用してください。');
    if (current.revision !== expected || current.basis !== candidate.basis) throw new WorkspaceError('制作中に入力が変わりました。画像を確認し直してください。', 409);
    const record = data.images[id] ?? { templateId: current.templateId, policy: '', revisions: [], candidateId: null, approvedId: null };
    if (!record.revisions.some(r => r.id === candidate.id)) record.revisions.push(candidate);
    record.candidateId = candidate.id; record.approvedId = null; data.images[id] = record;
  });
}
export function reviewCandidate(root, id, expected, candidateId, review) {
  return atomicUpdate(root, FILES.quality, data => {
    const current = imageById(root, id), record = data.images[id];
    if (current.revision !== expected || !record || record.candidateId !== candidateId || !current.candidateMatches)
      throw new WorkspaceError('候補または入力が変わりました。再確認してください。', 409);
    if (review.status === 'pass' && (!review.original || !review.mobile || !review.data))
      throw new WorkspaceError('原寸・スマホ表示・データの照合を確認してください。');
    const revision = record.revisions.find(r => r.id === candidateId);
    revision.review = { ...review, reviewedAt: new Date().toISOString() };
    record.approvedId = review.status === 'pass' ? candidateId : null;
  });
}
export function saveTemplate(root, id, expected, next) {
  return atomicUpdate(root, FILES.templates, data => {
    let index = data.templates.findIndex(t => t.id === id);
    if(index<0){const base=catalogTemplates().find(t=>t.id===id);if(!base)throw new WorkspaceError('図の型が見つかりません。',404);data.templates.push(base);index=data.templates.length-1;}
    if (sha(data.templates[index]) !== expected) throw new WorkspaceError('方針が更新されました。再読込してください。', 409);
    const current = data.templates[index];
    data.history ??= [];
    data.history.push(current);
    data.templates[index] = { ...current, policy: next.policy, profiles: next.profiles, version: current.version + 1 };
  });
}
export function candidateKey(hash, extension) { return 'media-workspace/images/' + hash + '.' + extension; }
export function inputKey(hash) { return 'media-workspace/inputs/' + hash + '.json'; }
export async function storeVerified(store, key, bytes) {
  const hash = sha(bytes), existing = await store.get(key);
  if (existing && sha(existing) !== hash) throw new WorkspaceError('保存先の内容が一致しません。', 409);
  if (!existing) await store.put(key, bytes);
  const check = await store.get(key);
  if (!check || check.length !== bytes.length || sha(check) !== hash) throw new WorkspaceError('R2保存後の照合に失敗しました。', 502);
  return { provider: 'r2-private', bucket: R2_PRIVATE_BUCKET, key, sha256: hash, bytes: bytes.length };
}
