/**
 * e-Stat API 統計データ取得パラメータ
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0#api_2_3
 */
export type GetStatsDataParams = {
  // === 必須パラメータ ===
  readonly statsDataId: string;

  // === フィルタリング（コード指定） ===
  readonly cdTab?: string;
  readonly cdTime?: string;
  readonly cdArea?: string;
  readonly cdCat01?: string;
  readonly cdCat02?: string;
  readonly cdCat03?: string;
  readonly cdCat04?: string;
  readonly cdCat05?: string;
  readonly cdCat06?: string;
  readonly cdCat07?: string;
  readonly cdCat08?: string;
  readonly cdCat09?: string;
  readonly cdCat10?: string;
  readonly cdCat11?: string;
  readonly cdCat12?: string;
  readonly cdCat13?: string;
  readonly cdCat14?: string;
  readonly cdCat15?: string;

  // === フィルタリング（レベル指定） ===
  readonly lvTab?: string;
  readonly lvTime?: string;
  readonly lvArea?: string;
  readonly lvCat01?: string;
  readonly lvCat02?: string;
  readonly lvCat03?: string;
  readonly lvCat04?: string;
  readonly lvCat05?: string;
  readonly lvCat06?: string;
  readonly lvCat07?: string;
  readonly lvCat08?: string;
  readonly lvCat09?: string;
  readonly lvCat10?: string;
  readonly lvCat11?: string;
  readonly lvCat12?: string;
  readonly lvCat13?: string;
  readonly lvCat14?: string;
  readonly lvCat15?: string;

  // === フィルタリング（範囲指定） ===
  readonly cdTabFrom?: string;
  readonly cdTabTo?: string;
  readonly cdTimeFrom?: string;
  readonly cdTimeTo?: string;
  readonly cdAreaFrom?: string;
  readonly cdAreaTo?: string;
  readonly cdCat01From?: string;
  readonly cdCat01To?: string;
  readonly cdCat02From?: string;
  readonly cdCat02To?: string;
  readonly cdCat03From?: string;
  readonly cdCat03To?: string;
  readonly cdCat04From?: string;
  readonly cdCat04To?: string;
  readonly cdCat05From?: string;
  readonly cdCat05To?: string;
  readonly cdCat06From?: string;
  readonly cdCat06To?: string;
  readonly cdCat07From?: string;
  readonly cdCat07To?: string;
  readonly cdCat08From?: string;
  readonly cdCat08To?: string;
  readonly cdCat09From?: string;
  readonly cdCat09To?: string;
  readonly cdCat10From?: string;
  readonly cdCat10To?: string;
  readonly cdCat11From?: string;
  readonly cdCat11To?: string;
  readonly cdCat12From?: string;
  readonly cdCat12To?: string;
  readonly cdCat13From?: string;
  readonly cdCat13To?: string;
  readonly cdCat14From?: string;
  readonly cdCat14To?: string;
  readonly cdCat15From?: string;
  readonly cdCat15To?: string;

  // === 取得オプション ===
  readonly metaGetFlg?: 'Y' | 'N';
  readonly cntGetFlg?: 'Y' | 'N';
  readonly explanationGetFlg?: 'Y' | 'N';
  readonly annotationGetFlg?: 'Y' | 'N';
  readonly replaceSpChars?: '0' | '1' | '2' | '3';

  // === 言語 ===
  readonly lang?: 'J' | 'E';
  readonly limit?: number;
  readonly startRecord?: number;
};
