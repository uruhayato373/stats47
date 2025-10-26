/**
 * ランキング項目未発見エラー表示コンポーネント
 * ランキング項目が見つからない場合のエラー表示を担当
 */

interface RankingItemNotFoundProps {
  rankingKey: string;
}

/**
 * ランキング項目が見つからない場合のエラー表示コンポーネント
 */
export function RankingItemNotFound({ rankingKey }: RankingItemNotFoundProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-red-500 mb-2">ランキング項目が見つかりません</p>
        <p className="text-sm text-muted-foreground">
          ランキングキー: {rankingKey}
        </p>
      </div>
    </div>
  );
}
