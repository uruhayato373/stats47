"use server";

import { readAllYearsNormalizedRankingValuesFromR2 } from "@stats47/ranking/server";
import { err, isOk, ok, type Result } from "@stats47/types";

import {
  buildNationalAverageSeries,
  type NationalAveragePoint,
} from "../lib/build-national-average-series";

import { sanitizeNormalizationType } from "./normalization-types";

import type { AreaType } from "@stats47/area";

/**
 * 指定した正規化タイプでの「全国平均の推移」を取得する。
 *
 * 計算方法を切り替えると大きく表示する平均値は client 側で差し替わるが、
 * サーバーで作った系列は総数ベースのままなので、そのままだと数値と線の単位がズレる。
 * それを防ぐため正規化版の全年データからも系列を組み直す。
 *
 * 正規化版スナップショットが存在しない指標 (R2 で 404) は空配列を返し、
 * 呼び出し側は推移を非表示にする。総数の推移を出し続けて別単位の線を見せない。
 */
export async function fetchNationalAverageSeriesAction(
  rankingKey: string,
  areaType: AreaType,
  normalizationType?: string,
): Promise<Result<NationalAveragePoint[], Error>> {
  try {
    const safeNormalizationType = sanitizeNormalizationType(normalizationType);
    if (!safeNormalizationType) {
      // 総数の系列はサーバー側 (loadRankingPageModel) が持っているので取り直さない
      return ok([]);
    }

    const result = await readAllYearsNormalizedRankingValuesFromR2(
      rankingKey,
      areaType,
      safeNormalizationType,
    );
    if (!isOk(result)) return ok([]);

    return ok(buildNationalAverageSeries(result.data));
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
