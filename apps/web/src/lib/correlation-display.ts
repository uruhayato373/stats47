/**
 * 相関係数の表示 (ランキング「相関が高い指標」とテーマ「このテーマと関連の深い指標」で共通)。
 * 係数は -1〜1 で意味が閉じた派生値なので、データセットの桁揃えではなく常に小数 2 桁で出す。
 */
export function formatCorrelation(r: number): string {
  const sign = r >= 0 ? "+" : "";
  return `${sign}${r.toFixed(2)}`;
}

/** 正の相関は赤系・負の相関は青系、|r| 0.7 / 0.4 で濃淡を分ける。 */
export function correlationColorClass(r: number): string {
  if (r >= 0.7) return "text-red-500";
  if (r >= 0.4) return "text-orange-500";
  if (r <= -0.7) return "text-blue-500";
  if (r <= -0.4) return "text-cyan-500";
  return "text-muted-foreground";
}
