const STRENGTH_RANK_THRESHOLD = 5;
const WEAKNESS_RANK_THRESHOLD = 43;
const MAX_PREFECTURE_RANK = 47;

/**
 * 地域ごとのデータリストから強みと弱みを抽出する
 * サーバー/クライアント両方で利用可能な純粋関数
 *
 * rank=0 はデータ欠損 (未ランクや欠測値) を意味するため、強み・弱みどちらにも含めない。
 */
export function extractStrengthsAndWeaknesses<T extends { rank: number }>(
  dataList: T[]
): {
  strengths: T[];
  weaknesses: T[];
} {
  const strengths = dataList
    .filter((d) => d.rank >= 1 && d.rank <= STRENGTH_RANK_THRESHOLD)
    .sort((a, b) => a.rank - b.rank);

  const weaknesses = dataList
    .filter((d) => d.rank >= WEAKNESS_RANK_THRESHOLD && d.rank <= MAX_PREFECTURE_RANK)
    .sort((a, b) => b.rank - a.rank);

  return { strengths, weaknesses };
}
