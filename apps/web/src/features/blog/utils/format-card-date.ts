/** ISO 文字列を記事カードの日付 YYYY.MM.DD へ整形。無効値は null (ブログ一覧とタグの一覧で共有する) */
export function formatCardDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}
