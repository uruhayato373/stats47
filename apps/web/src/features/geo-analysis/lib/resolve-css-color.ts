/**
 * `hsl(var(--chart-3))` のような CSS 変数を含む色を、ブラウザが解釈した実際の色 (rgb) に変える。
 * Leaflet の canvas 描画は CSS 変数を解決できないので、区分の台帳 (トークン) の色をここで変換してから渡す。
 * ブラウザの外 (SSR・テスト) では変換できないので、受け取った値をそのまま返す。
 */
export function resolveCssColor(value: string): string {
  if (typeof document === 'undefined' || !value.includes('var(')) return value;
  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.append(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || value;
}
