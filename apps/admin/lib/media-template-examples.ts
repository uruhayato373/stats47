import type { ImageView } from '../../../.claude/scripts/media/lib/workspace.mjs';
import { canonicalTemplate } from '../../../.claude/scripts/media/lib/taxonomy.mjs';

export function originalUrl(image: ImageView) {
  if (image.kind === 'cover') return image.coverUrl ?? null;
  if (
    image.original?.key ||
    image.original?.path ||
    image.original?.provider === 'inline-svg' ||
    (image.original?.url && image.original.provider !== 'external')
  )
    return '/api/media-library/' + image.id + '/file';
  return image.original?.url ?? image.legacyUrl ?? null;
}
export function candidateUrl(image: ImageView) {
  if (image.kind === 'cover') return image.coverCandidateUrl ?? null;
  return image.candidate
    ? '/api/media-library/' + image.id + '/file?revision=' + image.candidate.id
    : null;
}
export interface TemplateExample {
  image: ImageView;
  src: string;
  state: 'approved' | 'candidate' | 'stale' | 'existing';
}

/** Send only the visible sample pool; full ledgers stay on the library page. */
export function templateSamplePool(images: ImageView[]) {
  const groups = new Map<string, ImageView[]>();
  const counts: Record<string, number> = {};
  for (const image of images) {
    counts[image.templateId] = (counts[image.templateId] ?? 0) + 1;
    for (const purpose of new Set(['', image.classification?.purpose ?? ''])) {
      for (const selection of new Set([
        '',
        image.classification?.selection ?? '',
      ])) {
        const key = sampleCountKey(image.templateId, purpose, selection);
        counts[key] = (counts[key] ?? 0) + 1;
        const group = groups.get(key) ?? [];
        group.push(image);
        groups.set(key, group);
      }
    }
  }
  const samples = new Map<string, ImageView>();
  for (const group of groups.values()) {
    for (const channel of [...MEDIA_CHANNELS, 'web']) {
      for (const ratio of ['', ...channelRatios(group, channel)]) {
        for (const example of channelExamples(group, channel, ratio)) {
          samples.set(example.image.id, example.image);
        }
      }
    }
  }
  return { images: [...samples.values()], counts };
}
export const sampleCountKey = (id: string, purpose = '', selection = '') =>
  `${id}:${purpose}:${selection}`;
const order = { approved: 0, candidate: 1, stale: 2, existing: 3 };

/** Use actual ledger assets; a displayed example never implies template approval. */
export function templateExamples(
  images: ImageView[],
  limit = 3
): TemplateExample[] {
  const examples = images
    .flatMap((image): TemplateExample[] => {
      if (
        image.templateId === 'unclassified' ||
        canonicalTemplate(image.templateId) !== image.templateId ||
        (image.kind === 'cover' && image.templateId !== 'note-cover') ||
        ['pending', 'stale'].includes(image.classification?.status)
      )
        return [];
      // Covers have a separate approval ledger; don't infer their candidate state here.
      const candidate =
        image.kind !== 'cover' &&
        image.candidate &&
        image.candidateMatches &&
        image.candidate.review?.status !== 'needs-revision';
      const src = candidate ? candidateUrl(image) : originalUrl(image);
      if (!src) return [];
      return [
        {
          image,
          src,
          state: candidate
            ? !image.candidateMatches
              ? 'stale'
              : image.approved
                ? 'approved'
                : 'candidate'
            : 'existing',
        },
      ];
    })
    .sort(
      (a, b) =>
        order[a.state] - order[b.state] ||
        Number(b.image.classification?.status === 'confirmed') -
          Number(a.image.classification?.status === 'confirmed') ||
        Number(!!b.image.original?.key || !!b.image.original?.path) -
          Number(!!a.image.original?.key || !!a.image.original?.path) ||
        Number(!!b.image.original?.sha256) -
          Number(!!a.image.original?.sha256) ||
        a.image.id.localeCompare(b.image.id)
    );
  const selected: TemplateExample[] = [];
  const fingerprints = new Set<string>();
  for (const example of examples) {
    const fingerprint =
      example.state === 'existing'
        ? (example.image.original?.sha256 ?? example.src)
        : example.image.candidate!.storage.sha256;
    if (fingerprints.has(fingerprint)) continue;
    fingerprints.add(fingerprint);
    selected.push(example);
    if (selected.length === limit) break;
  }
  return selected;
}

export const MEDIA_CHANNELS = ['note', 'x', 'instagram'] as const;
export type MediaChannel = (typeof MEDIA_CHANNELS)[number];

/** Actual dimensions only: filenames and channel presets are not measurement evidence. */
export function exampleDimensions(
  image: ImageView,
  candidate = !!image.candidate &&
    image.candidateMatches &&
    image.candidate.review?.status !== 'needs-revision'
) {
  const box = image.viewBox
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = candidate ? image.candidate?.width : (image.width ?? box?.[2]);
  const height = candidate
    ? image.candidate?.height
    : (image.height ?? box?.[3]);
  if (
    !width ||
    !height ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  const known = [
    [1, 1],
    [4, 5],
    [2, 3],
    [9, 16],
    [16, 9],
  ];
  const match = known.find(
    ([w, h]) => Math.abs(width / height - w / h) < 0.002
  );
  const ratio = match ? match.join(':') : (width / height).toFixed(2) + ':1';
  return { width, height, ratio };
}

export function channelExamples(
  images: ImageView[],
  channel: string,
  ratio = ''
) {
  return templateExamples(
    images.filter(
      (image) =>
        image.channel === channel &&
        (!ratio || exampleDimensions(image)?.ratio === ratio)
    )
  );
}

export function channelRatios(images: ImageView[], channel: string) {
  return [
    ...new Set(
      templateExamples(
        images.filter((image) => image.channel === channel),
        Infinity
      )
        .map(
          (example) =>
            exampleDimensions(example.image, example.state !== 'existing')
              ?.ratio
        )
        .filter((ratio): ratio is string => !!ratio)
    ),
  ].sort();
}
