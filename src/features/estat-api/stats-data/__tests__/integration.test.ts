import { describe, it, expect } from "vitest";

import { EstatDataFilter } from "../filter";
import { EstatStatsDataFormatter } from "../formatter";
import {
  getPrefectures,
  sortByValueDesc,
  filterByTime,
  groupByArea,
} from "../helpers";

import { mockStatsDataResponse } from "./fixtures";

describe("Stats Data Integration Tests", () => {
  describe("データ取得→フィルタ→ソートのフロー", () => {
    it("完全なデータ処理パイプライン", () => {
      // 1. データ整形
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );
      expect(formatted.values.length).toBeGreaterThan(0);

      // 2. 有効値のみ抽出
      const validValues = EstatDataFilter.getValidValues(formatted.values);
      expect(validValues.length).toBeGreaterThan(0);
      expect(validValues.every((v) => v.value !== null)).toBe(true);

      // 3. 都道府県のみ抽出
      const prefectures = getPrefectures(validValues);
      expect(prefectures.every((v) => v.dimensions.area.level === "2")).toBe(
        true
      );
      expect(prefectures.every((v) => v.dimensions.area.code !== "00000")).toBe(
        true
      );

      // 4. 降順ソート
      const sorted = sortByValueDesc(prefectures);
      if (sorted.length > 1) {
        expect(sorted[0].value!).toBeGreaterThanOrEqual(
          sorted[sorted.length - 1].value!
        );
      }
    });
  });

  describe("ランキング生成のフロー", () => {
    it("都道府県ランキングを生成する", () => {
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );

      // 特定年度のデータ
      const timeCode = formatted.values[0].dimensions.time.code;
      const yearData = filterByTime(formatted.values, timeCode);
      expect(yearData.length).toBeGreaterThan(0);

      // 都道府県のみ
      const prefectures = getPrefectures(yearData);

      // 有効値のみ
      const validValues = EstatDataFilter.getValidValues(prefectures);

      // トップ10ランキング生成
      const ranking = sortByValueDesc(validValues).slice(0, 10);

      expect(ranking.length).toBeLessThanOrEqual(10);
      expect(ranking.length).toBeGreaterThan(0);

      ranking.forEach((item, index) => {
        expect(item.dimensions.area.level).toBe("2");
        expect(item.value).not.toBeNull();

        // ランキング順序の確認
        if (index > 0) {
          expect(item.value!).toBeLessThanOrEqual(ranking[index - 1].value!);
        }
      });
    });
  });

  describe("地域別集計のフロー", () => {
    it("地域ごとにデータをグループ化して集計する", () => {
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );

      // 有効値のみ
      const validValues = EstatDataFilter.getValidValues(formatted.values);

      // 地域別にグループ化
      const grouped = groupByArea(validValues);

      expect(grouped.size).toBeGreaterThan(0);

      // 各地域の平均値を計算
      const areaAverages = new Map<string, number>();
      grouped.forEach((values, areaCode) => {
        const sum = values.reduce((acc, v) => acc + (v.value || 0), 0);
        const avg = sum / values.length;
        areaAverages.set(areaCode, avg);
      });

      expect(areaAverages.size).toBe(grouped.size);

      // 平均値が正の数であることを確認
      areaAverages.forEach((avg) => {
        expect(avg).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("時系列分析のフロー", () => {
    it("特定地域の時系列データを抽出する", () => {
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );

      // 最初の地域コードを取得
      const areaCode = formatted.values[0].dimensions.area.code;

      // その地域のデータのみ抽出
      const areaData = formatted.values.filter(
        (v) => v.dimensions.area.code === areaCode
      );

      // 有効値のみ
      const validData = EstatDataFilter.getValidValues(areaData);

      expect(validData.length).toBeGreaterThan(0);
      expect(validData.every((v) => v.dimensions.area.code === areaCode)).toBe(
        true
      );
    });
  });

  describe("メタデータ活用のフロー", () => {
    it("メタデータから統計情報を取得する", () => {
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );
      const metadata = formatted.metadata;

      // 完全性スコアに基づいてデータ品質を判定
      const qualityScore = metadata.quality?.completenessScore || 0;

      if (qualityScore >= 90) {
        console.log("高品質データ");
      } else if (qualityScore >= 70) {
        console.log("中品質データ");
      } else {
        console.log("低品質データ");
      }

      // データ範囲情報の活用
      if (metadata.range) {
        expect(metadata.range.years.count).toBeGreaterThan(0);
        expect(metadata.range.areas.count).toBeGreaterThan(0);

        console.log(
          `年度範囲: ${metadata.range.years.min} - ${metadata.range.years.max}`
        );
        console.log(`地域数: ${metadata.range.areas.count}`);
        console.log(`都道府県数: ${metadata.range.areas.prefectureCount}`);
      }
    });
  });

  describe("パフォーマンステスト", () => {
    it("大規模データの処理パイプライン", () => {
      const startTime = performance.now();

      // 完全なパイプライン実行
      const formatted = EstatStatsDataFormatter.formatStatsData(
        mockStatsDataResponse
      );
      const validValues = EstatDataFilter.getValidValues(formatted.values);
      const prefectures = getPrefectures(validValues);
      const ranking = sortByValueDesc(prefectures).slice(0, 47);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`完全パイプライン処理時間: ${totalTime.toFixed(2)}ms`);
      console.log(`最終ランキング件数: ${ranking.length}`);

      // 全体で2秒以内に完了
      expect(totalTime).toBeLessThan(2000);
      expect(ranking.length).toBeGreaterThan(0);
    });
  });
});
