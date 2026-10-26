import { hrefFor } from "@stats47/data-configs/content/href";

/** テーマの正典 URL を返す。既定は `/themes/{themeKey}` (pattern の正本は data/content/routes.json)。 */
export function themeHref(themeKey: string): string {
  return hrefFor("theme", { themeSlug: themeKey });
}
