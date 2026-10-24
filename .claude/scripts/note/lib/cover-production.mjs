import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import schema from '../../../../data/note/cover-policies.schema.json' with { type: 'json' };
import { datasetPath } from '../../../../config/datasets.mjs';
import { COVER_ROOT, coverSha, emptyCoverArticle } from './cover-assets.mjs';
import { readArticleLedger } from './article-ledger.mjs';
import { noteCoverCategory } from '../catalog/cover-categories.mjs';
import { prefectureCoverReference } from './cover-geography.mjs';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

export function validateCoverPolicies(data, categories) {
  if (!validate(data)) throw Error(`cover policy schema: ${ajv.errorsText(validate.errors)}`);
  const ids = new Map(); const categoriesById = new Map(); const versions = new Set();
  for (const policy of data.policies) {
    if (policy.generation === 'imagegen-complete' && !data.completePrompt?.trim()) throw Error('complete image prompt missing');
    if (versions.has(`${policy.id}:${policy.version}`)) throw Error('duplicate cover policy version');
    versions.add(`${policy.id}:${policy.version}`);
    if (ids.has(policy.id) && ids.get(policy.id) !== policy.category) throw Error('cover policy category changed');
    if (categoriesById.has(policy.category) && categoriesById.get(policy.category) !== policy.id) throw Error('multiple policy IDs for category');
    ids.set(policy.id, policy.category); categoriesById.set(policy.category, policy.id);
  }
  if (categories && (categories.length !== categoriesById.size || categories.some(c => !categoriesById.has(c.key))))
    throw Error('cover policy category coverage mismatch');
  for (const category of categoriesById.keys()) {
    const current = latestCoverPolicy(data, category);
    if (current.generation !== 'imagegen-complete')
      throw Error(`current cover policy must use Codex imagegen: ${category}`);
    if (!data.completePromptV2?.includes('{{SUPPLEMENT_PX_AT_320}}') || !data.completePromptV2.includes('{{SUPPLEMENT_PX_AT_1280}}') || current.visualRules?.characters !== 'forbidden' ||
        ['noCharacters', 'subjectMatch', 'supplementReadable'].some(check => !current.visualRules.checks.includes(check)) ||
        (category === 'household') !== (current.visualRules.layout === 'prefecture-map'))
      throw Error(`current cover category visual contract missing or mismatched: ${category}`);
  }
  return data;
}
export function readCoverPolicies(root = COVER_ROOT) {
  return validateCoverPolicies(JSON.parse(fs.readFileSync(path.join(root, datasetPath('note.cover-policies')), 'utf8')));
}
export function latestCoverPolicy(policies, category) {
  const result = policies.policies.filter(p => p.category === category).sort((a, b) => b.version - a.version)[0];
  if (!result) throw Error(`cover policy missing: ${category}`);
  return result;
}

/** Existing IDs are stable; new articles receive IDs above the current maximum. */
export function seedCoverProduction(ledger, articles, policies) {
  let sequence = Math.max(0, ...ledger.articles.map(a => Number(a.production?.id.slice(4)) || 0));
  for (const article of [...articles].sort((a, b) => a.key.localeCompare(b.key))) {
    let row = ledger.articles.find(r => r.articleKey === article.key);
    if (!row) { row = emptyCoverArticle(article); ledger.articles.push(row); }
    const policy = latestCoverPolicy(policies, article.category);
    if (row.noteUrl === null && article.noteUrl) row.noteUrl = article.noteUrl;
    if (row.production) {
      // Untouched articles inherit the current workflow; authored briefs retain their frozen version.
      if (!row.production.brief) Object.assign(row.production, { policyId: policy.id, policyVersion: policy.version });
      continue;
    }
    row.production = { id: `NCI-${String(++sequence).padStart(5, '0')}`, policyId: policy.id, policyVersion: policy.version, brief: null };
  }
}

