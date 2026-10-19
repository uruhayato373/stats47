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
import { catalogTemplates, snsImageTemplate } from './catalog.mjs';
import { RETIRED_TEMPLATES, IMAGE_PURPOSES, IMAGE_SELECTIONS, selectionAllowed } from './taxonomy.mjs';
import { CLASSIFIER_VERSION, IMAGE_ROLES, roleForTemplate, resolveClassification, imageTasks, inventoryGaps, classificationSummary } from './classification.mjs';

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
  result.templates = result.templates.filter(t => !RETIRED_TEMPLATES.includes(t.id));
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
    id: 'sns/' + p.id, channel: p.platform, key: String(p.id), title: p.planning?.title || Array.from(p.caption ?? p.content_key ?? String(p.id)).slice(0, 100).join(''),
    category: p.domain ?? '未分類', status: p.status, url: p.post_url ?? null, publishedAt: p.posted_at ?? p.scheduled_at ?? null,
    bodyStore: 'git', bodySaved: !!p.caption, assetCount:p.assets?.length??0,
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
    if (review.imageInventory === 'no-assets') {
      const post=readSources(root).posts.find(p=>id==='sns/'+p.id);
      if (!post || post.assets?.length || !review.inventoryReason?.trim()) throw new WorkspaceError('素材なしの確認は、素材一覧が空のSNS投稿に根拠付きで記録してください。');
    }
    data.reviews[id] = { ...review, basis: item.basis, updatedAt: new Date().toISOString() };
  });
}
const raster = /\.(png|jpe?g|webp|gif|svg)$/i;
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
    if (!item) throw new WorkspaceError('画像の使用先が台帳にありません: ' + owner, 500);
    const id = imageId(owner, file), record = quality.images[id];
    const classificationBasis = sha([CLASSIFIER_VERSION, original, extra.coverUrl ?? null, extra.classificationSource ?? file, extra.generation ?? null]);
    const classification = resolveClassification({kind:extra.kind,templateId:extra.templateId,file,
      source:extra.classificationSource,record,basis:classificationBasis,
      origin: ['ogp','card','background'].includes(extra.usage) || extra.templateId === 'pref-silhouette' ? 'contract' : 'catalog'});
    const templateId = classification.templateId;
    const template = templates.find(t => t.id === templateId) ?? templates.find(t => t.id === 'unclassified');
    const basis = sha([item.basis, original, extra.inputFiles ?? [], extra.generation??null, template, record?.policy ?? '', classification.purpose, classification.selection]);
    const candidate = record?.revisions.find(r => r.id === record.candidateId) ?? null;
    const comparison = record?.comparison
      ? { ...extra.comparison, ...record.comparison, url:item.url, role:extra.comparison?.role??'reference' }
      : extra.comparison ?? {key:original?.sha256?'asset-'+original.sha256:id,title:item.title+' · '+file,url:item.url,role:'reference'};
    images.push({ ...extra, comparison, id, owner, file, title: item.title, channel: item.channel, category: item.category,
      original, templateId, classification, policy: record?.policy ?? '', basis,
      revision: sha([basis, record ?? null]), record: record ?? null, candidate,
      candidateMatches: !!candidate && candidate.basis === basis,
      approved: !!candidate && candidate.id === record?.approvedId && candidate.basis === basis && ['recorded','confirmed'].includes(classification.status),
      assessment:record?.assessment?.review??null,assessmentMatches:record?.assessment?.basis===sha([basis,classificationBasis]) && ['recorded','confirmed'].includes(classification.status),
      usage:extra.usage??(extra.kind==='cover'?'cover':item.channel==='note'?'body':'social'),
      format:extra.format??path.extname(original?.key??file).slice(1)??'',
      pageUrl:item.url });
  };
  const householdPosts=sources.posts.filter(p=>p.domain==='note'&&['note-household-v1','note-household-v2','note-household-v3'].includes(p.production?.version)&&p.status!=='deleted');
  for (const a of sources.articles) {
    const owner = 'note/' + a.key, entry = inventory.articles[a.key];
    if (entry?.status === 'indexed' && entry.manifestSha === a.body.manifest?.sha256) {
      const inputFiles = entry.files.filter(f => /\.(json|csv|ts|tsx|mjs|svg)$/i.test(f.name) && !/cover|eyecatch|header/i.test(f.name)).map(f=>({...f,bucket:entry.bucket,key:a.r2Path+'/'+f.name,state:'article-saved',role:'input'}));
      for (const f of entry.files.filter(f => raster.test(f.name) && !/cover|eyecatch|header/i.test(f.name))) {
        const household=f.name==='images/category-ratio.png'?householdPosts.find(p=>p.content_key===a.key):null;
        add(owner, f.name, { provider: a.body.store, bucket: entry.bucket, key: a.r2Path + '/' + f.name, sha256: f.sha256, bytes: f.bytes }, { inputFiles, inventoryStatus: 'indexed',
          comparison:household?{key:a.key,title:household.planning?.title??a.title,url:a.noteUrl??null,role:'layout',requiredSelection:'complete',candidateOnly:true,sharedChannels:['web']}:undefined });
      }
    }
    const cover = sources.covers.find(c => c.articleKey === a.key);
    if (cover) {
      const published = cover.revisions.find(r => r.id === cover.published?.revisionId);
      add(owner, '@cover', published ? { ...published.storage, sha256: published.sha256, bytes: published.bytes } : null,
        { kind: 'cover', width:published?.width, height:published?.height, coverUrl: published ? '/note-cover/' + a.key + '?revision=' + published.id : cover.published?.url ?? null,
          coverCandidateUrl: cover.candidateRevisionId ? '/note-cover/' + a.key + '?revision=' + cover.candidateRevisionId : null,
          coverManagement: '/content/note/covers?view=gallery&q=' + encodeURIComponent(cover.production?.id ?? a.key),
          coverWorkflow: { id:cover.production?.id??a.key, policyId:cover.production?.policyId??null,
            candidateId:cover.candidateRevisionId,approvedId:cover.approvedRevisionId,publishedId:cover.published?.revisionId??null },
          inputFiles: [], inventoryStatus: entry?.status ?? (a.body.manifest ? 'unindexed' : 'unavailable') });
    }
  }
  for (const post of sources.posts) {
    if (post.platform === 'note' || post.status === 'deleted') continue;
    const article=post.domain==='note'&&['note-household-v1','note-household-v2','note-household-v3'].includes(post.production?.version)
      ?sources.articles.find(a=>a.key===post.content_key):null;
    for (const asset of post.assets ?? []) {
      if (asset.role === 'video' || asset.mime?.startsWith('video/')) continue;
      const file = asset.role + '-' + asset.order;
      const production=asset.role==='thumbnail'?null:post.production;
      add('sns/' + post.id, file, asset.state === 'archived' ? {
        provider: asset.r2 ? 'r2-private' : 'drive', ...(asset.r2 ?? {}),
        sha256: asset.sha256, bytes: asset.bytes, drivePath: asset.drive_path ?? null,
      } : null, { inputFiles: production?.input?[{...production.input,name:'production-input.json',role:'input',state:'production-saved'}]:[], inventoryStatus: asset.state, legacyUrl: asset.state === 'archived' ? '/sns-asset/' + post.id + '/' + encodeURIComponent(asset.drive_path?.split('/').pop() ?? (file + '.' + (asset.mime?.split('/')[1] ?? 'png'))) : null,
        format:asset.mime?.split('/')[1]??'',
        templateId:snsImageTemplate(post,asset),classificationSource:asset.source??file,width:asset.width,height:asset.height,
        previewOnly:post.planning?.preview_only===true||asset.role==='thumbnail',
        comparison:article?{key:article.key,title:post.planning?.title??article.title,url:article.noteUrl??null,role:asset.role==='thumbnail'?'note-original':'layout',...(post.platform==='instagram'?{requiredSelection:'complete'}:{})}:undefined,
        generation:production?{generator:production.version,renderer:production.renderer,rendererHash:production.rendererHash,inputHash:production.input.sha256}:post.template?{generator:post.template}:undefined,
        sourceLinks:asset.source?[{label:asset.source,relationship:production?'固定数値・原記事・renderer・フォント・出力SHAは制作入力JSONから辿れます。':'投稿台帳に記録された元素材。固定数値入力との対応は未確認。'}]:[],
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
  for(const image of images)image.tasks=imageTasks(image);
  const value={images,templates,inventoryUpdatedAt:inventory.updatedAt,webInventoryUpdatedAt:web.updatedAt,coverage:web.coverage,
    classificationSummary:classificationSummary(images),inventoryGaps:inventoryGaps(sources,inventory,web,quality.reviews,items)};
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
    if (plan.templateId === 'unclassified' || plan.templateId === 'note-cover') throw new WorkspaceError('実画像に合う型を指定してください。カバーは専用台帳で管理します。');
    if (!Object.hasOwn(IMAGE_ROLES, plan.role) || plan.role === 'unresolved' || typeof plan.reason !== 'string' || !plan.reason.trim() || plan.reason.length > 5000)
      throw new WorkspaceError('画像の役割と分類の確認根拠を入力してください。');
    if (roleForTemplate(plan.templateId) !== plan.role) throw new WorkspaceError('画像の役割と型が一致しません。');
    if (!Object.hasOwn(IMAGE_PURPOSES, plan.purpose) || !Object.hasOwn(IMAGE_SELECTIONS, plan.selection)) throw new WorkspaceError('画像の目的と構成を指定してください。');
    if (!selectionAllowed(plan.purpose, plan.selection)) throw new WorkspaceError('上位・下位はランキングの表示範囲です。目的をランキングにしてください。');
    const previous = data.images[id];
    const classification = {role:plan.role,purpose:plan.purpose,selection:plan.selection,basis:current.classification.basis,reason:plan.reason.trim(),updatedAt:new Date().toISOString()};
    data.images[id] = { revisions: [], candidateId: null, ...previous,
      templateId:plan.templateId,policy:plan.policy,classification,
      classificationHistory:[...(previous?.classificationHistory??[]),...(previous?.classification?[{templateId:previous.templateId,...previous.classification}]:[])],
      approvedId: null };
  });
}
export function saveImagePolicy(root, id, expected, policy) {
  return atomicUpdate(root, FILES.quality, data => {
    const current = imageById(root, id);
    if (current.kind === 'cover') throw new WorkspaceError('カバー制作画面で編集してください。');
    if (current.revision !== expected) throw new WorkspaceError('画像または方針が変わりました。再読込してください。',409);
    data.images[id] = {templateId:current.templateId,revisions:[],candidateId:null,...data.images[id],policy,approvedId:null};
  });
}
export function saveImageComparison(root, id, expected, plan) {
  return atomicUpdate(root, FILES.quality, data => {
    const current=imageById(root,id);
    if(current.kind==='cover'||current.previewOnly)throw new WorkspaceError('本文・投稿用の画像を選んでください。');
    if(current.revision!==expected)throw new WorkspaceError('画像または題材が変わりました。再読込してください。',409);
    if(plan){
      if(!ajv.validate(schema.definitions.comparison,plan))throw new WorkspaceError('比較する題材の形式が不正です。');
      if(!plan.title.trim()||!plan.reason.trim())throw new WorkspaceError('題材名と同じ元データである根拠を記入してください。');
      const peers=imageLibrary(root).images.filter(i=>i.id!==id&&i.comparison?.key===plan.key);
      if(peers.some(i=>i.templateId!==current.templateId||i.classification.purpose!==current.classification.purpose||i.classification.selection!==current.classification.selection||((i.record?.comparison||i.comparison.role==='layout')&&i.comparison.title!==plan.title)))throw new WorkspaceError('同じ題材には同じ図の型・目的・掲載範囲・題材名を指定してください。');
    }
    const record={templateId:current.templateId,policy:'',revisions:[],candidateId:null,approvedId:null,...data.images[id]};
    if(plan)record.comparison=plan;else delete record.comparison;
    data.images[id]=record;
  });
}
export function assessImage(root, id, expected, review) {
  return atomicUpdate(root, FILES.quality, data => {
    const current=imageById(root,id);
    if (current.kind==='cover') throw new WorkspaceError('カバー制作画面で確認してください。');
    if (current.revision!==expected) throw new WorkspaceError('画像が変わりました。再確認してください。',409);
    if (review.status==='pass' && (!current.original?.sha256 || !['recorded','confirmed'].includes(current.classification.status) || !review.original || !review.mobile || !review.data))
      throw new WorkspaceError('原本の保存記録・分類・原寸・スマホ・内容の照合を確認してください。');
    data.images[id]={templateId:current.templateId,policy:'',revisions:[],candidateId:null,approvedId:null,...data.images[id],
      assessment:{basis:sha([current.basis,current.classification.basis]),review:{...review,reviewedAt:new Date().toISOString()}}};
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
    if (review.status === 'pass' && ['pending','suggested','stale'].includes(current.classification.status))
      throw new WorkspaceError('採用前に画像の役割と分類を確認して保存してください。');
    if (review.status === 'pass' && (!review.original || !review.mobile || !review.data))
      throw new WorkspaceError('原寸・スマホ表示・データの照合を確認してください。');
    const revision = record.revisions.find(r => r.id === candidateId);
    revision.review = { ...review, reviewedAt: new Date().toISOString() };
    record.approvedId = review.status === 'pass' ? candidateId : null;
  });
}
export function saveTemplate(root, id, expected, next) {
  if (RETIRED_TEMPLATES.includes(id)) throw new WorkspaceError('旧分類は編集できません。見た目の型を選択してください。');
  if (id === 'unclassified' || id === 'note-cover') throw new WorkspaceError('分類待ちには制作方針を設定できません。noteカバーはカバー制作画面を使用してください。');
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
