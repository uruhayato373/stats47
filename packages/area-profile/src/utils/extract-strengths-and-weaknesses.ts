const STRENGTH_RANK_THRESHOLD = 5;
const WEAKNESS_RANK_THRESHOLD = 43;

/**
 * 地域ごとのデータリストから強みと弱みを抽出する
 * サーバー/クライアント両方で利用可能な純粋関数
 */
export function extractStrengthsAndWeaknesses<T extends { rank: number }>(
  dataList: T[]
): {
  strengths: T[];
  weaknesses: T[];
} {
  const strengths = dataList
    .filter((d) => d.rank <= STRENGTH_RANK_THRESHOLD)
    .sort((a, b) => a.rank - b.rank);

  const weaknesses = dataList
    .filter((d) => d.rank >= WEAKNESS_RANK_THRESHOLD)
    .sort((a, b) => b.rank - a.rank);

  return { strengths, weaknesses };
}