export function coverBriefIssues(row, article, policies) {
  const work = row.production;
  if (!work?.brief) return ['コピー・題材・根拠を入力してください。'];
  const policy = policies.policies.find(p => p.id === work.policyId && p.version === work.policyVersion);
  if (!policy?.visualRules) return [];
  const brief = work.brief, issues = [];
  if (brief.headline.split('\n').length > 3) issues.push('見出しは3行以内にしてください。');
  if (policy.visualRules.layout === 'prefecture-map') {
    const scope = brief.dataScope;
    if (!scope?.place?.trim() || !/^[12][0-9]{3}$/.test(scope.year ?? '') || scope.households !== '二人以上の世帯')
      issues.push('家計記事の対象都市・対象年・二人以上の世帯を入力してください。');
    const copy = `${brief.headline}\n${brief.subline}`;
    if (scope && [scope.place, scope.year, scope.households].some(text => !copy.includes(text)))
      issues.push('対象都市・対象年・世帯区分を掲載文言にも含めてください。');
    try {
      const { reference } = prefectureCoverReference(article.key);
      if (!copy.includes(reference.name)) issues.push('県の輪郭に対応する都道府県名を掲載してください。');
    } catch { issues.push('記事に対応する県の地図素材を確認できません。'); }
  }
  return issues;
}

