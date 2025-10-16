/**
 * データ品質評価クラス
 * 完全性、信頼性、欠損データの評価
 */

import type { RankingDataPoint, DataQuality, TargetAreaLevel } from "@/types/ranking";

/**
 * データ品質評価クラス
 */
export class QualityAssessor {
  /**
   * データ品質を評価
   */
  assess(dataPoints: RankingDataPoint[], level: TargetAreaLevel): DataQuality {
    console.log(`🔵 QualityAssessor: 品質評価開始 (${dataPoints.length}件)`);
    
    const totalExpected = this.getExpectedCount(level);
    const validPoints = dataPoints.filter(point => this.isValidDataPoint(point));
    const missingAreas = this.findMissingAreas(dataPoints, level);
    const estimatedAreas = this.findEstimatedAreas(dataPoints);
    
    const completeness = totalExpected > 0 ? validPoints.length / totalExpected : 0;
    const reliability = this.calculateReliability(dataPoints);
    
    return {
      completeness: Math.round(completeness * 100) / 100, // 小数点以下2桁
      reliability,
      missingAreas,
      estimatedAreas,
      lastValidated: new Date().toISOString(),
      notes: this.generateQualityNotes(completeness, reliability, missingAreas.length),
    };
  }
  
  /**
   * 期待されるデータ件数を取得
   */
  private getExpectedCount(level: TargetAreaLevel): number {
    switch (level) {
      case "prefecture":
        return 47; // 都道府県数
      case "municipality":
        return 1700; // 市区町村数（概算）
      case "both":
        return 47 + 1700; // 両方
      default:
        return 0;
    }
  }
  
  /**
   * 有効なデータポイントかどうかを判定
   */
  private isValidDataPoint(point: RankingDataPoint): boolean {
    return (
      typeof point.value === "number" &&
      !isNaN(point.value) &&
      point.value >= 0 && // 負の値は無効とみなす
      point.areaCode &&
      point.areaName
    );
  }
  
  /**
   * 欠損地域を検出
   */
  private findMissingAreas(dataPoints: RankingDataPoint[], level: TargetAreaLevel): string[] {
    const existingCodes = new Set(dataPoints.map(point => point.areaCode));
    const expectedCodes = this.getExpectedAreaCodes(level);
    
    return expectedCodes.filter(code => !existingCodes.has(code));
  }
  
  /**
   * 推定地域を検出
   */
  private findEstimatedAreas(dataPoints: RankingDataPoint[]): string[] {
    return dataPoints
      .filter(point => point.dataQuality?.isEstimated)
      .map(point => point.areaCode);
  }
  
  /**
   * 期待される地域コードリストを取得
   */
  private getExpectedAreaCodes(level: TargetAreaLevel): string[] {
    const codes: string[] = [];
    
    if (level === "prefecture" || level === "both") {
      // 都道府県コード（01-47）
      for (let i = 1; i <= 47; i++) {
        codes.push(`${i.toString().padStart(2, "0")}000`);
      }
    }
    
    if (level === "municipality" || level === "both") {
      // 市区町村コード（簡易実装）
      // 実際の実装では、より詳細な市区町村コードリストが必要
      for (let pref = 1; pref <= 47; pref++) {
        const prefCode = pref.toString().padStart(2, "0");
        // 各都道府県に平均36の市区町村があると仮定
        for (let i = 1; i <= 36; i++) {
          codes.push(`${prefCode}${i.toString().padStart(3, "0")}`);
        }
      }
    }
    
    return codes;
  }
  
  /**
   * 信頼性を計算
   */
  private calculateReliability(dataPoints: RankingDataPoint[]): "high" | "medium" | "low" {
    if (dataPoints.length === 0) return "low";
    
    const highReliabilityCount = dataPoints.filter(
      point => point.dataQuality?.reliability === "high"
    ).length;
    
    const reliabilityRatio = highReliabilityCount / dataPoints.length;
    
    if (reliabilityRatio >= 0.8) return "high";
    if (reliabilityRatio >= 0.5) return "medium";
    return "low";
  }
  
  /**
   * 品質に関する注釈を生成
   */
  private generateQualityNotes(
    completeness: number,
    reliability: "high" | "medium" | "low",
    missingCount: number
  ): string | undefined {
    const notes: string[] = [];
    
    if (completeness < 0.9) {
      notes.push(`データ完全性: ${Math.round(completeness * 100)}%`);
    }
    
    if (reliability === "low") {
      notes.push("信頼性が低いデータが含まれています");
    }
    
    if (missingCount > 0) {
      notes.push(`欠損データ: ${missingCount}件`);
    }
    
    return notes.length > 0 ? notes.join(", ") : undefined;
  }
}
