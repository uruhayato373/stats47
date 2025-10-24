import { Badge } from "@/components/atoms/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { TimeAxisInfo } from "@/lib/estat-api/types/meta-info";
import { Calendar, Clock, TrendingUp } from "lucide-react";

interface TimeAxisTabProps {
  timeAxis: TimeAxisInfo;
}

/**
 * TimeAxisTab - 時間軸情報表示タブ
 *
 * 機能:
 * - 利用可能な年次、最小年、最大年を視覚的に表示
 * - 年次の範囲と期間を分かりやすく表示
 * - 時間軸の統計情報を提供
 */
export default function TimeAxisTab({ timeAxis }: TimeAxisTabProps) {
  const { availableYears, formattedYears, minYear, maxYear } = timeAxis;

  if (availableYears.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 dark:text-gray-400">
          時間軸情報がありません
        </div>
      </div>
    );
  }

  // 年次を降順でソート（最新が上）
  const sortedYears = [...availableYears].sort((a, b) => b.localeCompare(a));
  const sortedFormattedYears = [...formattedYears].sort((a, b) =>
    b.localeCompare(a)
  );

  // 年次の範囲を計算
  const yearRange = minYear && maxYear ? `${minYear} - ${maxYear}` : "不明";
  const yearCount = availableYears.length;

  // 最新年と最古年を取得
  const latestYear = sortedYears[0];
  const oldestYear = sortedYears[sortedYears.length - 1];

  return (
    <div className="space-y-6">
      {/* 統計情報セクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                利用可能年数
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {yearCount}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300">年</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                最新年
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {latestYear || "-"}
            </div>
            <div className="text-xs text-green-600 dark:text-green-300">
              {sortedFormattedYears[0] || ""}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                最古年
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {oldestYear || "-"}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-300">
              {sortedFormattedYears[sortedFormattedYears.length - 1] || ""}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 年次範囲情報 */}
      <Card>
        <CardHeader>
          <CardTitle>年次範囲</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                最小年
              </div>
              <div className="text-lg text-gray-900 dark:text-gray-100">
                {minYear || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                最大年
              </div>
              <div className="text-lg text-gray-900 dark:text-gray-100">
                {maxYear || "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 年次リスト */}
      <Card>
        <CardHeader>
          <CardTitle>利用可能な年次一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sortedYears.map((year, index) => (
              <div
                key={year}
                className={`p-3 rounded-lg border text-center ${
                  index === 0
                    ? "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
                    : "bg-gray-50 border-gray-200 text-gray-900 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-100"
                }`}
              >
                <div className="text-sm font-mono">{year}</div>
                {sortedFormattedYears[index] && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {sortedFormattedYears[index]}
                  </div>
                )}
                {index === 0 && (
                  <Badge variant="default" className="text-xs mt-1">
                    最新
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 年次統計 */}
      {availableYears.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>年次統計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">
                  年次間隔
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                  {availableYears.length > 1 ? "複数年" : "単年"}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">
                  データ期間
                </div>
                <div className="text-gray-900 dark:text-gray-100">
                  {yearRange}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