/** A frozen request joins policy + article identity + copy + subject + source evidence. */
export function buildCoverPlan(row, article, policies) {
  const work = row.production;
  if (!work) return null;
  const correction = work.titleCorrection;
  if (correction && article.title !== correction.publishedTitle) throw Error('production title correction mismatch');
  const policy = policies.policies.find(p => p.id === work.policyId && p.version === work.policyVersion);
  if (!policy || policy.category !== article.category) throw Error('production policy reference mismatch');
  if (!work.brief) return null;
  if (coverBriefIssues(row, article, policies).length) return null;
  const complete = policy.generation === 'imagegen-complete';
  const copy = [policy.label, ...work.brief.headline.split('\n'), ...work.brief.subline.split('\n'), 'stats47'].filter(Boolean);
  const mapReference = policy.visualRules?.layout === 'prefecture-map' ? prefectureCoverReference(article.key).reference : null;
  const common = policy.visualRules ? policies.completePromptV2
    .replaceAll('{{SUPPLEMENT_PX_AT_320}}', String(policy.visualRules.supplementMinPxAt320))
    .replaceAll('{{SUPPLEMENT_PX_AT_1280}}', String(policy.visualRules.supplementMinPxAt320 * 4)) : policies.completePrompt;
  const data = {
    schemaVersion: 1, renderer: complete ? 'note-imagegen-cover-v1' : 'note-pop-cover-v1', account: 'stats47', productionId: work.id,
    articleKey: article.key, articleTitle: correction?.generatedTitle ?? article.title, noteUrl: article.noteUrl ?? null,
    policyId: policy.id, policyVersion: policy.version, policySnapshot: policy,
    ...(complete ? { imagePrompt: `${common}\n\nカテゴリ方針:\n${policy.prompt}${mapReference ? `\n地図参照: 添付の${mapReference.name}の主域輪郭を必ず使う。北が上。離島は省略された地域識別用の輪郭であり、家計の観測対象は${work.brief.dataScope.place}。架空の海岸線や別県の形を作らない。` : ''}\n\n描く題材・構図:\n${work.brief.subject}\n\n掲載する文字（一字ずつ正確に。これ以外の文字を追加しない）:\n${copy.map(line => `「${line}」`).join('\n')}\n上部はカテゴリ名、主見出しは「${work.brief.headline.replaceAll('\n', ' / ')}」。補足の各行も幅320pxで読める大きさに。stats47は署名。` }
      : { backgroundPrompt: `${policies.commonPrompt}\n\n${policy.prompt}\n\n描く題材:\n${work.brief.subject}` }),
    composition: { width: 1280, height: 670, headline: work.brief.headline, subline: work.brief.subline, accent: policy.accent, publisher: 'stats47' },
    evidence: work.brief.evidence,
    ...(mapReference ? { mapReference, dataScope: work.brief.dataScope } : {}),
    instructions: complete
      ? '文字も含めてimagegenで一括生成する。原寸と幅320pxで掲載文言・文字切れ・重なり・本文との一致を目視確認する。実際のプロンプト・確認結果・生成原本をprepare-imageからprivate R2へ保存し、候補を比較して採用する。'
      : '背景を画像生成し、コピーは指定文字列のまま後から組版する。地図・データ図は検証済み素材を使う。画像は原寸と幅320pxで確認し、生成仕様とともに既存のnote:assets経路で非公開R2へ登録する。',
  };
  return { ...data, planSha256: coverSha(JSON.stringify(data)) };
}
export function coverProductionToken(row, article, policies) {
  const policy = latestCoverPolicy(policies, article.category);
  let mapSource;
  if (policy.visualRules?.layout === 'prefecture-map') {
    try { mapSource = prefectureCoverReference(article.key).reference; } catch { mapSource = null; }
  }
  return coverSha(JSON.stringify({ row, title: article.title, noteUrl: article.noteUrl ?? null, policy,
    common: policy.generation === 'imagegen-complete' ? (policy.visualRules ? policies.completePromptV2 : policies.completePrompt) : policies.commonPrompt,
    ...(mapSource !== undefined ? { mapSource } : {}) }));
}
export function coverProductionView(row, article, policies) {
  const policy = latestCoverPolicy(policies, article.category);
  const plan = buildCoverPlan(row, article, policies);
  const candidate = row.revisions.find(r => r.id === row.candidateRevisionId);
  // A draft has no note URL when its cover is generated. Publishing assigns the URL
  // without changing the approved image or copy, so retain that frozen plan.
  const draftPlan = article.noteUrl ? buildCoverPlan(row, { ...article, noteUrl: null }, policies) : null;
  const candidatePlanSha = candidate?.provenance.production?.planSha256;
  const matches = !!plan && !!candidatePlanSha && [plan.planSha256, draftPlan?.planSha256]
    .includes(candidatePlanSha);
  const outdated = !!row.production && (row.production.policyId !== policy.id || row.production.policyVersion !== policy.version);
  const stage = !row.production ? 'unplanned' : !plan ? 'brief' : outdated ? 'stale'
    : !matches ? (candidate?.provenance.production ? 'stale' : 'ready')
    : candidate.review.status === 'needs-revision' ? 'changes'
    : row.published?.status === 'configured' && row.published.revisionId === candidate.id ? 'published'
    : candidate.review.status === 'pass' && row.approvedRevisionId === candidate.id ? 'approved' : 'review';
  return { id: row.production?.id ?? null, policy, brief: row.production?.brief ?? null, plan, blockers: coverBriefIssues(row, article, policies),
    stage, revision: coverProductionToken(row, article, policies), candidateMatches: matches && !outdated,
    candidateRevisionId: candidate?.id ?? null };
}
export function assertCoverPlan(row, article, policies, supplied) {
  const plan = buildCoverPlan(row, article, policies);
  const latest = latestCoverPolicy(policies, article.category);
  if (!plan || plan.renderer !== 'note-imagegen-cover-v1' || latest.generation !== 'imagegen-complete' ||
      plan.policyId !== latest.id || plan.policyVersion !== latest.version ||
      !supplied || JSON.stringify(plan) !== JSON.stringify(supplied)) throw Error('cover production plan is stale or mismatched');
  return { id: plan.productionId, policyId: plan.policyId, policyVersion: plan.policyVersion, planSha256: plan.planSha256 };
}

/** CLI review/publish must enforce the same plan identity as the management UI. */
export function assertCurrentCoverCandidate(row, revisionId, context) {
  const revision = row?.revisions.find(r => r.id === revisionId);
  if (!revision) throw Error('unknown cover revision');
  if (!row.production?.brief || !revision.provenance.production || revision.provenance.renderer !== 'note-imagegen-cover-v1')
    throw Error('Codex imagegen cover with current production plan required; legacy covers are read-only');
  const policies = context?.policies ?? readCoverPolicies();
  const source = context?.article ?? readArticleLedger().articles.find(a => a.key === row.articleKey);
  const category = context?.article.category ?? (source && noteCoverCategory(source));
  if (!source || !category) throw Error('production article or policy missing');
  const view = coverProductionView(row, { ...source, category }, policies);
  if (!view.candidateMatches || view.candidateRevisionId !== revisionId) throw Error('cover production candidate is stale or mismatched');
  assertCoverPlan(row, { ...source, category }, policies, view.plan);
}
