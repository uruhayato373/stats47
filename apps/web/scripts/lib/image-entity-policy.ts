/** note のslugとして許可する、安全なASCII英数字・ハイフン形式。 */
export function isSafeNoteSlug(slug: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(slug);
}
