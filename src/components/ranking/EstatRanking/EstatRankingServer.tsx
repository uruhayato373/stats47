import React from "react";
import { EstatRankingClient } from "./EstatRankingClient";
import { EstatRankingProps } from "./EstatRankingClient";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { FormattedValue } from "@/lib/estat/types/formatted";

interface EstatRankingServerProps extends EstatRankingProps {
  // サーバー側で取得した初期データ
  initialData?: FormattedValue[];
  initialYears?: string[];
  initialSelectedYear?: string;
}

/**
 * EstatRankingのサーバーコンポーネント
 * サーバー側で初期データを取得し、EstatRankingClientをレンダリング
 */
export const EstatRankingServer: React.FC<EstatRankingServerProps> = async (
  props
) => {
  const { params, ...restProps } = props;

  try {
    if (!params.cdCat01) {
      throw new Error("カテゴリコードが指定されていません");
    }

    // サーバー側で年度一覧を取得
    const years = await EstatStatsDataService.getAvailableYears(
      params.statsDataId,
      params.cdCat01
    );

    // 初期年度を決定
    const initialYear = params.cdTime || years[0] || "";

    // サーバー側で初期データを取得
    const initialData = await EstatStatsDataService.getPrefectureDataByYear(
      params.statsDataId,
      params.cdCat01,
      initialYear,
      params.limit || 100000
    );

    return (
      <EstatRankingClient
        {...restProps}
        params={params}
        initialData={initialData}
        initialYears={years}
        initialSelectedYear={initialYear}
      />
    );
  } catch (error) {
    console.error("サーバー側データ取得エラー:", error);
    // エラー時はクライアント側でデータ取得にフォールバック
    return <EstatRankingClient {...props} />;
  }
};
