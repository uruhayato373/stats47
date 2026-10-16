import type { ImageView } from '../../../.claude/scripts/media/lib/workspace.mjs';

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
const order = { approved: 0, candidate: 1, stale: 2, existing: 3 };

// Legacy sample overrides: remove when NOTE-ARTICLE-QUALITY-PILOT-01 separates process timelines and chart types.
// Until then, use explicit statistical examples for these broad groups.
const referenceImages: Record<string, string[]> = {
  'time-series': ['IMG-d28cb325765185d2707d5a1b'],
  household: ['IMG-bfce0322b0e9e684edcd2018', 'IMG-0ac68685cae114fcd8a29bbd'],
};

/** Use actual ledger assets; a displayed example never implies template approval. */
export function templateExamples(images: ImageView[]): TemplateExample[] {
  const examples = images
    .flatMap((image): TemplateExample[] => {
      if (image.templateId === 'unclassified' || image.kind === 'cover')
        return [];
      // Covers have a separate approval ledger; don't infer their candidate state here.
      const candidate =
        image.candidate && image.candidate.review?.status !== 'needs-revision';
      const references = referenceImages[image.templateId];
      if (!candidate && references && !references.includes(image.id)) return [];
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
    if (selected.length === 3) break;
  }
  return selected;
}
