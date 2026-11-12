/**
 * 問いかけコピー (hook) と表示名の手動上書きの読み込み口。記録の正本は台帳 `ranking.hook-overrides`
 * (data/ranking/hooks/overrides.json + Schema。置いてよいものの基準は Schema の description、上書きごとの判断は notes)。
 * 原則は `derive-ranking-hook.ts` の導出規則で賄い、台帳には例外だけを置く。
 */
import data from "../../../../data/ranking/hooks/overrides.json";

export const RANKING_HOOK_OVERRIDES: Readonly<Record<string, string>> = data.hooks;

/**
 * hookと同じ監査で「正準名のままでは読者に伝わりにくい」と確定した表示名の例外。
 * 共通規則で扱える行動者率79件はここへ列挙しない。
 */
export const RANKING_READER_LABEL_OVERRIDES: Readonly<Record<string, string>> =
  data.readerLabels;
