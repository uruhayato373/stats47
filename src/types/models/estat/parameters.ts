/**
 * getStatsData APIパラメータ
 */
export interface GetStatsDataParams {
  // 必須パラメータ
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID
  
  // 絞り込み条件（階層）
  lvTab?: string;                      // 表章項目の階層レベル
  lvCat01?: string;                    // 分類01の階層レベル
  lvCat02?: string;                    // 分類02の階層レベル
  lvCat03?: string;                    // 分類03の階層レベル
  lvCat04?: string;                    // 分類04の階層レベル
  lvCat05?: string;                    // 分類05の階層レベル
  lvCat06?: string;                    // 分類06の階層レベル
  lvCat07?: string;                    // 分類07の階層レベル
  lvCat08?: string;                    // 分類08の階層レベル
  lvCat09?: string;                    // 分類09の階層レベル
  lvCat10?: string;                    // 分類10の階層レベル
  lvCat11?: string;                    // 分類11の階層レベル
  lvCat12?: string;                    // 分類12の階層レベル
  lvCat13?: string;                    // 分類13の階層レベル
  lvCat14?: string;                    // 分類14の階層レベル
  lvCat15?: string;                    // 分類15の階層レベル
  lvArea?: string;                     // 地域の階層レベル
  lvTime?: string;                     // 時間軸の階層レベル
  
  // 絞り込み条件（コード）
  cdTab?: string;                      // 表章項目コード（カンマ区切り）
  cdCat01?: string;                    // 分類01コード（カンマ区切り）
  cdCat02?: string;                    // 分類02コード（カンマ区切り）
  cdCat03?: string;                    // 分類03コード（カンマ区切り）
  cdCat04?: string;                    // 分類04コード（カンマ区切り）
  cdCat05?: string;                    // 分類05コード（カンマ区切り）
  cdCat06?: string;                    // 分類06コード（カンマ区切り）
  cdCat07?: string;                    // 分類07コード（カンマ区切り）
  cdCat08?: string;                    // 分類08コード（カンマ区切り）
  cdCat09?: string;                    // 分類09コード（カンマ区切り）
  cdCat10?: string;                    // 分類10コード（カンマ区切り）
  cdCat11?: string;                    // 分類11コード（カンマ区切り）
  cdCat12?: string;                    // 分類12コード（カンマ区切り）
  cdCat13?: string;                    // 分類13コード（カンマ区切り）
  cdCat14?: string;                    // 分類14コード（カンマ区切り）
  cdCat15?: string;                    // 分類15コード（カンマ区切り）
  cdArea?: string;                     // 地域コード（カンマ区切り）
  cdTime?: string;                     // 時間軸コード（カンマ区切り）
  
  // 絞り込み条件（From-To）
  cdTimeFrom?: string;                 // 時間軸From
  cdTimeTo?: string;                   // 時間軸To
  
  // データ取得位置
  startPosition?: number;              // データ開始位置（デフォルト:1）
  limit?: number;                      // データ取得件数（デフォルト:100000）
  
  // 出力オプション
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
  metaGetFlg?: 'Y' | 'N';             // メタ情報取得（デフォルト:Y）
  cntGetFlg?: 'Y' | 'N';              // 件数取得（デフォルト:N）
  explanationGetFlg?: 'Y' | 'N';      // 解説情報取得（デフォルト:N）
  annotationGetFlg?: 'Y' | 'N';       // 注釈情報取得（デフォルト:N）
  replaceSpChars?: '0' | '1' | '2';   // 特殊文字置換（0:置換しない、1:NULL、2:0）
  sectionHeaderFlg?: '1' | '2';       // セクションヘッダ（1:有り、2:無し）
}

/**
 * getMetaInfo APIパラメータ
 */
export interface GetMetaInfoParams {
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
}

/**
 * getStatsList APIパラメータ
 */
export interface GetStatsListParams {
  appId: string;                       // アプリケーションID
  
  // 検索条件
  searchKind?: '1' | '2' | '3';       // 検索種別（1:政府統計名、2:統計表題、3:項目名）
  surveyYears?: string;                // 調査年月（YYYY、YYYYMM、YYYY-YYYY）
  openYears?: string;                  // 公開年月（YYYY、YYYYMM、YYYY-YYYY）
  updatedDate?: string;                // 更新日付（YYYY-MM-DD、YYYY-MM-DD-YYYY-MM-DD）
  statsCode?: string;                  // 政府統計コード
  searchWord?: string;                 // キーワード
  statsName?: string;                  // 政府統計名
  govOrg?: string;                     // 作成機関
  statsNameList?: string;              // 提供統計名
  title?: string;                      // 統計表題
  explanation?: string;                // 統計表の説明
  field?: string;                      // 分野
  layout?: string;                     // 統計大分類
  toukei?: string;                     // 統計小分類
  
  // ページング
  startPosition?: number;              // データ開始位置（デフォルト:1）
  limit?: number;                      // データ取得件数（デフォルト:100）
  
  // 出力オプション
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
  replaceSpChars?: '0' | '1' | '2';   // 特殊文字置換
}

/**
 * getDataCatalog APIパラメータ
 */
export interface GetDataCatalogParams {
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
}