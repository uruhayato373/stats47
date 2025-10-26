/**
 * 統計計算クラス
 * 平均、中央値、標準偏差、四分位点の計算
 */

import type { RankingDataPoint, RankingStatistics } from "@/types/ranking";

/**
 * 統計計算クラス
 */
export class StatisticsCalculator {
  /**
   * 統計情報を計算
   */
  calculate(dataPoints: RankingDataPoint[]): RankingStatistics {
    console.log(`🔵 StatisticsCalculator: 統計計算開始 (${dataPoints.length}件)`);
    
    const values = dataPoints.map(point => point.value);
    const validValues = values.filter(value => typeof value === "number" && !isNaN(value));
    
    if (validValues.length === 0) {
      return this.createEmptyStatistics(dataPoints.length);
    }
    
    const sortedValues = [...validValues].sort((a, b) => a - b);
    
    return {
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      mean: this.calculateMean(validValues),
      median: this.calculateMedian(sortedValues),
      stdDev: this.calculateStandardDeviation(validValues),
      q1: this.calculateQuartile(sortedValues, 0.25),
      q3: this.calculateQuartile(sortedValues, 0.75),
      count: validValues.length,
      missingCount: dataPoints.length - validValues.length,
    };
  }
  
  /**
   * 平均値を計算
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  }
  
  /**
   * 中央値を計算
   */
  private calculateMedian(sortedValues: number[]): number {
    if (sortedValues.length === 0) return 0;
    
    const mid = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    } else {
      return sortedValues[mid];
    }
  }
  
  /**
   * 標準偏差を計算
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = this.calculateMean(values);
    const variance = values.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * 四分位点を計算
   */
  private calculateQuartile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
  
  /**
   * 空の統計情報を作成
   */
  private createEmptyStatistics(totalCount: number): RankingStatistics {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      count: 0,
      missingCount: totalCount,
    };
  }
}
