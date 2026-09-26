import { CORRELATION_STRENGTH_CLASS } from "./correlation-display.palette";

/**
 * 相関係数の表示 (ランキング「相関が高い指標」とテーマ「このテーマと関連の深い指標」で共通)。
 * 係数は -1〜1 で意味が閉じた派生値なので、データセットの桁揃えではなく常に小数 2 桁で出す。
 */
export function formatCorrelation(r: number): string {
  const sign = r >= 0 ? "+" : "";
  return `${sign}${r.toFixed(2)}`;
}

/**
 * 正の相関は赤系・負の相関は青系、|r| 0.7 / 0.4 で色相を分ける (配色は palette module)。
 */
export function correlationColorClass(r: number): string {
  if (r >= 0.7) return CORRELATION_STRENGTH_CLASS.strongPositive;
  if (r >= 0.4) return CORRELATION_STRENGTH_CLASS.moderatePositive;
  if (r <= -0.7) return CORRELATION_STRENGTH_CLASS.strongNegative;
  if (r <= -0.4) return CORRELATION_STRENGTH_CLASS.moderateNegative;
  return "text-muted-foreground";
}
