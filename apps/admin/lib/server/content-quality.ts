import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { datasetPath } from '../../../../config/datasets.mjs';
import { z } from 'zod';
import { NOTE_ARTICLES } from '../../../../.claude/scripts/note/catalog';
import {
  createArticleStores,
  readManifest,
} from '../../../../.claude/scripts/note/lib/article-store.mjs';
import {
  readVerified,
  mediaStore,
} from '../../../../.claude/scripts/media/lib/storage.mjs';
import {
  CHECKS,
  FILES,
  WorkspaceError,
  imageLibrary,
  imageById,
  inputKey,
  candidateKey,
  sha,
  storeVerified,
  registerCandidate,
  reviewCandidate,
  workspaceItems,
  readTemplates,
  type VisualReview,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { projectRoot } from './project-root';
import { getById } from './posts-store';

export function qualityOverview() {
  const library = imageLibrary(projectRoot());
  const reportFile = path.join(
    projectRoot(),
    datasetPath('content.image-migration')
  );
  const report = fs.existsSync(reportFile)
    ? JSON.parse(fs.readFileSync(reportFile, 'utf8'))
    : null;
  return {
    items: workspaceItems(projectRoot()),
    ...library,
    migration: report
      ? {
          observedAt: report.observedAt,
          counts: Object.fromEntries(
            [
              ...new Set<string>(
                report.results.map((r: { status: string }) => r.status)
              ),
            ].map((s) => [
              s,
              report.results.filter((r: { status: string }) => r.status === s)
                .length,
            ])
          ),
        }
      : null,
    templates: library.templates.map((t) => ({ ...t, revision: sha(t) })),
  };
}
export function regenerationRequest(id: string) {
  const image = imageById(projectRoot(), id);
  const template = readTemplates(projectRoot()).templates.find(
    (t) => t.id === image.templateId
  );
  return {
    schemaVersion: 1,
    account: 'stats47',
    imageId: id,
    owner: image.owner,
    file: image.file,
    basis: image.basis,
    mode: 'fixed-data-design',
    original: image.original,
    template,
    policy: image.policy,
    inputs: image.inputFiles,
    requiredReview: ['original', 'mobile-320px', 'data-year-unit'],
    instruction:
      '保存済みの年・単位・数値を保持して改善する。入力が不足する場合は回収する。統計図は決定的なrendererで作る。カバーは専用制作画面を使う。',
    reproducibility: image.inputFiles.length
      ? 'inputs-listed-not-render-verified'
      : 'inputs-unverified',
  };
}
export async function contentBody(owner: string) {
  if (owner.startsWith('sns/'))
    return {
      body: getById(Number(owner.slice(4)))?.caption ?? '',
      files: [],
      verified: true,
    };
  const article = NOTE_ARTICLES.find((a) => owner === 'note/' + a.key);
  if (!article) throw new WorkspaceError('記事が見つかりません。', 404);
  if (!article.body?.manifest)
    return {
      body: '',
      files: [],
      verified: false,
      reason: '本文のR2保存記録がありません。公開記事からの回収が必要です。',
    };
  const stores = createArticleStores(article),
    manifest = await readManifest(article, stores.archive);
  const file = manifest.files.find(
    (f: { name: string }) => f.name === 'draft.md'
  );
  if (!file) throw new WorkspaceError('原稿が保存一覧にありません。', 404);
  const bytes = await readVerified({
    ...file,
    bucket: stores.body.bucket,
    key: article.r2Path + '/draft.md',
  });
  return {
    body: bytes.toString('utf8'),
    files: manifest.files,
    verified: true,
  };
}
export async function importImage(
  id: string,
  revision: string,
  file: File,
  supplied: unknown
) {
  const evidence = z
    .object({
      renderer: z.string().trim().min(1).max(1000),
      sourceData: z.string().trim().min(1).max(10000),
      changes: z.string().trim().min(1).max(10000),
    })
    .strict()
    .safeParse(supplied);
  if (!evidence.success)
    throw new WorkspaceError(
      '生成根拠のrenderer・sourceData・changesを具体的に入力してください。'
    );
  const root = projectRoot(),
    current = imageById(root, id);
  if (current.kind === 'cover')
    throw new WorkspaceError('カバー制作画面を使ってください。');
  if (current.revision !== revision)
    throw new WorkspaceError(
      '制作条件が変わりました。再読込してください。',
      409
    );
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length || bytes.length > 16 * 1024 * 1024)
    throw new WorkspaceError('画像は16MB以内にしてください。');
  const metadata = await sharp(bytes, {
    limitInputPixels: 40_000_000,
  }).metadata();
  const extensions: Record<string, string> = {
    png: 'png',
    jpeg: 'jpg',
    webp: 'webp',
  };
  const ext = extensions[metadata.format ?? ''];
  if (
    !ext ||
    !metadata.width ||
    !metadata.height ||
    (metadata.pages && metadata.pages !== 1)
  )
    throw new WorkspaceError('静止画のPNG・JPEG・WebPを指定してください。');
  const store = mediaStore();
  const storage = await storeVerified(
    store,
    candidateKey(sha(bytes), ext),
    bytes
  );
  const request = regenerationRequest(id);
  const inputBytes = Buffer.from(
    JSON.stringify({
      request,
      supplied: evidence.data,
      imageSha256: storage.sha256,
    })
  );
  const input = await storeVerified(
    store,
    inputKey(sha(inputBytes)),
    inputBytes
  );
  registerCandidate(root, id, revision, {
    id: sha([storage.sha256, input.sha256]),
    basis: current.basis,
    storage,
    input,
    width: metadata.width,
    height: metadata.height,
    createdAt: new Date().toISOString(),
    review: null,
  });
  return imageById(root, id);
}
export async function saveVisualReview(
  id: string,
  revision: string,
  candidate: string,
  review: VisualReview
) {
  const current = imageById(projectRoot(), id);
  if (current.candidate?.id !== candidate)
    throw new WorkspaceError('候補が変わりました。', 409);
  await readVerified(current.candidate.storage);
  await readVerified(current.candidate.input);
  reviewCandidate(projectRoot(), id, revision, candidate, review);
  return imageById(projectRoot(), id);
}
export async function imageBytes(id: string, revision: string, input: boolean) {
  const image = imageById(projectRoot(), id);
  if (revision === 'original') {
    if (!image.original?.key)
      throw new WorkspaceError('R2への移行が未完了です。', 404);
    return {
      bytes: await readVerified(image.original),
      mime: path.extname(image.original.key).toLowerCase(),
    };
  }
  const record = image.record?.revisions.find((r) => r.id === revision);
  if (!record) throw new WorkspaceError('保存画像が見つかりません。', 404);
  const ref = input ? record.input : record.storage;
  return {
    bytes: await readVerified(ref),
    mime: path.extname(ref.key).toLowerCase(),
  };
}
export function inventoryState(owner: string) {
  if (!owner.startsWith('note/')) return null;
  const index = JSON.parse(
    fs.readFileSync(path.join(projectRoot(), FILES.inventory), 'utf8')
  );
  return index.articles[owner.slice(5)] ?? { status: 'unindexed' };
}
export { CHECKS };
