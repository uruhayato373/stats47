export type ReviewStatus = 'done' | 'review' | 'unused' | 'undecided';
export type ReviewSample = { label: string; light?: string; dark?: string };
export type ReviewRow = { id: string; title: string; status: ReviewStatus; summary: string; samples: ReviewSample[] };

/** The templates the review script draws. Their ids are those of image-templates.json. */
export const SAMPLED_TEMPLATES = ['bar', 'tile-map', 'choropleth', 'scatter', 'line', 'stacked-bar', 'grouped-bar', 'chord', 'boxplot', 'table', 'pie', 'heatmap'] as const;
export type SampledTemplate = (typeof SAMPLED_TEMPLATES)[number];

interface LedgerTemplate {
  id: string;
  label: string;
  review?: { status: string; summary: string };
}

/**
 * The review page's rows: the template ledger is the source of each row, its order, title and status, and the
 * script only supplies pictures. A sample with no ledger row, or a decided template with no sample, stops here.
 */
export function reviewRowsOf(templates: readonly LedgerTemplate[], samples: Partial<Record<string, ReviewSample[]>>): ReviewRow[] {
  const listed = templates.flatMap((template) => (template.review ? [{ ...template, review: template.review }] : []));
  const ids = new Set(listed.map((template) => template.id));
  for (const id of Object.keys(samples)) if (!ids.has(id)) throw new Error(`型の台帳に無い見本: ${id}`);
  return listed.map(({ id, label, review }) => {
    const drawn = samples[id] ?? [];
    if ((review.status === 'undecided') !== (drawn.length === 0)) throw new Error(`型の状態と見本が合わない: ${id} (${review.status}・見本 ${drawn.length} 件)`);
    return { id, title: label, status: review.status as ReviewStatus, summary: review.summary, samples: drawn };
  });
}
