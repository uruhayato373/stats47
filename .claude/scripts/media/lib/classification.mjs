/** Shared, deterministic classification and work queues. No caption, size or topic guesses. */
import {
  canonicalTemplate,
  purposeFromEvidence,
  IMAGE_PURPOSES,
  IMAGE_SELECTIONS,
  selectionAllowed,
} from './taxonomy.mjs';
export const CLASSIFIER_VERSION = 1;
export const IMAGE_ROLES = {
  chart: '統計グラフ',
  table: '数表',
  diagram: '説明図・手順',
  title: '表紙・タイトル',
  source: '出典・注記',
  navigation: '案内・CTA',
  summary: '要点・まとめ',
  caution: '注意事項',
  photo: '写真',
  illustration: 'イラスト・背景',
  outline: '地理・輪郭素材',
  logo: 'ロゴ・アイコン',
  unresolved: '役割を確認する',
};
export const CLASSIFICATION_STATES = {
  recorded: '記録から分類',
  confirmed: '分類確認済み',
  suggested: '分類案・要確認',
  pending: '要分類',
  stale: '画像変更・再分類',
};
export const IMAGE_QUEUES = {
  classification: '用途・型を確認',
  original: '原本を回収・照合',
  inputs: '元データを確認',
  plan: '改善方針を記録',
  candidate: '候補を作成',
  review: '候補を目視確認',
  approved: '候補採用済み・反映は別途',
  cover: 'カバー制作台帳で進める',
  kept: '現画像を確認済み・維持',
};
const fixedRoles = {
  'note-cover': 'title',
  ogp: 'title',
  'link-card': 'navigation',
  'title-card': 'title',
  'source-card': 'source',
  'cta-card': 'navigation',
  'summary-card': 'summary',
  'caution-card': 'caution',
  'pref-silhouette': 'outline',
  background: 'illustration',
  photo: 'photo',
  'logo-icon': 'logo',
  procedure: 'diagram',
  diagram: 'diagram',
  'svg-findings': 'summary',
  'svg-table': 'table',
  table: 'table',
  unclassified: 'unresolved',
};
export function roleForTemplate(id) {
  return fixedRoles[id] ?? 'chart';
}
export function classificationNeedsReview(value) {
  return !value || ['pending', 'suggested', 'stale'].includes(value.status);
}

export function slideTemplate(source = '') {
  const name = source.replaceAll('\\', '/').split('/').at(-1).toLowerCase();
  const role = name.match(
    /(?:^|[-_])slide-\d+-(cover|cta|source|outro|caution|highlights)(?:[-_.]|$)/
  )?.[1];
  return (
    {
      cover: 'title-card',
      cta: 'cta-card',
      source: 'source-card',
      outro: 'cta-card',
      caution: 'caution-card',
      highlights: 'summary-card',
    }[role] ?? null
  );
}

export function filenameTemplate(file) {
  const name = file.replaceAll('\\', '/').split('/').at(-1).toLowerCase();
  const slide = slideTemplate(name);
  if (slide) return slide;
  for (const id of ['boxplot', 'waterfall', 'radar', 'heatmap', 'sankey'])
    if (new RegExp('(?:^|[-_])' + id + '(?:[-_.]|$)').test(name)) return id;
  if (/(?:^|[-_])(?:pie|donut)(?:[-_.]|$)/.test(name)) return 'pie';
  if (/^(?:ranking-)?table[-_.]/.test(name)) return 'table';
  if (/tile[-_]?(?:map|grid)/.test(name)) return 'tile-map';
  if (/choropleth|prefecture-map/.test(name)) return 'choropleth';
  if (/scatter/.test(name)) return 'scatter';
  if (/line-chart/.test(name)) return 'line';
  if (/(?:^|[-_])bars?(?:[-_.]|$)/.test(name)) return 'bar';
  if (/flowchart|lineage|procedure/.test(name)) return 'diagram';
  // Generic chart-N / image-N and the owner's subject do not establish a chart type.
  return 'unclassified';
}

