/** テーマの正典 URL を返す。既定は `/themes/{themeKey}`。 */
export function themeHref(themeKey: string): string {
  return `/themes/${themeKey}`;
}
