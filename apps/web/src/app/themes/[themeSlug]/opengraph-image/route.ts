import { ALL_THEMES } from '@/features/theme-dashboard/config/all-themes';

import { ogpImageKeys,ogpImageUrl } from '@/lib/metadata/ogp-image';

/** Compatibility for previously shared cards; the page metadata uses R2 directly. */
export async function GET(_request:Request,{params}:{params:Promise<{themeSlug:string}>}) {
  const {themeSlug}=await params;
  if(!ALL_THEMES.some(theme=>theme.themeKey===themeSlug))return new Response(null,{status:404});
  return Response.redirect(ogpImageUrl(ogpImageKeys.theme(themeSlug)),307);
}