/** Manual decisions are tied to the original, never to metrics or a mutable caption. */
export function resolveClassification({
  kind,
  templateId,
  file,
  source,
  record,
  basis,
  origin,
}) {
  if (kind === 'cover')
    return {
      templateId: 'note-cover',
      role: 'title',
      status: 'recorded',
      basis,
      reason: 'noteカバー台帳の @cover。制作・採用・公開は同じカバーIDで管理。',
      purpose: 'explanation',
      selection: 'na',
    };
  if (record?.classification)
    return {
      templateId: canonicalTemplate(record.templateId),
      role: canonicalTemplate(record.templateId) === record.templateId
        ? record.classification.role
        : roleForTemplate(canonicalTemplate(record.templateId)),
      basis,
      status:
        canonicalTemplate(record.templateId) !== record.templateId ||
        !record.classification.purpose ||
        !record.classification.selection
          ? 'stale'
          : record.classification.basis === basis
            ? 'confirmed'
            : 'stale',
      reason: record.classification.reason,
      updatedAt: record.classification.updatedAt,
      purpose:
        record.classification.purpose ??
        purposeFromEvidence(record.templateId, source ?? file),
      selection: record.classification.selection ?? 'undecided',
    };
  const slide = slideTemplate(source ?? file);
  const id =
    slide ??
    (templateId && canonicalTemplate(templateId) !== 'unclassified'
      ? canonicalTemplate(templateId)
      : filenameTemplate(source ?? file));
  if (
    record?.templateId &&
    canonicalTemplate(record.templateId) !== 'unclassified' &&
    canonicalTemplate(record.templateId) !== id
  )
    return {
      templateId: canonicalTemplate(record.templateId),
      role: roleForTemplate(canonicalTemplate(record.templateId)),
      status: 'suggested',
      basis,
      purpose: purposeFromEvidence(record.templateId, source ?? file),
      selection: 'undecided',
      reason:
        '既存の改善台帳による指定。元画像に結び付いた分類の確認記録が必要です。',
    };
  const status =
    id === 'unclassified'
      ? 'pending'
      : slide || origin === 'contract'
        ? 'recorded'
        : 'suggested';
  return {
    templateId: id,
    role: roleForTemplate(id),
    status,
    basis,
    purpose: purposeFromEvidence(
      record?.templateId ?? templateId,
      source ?? file
    ),
    selection: 'undecided',
    reason:
      status === 'pending'
        ? '型を特定する記録が不足しています。実画像・生成元を確認して指定してください。'
        : slide
          ? '生成ファイル名にスライドの役割が明記されています: ' +
            (source ?? file)
          : status === 'recorded'
            ? '生成・使用先の契約に記録された型: ' + id
            : '既存カタログ・生成名からの分類案です。実画像で確認してください。',
  };
}

export function imageTasks(image) {
  if (image.kind === 'cover') return ['cover'];
  const tasks = [];
  if (classificationNeedsReview(image.classification))
    tasks.push('classification');
  if (!image.original?.sha256) tasks.push('original');
  // A source article, SVG or generation manifest alone is not fixed numeric input.
  if (
    ['chart', 'table'].includes(image.classification.role) &&
    !image.inputFiles.some(
      (f) =>
        f.sha256 &&
        /\.(json|csv)$/i.test(f.name) &&
        !/source|manifest|render[-_]spec|generation/i.test(f.name) &&
        ['data', 'input'].includes(f.role)
    )
  )
    tasks.push('inputs');
  if (image.assessmentMatches && image.assessment?.status === 'pass')
    return [...tasks, 'kept'];
  if (!image.policy.trim()) tasks.push('plan');
  tasks.push(
    image.approved
      ? 'approved'
      : !image.candidate ||
          !image.candidateMatches ||
          image.candidate.review?.status === 'needs-revision'
        ? 'candidate'
        : 'review'
  );
  return tasks;
}

