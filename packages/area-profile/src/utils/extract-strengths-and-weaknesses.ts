const STRENGTH_RANK_THRESHOLD = 5;
const WEAKNESS_RANK_THRESHOLD = 43;
const MAX_PREFECTURE_RANK = 47;

export interface ExtractOptions {
  /** 強みとみなす rank の上限 (デフォルト 5 = top 5) */
  strengthMax?: number;
  /** 弱みとみなす rank の下限 (デフォルト 43、47都道府県の下位 5) */
  weaknessMin?: number;
  /** 弱みとみなす rank の上限 (デフォルト 47) */
  maxRank?: number;
}

/**
 * 地域ごとのデータリストから強みと弱みを抽出する
 * サーバー/クライアント両方で利用可能な純粋関数
 *
 * rank=0 はデータ欠損 (未ランクや欠測値) を意味するため、強み・弱みどちらにも含めない。
 *
 * 都道府県 (47件) のデフォルト閾値:
 *   strengthMax=5, weaknessMin=43, maxRank=47
 *
 * 市区町村など 47件以外の集合では options で閾値を上書きする。
 * 例: cities (prefecture 内で 30-180件) → { strengthMax: 5, weaknessMin: 9999, maxRank: 9999 }
 *   = 強みのみ抽出、弱みは無効化
 */
export function extractStrengthsAndWeaknesses<T extends { rank: number }>(
  dataList: T[],
  options: ExtractOptions = {}
): {
  strengths: T[];
  weaknesses: T[];
} {
  const strengthMax = options.strengthMax ?? STRENGTH_RANK_THRESHOLD;
  const weaknessMin = options.weaknessMin ?? WEAKNESS_RANK_THRESHOLD;
  const maxRank = options.maxRank ?? MAX_PREFECTURE_RANK;

  const strengths = dataList
    .filter((d) => d.rank >= 1 && d.rank <= strengthMax)
    .sort((a, b) => a.rank - b.rank);

  const weaknesses = dataList
    .filter((d) => d.rank >= weaknessMin && d.rank <= maxRank)
    .sort((a, b) => b.rank - a.rank);

  return { strengths, weaknesses };
}
