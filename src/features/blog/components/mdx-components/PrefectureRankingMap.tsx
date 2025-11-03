/**
 * 都道府県ランキングマップコンポーネント（MDX用）
 *
 * MDXコンテンツ内で使用する都道府県ランキングマップ表示コンポーネント
 * サーバーコンポーネントとして実装され、R2ストレージからデータを取得します。
 */

import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { RankingMapCard } from "@/features/ranking/shared/components/RankingMapCard";

/**
 * PrefectureRankingMapコンポーネントのprops
 */
interface PrefectureRankingMapProps {
  /** ランキングキー */
  rankingKey: string;
  /** 時間（年度など） */
  time: string;
}

/**
 * 都道府県ランキングマップコンポーネント
 *
 * MDXコンテンツ内で使用する都道府県別ランキングマップを表示します。
 * サーバーコンポーネントとして実装され、データ取得をサーバー側で行います。
 */
export async function PrefectureRankingMap({
  rankingKey,
  time,
}: PrefectureRankingMapProps) {
  // バリデーション
  if (!rankingKey) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        rankingKeyが指定されていません
      </div>
    );
  }

  if (!time) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        timeが指定されていません
      </div>
    );
  }

  // サーバー側でランキングデータを取得
  let rankingData;
  try {
    // 都道府県データを取得（areaType: "prefecture"）
    rankingData = await getRankingData("prefecture", rankingKey, time);
  } catch (error) {
    console.error("Failed to fetch ranking data:", error);
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : "ランキングデータの取得に失敗しました"}
      </div>
    );
  }

  // データが存在しない場合
  if (!rankingData || rankingData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  // クライアントコンポーネント（RankingMapCard）にデータを渡す
  return (
    <RankingMapCard
      data={rankingData}
      colorScheme="interpolateBlues"
      height={600}
    />
  );
}
