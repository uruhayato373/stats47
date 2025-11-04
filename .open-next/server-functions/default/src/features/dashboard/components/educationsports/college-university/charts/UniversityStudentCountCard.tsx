/**
 * 大学学生数統計カードコンポーネント
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
const STATS_DATA_ID = "0000010105"; // 都道府県データ 基礎データ
const CAT01_UNIVERSITY_STUDENT_COUNT = "E6302"; // 大学学生数

interface UniversityStudentCountCardProps {
  /** 地域コード */
  areaCode: string;
  /** 年度（最新年度を取得する場合は指定しない） */
  timeCode?: string;
  /** タイトル */
  title?: string;
}

/**
 * 大学学生数統計カード
 */
export async function UniversityStudentCountCard({
  areaCode,
  timeCode,
  title = "大学学生数",
}: UniversityStudentCountCardProps) {
  try {
    // e-Stat APIから大学学生数データを取得
    const response = await fetchStatsData(STATS_DATA_ID, {
      categoryFilter: CAT01_UNIVERSITY_STUDENT_COUNT,
      areaFilter: areaCode,
      ...(timeCode && { yearFilter: timeCode }),
    });

    // データを整形
    const formattedData = formatStatsData(response);

    // StatsSchema形式に変換
    const statsSchemas = formattedData.values
      .filter((value) => value.dimensions.area?.code === areaCode)
      .map((value) => convertToStatsSchema(value))
      .filter(
        (schema): schema is NonNullable<typeof schema> => schema !== undefined
      );

    if (statsSchemas.length === 0) {
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
    statsSchemas.sort((a, b) => a.timeCode.localeCompare(b.timeCode));

    // 最新年度のデータを取得（timeCodeが指定されている場合はその年度）
    const targetData = timeCode
      ? statsSchemas.find((d) => d.timeCode === timeCode)
      : statsSchemas[statsSchemas.length - 1];

    if (!targetData) {
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

    // 数値をカンマ区切りでフォーマット
    const formatNumber = (value: number): string => {
      return new Intl.NumberFormat("ja-JP").format(value);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">
              {formatNumber(targetData.value)}
            </div>
            <p className="text-sm text-muted-foreground">
              {targetData.timeName}（{targetData.unit}）
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("[UniversityStudentCountCard] データ取得エラー:", error);
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

