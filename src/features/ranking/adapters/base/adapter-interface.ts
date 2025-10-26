/**
 * ランキングデータアダプターインターフェース
 * すべてのデータソースアダプターが実装すべき共通インターフェース
 */

import type { UnifiedRankingData, TargetAreaLevel } from "@/types/ranking";

/**
 * ランキングデータアダプターインターフェース
 * すべてのデータソースアダプターが実装すべき
 */
export interface RankingDataAdapter {
  /**
   * データソースID（一意識別子）
   */
  readonly sourceId: string;
  
  /**
   * データソース名（表示用）
   */
  readonly sourceName: string;
  
  /**
   * データソースが利用可能かチェック
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * データを取得して統一フォーマットに変換
   * 
   * @param params - 取得パラメータ
   * @returns 統一されたランキングデータ
   */
  fetchAndTransform(params: AdapterFetchParams): Promise<UnifiedRankingData>;
  
  /**
   * 利用可能な年度リストを取得
   */
  getAvailableYears(
    rankingKey: string,
    level: TargetAreaLevel
  ): Promise<string[]>;
}

/**
 * アダプター取得パラメータ
 */
export interface AdapterFetchParams {
  rankingKey: string;
  timeCode: string;
  level: TargetAreaLevel;
  parentCode?: string;
  
  // データソース固有のパラメータ（オプション）
  sourceSpecific?: {
    statsDataId?: string;      // e-Stat用
    categoryCode?: string;      // e-Stat用
    resasApiKey?: string;       // RESAS用
    [key: string]: unknown;
  };
}

/**
 * アダプター変換結果
 */
export interface AdapterTransformResult {
  data: UnifiedRankingData;
  metadata: {
    sourceId: string;
    sourceName: string;
    fetchedAt: Date;
    transformDuration: number;  // ミリ秒
  };
}

/**
 * アダプター設定
 */
export interface AdapterConfig {
  sourceId: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

/**
 * アダプターエラー
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly sourceId: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
