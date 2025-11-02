/**
 * 平均婚姻年齢統計カードコンポーネント
 * e-Stat APIから直接データを取得
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { fetchStatsData } from "@/features/estat-api/stats-data/services/fetcher";
import {
  formatStatsData,
  convertToStatsSchema,
} from "@/features/estat-api/stats-data/services/formatter";

// e-Stat APIパラメータ定義
const STATS_DATA_ID = "0000010101"; // 人口推計
const CAT01_MARRIAGE_AGE_HUSBAND = "A9111"; // 平均婚姻年齢（初婚の夫）
const CAT01_MARRIAGE_AGE_WIFE = "A9112"; // 平均婚姻年齢（初婚の妻）

interface AverageMarriageAgeCardProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
  /** タイトル */
  title?: string;
}

/**
 * 平均婚姻年齢統計カード（夫と妻の平均婚姻年齢を表示）
 */
export async function AverageMarriageAgeCard({
  areaCode,
  timeCode,
  title = "平均婚姻年齢",
}: AverageMarriageAgeCardProps) {
  try {
    // 夫と妻の平均婚姻年齢データを並列取得
    const [husbandResponse, wifeResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MARRIAGE_AGE_HUSBAND,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MARRIAGE_AGE_WIFE,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
    ]);

    // データを整形
    const husbandFormattedData = formatStatsData(husbandResponse);
    const wifeFormattedData = formatStatsData(wifeResponse);

    // StatsSchema形式に変換
    const husbandSchemas = husbandFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const wifeSchemas = wifeFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (husbandSchemas.length === 0 || wifeSchemas.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">データがありません</p>
          </CardContent>
        </Card>
      );
    }

    // 年度順にソート
    husbandSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    wifeSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestHusband = husbandSchemas[husbandSchemas.length - 1];
      const latestWife = wifeSchemas[wifeSchemas.length - 1];
      if (latestHusband && latestWife) {
        targetTimeCode = latestHusband.timeCode;
        targetTimeName = latestHusband.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const husbandDataItem = husbandSchemas.find(
        (d) => d.timeCode === targetTimeCode
      );
      if (husbandDataItem) {
        targetTimeName = husbandDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const husbandValue =
      husbandSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const wifeValue =
      wifeSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;

    // 数値を小数点1桁でフォーマット
    const formatNumber = (value: number): string => {
      return new Intl.NumberFormat("ja-JP", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">夫（初婚）</span>
              <div className="text-2xl font-bold">
                {formatNumber(husbandValue)}歳
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">妻（初婚）</span>
              <div className="text-2xl font-bold">
                {formatNumber(wifeValue)}歳
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {targetTimeName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("[AverageMarriageAgeCard] データ取得エラー:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            データの取得に失敗しました。
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }
}