/** A missing index is a task, not evidence that an article has no images. */
export function inventoryGaps(
  sources,
  inventory,
  web,
  reviews = {},
  items = []
) {
  const gaps = [];
  for (const article of sources.articles) {
    const entry = inventory.articles[article.key];
    if (
      !article.body.manifest ||
      entry?.status !== 'indexed' ||
      entry.manifestSha !== article.body.manifest.sha256
    )
      gaps.push({
        owner: 'note/' + article.key,
        reason: !article.body.manifest
          ? '本文・画像の保存記録が未回収です。'
          : '本文の現行版に対応する画像一覧が未取得です。',
      });
    if (!sources.covers.some((c) => c.articleKey === article.key))
      gaps.push({
        owner: 'note/' + article.key,
        reason: 'カバー台帳が未登録です。',
      });
  }
  for (const post of sources.posts.filter(
    (p) => p.platform !== 'note' && p.status !== 'deleted'
  )) {
    const owner = 'sns/' + post.id,
      review = reviews[owner],
      item = items.find((i) => i.id === owner);
    if (
      !post.assets?.length &&
      !(
        review?.imageInventory === 'no-assets' &&
        review.inventoryReason?.trim() &&
        review.basis === item?.basis
      )
    )
      gaps.push({
        owner,
        reason:
          '素材一覧が未登録です。画像なしの投稿か、回収待ちかを確認してください。',
      });
  }
  for (const item of web.items)
    if (item.inventoryError || item.indexComplete === false)
      gaps.push({
        owner: item.id,
        reason: item.inventoryError ?? '使用画像の棚卸しが未完了です。',
      });
  return gaps;
}

export function classificationSummary(images) {
  const states = Object.fromEntries(
    Object.keys(CLASSIFICATION_STATES).map((k) => [k, 0])
  );
  const tasks = Object.fromEntries(
    Object.keys(IMAGE_QUEUES).map((k) => [k, 0])
  );
  for (const image of images) {
    states[image.classification.status]++;
    for (const task of image.tasks) tasks[task]++;
  }
  return { version: CLASSIFIER_VERSION, total: images.length, states, tasks };
}

export function auditClassification(images, templates) {
  const types = new Set(templates.map((t) => t.id));
  for (const image of images) {
    const c = image.classification;
    if (
      !c ||
      !types.has(image.templateId) ||
      c.templateId !== image.templateId ||
      !Object.hasOwn(IMAGE_ROLES, c.role) ||
      !Object.hasOwn(CLASSIFICATION_STATES, c.status) ||
      !/^[a-f0-9]{64}$/.test(c.basis) ||
      !c.reason?.trim() ||
      !Object.hasOwn(IMAGE_PURPOSES, c.purpose) ||
      !Object.hasOwn(IMAGE_SELECTIONS, c.selection) ||
      !selectionAllowed(c.purpose, c.selection)
    )
      throw Error('Missing classification contract: ' + image.id);
    if (c.role !== roleForTemplate(image.templateId))
      throw Error('Role/template conflict: ' + image.id);
    if (
      !image.tasks?.length ||
      image.tasks.some((t) => !Object.hasOwn(IMAGE_QUEUES, t)) ||
      JSON.stringify(image.tasks) !== JSON.stringify(imageTasks(image))
    )
      throw Error('Missing image task: ' + image.id);
    if (
      image.kind === 'cover' &&
      (image.templateId !== 'note-cover' || !image.coverManagement)
    )
      throw Error('Cover route missing: ' + image.id);
    if (image.approved && classificationNeedsReview(c))
      throw Error('Unconfirmed classification approved: ' + image.id);
  }
  const report = classificationSummary(images);
  if (Object.values(report.states).reduce((a, b) => a + b, 0) !== images.length)
    throw Error('Classification count mismatch');
  return report;
}
