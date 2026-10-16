export const MEDIA_PAGES = {
  templates: '/ops/image-templates',
  images: '/ops/image-library',
  articles: '/product/content-quality',
} as const;

export const TEMPLATE_MEDIA = [
  'note',
  'x',
  'instagram',
  'web',
  'compare',
] as const;
export type TemplateMedium = (typeof TEMPLATE_MEDIA)[number];

export function templateMedium(value: string | null): TemplateMedium | null {
  return TEMPLATE_MEDIA.includes(value as TemplateMedium)
    ? (value as TemplateMedium)
    : null;
}

export function mediaUrl(
  page: keyof typeof MEDIA_PAGES,
  values: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return MEDIA_PAGES[page] + (params.size ? '?' + params : '');
}

/** Old bookmarks keep their filters while moving to the dedicated page. */
export function mediaViewRedirect(query: Record<string, string | undefined>) {
  const { view, ...filters } = query;
  return view === 'templates' || view === 'articles'
    ? mediaUrl(view, filters)
    : null;
}

/** Only a local template page can be used as a return destination. */
export function templateReturnUrl(value: string | null) {
  if (!value?.startsWith(MEDIA_PAGES.templates + '?')) return null;
  const url = new URL(value, 'http://localhost');
  return url.pathname === MEDIA_PAGES.templates
    ? url.pathname + url.search
    : null;
}
