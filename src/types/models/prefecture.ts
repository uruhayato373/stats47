/**
 * 都道府県関連の型定義
 */

/** 都道府県コード（2桁の文字列） */
export type PrefectureCode = string;

export interface Prefecture {
  prefCode: PrefectureCode;
  prefName: string;
}
