const NOTE_KEY_PATTERN = /^n[0-9a-f]+$/i;

export function isValidNoteKey(noteKey: string): boolean {
  return NOTE_KEY_PATTERN.test(noteKey);
}

/**
 * note のリンクカードには query を置かず、到着時だけ GA4 標準 UTM へ変換する。
 * utm_content に公開 note ID を残すため、記事単位で商品送客を集計できる。
 */
export function buildNoteProductDestination(
  productSlug: string,
  noteKey: string,
): string {
  const search = new URLSearchParams({
    utm_source: "note",
    utm_medium: "referral",
    utm_campaign: "note_product",
    utm_content: noteKey,
  });
  return `/products/${encodeURIComponent(productSlug)}?${search.toString()}`;
}
