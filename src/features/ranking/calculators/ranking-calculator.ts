/**
 * ランキング計算クラス
 * 順位、パーセンタイル、都道府県内ランクの計算
 */

import type { RankingDataPoint, TargetAreaLevel } from "@/types/ranking";

/**
 * ランキング計算クラス
 */
export class RankingCalculator {
  /**
   * ランキングを計算
   */
  calculate(
    dataPoints: RankingDataPoint[],
    level: TargetAreaLevel
  ): RankingDataPoint[] {
    console.log(`🔵 RankingCalculator: ランキング計算開始 (${dataPoints.length}件)`);
    
    // 1. 全体ランキング計算
    const rankedData = this.calculateOverallRanking(dataPoints);
    
    // 2. 都道府県内ランキング計算（市区町村の場合）
    if (level === "city") {
      return this.calculateParentRanking(rankedData);
    }
    
    // 3. パーセンタイル計算
    return this.calculatePercentiles(rankedData);
  }
  
  /**
   * 全体ランキングを計算
   */
  private calculateOverallRanking(dataPoints: RankingDataPoint[]): RankingDataPoint[] {
    // 値でソート（降順）
    const sortedData = [...dataPoints].sort((a, b) => b.value - a.value);
    
    // ランクを設定
    return sortedData.map((point, index) => ({
      ...point,
      rank: index + 1,
    }));
  }
  
  /**
   * 都道府県内ランキングを計算
   */
  private calculateParentRanking(dataPoints: RankingDataPoint[]): RankingDataPoint[] {
    // 都道府県別にグループ化
    const groupedByPrefecture = this.groupByPrefecture(dataPoints);
    
    const result: RankingDataPoint[] = [];
    
    // 各都道府県内でランキング計算
    for (const [prefCode, points] of Object.entries(groupedByPrefecture)) {
      const sortedPoints = points.sort((a, b) => b.value - a.value);
      
      sortedPoints.forEach((point, index) => {
        result.push({
          ...point,
          rankInParent: index + 1,
        });
      });
    }
    
    // 全体ランキングで再ソート
    return result.sort((a, b) => a.rank - b.rank);
  }
  
  /**
   * パーセンタイルを計算
   */
  private calculatePercentiles(dataPoints: RankingDataPoint[]): RankingDataPoint[] {
    const totalCount = dataPoints.length;
    
    return dataPoints.map((point) => ({
      ...point,
      percentile: this.calculatePercentile(point.rank, totalCount),
    }));
  }
  
  /**
   * パーセンタイル値を計算
   */
  private calculatePercentile(rank: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    
    // パーセンタイル = (総数 - ランク + 1) / 総数 * 100
    return Math.round(((totalCount - rank + 1) / totalCount) * 100);
  }
  
  /**
   * 都道府県別にグループ化
   */
  private groupByPrefecture(dataPoints: RankingDataPoint[]): Record<string, RankingDataPoint[]> {
    const groups: Record<string, RankingDataPoint[]> = {};
    
    for (const point of dataPoints) {
      const prefCode = point.parentAreaCode || point.areaCode;
      
      if (!groups[prefCode]) {
        groups[prefCode] = [];
      }
      
      groups[prefCode].push(point);
    }
    
    return groups;
  }
}
