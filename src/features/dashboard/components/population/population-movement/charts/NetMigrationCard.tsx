/**
 * 転入超過数統計カードコンポーネント
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
const CAT01_MOVERS_IN = "A5103"; // 転入者数
const CAT01_MOVERS_OUT = "A5104"; // 転出者数

interface NetMigrationCardProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
  /** タイトル */
  title?: string;
}

/**
 * 転入超過数統計カード（転入者数 - 転出者数）
 */
export async function NetMigrationCard({
  areaCode,
  timeCode,
  title = "転入超過数",
}: NetMigrationCardProps) {
  try {
    // 転入者数と転出者数を並列取得
    const [inResponse, outResponse] = await Promise.all([
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MOVERS_IN,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
      fetchStatsData(STATS_DATA_ID, {
        categoryFilter: CAT01_MOVERS_OUT,
        areaFilter: areaCode,
        ...(timeCode && { yearFilter: timeCode }),
      }),
    ]);

    // データを整形
    const inFormattedData = formatStatsData(inResponse);
    const outFormattedData = formatStatsData(outResponse);

    // StatsSchema形式に変換
    const inSchemas = inFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    const outSchemas = outFormattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (inSchemas.length === 0 || outSchemas.length === 0) {
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
    inSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));
    outSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 指定年度のデータを取得（指定がない場合は最新年度）
    let targetTimeCode = timeCode;
    let targetTimeName = "";

    if (!targetTimeCode) {
      // 最新年度を取得
      const latestIn = inSchemas[inSchemas.length - 1];
      const latestOut = outSchemas[outSchemas.length - 1];
      if (latestIn && latestOut) {
        targetTimeCode = latestIn.timeCode;
        targetTimeName = latestIn.timeName;
      }
    } else {
      // 指定年度の名前を取得
      const inDataItem = inSchemas.find((d) => d.timeCode === targetTimeCode);
      if (inDataItem) {
        targetTimeName = inDataItem.timeName;
      }
    }

    // 指定年度のデータを取得
    const inValue = inSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const outValue = outSchemas.find((d) => d.timeCode === targetTimeCode)?.value || 0;
    const netMigration = inValue - outValue;

    // 数値をカンマ区切りでフォーマット
    const formatNumber = (value: number): string => {
      return new Intl.NumberFormat("ja-JP").format(value);
    };

    // 正負に応じて色を変える
    const valueColor = netMigration >= 0 ? "text-green-600" : "text-red-600";

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${valueColor}`}>
              {netMigration >= 0 ? "+" : ""}
              {formatNumber(netMigration)}
            </div>
            <p className="text-sm text-muted-foreground">
              {targetTimeName}（転入: {formatNumber(inValue)}, 転出: {formatNumber(outValue)}）
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("[NetMigrationCard] データ取得エラー:", error);
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

