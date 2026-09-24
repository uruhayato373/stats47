/**
 * 相関係数の表示 (ランキング「相関が高い指標」とテーマ「このテーマと関連の深い指標」で共通)。
 * 係数は -1〜1 で意味が閉じた派生値なので、データセットの桁揃えではなく常に小数 2 桁で出す。
 */
export function formatCorrelation(r: number): string {
  const sign = r >= 0 ? "+" : "";
  return `${sign}${r.toFixed(2)}`;
}

/**
 * 正の相関は赤系・負の相関は青系、|r| 0.7 / 0.4 で色相を分ける。
 * 12px の数値なので WCAG AA (4.5:1) を満たす 700 番台を使う (500 番台は白地で 2.4〜3.8:1)。
 */
export function correlationColorClass(r: number): string {
  if (r >= 0.7) return "text-red-700 dark:text-red-400";
  if (r >= 0.4) return "text-orange-700 dark:text-orange-400";
  if (r <= -0.7) return "text-blue-700 dark:text-blue-400";
  if (r <= -0.4) return "text-cyan-700 dark:text-cyan-400";
  return "text-muted-foreground";
}
