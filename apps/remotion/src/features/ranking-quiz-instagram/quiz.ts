import { z } from "zod";

import type { RankingEntry } from "../../shared/types/ranking";

/**
 * 予想クイズ型カルーセル（Instagram 4:5・5枚）の編集入力と、ランキングデータからの導出。
 *
 * 正解・順位・値・倍率はすべて allEntries から導出し、spec には書かせない
 * （出題とデータが食い違ったカードを作らないため）。spec が データと矛盾する場合は
 * resolveRankingQuiz が throw し、レンダーを失敗させる。
 */

export const QUIZ_SLIDES = ["question", "hint", "answer", "table", "outro"] as const;
export type QuizSlide = (typeof QUIZ_SLIDES)[number];

export const RankingQuizSpecSchema = z.object({
  /** 出題文。\n で改行する（3行以内） */
  question: z.string(),
  /** 比較対象と単位の注記（例: 県庁所在市・二人以上世帯の年間支出（2024年）） */
  scopeNote: z.string(),
  /** 選択肢の都道府県コード（表示順。2〜4件）。1位の県を必ず含める */
  choiceCodes: z.array(z.string()).min(2).max(4),
  hint: z.object({
    headline: z.string(),
    /** 見出し2行目（強調色） */
    accent: z.string(),
    /** 補足文。\n で改行する */
    body: z.string(),
    /** 「?」で伏せて強調するタイル。1位の県を必ず含める */
    maskedCodes: z.array(z.string()).min(1),
    /** 順位を明かすタイル。1位の県は含めない */
    revealedCodes: z.array(z.string()).optional(),
  }),
  /** フッターの出典表記（例: 総務省「家計調査」2024年） */
  sourceLabel: z.string(),
  /** 正解スライド下部の注記 */
  footnote: z.string().optional(),
  /** 締めスライドの保存理由（例: 飲み会の小ネタに） */
  saveReason: z.string().optional(),
});
export type RankingQuizSpec = z.infer<typeof RankingQuizSpecSchema>;

export interface QuizChoice {
  letter: string;
  prefCode: string;
  name: string;
  isAnswer: boolean;
}

export interface ResolvedRankingQuiz {
  choices: QuizChoice[];
  answerLetter: string;
  /** 1位〜5位 */
  top: RankingEntry[];
  last: RankingEntry;
  /** 1位 ÷ 2位（どちらかが 0 以下なら倍率は意味を持たないので null） */
  ratioToRunnerUp: string | null;
  /** 1位 ÷ 最下位（同上） */
  ratioToLast: string | null;
  maskedPrefCodes: Set<string>;
  /** 都道府県コード(2桁) → 順位 */
  revealedRanks: Map<string, number>;
}

const LETTERS = ["A", "B", "C", "D"];

/** "45" / "45000" / 45 を "45" に揃える */
export function toPrefCode(code: string | number): string {
  return String(code).replace(/0{3}$/, "").padStart(2, "0");
}

function ratio(a: number, b: number): string | null {
  return a > 0 && b > 0 ? (a / b).toFixed(1) : null;
}

export function resolveRankingQuiz(
  spec: RankingQuizSpec,
  entries: RankingEntry[],
): ResolvedRankingQuiz {
  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  const byCode = new Map(sorted.map((e) => [toPrefCode(e.areaCode), e]));
  const leaders = sorted.filter((e) => e.rank === 1);
  if (leaders.length !== 1) {
    throw new Error(`1位が ${leaders.length} 件あるため正解を1つに決められません`);
  }
  const answerCode = toPrefCode(leaders[0].areaCode);

  const requireKnown = (codes: string[], field: string) => {
    const normalized = codes.map(toPrefCode);
    for (const code of normalized) {
      if (!byCode.has(code)) throw new Error(`${field} の ${code} がランキングにありません`);
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new Error(`${field} に重複があります`);
    }
    return normalized;
  };

  const choiceCodes = requireKnown(spec.choiceCodes, "choiceCodes");
  if (!choiceCodes.includes(answerCode)) {
    throw new Error(`choiceCodes に1位（${leaders[0].areaName}）が含まれていません`);
  }
  const masked = requireKnown(spec.hint.maskedCodes, "hint.maskedCodes");
  if (!masked.includes(answerCode)) {
    throw new Error(`hint.maskedCodes に1位（${leaders[0].areaName}）が含まれていません`);
  }
  const revealed = requireKnown(spec.hint.revealedCodes ?? [], "hint.revealedCodes");
  if (revealed.includes(answerCode)) {
    throw new Error("hint.revealedCodes に1位を含めると答えが明かされます");
  }

  const choices = choiceCodes.map((code, i) => ({
    letter: LETTERS[i],
    prefCode: code,
    name: byCode.get(code)!.areaName,
    isAnswer: code === answerCode,
  }));
  const last = sorted[sorted.length - 1];

  return {
    choices,
    answerLetter: choices.find((c) => c.isAnswer)!.letter,
    top: sorted.slice(0, 5),
    last,
    ratioToRunnerUp: ratio(sorted[0].value, sorted[1].value),
    ratioToLast: ratio(sorted[0].value, last.value),
    maskedPrefCodes: new Set(masked),
    revealedRanks: new Map(revealed.map((code) => [code, byCode.get(code)!.rank])),
  };
}
