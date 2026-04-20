/**
 * e-STAT 統計データフォーム型定義
 *
 * フォームフィールド:
 * - statsDataId: 必須（統計表ID）
 * - その他: オプショナル
 */
export interface StatsDataFormValues {
  statsDataId: string;
  cdCat01?: string;
  cdTime?: string;
  cdArea?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdCat04?: string;
  cdCat05?: string;
  cdCat06?: string;
  cdCat07?: string;
  cdCat08?: string;
  cdCat09?: string;
  cdCat10?: string;
  cdCat11?: string;
  cdCat12?: string;
  cdCat13?: string;
  cdCat14?: string;
  cdCat15?: string;
}
