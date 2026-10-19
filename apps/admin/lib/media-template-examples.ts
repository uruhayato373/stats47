import type { ImageView } from '../../../.claude/scripts/media/lib/workspace.mjs';
import {
  canonicalTemplate,
  IMAGE_PURPOSES,
  selectionAllowed,
} from '../../../.claude/scripts/media/lib/taxonomy.mjs';

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
  sharedFrom?: string;
}
export function comparisonTopic(
  image: ImageView
): NonNullable<ImageView['comparison']> {
  return (
    image.comparison ?? {
      key: image.original?.sha256 ? 'asset-' + image.original.sha256 : image.id,
      title: image.title + ' · ' + image.file,
      url: image.pageUrl ?? null,
      role: 'reference' as const,
    }
  );
}

/** Keep every note/SNS reference selectable; limit the much larger Web catalogue per leaf/ratio. */
export function templateSamplePool(images: ImageView[]) {
  const groups = new Map<string, ImageView[]>();
  const counts: Record<string, number> = {};
  for (const image of images) {
    if (!templateExamples([image]).length) continue;
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
  // Keep every bar topic and explicitly linked topic, even beyond the Web sample cap.
  for (const image of images)
    if (
      (image.templateId === 'bar' ||
        image.comparison?.role === 'layout' ||
        image.comparison?.reason) &&
      templateExamples([image]).length
    )
      samples.set(image.id, image);
  for (const group of groups.values()) {
    for (const channel of [...MEDIA_CHANNELS, 'web']) {
      for (const ratio of ['', ...channelRatios(group, channel)]) {
        for (const example of channelExamples(
          group,
          channel,
          ratio,
          channel === 'web' ? 3 : Infinity
        )) {
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
        image.previewOnly ||
        image.templateId === 'unclassified' ||
        canonicalTemplate(image.templateId) !== image.templateId ||
        (image.kind === 'cover' && image.templateId !== 'note-cover') ||
        !['recorded', 'confirmed'].includes(image.classification?.status) ||
        image.classification?.purpose === 'undecided' ||
        image.classification?.selection === 'undecided'
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
export const TEMPLATE_CHANNELS = ['note', 'web', 'x', 'instagram'] as const;
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
  ratio = '',
  limit = Infinity
) {
  return templateExamples(
    images.filter(
      (image) =>
        image.channel === channel &&
        (!ratio || exampleDimensions(image)?.ratio === ratio)
    ),
    limit
  );
}

export interface TemplateBranch {
  key: string;
  templateId: string;
  purpose: string;
  images: ImageView[];
}

/** Navigation stops at purpose + visual encoding. Range remains image metadata. */
export function templateBranches(images: ImageView[]): TemplateBranch[] {
  const branches = new Map<string, TemplateBranch>();
  for (const image of images) {
    const { purpose, selection } = image.classification ?? {};
    if (!purpose || !selection || !selectionAllowed(purpose, selection))
      continue;
    if (!templateExamples([image]).length || purpose === 'undecided') continue;
    const key = sampleCountKey(image.templateId, purpose);
    const branch = branches.get(key) ?? {
      key,
      templateId: image.templateId,
      purpose,
      images: [],
    };
    branch.images.push(image);
    branches.set(key, branch);
  }
  return [...branches.values()]
    .filter((branch) =>
      [...MEDIA_CHANNELS, 'web'].some(
        (channel) => channelExamples(branch.images, channel).length
      )
    )
    .sort(
      (a, b) =>
        Object.keys(IMAGE_PURPOSES).indexOf(a.purpose) -
          Object.keys(IMAGE_PURPOSES).indexOf(b.purpose) ||
        a.templateId.localeCompare(b.templateId)
    );
}

/** Resolve old broad bookmarks to a single leaf, keeping an explicitly selected sample when possible. */
export function resolveTemplateBranch(
  branches: TemplateBranch[],
  query: Record<string, string | undefined>
) {
  const requestedPurpose =
    query.purpose || (query.selection === 'top-bottom' ? 'ranking' : '');
  const matching = branches.filter(
    (branch) =>
      (!query.template || branch.templateId === query.template) &&
      (!requestedPurpose || branch.purpose === requestedPurpose)
  );
  const selectedSamples = [...MEDIA_CHANNELS, 'web']
    .map((channel) => query['sample-' + channel])
    .filter(Boolean);
  return (
    matching.find((branch) =>
      branch.images.some((image) => selectedSamples.includes(image.id))
    ) ?? matching[0]
  );
}

export function comparisonGroups(images: ImageView[]) {
  return [
    ...new Map(
      images
        .filter(
          (image) =>
            comparisonTopic(image).role !== 'note-original' &&
            templateExamples([image]).length
        )
        .sort(
          (a, b) =>
            Number(!!comparisonTopic(a).reason) -
            Number(!!comparisonTopic(b).reason)
        )
        .map((image) => [
          comparisonTopic(image).key,
          {
            key: comparisonTopic(image).key,
            title: comparisonTopic(image).title,
          },
        ])
    ).values(),
  ].sort((a, b) => a.key.localeCompare(b.key));
}

/** Same-article fixed layouts. The note source image is available in image details only. */
export function comparisonExamples(
  images: ImageView[],
  channel: string,
  topic: string | null,
  ratio = ''
): TemplateExample[] {
  if (!topic) return channelExamples(images, channel, ratio);
  const group = images.filter((image) => {
    const meta = comparisonTopic(image);
    if (meta.key !== topic || meta.role === 'note-original') return false;
    if (
      meta.requiredSelection &&
      image.classification.selection !== meta.requiredSelection
    )
      return false;
    const currentCandidate =
      image.candidate &&
      image.candidateMatches &&
      image.candidate.review?.status !== 'needs-revision';
    if (meta.candidateOnly && !currentCandidate) return false;
    return !(meta.role === 'layout' && image.candidate && !currentCandidate);
  });
  const examples = channelExamples(group, channel, ratio);
  if (examples.length) return examples;
  return templateExamples(
    group.filter(
      (image) =>
        comparisonTopic(image).sharedChannels?.includes(
          channel as (typeof TEMPLATE_CHANNELS)[number]
        ) &&
        (!ratio || exampleDimensions(image)?.ratio === ratio)
    ),
    Infinity
  ).map((example) => ({
    ...example,
    state: example.state === 'existing' ? 'existing' : 'candidate',
    sharedFrom: example.image.channel,
  }));
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
