export const IMAGE_PURPOSES: Record<string, string>;
export const IMAGE_SELECTIONS: Record<string, string>;
export const TEMPLATE_ALIASES: Record<string, string>;
export const RETIRED_TEMPLATES: string[];
export const VISUAL_TEMPLATES: Pick<
  import('./workspace.mjs').Template,
  'id' | 'label' | 'policy' | 'renderer'
>[];
export function canonicalTemplate(id: string): string;
export function purposeFromEvidence(template?: string, file?: string): string;
export function taxonomyQuery(
  query: Record<string, string | undefined>
): Record<string, string | undefined>;
