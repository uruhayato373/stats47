/**
 * e-Statデータ変換クラス
 * FormattedEstatData → RankingDataPoint[]
 */

import {
  createAreaFilter,
  getAreaType,
  getParentPrefectureCode,
} from "@/features/area/utils/code-converter";
import type { FormattedEstatData } from "@/features/estat-api/core/types";

import type { RankingDataPoint, TargetAreaLevel } from "@/types/ranking";

/**
 * e-Statデータ変換クラス
 * FormattedEstatData → RankingDataPoint[]
 */
export class EstatTransformer {
  /**
   * e-Statデータをランキングデータポイントに変換
   */
  transform(
    estatData: FormattedEstatData,
    level: TargetAreaLevel,
    parentCode?: string
  ): RankingDataPoint[] {
    console.log(`🔵 Transformer: 変換開始 (level: ${level})`);

    // 1. レベルでフィルタリング
    const filteredValues = this.filterByLevel(
      estatData.values,
      level,
      parentCode
    );

    // 2. RankingDataPointに変換
    const dataPoints = filteredValues.map((value) => {
      const areaCode = value.dimensions.area.code;
      const areaType = getAreaType(areaCode);

      return {
        areaCode,
        areaName: value.dimensions.area.name,
        areaType,
        parentAreaCode:
          areaType === "city"
            ? getParentPrefectureCode(areaCode)
            : undefined,
        parentAreaName: undefined, // 後で設定
        value: value.value,
        rawValue: value.value,
        displayValue: undefined, // 後でフォーマット
        rank: 0, // 後で計算
        rankInParent: undefined, // 後で計算
        percentile: undefined, // 後で計算
        timeCode: value.dimensions.time.code,
        timeName: value.dimensions.time.name,
        dataQuality: this.assessDataQuality(value),
      };
    });

    console.log(`✅ Transformer: 変換完了 (${dataPoints.length}件)`);
    return dataPoints;
  }

  /**
   * レベルでフィルタリング
   */
  private filterByLevel(
    values: any[],
    level: TargetAreaLevel,
    parentCode?: string
  ): any[] {
    const filter = createAreaFilter(level, parentCode);

    return values.filter((value) => {
      const areaCode = value.dimensions.area.code;
      return filter(areaCode);
    });
  }

  /**
   * データ品質を評価
   */
  private assessDataQuality(value: any): any {
    const reliability = this.determineReliability(value);
    const isEstimated = this.isEstimatedValue(value);
    const isInterpolated = this.isInterpolatedValue(value);

    return {
      reliability,
      isEstimated,
      isInterpolated,
      notes: this.generateQualityNotes(value),
    };
  }

  /**
   * 信頼性を判定
   */
  private determineReliability(value: any): "high" | "medium" | "low" {
    // e-Statの値が数値でない場合は低信頼性
    if (typeof value.value !== "number" || isNaN(value.value)) {
      return "low";
    }

    // 値が0の場合は中程度の信頼性（データが存在しない可能性）
    if (value.value === 0) {
      return "medium";
    }

    // その他の場合は高信頼性
    return "high";
  }

  /**
   * 推定値かどうかを判定
   */
  private isEstimatedValue(value: any): boolean {
    // e-Statの注釈やメタデータから推定値を判定
    // 実装は省略（実際のe-Statデータ構造に依存）
    return false;
  }

  /**
   * 補間値かどうかを判定
   */
  private isInterpolatedValue(value: any): boolean {
    // e-Statの注釈やメタデータから補間値を判定
    // 実装は省略（実際のe-Statデータ構造に依存）
    return false;
  }

  /**
   * 品質に関する注釈を生成
   */
  private generateQualityNotes(value: any): string | undefined {
    const notes: string[] = [];

    if (typeof value.value !== "number" || isNaN(value.value)) {
      notes.push("数値データが無効");
    }

    if (value.value === 0) {
      notes.push("値が0（データなしの可能性）");
    }

    return notes.length > 0 ? notes.join(", ") : undefined;
  }
}
